import { describe, expect, it } from "vitest";

import { formatReport } from "./format";
import type { AccessReport } from "./types";

describe("formatReport", () => {
  it("renders the human-readable block from the task sample", () => {
    const report: AccessReport = {
      groupPath: "apploud-external/testovaci-zadani",
      total: 2,
      users: [
        {
          id: 1,
          name: "Jan Konáš",
          username: "jan.konas",
          groups: [
            { path: "apploud-external/testovaci-zadani", role: "Owner", accessLevel: 50 },
          ],
          projects: [],
        },
        {
          id: 2,
          name: "Michal Pham",
          username: "KhanhPhams",
          groups: [
            { path: "apploud-external/testovaci-zadani/skupina-3", role: "Guest", accessLevel: 10 },
          ],
          projects: [
            { path: "apploud-external/testovaci-zadani/uloha-1", role: "Guest", accessLevel: 10 },
          ],
        },
      ],
    };

    expect(formatReport(report)).toBe(
      [
        "Jan Konáš (@jan.konas)",
        "Groups:    [apploud-external/testovaci-zadani (Owner)]",
        "Projects:  []",
        "",
        "Michal Pham (@KhanhPhams)",
        "Groups:    [apploud-external/testovaci-zadani/skupina-3 (Guest)]",
        "Projects:  [apploud-external/testovaci-zadani/uloha-1 (Guest)]",
        "",
        "Total Users: 2",
      ].join("\n"),
    );
  });

  it("handles an empty report", () => {
    const report: AccessReport = { groupPath: "x", total: 0, users: [] };
    expect(formatReport(report)).toBe("Total Users: 0");
  });
});
