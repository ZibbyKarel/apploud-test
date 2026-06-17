import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Typography, TypographyDataTestIds } from "./Typography";

describe("Typography", () => {
  it("renders its children", () => {
    render(<Typography>hello</Typography>);
    expect(screen.getByTestId(TypographyDataTestIds.Root)).toHaveTextContent("hello");
  });

  it("renders the default element for a variant", () => {
    render(<Typography variant="pageTitle">Title</Typography>);
    // Heading level is the property under test — assert via role.
    expect(screen.getByRole("heading", { level: 1, name: "Title" })).toBeInTheDocument();
  });

  it("renders sectionTitle as an h2 by default", () => {
    render(<Typography variant="sectionTitle">Section</Typography>);
    expect(screen.getByRole("heading", { level: 2, name: "Section" })).toBeInTheDocument();
  });

  it("honours the `as` override so the slot keeps its original element", () => {
    render(
      <Typography variant="sectionTitle" as="span">
        Inline
      </Typography>,
    );
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.getByTestId(TypographyDataTestIds.Root).tagName).toBe("SPAN");
  });

  it("applies tone and modifier classes", () => {
    render(
      <Typography variant="body" tone="danger" preWrap mono>
        boom
      </Typography>,
    );
    const el = screen.getByTestId(TypographyDataTestIds.Root);
    expect(el.className).toContain("text-danger");
    expect(el.className).toContain("whitespace-pre-wrap");
    expect(el.className).toContain("font-mono");
  });
});
