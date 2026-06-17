import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Input, InputDataTestIds } from "./Input";

describe("Input", () => {
  it("renders a textbox reachable by its aria-label", () => {
    render(<Input aria-label="ID skupiny" />);
    // Accessible name is the property under test — assert via role.
    expect(screen.getByRole("textbox", { name: "ID skupiny" })).toBeInTheDocument();
  });

  it("forwards arbitrary native attributes", () => {
    render(<Input aria-label="f" inputMode="numeric" placeholder="123" defaultValue="42" />);
    const input = screen.getByTestId(InputDataTestIds.Root);
    expect(input).toHaveAttribute("inputMode", "numeric");
    expect(input).toHaveAttribute("placeholder", "123");
    expect(input).toHaveValue("42");
  });

  it("accepts user input", async () => {
    render(<Input aria-label="f" />);
    await userEvent.type(screen.getByTestId(InputDataTestIds.Root), "10975505");
    expect(screen.getByTestId(InputDataTestIds.Root)).toHaveValue("10975505");
  });

  it("exposes the underlying input via ref (for react-hook-form register)", () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Input aria-label="f" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
