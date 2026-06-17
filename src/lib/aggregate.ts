import pLimit from "p-limit";

import { getApiV4GroupsId } from "@/api/generated/groups/groups";
import {
  getApiV4GroupsIdDescendantGroups,
  getApiV4GroupsIdProjects,
} from "@/api/generated/groups/groups";
import {
  getApiV4GroupsIdMembers,
  getApiV4ProjectsIdMembers,
} from "@/api/generated/members/members";
import type {
  APIEntitiesGroup,
  APIEntitiesMember,
  APIEntitiesProject,
} from "@/api/generated/model";

import { accessLevelToRole } from "./access-levels";
import { fetchAllPages } from "./paginate";
import type { AccessReport, Membership, ReportUser } from "./types";

/** Max concurrent GitLab requests. The real instance has ~500 projects, so we
 * fan out project-member calls but cap concurrency to stay friendly to the API. */
const CONCURRENCY = 8;

/**
 * Builds the access report for a top-level group: every user who is a DIRECT
 * member of the group (or any descendant group) or of any project within the
 * subtree, with their roles.
 *
 * Direct membership (not `/members/all`) matches the task's sample output, where
 * a user with no group membership still appears via their project memberships.
 */
export async function buildAccessReport(groupId: string): Promise<AccessReport> {
  const id = groupId.trim();

  // 1. Top-level group — validates access and gives us its full path.
  const topRes = await getApiV4GroupsId(id);
  if (topRes.status !== 200) {
    throw new Error(`Failed to load group ${id} (status ${topRes.status})`);
  }
  const topGroup = topRes.data;

  // 2. All descendant groups (any depth) in one paginated sweep.
  const descendants = await fetchAllPages<APIEntitiesGroup>((page, perPage) =>
    getApiV4GroupsIdDescendantGroups(id, { page, per_page: perPage }),
  );

  const groups: Array<{ id: number; fullPath: string }> = [
    { id: Number(topGroup.id), fullPath: topGroup.full_path ?? id },
    ...descendants
      .filter((g) => g.id != null)
      .map((g) => ({ id: Number(g.id), fullPath: g.full_path ?? String(g.id) })),
  ];

  const users = new Map<number, ReportUser>();
  // Project id -> full path. Each project belongs to exactly one group, so
  // iterating every group covers each project once (the Map also de-dupes).
  const projects = new Map<number, string>();

  const limit = pLimit(CONCURRENCY);

  // 3. For each group: direct members + the group's projects, in parallel.
  await Promise.all(
    groups.flatMap((group) => [
      limit(async () => {
        const members = await fetchAllPages<APIEntitiesMember>((page, perPage) =>
          getApiV4GroupsIdMembers(String(group.id), { page, per_page: perPage }),
        );
        for (const member of members) {
          addMembership(users, member, "groups", group.fullPath);
        }
      }),
      limit(async () => {
        const groupProjects = await fetchAllPages<APIEntitiesProject>((page, perPage) =>
          getApiV4GroupsIdProjects(String(group.id), { page, per_page: perPage }),
        );
        for (const project of groupProjects) {
          if (project.id != null) {
            projects.set(
              Number(project.id),
              project.path_with_namespace ?? String(project.id),
            );
          }
        }
      }),
    ]),
  );

  // 4. For each project: direct members (the main fan-out at scale).
  await Promise.all(
    [...projects.entries()].map(([projectId, projectPath]) =>
      limit(async () => {
        const members = await fetchAllPages<APIEntitiesMember>((page, perPage) =>
          getApiV4ProjectsIdMembers(String(projectId), { page, per_page: perPage }),
        );
        for (const member of members) {
          addMembership(users, member, "projects", projectPath);
        }
      }),
    ),
  );

  // 5. Assemble, sorted by name then username for stable output.
  const list = [...users.values()].sort(
    (a, b) => a.name.localeCompare(b.name) || a.username.localeCompare(b.username),
  );

  return {
    groupPath: topGroup.full_path ?? id,
    users: list,
    total: list.length,
  };
}

function addMembership(
  users: Map<number, ReportUser>,
  member: APIEntitiesMember,
  kind: "groups" | "projects",
  path: string,
): void {
  if (member.id == null) return;

  let user = users.get(member.id);
  if (!user) {
    user = {
      id: member.id,
      name: member.name ?? "",
      username: member.username ?? "",
      groups: [],
      projects: [],
    };
    users.set(member.id, user);
  }

  const entry: Membership = {
    path,
    role: accessLevelToRole(member.access_level),
    accessLevel: Number(member.access_level),
  };
  user[kind].push(entry);
}
