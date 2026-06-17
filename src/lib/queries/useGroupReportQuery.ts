import { useQuery } from "@tanstack/react-query";

import type { AccessReport } from "@/types";

async function fetchReport(groupId: string): Promise<AccessReport> {
  const res = await fetch(
    `/api/group-report?groupId=${encodeURIComponent(groupId)}`,
  );
  // `fetch` only rejects on network failure, so an HTTP error (400/5xx) resolves
  // normally. Without this guard the route's `{ error }` body would be handed to
  // the report UI as if it were data; throw so TanStack Query surfaces it and
  // QueryBoundary renders the error state.
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed with status ${res.status}.`);
  }
  return (await res.json()) as AccessReport;
}

const getGroupReportQuery = (groupId: string) =>
  ["group-report", groupId] as const;

export function useGroupReportQuery(groupId: string) {
  return useQuery({
    queryKey: getGroupReportQuery(groupId),
    queryFn: () => fetchReport(groupId),
  });
}
