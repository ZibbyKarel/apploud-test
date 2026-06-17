"use client";

import { useParams, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, type ReactNode } from "react";

type GroupContextValue = {
  /** Navigate to the report route for the given group id. */
  changeGroupId: (groupId: string) => void;
  /** Committed value derived from the URL — drives the report query and form prefill. */
  groupId: string;
};

const GroupContext = createContext<GroupContextValue | null>(null);

function readParamId(id: string | string[] | undefined): string {
  const raw = Array.isArray(id) ? id[0] : id;
  return raw ? decodeURIComponent(raw) : "";
}

export function GroupProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const params = useParams<{ id?: string | string[] }>();
  const groupId = readParamId(params?.id);

  const changeGroupId = useCallback(
    (groupId: string) => {
      const trimmed = groupId.trim();
      if (trimmed) router.push(`/group/${encodeURIComponent(trimmed)}`);
    },
    [router],
  );

  return (
    <GroupContext.Provider value={{ changeGroupId, groupId }}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroupContext() {
  const ctx = useContext(GroupContext);
  if (!ctx) {
    throw new Error("useGroupContext must be used within a GroupProvider");
  }
  return ctx;
}
