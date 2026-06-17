/**
 * In-process mock of the GitLab REST API, installed at the global `fetch` seam.
 *
 * Every GitLab call in the app funnels through `customFetch` → `fetch`
 * (src/api/mutator.ts), so stubbing the global `fetch` lets a single fixture
 * drive the WHOLE server stack: route handler → cache → buildAccessReport →
 * paginate → generated client → mutator. That's the boundary the API-layer
 * e2e tests exercise — nothing is mocked above the network.
 *
 * The mock understands the five endpoints the aggregator touches and replays
 * GitLab's header-based pagination (`x-next-page`), so the same fixture also
 * proves the multi-page sweep works.
 */
import { vi } from "vitest";

export interface MockMember {
  id: number;
  name: string;
  username: string;
  access_level: number;
  web_url?: string;
  avatar_url?: string;
}

export interface MockGroup {
  id: number;
  full_path: string;
  web_url?: string;
}

export interface MockProject {
  id: number;
  path_with_namespace: string;
  web_url?: string;
}

export interface GitlabTopology {
  /** Numeric id of the top-level group passed to the report. */
  topGroupId: number;
  topGroupPath: string;
  topGroupWebUrl?: string;
  /** Descendant groups at any depth. */
  descendants?: MockGroup[];
  /** group id (as string) -> direct members. */
  groupMembers?: Record<string, MockMember[]>;
  /** group id (as string) -> projects owned by that group. */
  groupProjects?: Record<string, MockProject[]>;
  /** project id (as string) -> direct members. */
  projectMembers?: Record<string, MockMember[]>;
}

export interface GitlabMockOptions {
  /**
   * Force a page size so list endpoints span multiple pages regardless of the
   * `per_page=100` the client sends. Used to exercise the pagination sweep.
   */
  pageSize?: number;
  /**
   * Fault injection on the top-level group lookup — the first call the report
   * makes. The route fails fast there before any fan-out, so it's the clean
   * place to drive error-mapping, retry and circuit-breaker scenarios.
   */
  topGroup?: {
    /** HTTP status returned instead of 200. */
    errorStatus: number;
    /** How many leading calls return the error before succeeding (default ∞). */
    times?: number;
    /** Optional `Retry-After` header value (429 throttling tests). */
    retryAfter?: string;
  };
  /**
   * Fault injection on ONE project's members call — fired during the parallel
   * fan-out (step 4 of the aggregation), unlike `topGroup` which fails fast
   * before any fan-out. Used to prove the report is fail-closed: a single
   * failed call in the `Promise.all` must fail the whole audit.
   */
  projectMembersFault?: {
    projectId: number;
    errorStatus: number;
  };
}

export interface GitlabMockHandle {
  fetchMock: ReturnType<typeof vi.fn>;
  /** Every requested path+query, in call order — lets tests assert the sweep. */
  calls: string[];
}

const jsonResponse = (body: unknown, headers: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json", ...headers },
  });

/** Slice a list into one page and attach `x-next-page` when more remain. */
const listPage = (items: unknown[], page: number, pageSize: number): Response => {
  const start = (page - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  const hasNext = start + pageSize < items.length;
  return jsonResponse(slice, hasNext ? { "x-next-page": String(page + 1) } : {});
};

/**
 * Install a `fetch` mock that serves the given GitLab topology. Returns the mock
 * and a recorded list of call paths. Caller is responsible for `clearCache()`
 * and `vi.unstubAllGlobals()` between tests.
 */
export function installGitlabMock(
  topo: GitlabTopology,
  opts: GitlabMockOptions = {},
): GitlabMockHandle {
  const pageSize = opts.pageSize ?? 100;
  const descendants = topo.descendants ?? [];
  const groupMembers = topo.groupMembers ?? {};
  const groupProjects = topo.groupProjects ?? {};
  const projectMembers = topo.projectMembers ?? {};
  const fault = opts.topGroup;
  const calls: string[] = [];
  let topGroupCalls = 0;

  const errorResponse = (status: number, retryAfter?: string): Response =>
    new Response(`error ${status}`, {
      status,
      headers: retryAfter ? { "retry-after": retryAfter } : {},
    });

  const fetchMock = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
    const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(raw);
    calls.push(url.pathname + url.search);
    const path = url.pathname;
    const page = Number(url.searchParams.get("page") ?? "1");

    // Single top-level group lookup (not a list — no pagination).
    const single = /^\/api\/v4\/groups\/(\d+)$/.exec(path);
    if (single) {
      topGroupCalls += 1;
      if (fault && topGroupCalls <= (fault.times ?? Infinity)) {
        return errorResponse(fault.errorStatus, fault.retryAfter);
      }
      return jsonResponse({
        id: topo.topGroupId,
        full_path: topo.topGroupPath,
        web_url: topo.topGroupWebUrl,
      });
    }

    const descendantsMatch = /^\/api\/v4\/groups\/(\d+)\/descendant_groups$/.exec(path);
    if (descendantsMatch) return listPage(descendants, page, pageSize);

    const groupProjectsMatch = /^\/api\/v4\/groups\/(\d+)\/projects$/.exec(path);
    if (groupProjectsMatch) return listPage(groupProjects[groupProjectsMatch[1]] ?? [], page, pageSize);

    const groupMembersMatch = /^\/api\/v4\/groups\/(\d+)\/members$/.exec(path);
    if (groupMembersMatch) return listPage(groupMembers[groupMembersMatch[1]] ?? [], page, pageSize);

    const projectMembersMatch = /^\/api\/v4\/projects\/(\d+)\/members$/.exec(path);
    if (projectMembersMatch) {
      const pid = projectMembersMatch[1];
      if (opts.projectMembersFault && String(opts.projectMembersFault.projectId) === pid) {
        return errorResponse(opts.projectMembersFault.errorStatus);
      }
      return listPage(projectMembers[pid] ?? [], page, pageSize);
    }

    throw new Error(`Unexpected GitLab request in test: ${path}`);
  });

  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, calls };
}
