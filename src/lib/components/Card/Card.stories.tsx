import type { Meta, StoryObj } from "@storybook/nextjs";

import { Case, Grid } from "../../../../.storybook/StoryGrid";
import { Chip } from "../Chip";
import { Row } from "../Stack";
import { Tag } from "../Tag";
import { Card } from "./Card";

const meta = {
  title: "lib/Card",
  component: Card,
  args: { title: "Jan Konáš", subtitle: "@jan.konas" },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = (
  <Row wrap gap="xs">
    <Tag path="acme/platform" variant="primary">
      <Chip>Owner</Chip>
    </Tag>
    <Tag path="acme/platform/api" variant="secondary">
      <Chip>Guest</Chip>
    </Tag>
  </Row>
);

/** Title linked-vs-plain, with/without subtitle, with/without body content. */
export const Overview: Story = {
  name: "Overview — all states",
  render: () => (
    <Grid>
      <Case label="title + subtitle + body">
        <Card title="Jan Konáš" subtitle="@jan.konas">
          {body}
        </Card>
      </Case>
      <Case label="linked title (opens GitLab profile)">
        <Card title="Jan Konáš" subtitle="@jan.konas" titleHref="https://gitlab.com/jan.konas">
          {body}
        </Card>
      </Case>
      <Case label="no subtitle">
        <Card title="Jan Konáš">{body}</Card>
      </Case>
      <Case label="header only (no body)">
        <Card title="Jan Konáš" subtitle="@jan.konas" />
      </Case>
    </Grid>
  ),
};

export const WithSubtitle: Story = {
  render: (args) => <Card {...args}>{body}</Card>,
};

export const LinkedTitle: Story = {
  args: { titleHref: "https://gitlab.com/jan.konas" },
  render: (args) => <Card {...args}>{body}</Card>,
};

export const HeaderOnly: Story = {};
