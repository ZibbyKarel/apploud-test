import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Tag, TagDataTestIds } from "./Tag";

describe("Tag", () => {
  it("renders the path", () => {
    render(<Tag path="group/subgroup" />);
    expect(screen.getByTestId(TagDataTestIds.Path)).toHaveTextContent("group/subgroup");
  });

  it("renders as a link opening in a new tab when href is set", () => {
    render(<Tag path="group/project" href="https://gitlab.com/group/project" />);
    const link = screen.getByTestId(TagDataTestIds.Root);
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "https://gitlab.com/group/project");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders as plain text (no link) when href is omitted", () => {
    render(<Tag path="group/project" />);
    expect(screen.getByTestId(TagDataTestIds.Root).tagName).toBe("SPAN");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders trailing children, e.g. a role chip", () => {
    render(
      <Tag path="group/project">
        <span>Owner</span>
      </Tag>,
    );
    expect(screen.getByText("Owner")).toBeInTheDocument();
  });
});
