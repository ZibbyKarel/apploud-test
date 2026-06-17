import type { Meta, StoryObj } from "@storybook/nextjs";

import { Case, Grid } from "../../../.storybook/StoryGrid";
import { GroupForm } from "./GroupForm";

const noop = () => {};

const meta = {
  title: "app/GroupForm",
  component: GroupForm,
  args: {
    defaultGroupId: "",
    onSubmit: noop,
  },
} satisfies Meta<typeof GroupForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Empty (submit disabled) vs. prefilled (submit enabled). */
export const Overview: Story = {
  name: "Overview — all states",
  render: (args) => (
    <div style={{ width: 480, maxWidth: "100%" }}>
      <Grid>
        <Case label="empty — submit disabled">
          <GroupForm {...args} defaultGroupId="" />
        </Case>
        <Case label="prefilled — submit enabled">
          <GroupForm {...args} defaultGroupId="10975505" />
        </Case>
      </Grid>
    </div>
  ),
};

export const Empty: Story = {};

export const Prefilled: Story = {
  args: { defaultGroupId: "10975505" },
};
