import type { Meta, StoryObj } from "@storybook/nextjs";

import { Case, Grid } from "../../../../.storybook/StoryGrid";
import { Input } from "./Input";

const meta = {
  title: "lib/Input",
  component: Input,
  args: { "aria-label": "ID skupiny", placeholder: "ID skupiny, např. 10975505" },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  name: "Overview — all states",
  render: () => (
    <Grid>
      <Case label="empty (placeholder)">
        <Input aria-label="ID skupiny" placeholder="ID skupiny, např. 10975505" />
      </Case>
      <Case label="with value">
        <Input aria-label="ID skupiny" defaultValue="10975505" />
      </Case>
      <Case label="disabled">
        <Input aria-label="ID skupiny" defaultValue="10975505" disabled />
      </Case>
    </Grid>
  ),
};

export const Default: Story = {};

export const WithValue: Story = { args: { defaultValue: "10975505" } };

export const Disabled: Story = { args: { defaultValue: "10975505", disabled: true } };
