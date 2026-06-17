import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ButtonDataTestIds, InputDataTestIds } from "@/lib/components";

import { renderWithIntl } from "@/test/intl";

import { GroupForm, GroupFormDataTestIds } from "./GroupForm";

const onSubmit = vi.fn();

beforeEach(() => {
  onSubmit.mockClear();
});

describe("GroupForm", () => {
  it("disables submit when the field is empty", () => {
    renderWithIntl(<GroupForm onSubmit={onSubmit} />);
    expect(screen.getByTestId(ButtonDataTestIds.Root)).toBeDisabled();
  });

  it("disables submit when the field is only whitespace", () => {
    renderWithIntl(<GroupForm defaultGroupId="   " onSubmit={onSubmit} />);
    expect(screen.getByTestId(ButtonDataTestIds.Root)).toBeDisabled();
  });

  it("enables submit once a value is entered", async () => {
    renderWithIntl(<GroupForm onSubmit={onSubmit} />);
    await userEvent.type(screen.getByTestId(InputDataTestIds.Root), "42");
    expect(screen.getByTestId(ButtonDataTestIds.Root)).toBeEnabled();
  });

  it("prefills the field from defaultGroupId", () => {
    renderWithIntl(<GroupForm defaultGroupId="123" onSubmit={onSubmit} />);
    expect(screen.getByTestId(InputDataTestIds.Root)).toHaveValue("123");
  });

  it("calls onSubmit with the trimmed value on submit", async () => {
    renderWithIntl(<GroupForm onSubmit={onSubmit} />);
    await userEvent.type(screen.getByTestId(InputDataTestIds.Root), "  10975505  ");
    await userEvent.click(screen.getByTestId(ButtonDataTestIds.Root));
    expect(onSubmit).toHaveBeenCalledWith("10975505");
  });

  it("does not call onSubmit when the field is empty", () => {
    renderWithIntl(<GroupForm onSubmit={onSubmit} />);
    (screen.getByTestId(GroupFormDataTestIds.Form) as HTMLFormElement).requestSubmit();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
