import Redis from "ioredis";

/**
 * Shared Redis client for multi-instance deployments.
 *
 * Single-instance (`next start`) is the default and needs no Redis: the limiter
 * and cache run in-process. Behind a load balancer with N instances, two
 * per-process assumptions break (see docs/SCALABILITY.md):
 *   - each instance has its own limiter ⇒ the real rate against the shared token
 *     is N× the intended one → risk of a token ban.
 *   - the cache is not shared ⇒ the same group is swept by every instance.
 *
 * Setting `REDIS_URL` turns both into cluster-wide, shared state. This module is
 * the single client used by BOTH `limiter.ts` (Bottleneck's `ioredis` datastore)
 * and `cache.ts` (the report TTL cache).
 *
 * Lifecycle notes:
 *   - **Construction is cheap and only happens when `REDIS_URL` is set.** The
 *     client is created lazily (first `getRedisClient()` call), so `next build`,
 *     the test suite, and the no-Redis path never construct it. ioredis connects
 *     in the background and retries on its own; connectivity failures surface on
 *     the `error` event (handled below), never as a synchronous throw — so a
 *     down/unreachable Redis cannot crash import or `next build`.
 *     (`lazyConnect` is intentionally NOT used: Bottleneck's `IORedisConnection`
 *     waits on the client's `ready` event, which `lazyConnect` never fires until
 *     a command is issued — deadlocking the limiter.)
 *   - **`globalThis` singleton**: survives dev HMR so hot reloads don't leak a
 *     new connection on every edit.
 */

const REDIS_URL = process.env.REDIS_URL;

// Reuse one client across HMR reloads in dev (module re-evaluation otherwise
// leaks a connection per edit).
const globalForRedis = globalThis as unknown as {
  __gitlabRedis?: Redis | null;
};

/**
 * The shared Redis client, or `null` when `REDIS_URL` is unset (single-instance
 * mode). Callers branch on the return value to pick the Redis or in-memory path.
 */
export function getRedisClient(): Redis | null {
  if (!REDIS_URL) return null;
  if (globalForRedis.__gitlabRedis !== undefined) {
    return globalForRedis.__gitlabRedis;
  }

  const client = new Redis(REDIS_URL, {
    // Bound how long a command waits on a dead/unreachable Redis before it
    // rejects — without this, ioredis queues commands indefinitely and the
    // limiter would hang to `maxDuration` instead of failing the report.
    maxRetriesPerRequest: 3,
  });
  // An ioredis client emits 'error' on connectivity problems; without a listener
  // Node treats it as an unhandled exception and crashes the process.
  client.on("error", (err) => {
    console.error("[redis] client error:", err.message);
  });

  globalForRedis.__gitlabRedis = client;
  return client;
}
