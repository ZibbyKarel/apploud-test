import type { Meta, StoryObj } from "@storybook/nextjs";

import { Case, Grid } from "../../../../.storybook/StoryGrid";
import { Avatar } from "./Avatar";

const meta = {
  title: "lib/Avatar",
  component: Avatar,
  args: { name: "Jan Konáš" },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Image avatar, initials fallback (no URL) and broken-URL fallback. */
export const Overview: Story = {
  name: "Overview — all states",
  render: () => (
    <Grid>
      <Case label="image">
        <Avatar name="Jan Konáš" src="https://www.gravatar.com/avatar/0?d=identicon&s=72" />
      </Case>
      <Case label="initials (no URL)">
        <Avatar name="Jan Konáš" />
      </Case>
      <Case label="initials (broken URL)">
        <Avatar name="Eva Nováková" src="https://example.invalid/missing.png" />
      </Case>
      <Case label="single name">
        <Avatar name="Octocat" />
      </Case>
    </Grid>
  ),
};

export const Default: Story = {
  render: () => <Avatar name="Jan Konáš" />,
};
