/**
 * GitLab access levels. The OpenAPI spec types `access_level` as a string, but
 * the REST API returns an integer at runtime — so we coerce with `Number()`.
 *
 * https://docs.gitlab.com/api/access_requests/#valid-access-levels
 */
export const ACCESS_LEVELS: Record<number, string> = {
  0: "No access",
  5: "Minimal Access",
  10: "Guest",
  15: "Planner",
  20: "Reporter",
  30: "Developer",
  40: "Maintainer",
  50: "Owner",
};

export function accessLevelToRole(level: string | number | null | undefined): string {
  if (level === null || level === undefined || level === "") return "Unknown";
  const n = Number(level);
  if (!Number.isFinite(n)) return "Unknown";
  return ACCESS_LEVELS[n] ?? `Level ${n}`;
}
