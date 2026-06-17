import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ReportUser } from "@/types";

import { AvatarDataTestIds, CardDataTestIds, TagDataTestIds } from "@/lib/components";

import { renderWithIntl } from "@/test/intl";

import { MembershipListDataTestIds } from "../MembershipList";

import { UserCard } from "./UserCard";

const baseUser: ReportUser = {
  id: 1,
  name: "Jan Konáš",
  username: "jan.konas",
  webUrl: "https://gitlab.com/jan.konas",
  avatarUrl: "https://gitlab.com/avatar.png",
  groups: [{ path: "group/a", role: "Owner", accessLevel: 50 }],
  projects: [{ path: "group/a/proj", role: "Guest", accessLevel: 10 }],
};

describe("UserCard", () => {
  it("renders the user's name linking to their GitLab profile", () => {
    renderWithIntl(<UserCard user={baseUser} />);
    const link = screen.getByTestId(CardDataTestIds.TitleLink);
    expect(link).toHaveTextContent("Jan Konáš");
    expect(link).toHaveAttribute("href", "https://gitlab.com/jan.konas");
  });

  it("renders the user's avatar from GitLab", () => {
    renderWithIntl(<UserCard user={baseUser} />);
    expect(screen.getByTestId(AvatarDataTestIds.Image)).toHaveAttribute(
      "src",
      "https://gitlab.com/avatar.png",
    );
  });

  it("falls back to initials when the user has no avatar", () => {
    renderWithIntl(<UserCard user={{ ...baseUser, avatarUrl: undefined }} />);
    expect(screen.getByTestId(AvatarDataTestIds.Initials)).toHaveTextContent("JK");
  });

  it("renders the @username", () => {
    renderWithIntl(<UserCard user={baseUser} />);
    expect(screen.getByTestId(CardDataTestIds.Subtitle)).toHaveTextContent("@jan.konas");
  });

  it("renders both the group and project memberships", () => {
    renderWithIntl(<UserCard user={baseUser} />);

    const groups = screen.getByTestId(MembershipListDataTestIds.Groups);
    expect(within(groups).getByTestId(MembershipListDataTestIds.Label)).toHaveTextContent(
      /skupiny/i,
    );
    expect(within(groups).getByTestId(TagDataTestIds.Path)).toHaveTextContent("group/a");

    const projects = screen.getByTestId(MembershipListDataTestIds.Projects);
    expect(within(projects).getByTestId(MembershipListDataTestIds.Label)).toHaveTextContent(
      /projekty/i,
    );
    expect(within(projects).getByTestId(TagDataTestIds.Path)).toHaveTextContent("group/a/proj");
  });

  it("shows the empty placeholder for a user with no memberships", () => {
    renderWithIntl(<UserCard user={{ ...baseUser, groups: [], projects: [] }} />);
    // One placeholder for groups, one for projects.
    expect(screen.getAllByTestId(MembershipListDataTestIds.Empty)).toHaveLength(2);
  });
});
