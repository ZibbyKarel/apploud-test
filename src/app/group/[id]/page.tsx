"use client";

import { GroupForm, GroupReport, QueryBoundary } from "@/components";
import { useGroupContext } from "@/context/GroupContext";
import { useGroupReportQuery } from "@/lib/queries/useGroupReportQuery";

export default function GroupPage() {
  const { changeGroupId, groupId } = useGroupContext();
  const query = useGroupReportQuery(groupId);

  return (
    <>
      <GroupForm defaultGroupId={groupId} onSubmit={changeGroupId} />
      <QueryBoundary query={query}>
        {(report) => <GroupReport report={report} />}
      </QueryBoundary>
    </>
  );
}
