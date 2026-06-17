import type { ReportUser } from "@/types";

import { Avatar, Card, Column } from "@/lib/components";

import { GroupMemberships, ProjectMemberships } from "../MembershipList";

/** Stable hook for tests to locate a user's card. */
export enum UserCardDataTestIds {
  Root = "user-card",
}

/** One user's access report: their groups and projects with roles. */
export function UserCard({ user }: { user: ReportUser }) {
  return (
    <Card
      data-testid={UserCardDataTestIds.Root}
      title={user.name}
      titleHref={user.webUrl}
      subtitle={`@${user.username}`}
      leading={<Avatar src={user.avatarUrl} name={user.name} />}
    >
      <Column gap="xs">
        <GroupMemberships items={user.groups} />
        <ProjectMemberships items={user.projects} />
      </Column>
    </Card>
  );
}
