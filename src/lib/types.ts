/** A single group/project membership with its resolved role. */
export interface Membership {
  /** Full path, e.g. `apploud-external/testovaci-zadani/skupina-3`. */
  path: string;
  /** Human-readable role, e.g. `Owner`. */
  role: string;
  /** Raw numeric access level (10/20/30/40/50). */
  accessLevel: number;
}

/** One user in the final report. */
export interface ReportUser {
  id: number;
  /** Civil name (first + last), e.g. `Jan Konáš`. */
  name: string;
  /** GitLab username, e.g. `jan.konas`. */
  username: string;
  groups: Membership[];
  projects: Membership[];
}

/** The full access report returned by the aggregation orchestrator. */
export interface AccessReport {
  /** Full path of the top-level group that was audited. */
  groupPath: string;
  users: ReportUser[];
  total: number;
}
