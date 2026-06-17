# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # dev server at localhost:3000
npm run gen          # regenerate GitLab client from api.yaml (run after changing api.yaml)
npm run typecheck    # tsc --noEmit
npm test             # Vitest unit tests
npm run build        # production build
npm start            # serve production build

docker compose up --build   # single instance on :3000 (in-memory path)
docker compose -f docker-compose.cluster.yml up --build
                            # multi-instance harness: redis + 2 app instances + nginx LB
                            # exercises the REDIS_URL path; see docs/SCALABILITY.md
```

To run a single test file: `npx vitest run src/api/utils/access-levels.test.ts`

## Environment

Copy `.env.example` to `.env.local` and set `GITLAB_TOKEN`. Optionally set `GITLAB_BASE_URL` (defaults to `https://gitlab.com`) for self-hosted instances. The token is server-only — no `NEXT_PUBLIC_` prefix.

## Architecture

This is a Next.js 15 App Router app that audits GitLab group access. The browser never touches GitLab directly; all API calls are proxied through a Route Handler.

**Request flow:**

```
Browser (page.tsx)
  → TanStack Query → GET /api/group-report?groupId=…
    → Route Handler (src/app/api/group-report/route.ts)
      → buildAccessReport() (src/api/utils/aggregate.ts)
        → Orval-generated fetch functions (src/api/generated/)
          → GitLab REST API  (token injected in src/api/mutator.ts)
```

**Aggregation algorithm** (`src/api/utils/aggregate.ts`):

1. Fetch top-level group → validates access, retrieves `full_path`.
2. Fetch all descendant groups (any depth) in one paginated sweep.
3. For every group in parallel: fetch direct members + fetch the group's projects.
4. For every discovered project in parallel: fetch direct members.
5. Merge by user ID → sort by name → return `{ groupPath, users[], total }`.

Uses **direct** members (`/members`, not `/members/all`) — this matches the spec sample where a user appears via project membership even with no group membership.

**Concurrency & rate limiting:** `src/api/utils/limiter.ts` exports a single **module-level `bottleneck`** limiter shared by every GitLab call (the rate limit is per-token and we have one shared token). It enforces two things: `maxConcurrent` (bulkhead, default 8) and `minTime` (rate cap — spacing between request starts, derived from `GITLAB_MAX_RPM`, default 1500/min, under GitLab.com's ~2000/min). Tunable via `GITLAB_MAX_RPM` / `GITLAB_MAX_CONCURRENT` env vars. **Multi-instance:** setting `REDIS_URL` (opt-in) switches Bottleneck to its `ioredis` datastore with a shared `id`, so all instances behind a load balancer draw from one cluster-wide budget against the shared token (see `src/api/utils/redis.ts`, `docs/SCALABILITY.md`).

**Resilience:** `src/api/mutator.ts` retries 429/5xx/network errors with exponential backoff + jitter (honours `Retry-After`), max 3 attempts; never retries 401/403/404. A process-wide **circuit breaker** (`cockatiel`) wraps every call: after 5 consecutive retryable failures it opens for 10s and fails fast with `BrokenCircuitError` (the route maps that to **503**) instead of retry-bombarding a struggling API, then half-opens to probe. The report is **fail-closed** — if a call still fails the whole report errors, never a silently-partial audit.

**Caching & coalescing:** `src/api/utils/cache.ts` — TTL cache (60s) with in-flight request coalescing keyed by `groupId`, so concurrent requests for the same group collapse to one sweep. In-memory by default; with `REDIS_URL` set the TTL cache moves to Redis (cluster-wide, fails soft) while per-instance coalescing stays in process. The route also sets `Cache-Control` (`s-maxage` + `stale-while-revalidate`) and `maxDuration = 60` for the cold sweep.

**Pagination:** `src/api/utils/paginate.ts` — reads `x-next-page` response header (not described in the OpenAPI spec), 100 items/page.

## GitLab client generation (Orval)

`api.yaml` is the full GitLab REST spec (~3 MB). `npm run gen` runs it through `scripts/orval-transformer.cjs`, which prunes to the 5 used endpoints and fixes list-response array types, then generates typed fetch functions + TS types into `src/api/generated/` (split by tag: `groups/`, `members/`).

Orval generates **bare fetch functions, not React Query hooks** — aggregation runs server-side where hooks aren't available. The custom mutator at `src/api/mutator.ts` injects the `PRIVATE-TOKEN` header and returns `{ status, data, headers }` so `src/api/utils/paginate.ts` can read pagination headers.

## Localisation (next-intl)

All Czech UI text lives in `messages/cs.json` — never hardcode strings in components. `src/i18n/request.ts` statically returns locale `cs`. The app is single-locale (no URL-based locale routing). Server-side error messages and GitLab role names (`Owner`/`Guest`/…) stay in English.

## Key types (`src/types/`)

- `Membership` — one group or project entry: `{ path, role, accessLevel, webUrl? }`
- `ReportUser` — one user: `{ id, name, username, webUrl?, groups: Membership[], projects: Membership[] }`
- `AccessReport` — top-level response: `{ groupPath, users: ReportUser[], total }`

## Test environment

Group ID `10975505` (read-only token from the assignment). Expected: 5 users, `Total Users: 5`.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:

- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
