import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Chip, ChipDataTestIds } from "./Chip";

describe("Chip", () => {
  it("renders its children", () => {
    render(<Chip>Owner</Chip>);
    expect(screen.getByTestId(ChipDataTestIds.Root)).toHaveTextContent("Owner");
  });
});
