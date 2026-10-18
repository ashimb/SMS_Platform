import { expect, PORTAL_URL, STUDENTS, test, WEBSITE_URL } from "../../fixtures/index.ts";
import { assertNoHorizontalOverflow } from "../../helpers/responsive.ts";

/**
 * No horizontal page scroll from 320 to 1440 px (RESPONSIVE standard). Runs once per viewport
 * project (rs-*), so every route is checked at every verified width.
 */
const WEBSITE_ROUTES = [
  "/",
  "/about",
  "/admissions",
  "/notices",
  "/notices/diwali-holidays",
  "/events",
  "/events/annual-day-2026",
  "/gallery",
  "/contact",
  "/facilities",
  "/privacy-policy",
  "/this-page-does-not-exist",
];

const MODULES = [
  "/guardians",
  "/staff",
  "/academics",
  "/timetable",
  "/attendance",
  "/exams",
  "/admissions",
  "/fees",
  "/communication",
  "/cms",
  "/reports",
  "/settings",
  "/audit",
];

const PORTAL_ROUTES = {
  admin: [
    "/",
    "/students",
    "/students/new",
    `/students/${STUDENTS.a.id}`,
    `/students/${STUDENTS.a.id}/edit`,
    ...MODULES,
    "/403",
    "/does-not-exist",
  ],
  teacher: ["/", "/students", "/attendance", "/timetable", "/exams", "/communication"],
  parent: ["/"],
} as const;

test.describe("website: no horizontal overflow", () => {
  for (const route of WEBSITE_ROUTES) {
    test(`${route}`, async ({ page }) => {
      await page.goto(`${WEBSITE_URL}${route}`);
      await expect(page.locator("main")).toBeVisible();
      await page.waitForLoadState("load");
      await assertNoHorizontalOverflow(page, `website ${route}`);
    });
  }

  test("enquiry form with validation errors", async ({ page }) => {
    await page.goto(`${WEBSITE_URL}/admissions#enquiry`);
    await page.getByRole("button", { name: "Send enquiry" }).click();
    await expect(page.getByRole("alert").first()).toBeVisible();
    await assertNoHorizontalOverflow(page, "website enquiry form (errors)");
  });
});

test.describe("portal: no horizontal overflow", () => {
  for (const route of ["/login", "/forgot-password"]) {
    test(`anonymous ${route}`, async ({ page }) => {
      await page.goto(`${PORTAL_URL}${route}`);
      await expect(page.getByRole("main")).toBeVisible();
      await assertNoHorizontalOverflow(page, `portal ${route}`);
    });
  }

  for (const role of ["admin", "teacher", "parent"] as const) {
    test(`${role}: every route`, async ({ page, signedInAs }) => {
      test.setTimeout(180_000);
      await signedInAs(role);
      for (const route of PORTAL_ROUTES[role]) {
        await page.goto(`${PORTAL_URL}${route}`);
        await expect(page.getByRole("main")).toBeVisible();
        // Let lazy route chunks and the first data request settle.
        await page.waitForLoadState("networkidle");
        await assertNoHorizontalOverflow(page, `portal ${role} ${route}`);
      }
    });
  }
});
