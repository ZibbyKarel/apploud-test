import { BrokenCircuitError } from "cockatiel";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Each test re-imports the module so the process-wide circuit breaker starts
 * fresh (its state would otherwise leak between tests).
 */
const loadFetch = async () => (await import("./mutator")).customFetch;

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const errorResponse = (status: number) => new Response("error", { status });

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  process.env.GITLAB_TOKEN = "test-token";
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("customFetch resilience", () => {
  it("retries a transient 500 and then succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(errorResponse(500))
      .mockResolvedValueOnce(jsonResponse(200, []));
    vi.stubGlobal("fetch", fetchMock);

    const customFetch = await loadFetch();
    const promise = customFetch("/api/v4/groups", {});
    await vi.runAllTimersAsync(); // flush the backoff sleep
    const result = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ status: 200 });
  });

  it("does NOT retry a permanent 403", async () => {
    const fetchMock = vi.fn().mockResolvedValue(errorResponse(403));
    vi.stubGlobal("fetch", fetchMock);

    const customFetch = await loadFetch();
    const { GitlabApiError } = await import("./mutator");

    await expect(customFetch("/api/v4/groups", {})).rejects.toBeInstanceOf(GitlabApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("opens the circuit after sustained failures and then fails fast", async () => {
    const fetchMock = vi.fn().mockResolvedValue(errorResponse(500));
    vi.stubGlobal("fetch", fetchMock);

    const customFetch = await loadFetch();

    // A couple of fully-failing calls trip the ConsecutiveBreaker.
    for (let i = 0; i < 3; i++) {
      const settled = customFetch("/api/v4/groups", {}).catch((e) => e);
      await vi.runAllTimersAsync();
      await settled;
    }

    // Circuit now open: a fresh call short-circuits without touching the network.
    const callsBefore = fetchMock.mock.calls.length;
    await expect(customFetch("/api/v4/groups", {})).rejects.toBeInstanceOf(BrokenCircuitError);
    expect(fetchMock.mock.calls.length).toBe(callsBefore); // no new network call
  });
});
