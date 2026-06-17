import { defineConfig, devices } from "@playwright/test";

/**
 * Browser e2e for the GitLab Access Audit UI.
 *
 * These specs mock the app's own `/api/group-report` endpoint at the browser
 * boundary (`page.route`), so they're deterministic and need no GITLAB_TOKEN or
 * live GitLab — the server-side route + aggregation are already covered by the
 * Vitest API-layer e2e suite (`src/app/api/group-report/*.e2e.test.ts`).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // A token isn't needed (the API is mocked in-browser), but the dev server reads
  // .env.local on boot regardless; a dummy keeps it happy if the file is absent.
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { GITLAB_TOKEN: process.env.GITLAB_TOKEN ?? "e2e-dummy-token" },
  },
});
