import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

import { expect, PORTAL_URL, test, WEBSITE_URL } from "../../fixtures/index.ts";
import { viewportWidth } from "../../helpers/responsive.ts";
import { LoginPage } from "../../pages/LoginPage.ts";

/**
 * axe (WCAG 2.2 AA) at every verified viewport, including the mobile-only surfaces: the bottom
 * sheets, the stacked-card list and the full-screen website menu.
 */
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function scan(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  const summary = results.violations.map(
    (v) =>
      `${v.id} (${v.impact ?? "n/a"}): ${v.help}\n   ${v.nodes
        .slice(0, 3)
        .map((n) => `${n.target.join(" ")}  ${n.html.slice(0, 200)}`)
        .join("\n   ")}`,
  );
  expect(summary, `${label}: axe violations:\n${summary.join("\n")}`).toEqual([]);
}

test.describe("axe at every viewport", () => {
  // Sheets fade in; scanning mid-animation would measure half-transparent overlays.
  test.use({ reducedMotion: "reduce" });

  test("portal sign-in", async ({ page }) => {
    await new LoginPage(page).goto();
    await scan(page, "login");
  });

  test("portal dashboard", async ({ page, signedInAs }) => {
    await signedInAs("admin");
    await page.goto(`${PORTAL_URL}/`);
    await expect(page.getByRole("main")).toBeVisible();
    await page.waitForLoadState("networkidle");
    await scan(page, "dashboard");
  });

  test("students list and its filter sheet", async ({ page, signedInAs }) => {
    await signedInAs("admin");
    await page.goto(`${PORTAL_URL}/students`);
    await expect(page.getByText(/^Showing 1–/)).toBeVisible();
    await scan(page, "students list");

    const filters = page.getByRole("button", { name: /Filters/ });
    if (await filters.isVisible()) {
      await filters.click();
      await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
      await scan(page, "filter sheet");
    }
  });

  test("portal More sheet", async ({ page, signedInAs }) => {
    await signedInAs("admin");
    const more = page.getByRole("button", { name: "More" });
    test.skip(!(await more.isVisible()), "no bottom bar at this width");
    await more.click();
    await expect(page.getByRole("dialog", { name: "All sections" })).toBeVisible();
    await scan(page, "More sheet");
  });

  test("website home and the open mobile menu", async ({ page }) => {
    await page.goto(`${WEBSITE_URL}/`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await scan(page, "website home");

    const opener = page.getByRole("button", { name: "Open menu" });
    if (await opener.isVisible()) {
      await opener.click();
      await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
      await scan(page, `website menu @${String(viewportWidth(page))}`);
    }
  });

  test("website enquiry form with errors", async ({ page }) => {
    await page.goto(`${WEBSITE_URL}/admissions#enquiry`);
    await page.getByRole("button", { name: "Send enquiry" }).click();
    await expect(page.getByRole("alert").first()).toBeVisible();
    await scan(page, "enquiry errors");
  });
});
