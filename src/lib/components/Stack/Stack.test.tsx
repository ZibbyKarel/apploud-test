import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Column, Row, StackDataTestIds } from "./Stack";

describe("Stack", () => {
  it("Row lays children out in a horizontal flex row", () => {
    render(<Row>child</Row>);
    expect(screen.getByTestId(StackDataTestIds.Root)).toHaveClass("flex", "flex-row", "min-w-0");
  });

  it("Column lays children out in a vertical flex column", () => {
    render(<Column>child</Column>);
    expect(screen.getByTestId(StackDataTestIds.Root)).toHaveClass("flex", "flex-col");
  });

  it("maps the gap token to the matching spacing class", () => {
    render(<Row gap="md">child</Row>);
    expect(screen.getByTestId(StackDataTestIds.Root)).toHaveClass("gap-2.5");
  });

  it("applies wrap, grow, align and padY props", () => {
    render(
      <Row wrap grow align="baseline" padY="xs">
        child
      </Row>,
    );
    expect(screen.getByTestId(StackDataTestIds.Root)).toHaveClass(
      "flex-wrap",
      "flex-1",
      "items-baseline",
      "py-1.5",
    );
  });

  it("emits no optional layout classes by default", () => {
    render(<Column>child</Column>);
    const cls = screen.getByTestId(StackDataTestIds.Root).className;
    expect(cls).not.toMatch(/gap-|items-|flex-wrap|flex-1|py-/);
  });
});
