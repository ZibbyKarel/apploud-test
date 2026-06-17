import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Membership } from "@/types";

import { ChipDataTestIds, TagDataTestIds } from "@/lib/components";

import { renderWithIntl } from "@/test/intl";

import {
  GroupMemberships,
  MembershipListDataTestIds,
  ProjectMemberships,
} from "./MembershipList";

const memberships: Membership[] = [
  {
    path: "group/a",
    role: "Owner",
    accessLevel: 50,
    webUrl: "https://gitlab.com/group/a",
  },
  { path: "group/b", role: "Guest", accessLevel: 10 },
];

describe("GroupMemberships", () => {
  it('renders the "Skupiny" label (rendered upper-cased)', () => {
    renderWithIntl(<GroupMemberships items={memberships} />);
    expect(screen.getByTestId(MembershipListDataTestIds.Label)).toHaveTextContent(/skupiny/i);
  });

  it("renders each membership path with its role chip and link", () => {
    renderWithIntl(<GroupMemberships items={memberships} />);
    const paths = screen
      .getAllByTestId(TagDataTestIds.Path)
      .map((el) => el.textContent);
    expect(paths).toEqual(["group/a", "group/b"]);

    const roles = screen
      .getAllByTestId(ChipDataTestIds.Root)
      .map((el) => el.textContent);
    expect(roles).toEqual(["Owner", "Guest"]);

    // group/a carries a webUrl, so its tag is rendered as a link.
    expect(screen.getAllByTestId(TagDataTestIds.Root)[0]).toHaveAttribute(
      "href",
      "https://gitlab.com/group/a",
    );
  });

  it("shows the empty placeholder when there are no memberships", () => {
    renderWithIntl(<GroupMemberships items={[]} />);
    expect(screen.getByTestId(MembershipListDataTestIds.Empty)).toBeInTheDocument();
    expect(screen.queryByTestId(MembershipListDataTestIds.List)).not.toBeInTheDocument();
  });
});

describe("ProjectMemberships", () => {
  it('renders the "Projekty" label (rendered upper-cased)', () => {
    renderWithIntl(<ProjectMemberships items={memberships} />);
    expect(screen.getByTestId(MembershipListDataTestIds.Label)).toHaveTextContent(/projekty/i);
  });

  it("renders the empty placeholder inside the projects row", () => {
    renderWithIntl(<ProjectMemberships items={[]} />);
    const row = screen.getByTestId(MembershipListDataTestIds.Projects);
    expect(within(row).getByTestId(MembershipListDataTestIds.Empty)).toBeInTheDocument();
  });
});
