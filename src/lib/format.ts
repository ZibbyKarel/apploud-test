import type { AccessReport, Membership } from "./types";

function formatMemberships(items: Membership[]): string {
  return `[${items.map((m) => `${m.path} (${m.role})`).join(", ")}]`;
}

/**
 * Renders the report as the human-readable text block from the task description:
 *
 *   Jan Konáš (@jan.konas)
 *   Groups:    [apploud-external/testovaci-zadani (Owner)]
 *   Projects:  []
 *
 *   Total Users: 5
 */
export function formatReport(report: AccessReport): string {
  const blocks = report.users.map(
    (u) =>
      `${u.name} (@${u.username})\n` +
      `Groups:    ${formatMemberships(u.groups)}\n` +
      `Projects:  ${formatMemberships(u.projects)}`,
  );
  return `${blocks.join("\n\n")}${blocks.length ? "\n\n" : ""}Total Users: ${report.total}`;
}
