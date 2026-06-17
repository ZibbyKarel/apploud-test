import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GroupProvider, useGroupContext } from "./GroupContext";

const push = vi.fn();
let params: { id?: string } = {};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useParams: () => params,
}));

/** Minimal consumer exercising the context contract directly. */
function Consumer() {
  const { changeGroupId, groupId } = useGroupContext();
  return (
    <button type="button" onClick={() => changeGroupId("  group/sub  ")}>
      {groupId}
    </button>
  );
}

function renderConsumer() {
  return render(
    <GroupProvider>
      <Consumer />
    </GroupProvider>,
  );
}

beforeEach(() => {
  push.mockClear();
  params = {};
});

describe("GroupContext", () => {
  it("exposes the decoded route param as groupId", () => {
    params = { id: "123" };
    renderConsumer();
    expect(screen.getByRole("button")).toHaveTextContent("123");
  });

  it("navigates to the trimmed, encoded group route on changeGroupId", async () => {
    renderConsumer();
    await userEvent.click(screen.getByRole("button"));
    expect(push).toHaveBeenCalledWith("/group/group%2Fsub");
  });

  it("does not navigate when changeGroupId receives a blank value", () => {
    function BlankConsumer() {
      const { changeGroupId } = useGroupContext();
      return (
        <button type="button" onClick={() => changeGroupId("   ")}>
          go
        </button>
      );
    }
    render(
      <GroupProvider>
        <BlankConsumer />
      </GroupProvider>,
    );
    screen.getByRole("button").click();
    expect(push).not.toHaveBeenCalled();
  });
});
