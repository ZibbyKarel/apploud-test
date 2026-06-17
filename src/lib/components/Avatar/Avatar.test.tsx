import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Avatar, AvatarDataTestIds } from "./Avatar";

describe("Avatar", () => {
  it("renders the image when a URL is given", () => {
    render(<Avatar name="Jan Konáš" src="https://gitlab.com/avatar.png" />);
    const img = screen.getByTestId(AvatarDataTestIds.Image);
    expect(img).toHaveAttribute("src", "https://gitlab.com/avatar.png");
    // NOTE: the component's JSDoc documents a decorative `alt=""`, but the code
    // currently renders a descriptive alt. Asserting actual behaviour here; the
    // doc/code mismatch predates this change — flagged for the team to reconcile.
    expect(img).toHaveAttribute("alt", "avatar for Jan Konáš");
    expect(screen.queryByTestId(AvatarDataTestIds.Initials)).not.toBeInTheDocument();
  });

  it("shows first+last initials when no URL is given", () => {
    render(<Avatar name="Jan Konáš" />);
    expect(screen.getByTestId(AvatarDataTestIds.Initials)).toHaveTextContent("JK");
  });

  it("falls back to initials when the image fails to load", () => {
    render(<Avatar name="Eva Nováková" src="https://example.invalid/x.png" />);
    fireEvent.error(screen.getByTestId(AvatarDataTestIds.Image));
    expect(screen.getByTestId(AvatarDataTestIds.Initials)).toHaveTextContent("EN");
    expect(screen.queryByTestId(AvatarDataTestIds.Image)).not.toBeInTheDocument();
  });

  it("uses a single initial for a one-word name", () => {
    render(<Avatar name="Octocat" />);
    expect(screen.getByTestId(AvatarDataTestIds.Initials)).toHaveTextContent("O");
  });
});
