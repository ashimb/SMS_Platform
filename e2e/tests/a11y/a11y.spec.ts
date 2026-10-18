import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

import { expect, PORTAL_URL, test } from "../../fixtures/index.ts";
import { LoginPage } from "../../pages/LoginPage.ts";
import { WebsiteHomePage } from "../../pages/WebsiteHomePage.ts";

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function scan(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  // Fail with a readable summary: rule, impact and the first few offending nodes.
  const summary = results.violations.map(
    (v) =>
      `${v.id} (${v.impact ?? "n/a"}): ${v.help}\n   ${v.nodes
        .slice(0, 3)
        .map(
          (n) =>
            `${n.target.join(" ")}  ${n.html.slice(0, 240)}  ${JSON.stringify(n.any.map((a) => a.data))}`,
        )
        .join("\n   ")}`,
  );
  expect(summary, `axe violations:\n${summary.join("\n")}`).toEqual([]);
}

test.describe("accessibility (axe, WCAG 2.2 AA)", () => {
  test("portal sign-in page", async ({ page }) => {
    await new LoginPage(page).goto();
    await scan(page);
  });

  test("portal dashboard", async ({ page, signedInAs }) => {
    await signedInAs("admin");
    await page.goto(`${PORTAL_URL}/`);
    await expect(page.getByRole("main")).toBeVisible();
    await scan(page);
  });

  test("website home page", { tag: "@smoke" }, async ({ page }) => {
    await new WebsiteHomePage(page).goto();
    await scan(page);
  });

  test("website home page in dark mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await new WebsiteHomePage(page).goto();
    await scan(page);
  });
});
