import { describe, expect, it } from "vitest";

import { accessLevelToRole } from "./access-levels";

describe("accessLevelToRole", () => {
  it("maps known numeric levels to role names", () => {
    expect(accessLevelToRole(10)).toBe("Guest");
    expect(accessLevelToRole(30)).toBe("Developer");
    expect(accessLevelToRole(50)).toBe("Owner");
  });

  it("coerces string levels (the spec types access_level as string)", () => {
    expect(accessLevelToRole("40")).toBe("Maintainer");
  });

  it("falls back gracefully for unknown or missing levels", () => {
    expect(accessLevelToRole(99)).toBe("Level 99");
    expect(accessLevelToRole(null)).toBe("Unknown");
    expect(accessLevelToRole(undefined)).toBe("Unknown");
  });
});
