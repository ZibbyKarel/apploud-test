import { afterEach, describe, expect, it, vi } from "vitest";

import { cached, clearCache } from "./cache";

afterEach(() => {
  clearCache();
  vi.useRealTimers();
});

describe("cached", () => {
  it("coalesces concurrent calls for the same key into one production", async () => {
    const produce = vi.fn(async () => "report");

    const [a, b, c] = await Promise.all([
      cached("k", 1000, produce),
      cached("k", 1000, produce),
      cached("k", 1000, produce),
    ]);

    expect(produce).toHaveBeenCalledTimes(1);
    expect([a, b, c]).toEqual(["report", "report", "report"]);
  });

  it("serves a cached value within the TTL and re-produces after it expires", async () => {
    vi.useFakeTimers();
    let n = 0;
    const produce = vi.fn(async () => ++n);

    expect(await cached("k", 1000, produce)).toBe(1);
    vi.advanceTimersByTime(500);
    expect(await cached("k", 1000, produce)).toBe(1); // still fresh
    expect(produce).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(600); // now past the 1000ms TTL
    expect(await cached("k", 1000, produce)).toBe(2);
    expect(produce).toHaveBeenCalledTimes(2);
  });

  it("does not cache failures — the next caller retries", async () => {
    const produce = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("ok");

    await expect(cached("k", 1000, produce)).rejects.toThrow("boom");
    expect(await cached("k", 1000, produce)).toBe("ok");
    expect(produce).toHaveBeenCalledTimes(2);
  });

  it("keeps separate keys independent", async () => {
    expect(await cached("a", 1000, async () => "A")).toBe("A");
    expect(await cached("b", 1000, async () => "B")).toBe("B");
  });
});
