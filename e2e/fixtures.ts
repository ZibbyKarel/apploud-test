import type { Page, Route } from "@playwright/test";

/**
 * A small but representative report payload (the shape the route returns). Two
 * users, one with both a group and a project membership, one project-only —
 * enough to assert the UI renders names, usernames, roles, paths and the total.
 */
export const SAMPLE_REPORT = {
  groupPath: "apploud-external/testovaci-zadani",
  total: 2,
  users: [
    {
      id: 3,
      name: "Michal Pham",
      username: "KhanhPhams",
      groups: [
        {
          path: "apploud-external/testovaci-zadani/skupina-3",
          role: "Guest",
          accessLevel: 10,
        },
      ],
      projects: [
        {
          path: "apploud-external/testovaci-zadani/uloha-1",
          role: "Guest",
          accessLevel: 10,
        },
      ],
    },
    {
      id: 4,
      name: "Martin Špicar",
      username: "martin.spicar",
      groups: [],
      projects: [
        {
          path: "apploud-external/testovaci-zadani/uloha-1",
          role: "Developer",
          accessLevel: 30,
        },
      ],
    },
  ],
};

const ROUTE_GLOB = "**/api/group-report*";

/** Fulfil the in-app report API with a fixed JSON body + status. */
export async function mockReport(
  page: Page,
  body: unknown,
  status = 200,
): Promise<void> {
  await page.route(ROUTE_GLOB, (route: Route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    }),
  );
}

/** Hold the report API open until `release()` is called — for asserting the loading state. */
export async function mockReportDeferred(
  page: Page,
  body: unknown,
): Promise<{ release: () => void }> {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(ROUTE_GLOB, async (route: Route) => {
    await gate;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
  return { release };
}
