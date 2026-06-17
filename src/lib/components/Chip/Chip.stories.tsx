import type { Meta, StoryObj } from "@storybook/nextjs";

import { Case, Grid } from "../../../../.storybook/StoryGrid";
import { Chip } from "./Chip";

const meta = {
  title: "lib/Chip",
  component: Chip,
  args: { children: "Owner" },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Chip is single-state; the overview shows it across the GitLab role names it carries. */
export const Overview: Story = {
  name: "Overview — all states",
  render: () => (
    <Grid>
      {["Owner", "Maintainer", "Developer", "Reporter", "Guest"].map((role) => (
        <Case key={role} label={role}>
          <Chip>{role}</Chip>
        </Case>
      ))}
    </Grid>
  ),
};

export const Default: Story = {};
