import type { Meta, StoryObj } from "@storybook/nextjs";

import { Case, Grid } from "../../../../.storybook/StoryGrid";
import { Button } from "./Button";

const meta = {
  title: "lib/Button",
  component: Button,
  args: { children: "Zkontrolovat", variant: "primary" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every variant × enabled/disabled. */
export const Overview: Story = {
  name: "Overview — all states",
  render: () => (
    <Grid>
      <Case label="primary">
        <Button variant="primary">Zkontrolovat</Button>
      </Case>
      <Case label="secondary">
        <Button variant="secondary">Zrušit</Button>
      </Case>
      <Case label="primary · disabled">
        <Button variant="primary" disabled>
          Zkontrolovat
        </Button>
      </Case>
      <Case label="secondary · disabled">
        <Button variant="secondary" disabled>
          Zrušit
        </Button>
      </Case>
    </Grid>
  ),
};

export const Primary: Story = { args: { variant: "primary" } };

export const Secondary: Story = { args: { variant: "secondary" } };

export const Disabled: Story = { args: { disabled: true } };
