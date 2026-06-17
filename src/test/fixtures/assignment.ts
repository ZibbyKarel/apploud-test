/**
 * The exact GitLab subtree from the assignment (`apploud-testovaci-zadani-fe.md`),
 * which documents the expected report for the real test environment:
 *
 *   Jan Konáš (@jan.konas)      Groups: testovaci-zadani (Owner)            Projects: —
 *   Jan Konáš (@jankonas1)      Groups: testovaci-zadani (Owner)            Projects: —
 *   Michal Pham (@KhanhPhams)   Groups: …/skupina-3 (Guest)                 Projects: …/uloha-1 (Guest)
 *   Martin Špicar (@martin.spicar) Groups: —                                Projects: …/uloha-1 (Developer),
 *                                                                                     …/skupina-4/projekt-3 (Guest),
 *                                                                                     …/skupina-3/projekt-2 (Guest)
 *   Michal Bílý (@MichalBily)   Groups: …/skupina-1 (Guest)                 Projects: —
 *   Total Users: 5
 *
 * Reproducing it here lets the API-layer e2e test assert the transformed report
 * field-for-field — a regression lock on the merge-by-user-id aggregation that
 * the pure-function unit tests don't cover.
 */
import type { GitlabTopology } from "../gitlab-mock";

const BASE = "apploud-external/testovaci-zadani";

/** GitLab numeric access levels (mirrors src/lib/utils/api/access-levels.ts). */
const GUEST = 10;
const DEVELOPER = 30;
const OWNER = 50;

const TOP_GROUP_ID = 10975505;
const SKUPINA_1 = 2;
const SKUPINA_2 = 3;
const SKUPINA_4 = 4; // nested under skupina-2
const SKUPINA_3 = 5;

const ULOHA_1 = 101; // project directly under the top group
const PROJEKT_2 = 102; // project under skupina-3
const PROJEKT_3 = 103; // project under skupina-2/skupina-4

const janKonas = { id: 1, name: "Jan Konáš", username: "jan.konas" };
const janKonas1 = { id: 2, name: "Jan Konáš", username: "jankonas1" };
const michalPham = { id: 3, name: "Michal Pham", username: "KhanhPhams" };
const martinSpicar = { id: 4, name: "Martin Špicar", username: "martin.spicar" };
const michalBily = { id: 5, name: "Michal Bílý", username: "MichalBily" };

export const ASSIGNMENT_TOPOLOGY: GitlabTopology = {
  topGroupId: TOP_GROUP_ID,
  topGroupPath: BASE,
  descendants: [
    { id: SKUPINA_1, full_path: `${BASE}/skupina-1` },
    { id: SKUPINA_2, full_path: `${BASE}/skupina-2` },
    { id: SKUPINA_4, full_path: `${BASE}/skupina-2/skupina-4` },
    { id: SKUPINA_3, full_path: `${BASE}/skupina-3` },
  ],
  groupMembers: {
    [TOP_GROUP_ID]: [
      { ...janKonas, access_level: OWNER },
      { ...janKonas1, access_level: OWNER },
    ],
    [SKUPINA_1]: [{ ...michalBily, access_level: GUEST }],
    [SKUPINA_3]: [{ ...michalPham, access_level: GUEST }],
    // skupina-2 and skupina-4 have no direct members.
  },
  groupProjects: {
    [TOP_GROUP_ID]: [{ id: ULOHA_1, path_with_namespace: `${BASE}/uloha-1` }],
    [SKUPINA_3]: [{ id: PROJEKT_2, path_with_namespace: `${BASE}/skupina-3/projekt-2` }],
    [SKUPINA_4]: [{ id: PROJEKT_3, path_with_namespace: `${BASE}/skupina-2/skupina-4/projekt-3` }],
  },
  projectMembers: {
    [ULOHA_1]: [
      { ...michalPham, access_level: GUEST },
      { ...martinSpicar, access_level: DEVELOPER },
    ],
    [PROJEKT_2]: [{ ...martinSpicar, access_level: GUEST }],
    [PROJEKT_3]: [{ ...martinSpicar, access_level: GUEST }],
  },
};

export const ASSIGNMENT_TOP_GROUP_ID = String(TOP_GROUP_ID);
export const ASSIGNMENT_GROUP_PATH = BASE;
