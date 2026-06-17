import type { ReportUser } from "./user";

/** The full access report returned by the aggregation orchestrator. */
export interface AccessReport {
  /** Full path of the top-level group that was audited. */
  groupPath: string;
  users: ReportUser[];
  total: number;
}
