import { expect, test } from "@playwright/test";

import { SAMPLE_REPORT, mockReport, mockReportDeferred } from "./fixtures";

const INPUT = /ID skupiny/i;
const SUBMIT = "Zkontrolovat";

test.describe("audit flow", () => {
  test("home page shows the group form", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("textbox", { name: INPUT })).toBeVisible();
    await expect(page.getByRole("button", { name: SUBMIT })).toBeVisible();
  });

  test("submitting a group id navigates to its report and renders the users", async ({ page }) => {
    await mockReport(page, SAMPLE_REPORT);
    await page.goto("/");

    await page.getByRole("textbox", { name: INPUT }).fill("10975505");
    await page.getByRole("button", { name: SUBMIT }).click();

    // Navigated to the report route for that group.
    await expect(page).toHaveURL(/\/group\/10975505$/);

    // Heading + total reflect the report.
    await expect(
      page.getByRole("heading", { name: /apploud-external\/testovaci-zadani/ }),
    ).toBeVisible();
    await expect(page.getByText("Celkem uživatelů: 2")).toBeVisible();

    // Both users, their usernames, roles and a project path are shown.
    await expect(page.getByText("Michal Pham")).toBeVisible();
    await expect(page.getByText("@KhanhPhams")).toBeVisible();
    await expect(page.getByText("Martin Špicar")).toBeVisible();
    await expect(page.getByText("@martin.spicar")).toBeVisible();
    await expect(page.getByText("Developer")).toBeVisible();
    await expect(page.getByText("uloha-1").first()).toBeVisible();
  });

  test("shows the loading state while the report is in flight", async ({ page }) => {
    const { release } = await mockReportDeferred(page, SAMPLE_REPORT);
    await page.goto("/");

    await page.getByRole("textbox", { name: INPUT }).fill("10975505");
    await page.getByRole("button", { name: SUBMIT }).click();

    await expect(page.getByText(/Stahuji a spojuji data/i)).toBeVisible();

    release();
    await expect(page.getByText("Celkem uživatelů: 2")).toBeVisible();
  });

  test("renders an empty-but-valid report (0 users)", async ({ page }) => {
    await mockReport(page, { groupPath: "some/empty-group", total: 0, users: [] });
    await page.goto("/group/999");

    await expect(page.getByText("Celkem uživatelů: 0")).toBeVisible();
  });
});

test.describe("error handling", () => {
  test("renders the error message when the API fails (500)", async ({ page }) => {
    await mockReport(page, { error: "GitLab API responded with 500." }, 500);
    await page.goto("/group/10975505");

    // The QueryBoundary error branch must surface the failure — not crash or
    // silently render an empty/garbage report.
    await expect(page.getByText(/Chyba:/i)).toBeVisible();
  });

  test("renders the error message on a 400 (bad group id)", async ({ page }) => {
    await mockReport(page, { error: "groupId must be a numeric group ID." }, 400);
    await page.goto("/group/abc");

    await expect(page.getByText(/Chyba:/i)).toBeVisible();
  });
});

test.describe("form validation", () => {
  test("submit is disabled until a group id is entered", async ({ page }) => {
    await page.goto("/");

    const submit = page.getByRole("button", { name: SUBMIT });
    await expect(submit).toBeDisabled();

    await page.getByRole("textbox", { name: INPUT }).fill("123");
    await expect(submit).toBeEnabled();
  });
});
