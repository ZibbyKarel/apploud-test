"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";

import { formatReport } from "@/lib/format";
import type { AccessReport } from "@/lib/types";

async function fetchReport(groupId: string): Promise<AccessReport> {
  const res = await fetch(`/api/access-report?groupId=${encodeURIComponent(groupId)}`);
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return body as AccessReport;
}

export default function Home() {
  const [groupId, setGroupId] = useState("");
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["access-report", submittedId],
    queryFn: () => fetchReport(submittedId as string),
    enabled: submittedId !== null,
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = groupId.trim();
    if (trimmed) setSubmittedId(trimmed);
  };

  return (
    <main>
      <h1>GitLab Access Audit</h1>
      <p className="subtitle">
        Zadej ID top-level skupiny a získej seznam uživatelů s přístupem ke skupinám a
        projektům v jejím podstromu.
      </p>

      <form onSubmit={onSubmit}>
        <input
          inputMode="numeric"
          placeholder="ID skupiny, např. 10975505"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
        />
        <button type="submit" disabled={!groupId.trim() || query.isFetching}>
          {query.isFetching ? "Načítám…" : "Zkontrolovat"}
        </button>
      </form>

      {query.isFetching && <p className="status">Stahuji a spojuji data z GitLab API…</p>}

      {query.isError && (
        <p className="error">Chyba: {(query.error as Error).message}</p>
      )}

      {query.data && !query.isFetching && <pre>{formatReport(query.data)}</pre>}
    </main>
  );
}
