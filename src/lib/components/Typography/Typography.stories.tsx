import type { Meta, StoryObj } from "@storybook/nextjs";

import { Case, Grid } from "../../../../.storybook/StoryGrid";
import { Typography } from "./Typography";

const meta = {
  title: "lib/Typography",
  component: Typography,
  args: { children: "The quick brown fox", variant: "body" },
} satisfies Meta<typeof Typography>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every variant, plus the tone + modifier options. */
export const Overview: Story = {
  name: "Overview — all states",
  render: () => (
    <Grid>
      <Case label="pageTitle">
        <Typography variant="pageTitle">GitLab Access Audit</Typography>
      </Case>
      <Case label="sectionTitle">
        <Typography variant="sectionTitle">Skupina apploud-external/testovaci-zadani</Typography>
      </Case>
      <Case label="body">
        <Typography variant="body">Stahuji a spojuji data z GitLab API…</Typography>
      </Case>
      <Case label="bodySm · muted · mono">
        <Typography variant="bodySm" tone="muted" mono>
          @jan.konas
        </Typography>
      </Case>
      <Case label="label · muted">
        <Typography variant="label" tone="muted">
          Skupiny
        </Typography>
      </Case>
      <Case label="body · subtle">
        <Typography variant="body" tone="subtle">
          —
        </Typography>
      </Case>
      <Case label="body · danger">
        <Typography variant="body" tone="danger">
          Chyba: GitLab API responded with 500.
        </Typography>
      </Case>
    </Grid>
  ),
};

export const PageTitle: Story = { args: { variant: "pageTitle", children: "GitLab Access Audit" } };

export const SectionTitle: Story = { args: { variant: "sectionTitle", children: "Skupina …" } };

export const Body: Story = { args: { variant: "body" } };

export const Danger: Story = { args: { tone: "danger", children: "Chyba: …" } };
