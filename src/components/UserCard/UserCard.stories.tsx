import type { Meta, StoryObj } from "@storybook/nextjs";

import type { ReportUser } from "@/types";

import { Case, Grid } from "../../../.storybook/StoryGrid";
import { UserCard } from "./UserCard";

const base: ReportUser = {
  id: 1,
  name: "Jan Konáš",
  username: "jan.konas",
  webUrl: "https://gitlab.com/jan.konas",
  avatarUrl: "https://www.gravatar.com/avatar/0?d=identicon&s=72",
  groups: [
    { path: "acme/platform", role: "Owner", accessLevel: 50, webUrl: "https://gitlab.com/acme/platform" },
    { path: "acme/infra", role: "Maintainer", accessLevel: 40, webUrl: "https://gitlab.com/acme/infra" },
  ],
  projects: [
    { path: "acme/platform/api", role: "Developer", accessLevel: 30, webUrl: "https://gitlab.com/acme/platform/api" },
  ],
};

const meta = {
  title: "app/UserCard",
  component: UserCard,
  args: { user: base },
} satisfies Meta<typeof UserCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Groups+projects, groups-only, projects-only, and a user with no memberships. */
export const Overview: Story = {
  name: "Overview — all states",
  render: () => (
    <div style={{ width: 620, maxWidth: "100%" }}>
      <Grid>
        <Case label="groups + projects">
          <UserCard user={base} />
        </Case>
        <Case label="groups only">
          <UserCard user={{ ...base, projects: [] }} />
        </Case>
        <Case label="projects only">
          <UserCard user={{ ...base, groups: [] }} />
        </Case>
        <Case label="no memberships">
          <UserCard user={{ ...base, groups: [], projects: [] }} />
        </Case>
        <Case label="no profile link (plain title)">
          <UserCard user={{ ...base, webUrl: undefined }} />
        </Case>
        <Case label="no avatar (initials)">
          <UserCard user={{ ...base, avatarUrl: undefined }} />
        </Case>
      </Grid>
    </div>
  ),
};

export const Default: Story = {
  render: () => <UserCard user={base} />,
};
