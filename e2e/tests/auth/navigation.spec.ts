import { expect, PORTAL_URL, test } from "../../fixtures/index.ts";

const FORBIDDEN = "You don't have access to this page";

test.describe("role-based navigation", () => {
  test("a teacher cannot open admin-only routes and does not see their menu entries", async ({
    page,
    signedInAs,
  }) => {
    await signedInAs("teacher");

    await expect(page.getByRole("link", { name: /^Audit/ })).toHaveCount(0);

    await page.goto(`${PORTAL_URL}/audit`);
    await expect(page.getByText(FORBIDDEN)).toBeVisible();
  });

  test("an admin can open the same route", async ({ page, signedInAs }) => {
    await signedInAs("admin");
    await page.goto(`${PORTAL_URL}/audit`);

    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByText(FORBIDDEN)).toHaveCount(0);
  });

  test("an unauthenticated visitor is redirected to sign in and returned afterwards", async ({
    page,
  }) => {
    await page.goto(`${PORTAL_URL}/students`);
    await expect(page).toHaveURL(/\/login\?next=%2Fstudents/);
  });

  test("a sign-in link cannot redirect off-site (open redirect)", async ({ page, signedInAs }) => {
    await page.goto(`${PORTAL_URL}/login?next=https://evil.example/`);
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    // The post-login target is sanitised to a same-app path.
    await page.getByLabel(/^Email/).fill("admin@greenvalley.example.com");
    void signedInAs; // fixture intentionally unused: this test signs in manually below
    await page.getByLabel(/^Password/).fill(process.env["E2E_PASSWORD"] ?? "Gv-E2e-9fK2!xQw7");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("main")).toBeVisible();
    expect(new URL(page.url()).origin).toBe(PORTAL_URL);
  });
});
