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

const DEFAULT_BASE_URL = "https://gitlab.com";

/** Thrown on a non-2xx GitLab response so callers can map status codes. */
export class GitlabApiError extends Error {
  constructor(
    public status: number,
    public body: string,
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

  const response = await fetch(resolveUrl(url), {
    ...options,
    headers: {
      ...options.headers,
      "PRIVATE-TOKEN": token,
    },
  });

  if (!response.ok) {
    throw new GitlabApiError(response.status, await response.text());
  }

  const data = await parseBody<unknown>(response);
  return { status: response.status, data, headers: response.headers } as T;
};

export default customFetch;
