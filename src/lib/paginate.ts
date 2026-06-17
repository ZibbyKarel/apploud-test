/**
 * Walks all pages of a GitLab list endpoint.
 *
 * GitLab paginates with a max of 100 items per page and signals the next page
 * via the `x-next-page` response header (empty on the last page). Those headers
 * are NOT described in the OpenAPI spec, so we read them off the `Headers` object
 * that the generated fetch client returns alongside `data`.
 */

/** Shape returned by the Orval `fetch` client for a list endpoint (success or error branch). */
export interface ListPageResponse<Item> {
  status: number;
  data: Item[] | void;
  headers: Headers;
}

const PER_PAGE = 100;

export async function fetchAllPages<Item>(
  fetchPage: (page: number, perPage: number) => Promise<ListPageResponse<Item>>,
): Promise<Item[]> {
  const all: Item[] = [];
  let page = 1;

  for (;;) {
    const res = await fetchPage(page, PER_PAGE);
    if (res.status !== 200 || !Array.isArray(res.data)) {
      throw new Error(`Unexpected paginated response (status ${res.status})`);
    }
    all.push(...res.data);

    const next = res.headers.get("x-next-page");
    if (!next) break;
    const nextPage = Number(next);
    if (!Number.isFinite(nextPage) || nextPage <= page) break;
    page = nextPage;
  }

  return all;
}
