import { expect, PASSWORD, PORTAL_URL, test, USERS } from "../../fixtures/index.ts";
import { LoginPage } from "../../pages/LoginPage.ts";

test.describe("two-step verification", () => {
  test("asks for the authenticator code after a correct password", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.signIn(USERS.mfa.email, PASSWORD);

    await expect(page).toHaveURL(/\/login\/mfa/);
    await expect(page.getByRole("heading", { name: "Verify it's you" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Verify" })).toBeVisible();
    // No session yet: the password step alone must not sign the user in.
    await expect(page.getByRole("link", { name: "Back to sign in" })).toBeVisible();
  });

  test("an accounts without MFA goes straight to the dashboard", async ({ page }) => {
    const login = new LoginPage(page);
    await login.signInAs("teacher");
    await login.expectSignedIn();
    await expect(page).not.toHaveURL(/\/login\/mfa/);
  });

  test("the verification step cannot be reached without signing in first", async ({ page }) => {
    await page.goto(`${PORTAL_URL}/login/mfa`);
    // The pending token lives in memory only, so a direct visit returns to the first step.
    await expect(page).toHaveURL(/\/login$/);
  });
});
