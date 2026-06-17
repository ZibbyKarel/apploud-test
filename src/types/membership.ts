/** A single group/project membership with its resolved role. */
export interface Membership {
  /** Full path, e.g. `apploud-external/testovaci-zadani/skupina-3`. */
  path: string;
  /** Human-readable role, e.g. `Owner`. */
  role: string;
  /** Raw numeric access level (10/20/30/40/50). */
  accessLevel: number;
  /** GitLab web URL of the group/project, for linking. */
  webUrl?: string;
}
