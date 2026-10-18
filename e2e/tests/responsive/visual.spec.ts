import { expect, PORTAL_URL, test, WEBSITE_URL } from "../../fixtures/index.ts";
import { LoginPage } from "../../pages/LoginPage.ts";

/**
 * Visual regression: login, portal dashboard, students list and website home, in light and dark,
 * at a phone (375), tablet (768) and desktop (1440) width. Only those three viewport projects take
 * snapshots; the others skip. Baselines are per platform (font rendering differs between
 * operating systems): create them with `npx playwright test tests/responsive/visual.spec.ts
 * --update-snapshots` on the platform that will compare them (CI: Linux).
 */
const SNAPSHOT_PROJECTS = new Set(["rs-375-iphone-se", "rs-768-ipad-portrait", "rs-1440-desktop"]);

for (const scheme of ["light", "dark"] as const) {
  test.describe(`visual (${scheme})`, () => {
    test.use({ colorScheme: scheme });

    test.beforeEach(() => {
      test.skip(
        !SNAPSHOT_PROJECTS.has(test.info().project.name),
        "snapshots at 375 / 768 / 1440 only",
      );
    });

    const shot = { fullPage: true, maxDiffPixelRatio: 0.02 } as const;

    test("login", async ({ page }) => {
      await new LoginPage(page).goto();
      await expect(page).toHaveScreenshot(`login-${scheme}.png`, shot);
    });

    test("portal dashboard", async ({ page, signedInAs }) => {
      await signedInAs("admin");
      await page.goto(`${PORTAL_URL}/`);
      await expect(page.getByRole("main")).toBeVisible();
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot(`dashboard-${scheme}.png`, {
        ...shot,
        // Dates and "as of" times change between runs.
        mask: [page.locator("time"), page.getByText(/as of/i)],
      });
    });

    test("students list", async ({ page, signedInAs }) => {
      await signedInAs("admin");
      await page.goto(`${PORTAL_URL}/students`);
      await expect(page.getByText(/^Showing 1–/)).toBeVisible();
      await expect(page).toHaveScreenshot(`students-${scheme}.png`, shot);
    });

    test("website home", async ({ page }) => {
      await page.goto(`${WEBSITE_URL}/`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await page.waitForLoadState("load");
      await expect(page).toHaveScreenshot(`website-home-${scheme}.png`, {
        ...shot,
        // The hero photo is not part of the layout under test.
        mask: [page.locator("section[aria-labelledby=hero-title] img")],
      });
    });
  });
}
