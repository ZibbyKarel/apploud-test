// @vitest-environment node
/**
 * API-layer e2e — validation, error mapping & resilience.
 *
 * The route's contract under failure is a critical scenario: the report is
 * fail-closed (one bad call fails the whole audit rather than returning a
 * silently-partial one), and status codes must map correctly so the UI and any
 * automation can react.
 *
 * The process-wide circuit breaker (src/api/mutator.ts) carries state across
 * calls, so every test starts from fresh module state: `vi.resetModules()` plus
 * a dynamic import of BOTH the route handler and the mock (which closes over a
 * fresh `vi`-stubbed fetch). Real timers throughout — fake timers would deadlock
 * the bottleneck limiter; the retry backoff for the small fixtures is sub-3s.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ASSIGNMENT_TOPOLOGY } from "@/test/fixtures/assignment";

const TOP_ID = String(ASSIGNMENT_TOPOLOGY.topGroupId);

/** Fresh route handler + request builder + mock installer, fresh module graph. */
async function loadRoute() {
  vi.resetModules();
  const { GET } = await import("./route");
  const { NextRequest } = await import("next/server");
  const { installGitlabMock } = await import("@/test/gitlab-mock");
  const { clearCache } = await import("@/api/utils/cache");
  clearCache();

  const request = (groupId?: string) => {
    const url = new URL("http://localhost/api/group-report");
    if (groupId !== undefined) url.searchParams.set("groupId", groupId);
    return new NextRequest(url);
  };
  return { GET, request, installGitlabMock };
}

beforeEach(() => {
  process.env.GITLAB_TOKEN = "test-token";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("input validation (no network)", () => {
  it("400s when groupId is missing", async () => {
    const { GET, request } = await loadRoute();
    const res = await GET(request());
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/groupId/i);
  });

  it("400s when groupId is not numeric", async () => {
    const { GET, request } = await loadRoute();
    const res = await GET(request("not-a-number"));
    expect(res.status).toBe(400);
  });

  it("trims surrounding whitespace before validating", async () => {
    const { GET, request, installGitlabMock } = await loadRoute();
    installGitlabMock(ASSIGNMENT_TOPOLOGY);
    const res = await GET(request(`  ${TOP_ID}  `));
    expect(res.status).toBe(200);
  });
});

describe("error mapping (permanent failures — not retried)", () => {
  // 401/403/404 are permanent: the mutator throws immediately (no retry/backoff)
  // and the route forwards the same status. Fast, timer-free.
  it.each([401, 403, 404])("forwards a top-group %i as-is", async (status) => {
    const { GET, request, installGitlabMock } = await loadRoute();
    const { fetchMock } = installGitlabMock(ASSIGNMENT_TOPOLOGY, {
      topGroup: { errorStatus: status },
    });

    const res = await GET(request(TOP_ID));

    expect(res.status).toBe(status);
    expect(fetchMock).toHaveBeenCalledTimes(1); // no retry on permanent errors
  });

  it("maps an exhausted retryable failure (500) to 502", async () => {
    const { GET, request, installGitlabMock } = await loadRoute();
    const { fetchMock } = installGitlabMock(ASSIGNMENT_TOPOLOGY, {
      topGroup: { errorStatus: 500 }, // always fails
    });

    const res = await GET(request(TOP_ID));

    expect(res.status).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(4); // 1 + 3 retries
  }, 15_000);
});

describe("retry + fail-closed", () => {
  it("recovers when a transient 500 clears on retry", async () => {
    const { GET, request, installGitlabMock } = await loadRoute();
    installGitlabMock(ASSIGNMENT_TOPOLOGY, {
      topGroup: { errorStatus: 500, times: 1 }, // fail once, then succeed
    });

    const res = await GET(request(TOP_ID));

    expect(res.status).toBe(200);
    expect((await res.json()).total).toBe(5); // full report still produced
  }, 15_000);

  it("honours Retry-After on a 429 then succeeds", async () => {
    const { GET, request, installGitlabMock } = await loadRoute();
    installGitlabMock(ASSIGNMENT_TOPOLOGY, {
      topGroup: { errorStatus: 429, times: 1, retryAfter: "0" },
    });

    const res = await GET(request(TOP_ID));
    expect(res.status).toBe(200);
  }, 15_000);

  it("fails the whole report when one call in the fan-out fails (no partial audit)", async () => {
    // The top group + descendants succeed; one project's members call fails
    // mid-sweep (inside the parallel Promise.all). A partial audit would silently
    // omit access — so the contract is to fail the whole report instead.
    const { GET, request, installGitlabMock } = await loadRoute();
    installGitlabMock(ASSIGNMENT_TOPOLOGY, {
      projectMembersFault: { projectId: 101, errorStatus: 500 }, // uloha-1
    });

    const res = await GET(request(TOP_ID));

    expect(res.status).not.toBe(200); // never a silently-partial 200
    expect(res.status).toBe(502); // exhausted-retry GitLab error → 502
  }, 15_000);
});

describe("circuit breaker", () => {
  it("opens after sustained failures and fails fast with 503", async () => {
    const { GET, request, installGitlabMock } = await loadRoute();
    installGitlabMock(ASSIGNMENT_TOPOLOGY, { topGroup: { errorStatus: 500 } });

    // Each failing report racks up consecutive breaker failures (1 + 3 retries).
    // The breaker opens at 5 consecutive failures, so by the second report a
    // call short-circuits with BrokenCircuitError → the route returns 503.
    let sawCircuitOpen = false;
    for (let i = 0; i < 4 && !sawCircuitOpen; i++) {
      const res = await GET(request(TOP_ID));
      if (res.status === 503) sawCircuitOpen = true;
      else expect(res.status).toBe(502);
    }

    expect(sawCircuitOpen).toBe(true);
  }, 30_000);
});
