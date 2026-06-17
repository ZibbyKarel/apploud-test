import type { Membership } from "./membership";

/** One user in the final report. */
export interface ReportUser {
  id: number;
  /** Civil name (first + last), e.g. `Jan Konáš`. */
  name: string;
  /** GitLab username, e.g. `jan.konas`. */
  username: string;
  /** GitLab web URL of the user's profile, for linking. */
  webUrl?: string;
  /** GitLab avatar image URL (gravatar/identicon/upload); may be absent. */
  avatarUrl?: string;
  groups: Membership[];
  projects: Membership[];
}
