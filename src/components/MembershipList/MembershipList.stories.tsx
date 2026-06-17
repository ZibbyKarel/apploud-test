import type { Meta, StoryObj } from "@storybook/nextjs";

import type { Membership } from "@/types";

import { Case, Grid } from "../../../.storybook/StoryGrid";
import { GroupMemberships, ProjectMemberships } from "./MembershipList";

const meta = {
  title: "app/Memberships",
  component: GroupMemberships,
  // Required-prop default so the render-only stories below typecheck; every
  // story supplies its own items via `render`.
  args: { items: [] },
} satisfies Meta<typeof GroupMemberships>;

export default meta;
type Story = StoryObj<typeof meta>;

const one: Membership[] = [
  { path: "acme/platform", role: "Owner", accessLevel: 50, webUrl: "https://gitlab.com/acme/platform" },
];

const many: Membership[] = [
  { path: "acme/platform", role: "Owner", accessLevel: 50, webUrl: "https://gitlab.com/acme/platform" },
  { path: "acme/platform/api", role: "Maintainer", accessLevel: 40, webUrl: "https://gitlab.com/acme/platform/api" },
  { path: "acme/platform/web", role: "Developer", accessLevel: 30 },
  { path: "acme/infra/very-long-path-that-wraps-onto-multiple-lines", role: "Guest", accessLevel: 10 },
];

/** Both variants × empty / single / many (wrapping). */
export const Overview: Story = {
  name: "Overview — all states",
  render: () => (
    <div style={{ width: 560, maxWidth: "100%" }}>
      <Grid>
        <Case label="Groups · empty">
          <GroupMemberships items={[]} />
        </Case>
        <Case label="Groups · one">
          <GroupMemberships items={one} />
        </Case>
        <Case label="Groups · many (wraps)">
          <GroupMemberships items={many} />
        </Case>
        <Case label="Projects · empty">
          <ProjectMemberships items={[]} />
        </Case>
        <Case label="Projects · many (wraps)">
          <ProjectMemberships items={many} />
        </Case>
      </Grid>
    </div>
  ),
};

export const Groups: Story = {
  render: () => <GroupMemberships items={many} />,
};

export const Projects: Story = {
  render: () => <ProjectMemberships items={many} />,
};

export const Empty: Story = {
  render: () => <GroupMemberships items={[]} />,
};
