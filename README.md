# GitLab Access Audit

A tool for auditing who has access to a GitLab group and its subgroups and projects.
Enter a top-level group ID in the form and get a human-readable list of users with their
roles in groups and projects, plus a total user count.

## Stack

- **Next.js 15 (App Router) + TypeScript** — form (client) + Route Handler (server)
- **TanStack Query** — client-side query state
- **Orval** — generates a typed GitLab client (fetch functions + TS types) from `api.yaml`
- **next-intl** — translations; all UI text lives in `messages/cs.json`, not in code
- **GitLab REST API** (not GraphQL)

## Setup

```bash
npm install
cp .env.example .env.local   # fill in your token
npm run dev                  # http://localhost:3000
```

### Access token

The token is **not passed as an argument**. It is stored in `.env.local` as a server-only variable:

```
GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx
```

- Read **server-side only** (`process.env.GITLAB_TOKEN` in `src/api/mutator.ts`) — never exposed to the browser (no `NEXT_PUBLIC_` prefix).
- **Change it** by editing the single value in `.env.local` and restarting the dev server.
- For self-hosted GitLab, override `GITLAB_BASE_URL` (default: `https://gitlab.com`).

## How it works

```
[Browser: form]  --useQuery-->  GET /api/group-report?groupId=  (server)
                                      │
                                      ├─ src/api/utils/aggregate.ts (orchestrator)
                                      │    └─ Orval fetch functions + pagination + concurrency
                                      └─> GitLab REST API  (token from process.env)
     <-- JSON { users, total } --
[Render human-readable output + Total Users]
```

Aggregation runs **server-side** — the Next.js Route Handler acts as a proxy, eliminating
both CORS issues and token exposure in the client.

Output is rendered as a **list of user cards**: the name links to the user's GitLab profile;
each group and project is a clickable link (from `web_url`) with a role badge. Total user
count is shown at the bottom.

## Algorithm (`src/api/utils/aggregate.ts`)

1. Fetch the top-level group (`GET /groups/{id}`) — validates access, retrieves `full_path`.
2. Fetch all descendant groups (`GET /groups/{id}/descendant_groups`) — any depth, one paginated sweep.
3. For every group (top-level + descendants) in parallel: fetch direct members + fetch the group's projects.
4. For every discovered project in parallel: fetch direct members.
5. Merge by user ID → sort by name → return `{ groupPath, users[], total }`.

**Direct** members are used (`/members`, not `/members/all`) — this matches the spec sample
where a user appears via project membership even without group membership.

## Scalability

The real environment has ~500 projects, which means ~560 HTTP calls per report through one
shared token. The implementation handles this with:

- **Parallel fan-out** — groups and projects are fetched concurrently with `Promise.all`
- **Rate limiter** (`bottleneck`) — `maxConcurrent` bulkhead (default 8) + `minTime` rate cap (~1500 req/min, under GitLab's ~2000/min limit); tunable via `GITLAB_MAX_RPM` / `GITLAB_MAX_CONCURRENT`
- **Retry with backoff** — 429/5xx/network errors retry up to 3× with exponential backoff + jitter; honours `Retry-After`
- **Circuit breaker** (`cockatiel`) — opens for 10s after 5 consecutive failures, fails fast with 503 instead of retry-bombing a struggling API
- **TTL cache + in-flight coalescing** — 60s cache keyed by `groupId`; concurrent requests for the same group collapse to one sweep
- **Pagination** — 100 items/page, loops via `x-next-page` header
- **Fail-closed** — one failed call fails the whole report; never a silently-partial audit

For multi-instance deployments, set `REDIS_URL` to move the limiter and TTL cache to
cluster-wide Redis state. See [docs/SCALABILITY.md](docs/SCALABILITY.md) for a full
breakdown and Docker multi-instance setup instructions.

## Localisation (next-intl)

All Czech UI text lives in `messages/cs.json` — strings are never hardcoded in components.
`src/i18n/request.ts` statically returns locale `cs`. The app is single-locale (no
URL-based locale routing). Server-side error messages and GitLab role names (`Owner` /
`Guest` / …) stay in English.

## GitLab client generation (Orval)

`api.yaml` is the full GitLab REST spec (~3 MB). `npm run gen` runs it through
`scripts/orval-transformer.cjs`, which prunes to the 5 used endpoints and fixes
list-response array types, then generates typed fetch functions + TS types into
`src/api/generated/`. Run after changing `api.yaml`.

> Orval generates **fetch functions + types**, not React Query hooks — aggregation runs
> server-side where hooks aren't available. TanStack Query is used client-side for our
> single `/api/group-report` endpoint.

## Scripts

| Command                       | Description                                  |
| ----------------------------- | -------------------------------------------- |
| `npm run dev`                 | Dev server at `localhost:3000`               |
| `npm run gen`                 | Regenerate GitLab client from `api.yaml`     |
| `npm run typecheck`           | `tsc --noEmit`                               |
| `npm test`                    | Unit tests (Vitest)                          |
| `npm run build` / `npm start` | Production build / serve production build    |

## Test environment

Group ID `10975505` (read-only token from the assignment). Expected output: 5 users, `Total Users: 5`.
