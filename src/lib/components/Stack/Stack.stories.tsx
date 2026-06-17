import type { Meta, StoryObj } from "@storybook/nextjs";
import React from "react";

import { Case, Grid } from "../../../../.storybook/StoryGrid";
import { Column, Row } from "./Stack";

const meta = {
  title: "lib/Stack",
  component: Row,
  // Required-prop default so the render-only stories below typecheck; every
  // story supplies its own children via `render`, so this is never displayed.
  args: { children: "box" },
} satisfies Meta<typeof Row>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A demo box so the layout props (direction, gap, wrap, …) are visible. */
function Box({ children }: { children?: React.ReactNode }) {
  return (
    <span
      style={{
        background: "#30363d",
        color: "#e6edf3",
        padding: "4px 10px",
        borderRadius: 4,
        fontSize: 13,
      }}
    >
      {children ?? "box"}
    </span>
  );
}

const GAPS = ["xs", "sm", "md", "lg"] as const;

/** Both directions and every layout prop the constrained API exposes. */
export const Overview: Story = {
  name: "Overview — all states",
  render: () => (
    <Grid>
      <Case label="Row (horizontal)">
        <Row gap="sm">
          <Box>1</Box>
          <Box>2</Box>
          <Box>3</Box>
        </Row>
      </Case>
      <Case label="Column (vertical)">
        <Column gap="sm">
          <Box>1</Box>
          <Box>2</Box>
          <Box>3</Box>
        </Column>
      </Case>
      <Case label="gap scale — xs · sm · md · lg">
        <Column gap="md">
          {GAPS.map((g) => (
            <Row key={g} gap={g}>
              <Box>{g}</Box>
              <Box>{g}</Box>
              <Box>{g}</Box>
            </Row>
          ))}
        </Column>
      </Case>
      <Case label="align='baseline'">
        <Row align="baseline" gap="sm">
          <Box>small</Box>
          <span style={{ fontSize: 28, color: "#e6edf3" }}>Big</span>
        </Row>
      </Case>
      <Case label="wrap (narrow container)">
        <div style={{ width: 220, outline: "1px dashed #30363d" }}>
          <Row wrap gap="xs">
            {Array.from({ length: 8 }, (_, i) => (
              <Box key={i}>{i + 1}</Box>
            ))}
          </Row>
        </div>
      </Case>
      <Case label="grow (fills the row)">
        <div style={{ width: 320, outline: "1px dashed #30363d" }}>
          <Row gap="sm">
            <Box>fixed</Box>
            <Row grow gap="xs">
              <Box>grows →</Box>
            </Row>
          </Row>
        </div>
      </Case>
      <Case label="padY (vertical padding)">
        <div style={{ outline: "1px dashed #30363d" }}>
          <Row padY="lg" gap="sm">
            <Box>padded</Box>
          </Row>
        </div>
      </Case>
    </Grid>
  ),
};

export const RowDefault: Story = {
  render: () => (
    <Row gap="sm">
      <Box>1</Box>
      <Box>2</Box>
      <Box>3</Box>
    </Row>
  ),
};

export const ColumnDefault: Story = {
  render: () => (
    <Column gap="sm">
      <Box>1</Box>
      <Box>2</Box>
      <Box>3</Box>
    </Column>
  ),
};
