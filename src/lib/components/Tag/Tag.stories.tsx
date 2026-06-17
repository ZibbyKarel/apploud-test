import type { Meta, StoryObj } from "@storybook/nextjs";

import { Case, Grid } from "../../../../.storybook/StoryGrid";
import { Chip } from "../Chip";
import { Tag } from "./Tag";

const meta = {
  title: "lib/Tag",
  component: Tag,
  args: { path: "group/subgroup", variant: "primary" },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every combination of variant × link-or-plain × with/without a role chip. */
export const Overview: Story = {
  name: "Overview — all states",
  render: () => (
    <Grid>
      <Case label="primary (group)">
        <Tag path="acme/platform" variant="primary" />
      </Case>
      <Case label="secondary (project)">
        <Tag path="acme/platform/api" variant="secondary" />
      </Case>
      <Case label="primary · linked">
        <Tag path="acme/platform" variant="primary" href="https://gitlab.com/acme/platform" />
      </Case>
      <Case label="primary · with role chip">
        <Tag path="acme/platform" variant="primary">
          <Chip>Owner</Chip>
        </Tag>
      </Case>
      <Case label="secondary · linked · with role chip">
        <Tag path="acme/platform/api" variant="secondary" href="https://gitlab.com/acme/platform/api">
          <Chip>Guest</Chip>
        </Tag>
      </Case>
    </Grid>
  ),
};

export const Primary: Story = { args: { variant: "primary" } };

export const Secondary: Story = { args: { variant: "secondary" } };

export const Linked: Story = {
  args: { href: "https://gitlab.com/acme/platform" },
};

export const WithRoleChip: Story = {
  render: (args) => (
    <Tag {...args}>
      <Chip>Owner</Chip>
    </Tag>
  ),
};
