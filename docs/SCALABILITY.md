# Scalability

> Mapping of the assignment's _Škálovatelnost_ requirement to the implementation.

## What the requirement means

The test environment has **5 users / 5 groups / 4 projects**, but the real
environment has **~500 projects, low tens of groups, ~50 users**. A naive
solution sails through the test environment and falls over (or becomes
unusably slow) on the real one.

The reason is the shape of the algorithm (`src/api/utils/aggregate.ts`).
GitLab offers no "give me every member of this subtree" call — we don't have an
admin token (the assignment says so explicitly), so the data must be fetched
and merged by hand.

## Request count formula

Let **G** = total groups (top-level + descendants), **P** = total projects,
**p(n)** = number of pages needed for a list of n items (ceil(n / 100)).

```
requests = 1                          # GET /groups/{id}              — top-level group
         + p(G-1)                     # GET /groups/{id}/descendant_groups
         + G × p(members_per_group)   # GET /groups/{g}/members       — per group
         + G × p(projects_per_group)  # GET /groups/{g}/projects      — per group
         + P × p(members_per_project) # GET /projects/{p}/members     — per project  ← bottleneck
```

When everything fits on one page (≤ 100 items each), this simplifies to:

```
requests ≈ 2 + 2G + P
```

**Concrete examples (single-page assumption):**

| Environment | G | P | Formula | Total |
|---|---|---|---|---|
| Test (`10975505`) | 5 | 4 | 2 + 10 + 4 | **~16** |
| Real | 10 | 500 | 2 + 20 + 500 | **~522** |

The SCALABILITY.md figure of ~560 accounts for multi-page responses on large
groups/projects. The project-members step (`P × …`) is the dominant term — it
grows linearly with the number of projects and cannot be batched, because
GitLab has no "members of an entire subtree" endpoint.

## Concrete problems at scale and how the project solves them

| Problem at scale                                            | Solution                                                                                                              | Where                                        |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 560 sequential calls = tens of seconds                      | Parallel fan-out (`Promise.all` over groups and projects)                                                             | `src/api/utils/aggregate.ts`                 |
| All-at-once parallelism overruns the rate limit / token ban | Shared `Bottleneck` limiter: `maxConcurrent` (bulkhead, 8) + `minTime` (rate cap ~1500/min, under GitLab's ~2000/min) | `src/api/utils/limiter.ts`                   |
| Large lists don't fit one response                          | Pagination via `x-next-page` header, 100/page                                                                         | `src/api/utils/paginate.ts`                  |
| At 560 calls a 429/5xx blip is near-certain                 | Retry with exponential backoff + jitter, honours `Retry-After`                                                        | `src/api/mutator.ts`                         |
| Retrying a failing GitLab only piles on                     | Circuit breaker (`cockatiel`) — opens for 10s after 5 failures, fail-fast → 503                                       | `src/api/mutator.ts`                         |
| N users open the same group = N×560 calls                   | In-memory TTL cache (60s) + in-flight coalescing keyed by `groupId`                                                   | `src/api/utils/cache.ts`                     |
| A partial audit is dangerous (a hidden user)                | Fail-closed: one failed call fails the whole report, never a silently-partial result                                  | `src/api/utils/aggregate.ts` + `paginate.ts` |

## Multi-instance (implemented, opt-in via `REDIS_URL`)

Everything above is solved for a **single instance** (`next start`). The limiter
and cache are per-process, so behind a load balancer with N instances two
assumptions break:

- N instances × their own in-memory limiter ⇒ the real rate against the token is
  N× the intended one → risk of exceeding the limit / a token ban.
- Cache/coalescing not shared ⇒ the same group can be swept by every instance.

**Fix:** setting `REDIS_URL` switches both to cluster-wide shared state. It is
**opt-in** — unset (the default, and what the test suite runs) keeps the exact
in-process behaviour for single-instance deploys.

| Concern                          | What `REDIS_URL` changes                                                                                                                                               | Where                      |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| N× rate against the shared token | Bottleneck switches to its **`ioredis` datastore** with a shared `id` (`gitlab-global`) ⇒ one cluster-wide `maxConcurrent`/`minTime` budget across all instances       | `src/api/utils/limiter.ts` |
| Same group swept per-instance    | Report **TTL cache moves to Redis** (`SET … PX`) ⇒ one instance's sweep serves all instances for the TTL                                                               | `src/api/utils/cache.ts`   |
| Connection lifecycle             | One `globalThis` singleton client, created on first use and shared by limiter + cache; constructed only when `REDIS_URL` is set, so build/test/no-Redis open no socket | `src/api/utils/redis.ts`   |

**Failure posture is deliberate and split:**

- The **limiter is fail-closed** on Redis — failing soft to in-memory would
  silently reintroduce the N× problem, so a Redis outage surfaces as a failed
  report instead.
- The **cache fails soft** — a Redis read/write blip degrades to a fresh local
  sweep rather than failing the audit.

**Residual gap (intentionally left):** the per-instance in-flight Map still
coalesces concurrent callers _within_ one instance, but on a cold start several
instances can miss Redis simultaneously and each sweep once before the first
result lands. That duplicate work is **bounded by the cluster-wide limiter**
(it can't exceed the token's rate budget) and the window closes the moment one
sweep completes. Eliminating it entirely would need a distributed lock
(`SET NX` + poll); left out as a further optimization since the limiter already
caps the blast radius.

### Try it locally (Docker)

The default `docker compose up` runs a **single instance** on `:3000` (the
in-memory path, no Redis). To exercise the multi-instance path end-to-end, use
the opt-in cluster file, which brings up **one Redis + two app instances + an
nginx load balancer**. Both require `.env.local` with `GITLAB_TOKEN` (the same
file the app uses locally).

```bash
docker compose -f docker-compose.cluster.yml up --build   # redis + web1 + web2 + nginx
```

Host ports: `3000` → nginx (round-robins the two), `3001`/`3002` → web1/web2
directly (target a specific instance), `6379` → redis. If a local `next dev`
already holds `3000`, the nginx container can't bind it — start on another port
with `LB_PORT=8080 docker compose -f docker-compose.cluster.yml up`. (`curl -sI
localhost:3000` returns an `X-Upstream` header showing which instance served
each request.)

**Watch one instance's sweep serve the other** — hit the two instances
sequentially and compare latency:

```bash
G=10975505
curl -s "http://localhost:3001/api/group-report?groupId=$G" >/dev/null   # web1: cold, ~2-3s (real sweep)
docker compose -f docker-compose.cluster.yml exec redis redis-cli KEYS '*'   # report:$G + b_gitlab-global_* limiter keys
curl -s -w '%{time_total}s\n' "http://localhost:3002/api/group-report?groupId=$G" -o /dev/null  # web2: ~0.02s Redis hit
```

The `report:<groupId>` key is the shared TTL cache; the `b_gitlab-global_*`
keys are Bottleneck's cluster-wide limiter state shared across both instances.

> Test **sequentially**, not with two concurrent requests: concurrent cold
> requests hit the documented residual gap above (per-instance coalescing only),
> so both instances sweep once — correct, but it looks like a cache miss.
>
> Flushing Redis (`FLUSHALL`) — or restarting the redis container, which runs
> without persistence here — while the apps are connected wipes Bottleneck's
> settings key, and the limiter fails closed (`ERR SETTINGS_KEY_NOT_FOUND`)
> until the instances reconnect. That's the fail-closed posture, not a bug:
> restart the web containers (`docker compose -f docker-compose.cluster.yml
restart web1 web2`) after flushing or restarting redis.
