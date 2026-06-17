// @vitest-environment node
/**
 * API-layer e2e — happy path & sweep mechanics.
 *
 * Drives the real route handler (`GET /api/group-report`) end-to-end with only
 * the network (`fetch`) mocked, so the route → cache → buildAccessReport →
 * paginate → generated client → mutator stack all run for real. The fixture is
 * the assignment's documented subtree, so the assertions double as a spec
 * conformance check.
 *
 * Everything here is on the success path (no retries / breaker), so a static
 * import and a shared module instance are fine; resilience cases that mutate the
 * process-wide circuit breaker live in route.resilience.e2e.test.ts with fresh
 * module state per test.
 */
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearCache } from "@/api/utils/cache";
import {
  ASSIGNMENT_GROUP_PATH,
  ASSIGNMENT_TOP_GROUP_ID,
  ASSIGNMENT_TOPOLOGY,
} from "@/test/fixtures/assignment";
import { installGitlabMock } from "@/test/gitlab-mock";
import type { AccessReport, ReportUser } from "@/types";
import { GET } from "./route";

const makeRequest = (groupId?: string): NextRequest => {
  const url = new URL("http://localhost/api/group-report");
  if (groupId !== undefined) url.searchParams.set("groupId", groupId);
  return new NextRequest(url);
};

const byUsername = (report: AccessReport, username: string): ReportUser => {
  const user = report.users.find((u) => u.username === username);
  if (!user) throw new Error(`user @${username} missing from report`);
  return user;
};

/** Sorted "path (Role)" strings — order-independent membership assertions. */
const labels = (entries: ReportUser["groups"]): string[] =>
  entries.map((e) => `${e.path} (${e.role})`).sort();

beforeEach(() => {
  clearCache();
  process.env.GITLAB_TOKEN = "test-token";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/group-report — assignment topology", () => {
  it("returns the documented 5 users with correct memberships and total", async () => {
    installGitlabMock(ASSIGNMENT_TOPOLOGY);

    const res = await GET(makeRequest(ASSIGNMENT_TOP_GROUP_ID));
    expect(res.status).toBe(200);

    const report = (await res.json()) as AccessReport;

    expect(report.groupPath).toBe(ASSIGNMENT_GROUP_PATH);
    expect(report.total).toBe(5);
    expect(report.users).toHaveLength(5);

    // Two distinct users share the name "Jan Konáš" — both Owners of the top
    // group, no projects. Proves users key off id, not name.
    const jan = byUsername(report, "jan.konas");
    expect(labels(jan.groups)).toEqual([`${ASSIGNMENT_GROUP_PATH} (Owner)`]);
    expect(jan.projects).toHaveLength(0);
    expect(byUsername(report, "jankonas1").groups).toHaveLength(1);

    // Member of a subgroup AND a project — merged into one user.
    const pham = byUsername(report, "KhanhPhams");
    expect(labels(pham.groups)).toEqual([
      `${ASSIGNMENT_GROUP_PATH}/skupina-3 (Guest)`,
    ]);
    expect(labels(pham.projects)).toEqual([
      `${ASSIGNMENT_GROUP_PATH}/uloha-1 (Guest)`,
    ]);

    // Appears ONLY via projects (no group membership) — the case the spec calls
    // out, and why we use direct /members rather than /members/all.
    const martin = byUsername(report, "martin.spicar");
    expect(martin.groups).toHaveLength(0);
    expect(labels(martin.projects)).toEqual([
      `${ASSIGNMENT_GROUP_PATH}/skupina-2/skupina-4/projekt-3 (Guest)`,
      `${ASSIGNMENT_GROUP_PATH}/skupina-3/projekt-2 (Guest)`,
      `${ASSIGNMENT_GROUP_PATH}/uloha-1 (Developer)`,
    ]);

    const bily = byUsername(report, "MichalBily");
    expect(labels(bily.groups)).toEqual([
      `${ASSIGNMENT_GROUP_PATH}/skupina-1 (Guest)`,
    ]);
    expect(bily.projects).toHaveLength(0);
  });

  it("sorts users by name then username for stable output", async () => {
    installGitlabMock(ASSIGNMENT_TOPOLOGY);

    const report = (await (
      await GET(makeRequest(ASSIGNMENT_TOP_GROUP_ID))
    ).json()) as AccessReport;

    const sorted = [...report.users].sort(
      (a, b) =>
        a.name.localeCompare(b.name) || a.username.localeCompare(b.username),
    );
    expect(report.users.map((u) => u.username)).toEqual(
      sorted.map((u) => u.username),
    );
  });

  it("sets the SWR cache-control header", async () => {
    installGitlabMock(ASSIGNMENT_TOPOLOGY);

    const res = await GET(makeRequest(ASSIGNMENT_TOP_GROUP_ID));
    expect(res.headers.get("cache-control")).toContain(
      "stale-while-revalidate",
    );
  });
});

describe("GET /api/group-report — sweep mechanics", () => {
  it("walks every page when results span multiple pages", async () => {
    // Force tiny pages so each list endpoint paginates; the report must still be
    // complete (x-next-page following works end-to-end).
    const { calls } = installGitlabMock(ASSIGNMENT_TOPOLOGY, { pageSize: 1 });

    const report = (await (
      await GET(makeRequest(ASSIGNMENT_TOP_GROUP_ID))
    ).json()) as AccessReport;

    expect(report.total).toBe(5);
    // The top group has 2 members → must have fetched members page 1 AND page 2.
    const topMembersPage2 = calls.some(
      (c) =>
        c.startsWith(`/api/v4/groups/${ASSIGNMENT_TOP_GROUP_ID}/members?`) &&
        /(?:[?&])page=2(?:&|$)/.test(c),
    );
    expect(topMembersPage2).toBe(true);
  });

  it("coalesces + caches: a second request does not re-hit GitLab", async () => {
    const { fetchMock } = installGitlabMock(ASSIGNMENT_TOPOLOGY);

    await GET(makeRequest(ASSIGNMENT_TOP_GROUP_ID));
    const callsAfterFirst = fetchMock.mock.calls.length;
    expect(callsAfterFirst).toBeGreaterThan(0);

    const second = (await (
      await GET(makeRequest(ASSIGNMENT_TOP_GROUP_ID))
    ).json()) as AccessReport;

    expect(second.total).toBe(5);
    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst); // served from cache
  });
});
