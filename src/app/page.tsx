"use client";

import { GroupForm } from "@/components";
import { useGroupContext } from "@/context/GroupContext";

export default function Home() {
  const { changeGroupId, groupId } = useGroupContext();
  return <GroupForm defaultGroupId={groupId} onSubmit={changeGroupId} />;
}
