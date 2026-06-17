import { getRedisClient } from "./redis";

/**
 * Report cache with in-flight request coalescing.
 *
 * The audit fans out ~560 GitLab calls through ONE shared token, so the real
 * production risk is concurrency: N users hitting the same group at once would
 * each launch a full sweep and blow GitLab's authenticated rate limit.
 *
 * Two layers solve that on a single instance:
 *   - **Coalescing** — one in-flight promise per key. Concurrent callers for the
 *     same group share a single sweep instead of each starting their own.
 *   - **TTL cache** — a completed report is reused for `ttlMs`, so repeated page
 *     loads / refreshes don't re-fetch.
 *
 * Failures are NOT cached: a rejected sweep clears the in-flight slot (and is
 * never written to Redis) so the next caller retries.
 *
 * **Multi-instance** (`REDIS_URL` set — see `redis.ts`): the TTL cache moves to
 * Redis so a sweep by one instance serves every instance for `ttlMs`. The
 * per-instance in-flight Map is kept on top — it still coalesces concurrent
 * callers *within* one instance, which is the common case (one browser, many
 * components / refreshes hitting the same node). The Redis cache fails **soft**:
 * a read/write error degrades to a fresh local sweep rather than failing the
 * audit (the limiter, by contrast, is fail-closed — see `limiter.ts`).
 *
 * Residual gap: on a cold start, several instances can miss Redis simultaneously
 * and each sweep once before the first result is written. That duplicate work is
 * bounded by the cluster-wide limiter (it cannot exceed the token's rate budget)
 * and the window closes as soon as one sweep completes. Eliminating it entirely
 * would need a distributed lock (SET NX + poll); deliberately left out as a
 * further optimization, since the limiter already caps the blast radius.
 */

interface Entry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, Entry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

export function cached<T>(
  key: string,
  ttlMs: number,
  produce: () => Promise<T>,
): Promise<T> {
  // Coalesce concurrent callers on this instance regardless of backend.
  const pending = inFlight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const redis = getRedisClient();
  const promise = (redis
    ? cachedViaRedis(redis, key, ttlMs, produce)
    : cachedInMemory(key, ttlMs, produce)
  ).finally(() => {
    inFlight.delete(key);
  });

  inFlight.set(key, promise);
  return promise;
}

/** Single-instance path: a process-local TTL map. */
async function cachedInMemory<T>(
  key: string,
  ttlMs: number,
  produce: () => Promise<T>,
): Promise<T> {
  const fresh = cache.get(key) as Entry<T> | undefined;
  if (fresh && fresh.expiresAt > Date.now()) {
    return fresh.value;
  }
  const value = await produce();
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

/** Multi-instance path: a cluster-wide TTL cache in Redis, failing soft. */
async function cachedViaRedis<T>(
  redis: NonNullable<ReturnType<typeof getRedisClient>>,
  key: string,
  ttlMs: number,
  produce: () => Promise<T>,
): Promise<T> {
  try {
    const hit = await redis.get(key);
    if (hit != null) return JSON.parse(hit) as T;
  } catch (err) {
    // Fail soft: a Redis read blip must not fail the audit — fall through to a
    // fresh local sweep.
    console.error("[cache] redis read failed, sweeping fresh:", err);
  }

  const value = await produce();

  try {
    // PX = expiry in ms. Only successful results are written (failures throw
    // before reaching here), so failures are never cached.
    await redis.set(key, JSON.stringify(value), "PX", ttlMs);
  } catch (err) {
    console.error("[cache] redis write failed, result not cached:", err);
  }
  return value;
}

/** Test/ops helper — drop all process-local cached + in-flight state. */
export function clearCache(): void {
  cache.clear();
  inFlight.clear();
}
