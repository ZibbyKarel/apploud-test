import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Card, CardDataTestIds } from "./Card";

describe("Card", () => {
  it("renders the title", () => {
    render(<Card title="Jan Konáš" />);
    expect(screen.getByTestId(CardDataTestIds.Title)).toHaveTextContent("Jan Konáš");
  });

  it("renders the title as a new-tab link when titleHref is set", () => {
    render(<Card title="Jan Konáš" titleHref="https://gitlab.com/jan" />);
    const link = screen.getByTestId(CardDataTestIds.TitleLink);
    expect(link).toHaveAttribute("href", "https://gitlab.com/jan");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders the title as plain text when titleHref is omitted", () => {
    render(<Card title="Jan Konáš" />);
    expect(screen.queryByTestId(CardDataTestIds.TitleLink)).not.toBeInTheDocument();
  });

  it("renders the subtitle when provided", () => {
    render(<Card title="Jan Konáš" subtitle="@jan.konas" />);
    expect(screen.getByTestId(CardDataTestIds.Subtitle)).toHaveTextContent("@jan.konas");
  });

  it("omits the subtitle when not provided", () => {
    render(<Card title="Jan Konáš" />);
    expect(screen.queryByTestId(CardDataTestIds.Subtitle)).not.toBeInTheDocument();
  });

  it("renders body children", () => {
    render(
      <Card title="Jan Konáš">
        <p>body content</p>
      </Card>,
    );
    expect(screen.getByText("body content")).toBeInTheDocument();
  });
});
