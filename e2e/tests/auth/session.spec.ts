import { expect, PORTAL_URL, test } from "../../fixtures/index.ts";

test.describe("session expiry", () => {
  test("ends the session and explains why when the API rejects the token and the refresh", async ({
    page,
    signedInAs,
  }) => {
    await signedInAs("admin");

    // From now on the API treats the session as expired: data calls and silent refresh both fail.
    const unauthorized = {
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: "INVALID_TOKEN", message: "Your session is invalid or has expired." },
      }),
    };
    await page.route("**/api/v1/auth/refresh", (route) => route.fulfill(unauthorized));
    await page.route("**/api/v1/students**", (route) => route.fulfill(unauthorized));

    // In-app navigation (no reload), as a user clicking "Students" would do.
    await page.evaluate(() => {
      window.history.pushState({}, "", "/students");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await expect(page).toHaveURL(/\/login\?next=%2Fstudents/);
    await expect(page.getByText(/Your session has ended/)).toBeVisible();
  });

  test("signing out ends the session: protected pages ask for sign-in again", async ({
    page,
    signedInAs,
  }) => {
    await signedInAs("teacher");

    await page.getByRole("button", { name: /^Account menu/ }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto(`${PORTAL_URL}/students`);
    await expect(page).toHaveURL(/\/login\?next=%2Fstudents/);
  });
});
