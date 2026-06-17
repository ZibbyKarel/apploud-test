/**
 * Custom fetch mutator used by the Orval-generated GitLab client.
 *
 * Runs SERVER-SIDE ONLY (imported from Route Handlers / lib code). The access
 * token is read from `process.env.GITLAB_TOKEN` here, so it never ships to the
 * browser. Swap the token by editing `.env.local`.
 *
 * With `includeHttpResponseReturnType`, generated functions return
 * `{ status, data, headers }`, which lets the pagination helper read GitLab's
 * `x-next-page` / `x-total` response headers (these are NOT described in the spec).
 */

import {
  BrokenCircuitError,
  ConsecutiveBreaker,
  circuitBreaker,
  handleWhen,
} from "cockatiel";

const DEFAULT_BASE_URL = "https://gitlab.com";

/** Thrown on a non-2xx GitLab response so callers can map status codes. */
export class GitlabApiError extends Error {
  constructor(
    public status: number,
    public body: string,
    /** Value of the `Retry-After` header, if GitLab sent one (429 throttling). */
    public retryAfter: string | null = null,
  ) {
    super(`GitLab API error ${status}: ${body.slice(0, 300)}`);
    this.name = "GitlabApiError";
  }
}

const resolveUrl = (path: string): string => {
  if (/^https?:\/\//.test(path)) return path;
  const base = process.env.GITLAB_BASE_URL ?? DEFAULT_BASE_URL;
  return `${base}${path}`;
};

/** A single report fans out ~560 calls through one shared token; transient
 * rate-limit (429) and server (5xx) blips are expected at that volume. Without
 * retry, any one failed call throws away the whole report. We retry those plus
 * network errors with exponential backoff + jitter, but NEVER retry permanent
 * auth/not-found errors (401/403/404) — those won't change on a second attempt. */
const MAX_RETRIES = 3;
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

/** A failure that signals GitLab itself is unhealthy (vs. a permanent 4xx like
 * 401/403/404, which means *our* request is wrong and won't improve on retry).
 * Used both to decide whether to retry and to feed the circuit breaker. */
const isRetryableError = (error: unknown): boolean => {
  if (error instanceof GitlabApiError) return RETRYABLE_STATUS.has(error.status);
  // Anything else thrown from `fetch` is a network/transport error — retryable.
  // (BrokenCircuitError is raised by the breaker itself, never by the operation.)
  return !(error instanceof BrokenCircuitError);
};

/**
 * Process-wide circuit breaker for GitLab. After 5 consecutive retryable
 * failures (hard rate-limiting or an outage), the circuit OPENS: further calls
 * fail fast with BrokenCircuitError for 10s instead of retry-bombarding a server
 * that's already struggling. It then half-opens to probe with a single call and
 * closes again on success. Shared across all reports since GitLab health is global.
 */
const gitlabBreaker = circuitBreaker(handleWhen(isRetryableError), {
  halfOpenAfter: 10_000,
  breaker: new ConsecutiveBreaker(5),
});

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Backoff for the given attempt (0-based). Honours `Retry-After` when GitLab
 * sends it (429 throttling), otherwise exponential 0.3s/0.6s/1.2s + jitter. */
const backoffMs = (attempt: number, retryAfter: string | null): number => {
  if (retryAfter) {
    const secs = Number(retryAfter);
    if (Number.isFinite(secs) && secs >= 0) return secs * 1000;
  }
  return 300 * 2 ** attempt + Math.random() * 200;
};

const parseBody = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return (await response.text()) as T;
};

export const customFetch = async <T>(
  url: string,
  options: RequestInit,
): Promise<T> => {
  const token = process.env.GITLAB_TOKEN;
  if (!token) {
    throw new Error(
      "GITLAB_TOKEN is not set. Copy .env.example to .env.local and set the token.",
    );
  }

  const target = resolveUrl(url);
  const init: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      "PRIVATE-TOKEN": token,
    },
  };

  // One network call + status check; throws on failure so the breaker can score it.
  const attemptFetch = async (): Promise<T> => {
    const response = await fetch(target, init);
    if (!response.ok) {
      throw new GitlabApiError(
        response.status,
        await response.text(),
        response.headers.get("retry-after"),
      );
    }
    const data = await parseBody<unknown>(response);
    return { status: response.status, data, headers: response.headers } as T;
  };

  for (let attempt = 0; ; attempt++) {
    try {
      // Each attempt runs through the breaker (which short-circuits if open).
      return await gitlabBreaker.execute(attemptFetch);
    } catch (error) {
      // Circuit is open → fail fast. Retrying a known-down API just wastes the
      // rate budget; let the report fail and the breaker recover.
      if (error instanceof BrokenCircuitError) throw error;

      if (isRetryableError(error) && attempt < MAX_RETRIES) {
        const retryAfter = error instanceof GitlabApiError ? error.retryAfter : null;
        await sleep(backoffMs(attempt, retryAfter));
        continue;
      }
      throw error;
    }
  }
};

export default customFetch;
