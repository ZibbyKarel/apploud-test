import Bottleneck from "bottleneck";

import { getRedisClient } from "./redis";

/**
 * Global rate limiter for ALL outbound GitLab calls.
 *
 * Why a module-level singleton and not a per-report limiter: GitLab's rate limit
 * is per *token*, and we have ONE shared token. A per-`buildAccessReport`
 * limiter would let two concurrent reports run 2× the budget; a single shared
 * instance keeps the whole process inside one rate envelope.
 *
 * Two distinct controls (the reason this replaces a plain concurrency cap):
 *   - `maxConcurrent` — bulkhead: at most N requests in flight at once.
 *   - `minTime`       — rate cap: minimum spacing between request *starts*. A
 *     pure concurrency cap of 8 at ~150ms/call is ~3200 req/min, OVER GitLab's
 *     ~2000/min. `minTime` smooths starts to stay safely under that ceiling.
 *
 * Tunable via env without a code change (the token must stay swappable too).
 */

/** Stay comfortably under GitLab.com's ~2000 authenticated req/min per token. */
const MAX_RPM = Number(process.env.GITLAB_MAX_RPM ?? 1500);
/** Friendly fan-out width for the ~500-project sweep. */
const MAX_CONCURRENT = Number(process.env.GITLAB_MAX_CONCURRENT ?? 8);

const baseOptions = {
  maxConcurrent: MAX_CONCURRENT,
  // 60_000 / 1500 ≈ 40ms between starts → ~25 req/s → ~1500 req/min.
  minTime: Math.ceil(60_000 / MAX_RPM),
};

/**
 * Multi-instance: behind a load balancer, each Node process otherwise has its
 * own in-memory limiter, so the shared token's real rate is N× this — a token-ban
 * risk. With `REDIS_URL` set, Bottleneck's `ioredis` datastore turns the limiter
 * into a *cluster-wide* budget: every instance with the same `id` draws from one
 * shared `maxConcurrent`/`minTime` envelope against the shared token.
 *
 * The Redis client is shared with `cache.ts` (see `redis.ts`); Bottleneck's
 * Connection opens one extra client for its pub/sub channel. Without `REDIS_URL`
 * this falls back to the in-process limiter — correct for single-instance
 * (`next start`) and what the test suite exercises.
 *
 * The limiter requires Redis to be reachable when `REDIS_URL` is set: failing
 * soft to in-memory would silently reintroduce the N× rate problem, so a Redis
 * outage surfaces as a failed report instead (fail-closed, like the rest of the
 * audit). The cache, by contrast, fails soft — see `cache.ts`.
 */
function createLimiter(): Bottleneck {
  const client = getRedisClient();
  if (!client) {
    return new Bottleneck(baseOptions);
  }

  const limiter = new Bottleneck({
    ...baseOptions,
    // Reuse the shared client rather than opening another connection pool; the
    // connection's type (ioredis) selects the datastore.
    connection: new Bottleneck.IORedisConnection({ client }),
    id: "gitlab-global", // shared key: all instances cluster onto one budget.
  });
  // When a Connection is supplied, connectivity errors surface on the limiter;
  // an unhandled 'error' would otherwise crash the process.
  limiter.on("error", (err) => {
    console.error("[limiter] redis error:", err.message);
  });
  return limiter;
}

export const gitlabLimiter = createLimiter();
