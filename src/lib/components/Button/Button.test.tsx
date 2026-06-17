import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button, ButtonDataTestIds } from "./Button";

describe("Button", () => {
  it("renders its children with an accessible name", () => {
    render(<Button>Zkontrolovat</Button>);
    // Accessible name is the property under test — assert via role.
    expect(screen.getByRole("button", { name: "Zkontrolovat" })).toBeInTheDocument();
    expect(screen.getByTestId(ButtonDataTestIds.Root)).toHaveTextContent("Zkontrolovat");
  });

  it("defaults to type=button so it never submits a form by accident", () => {
    render(<Button>Go</Button>);
    expect(screen.getByTestId(ButtonDataTestIds.Root)).toHaveAttribute("type", "button");
  });

  it("forwards type=submit when asked", () => {
    render(<Button type="submit">Go</Button>);
    expect(screen.getByTestId(ButtonDataTestIds.Root)).toHaveAttribute("type", "submit");
  });

  it("forwards the disabled attribute", () => {
    render(<Button disabled>Go</Button>);
    expect(screen.getByTestId(ButtonDataTestIds.Root)).toBeDisabled();
  });

  it("forwards onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByTestId(ButtonDataTestIds.Root));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("exposes the underlying button via ref", () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Button ref={ref}>Go</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
