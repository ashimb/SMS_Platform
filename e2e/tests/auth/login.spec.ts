import {
  apiLogin,
  expect,
  GENERIC_LOGIN_ERROR,
  PASSWORD,
  test,
  USERS,
} from "../../fixtures/index.ts";
import { LoginPage } from "../../pages/LoginPage.ts";

test.describe("portal sign-in", () => {
  test("signs in with valid credentials", { tag: "@smoke" }, async ({ page }) => {
    const login = new LoginPage(page);
    await login.signInAs("admin");
    await login.expectSignedIn();
    await expect(page).toHaveURL(/\/$/);
  });

  test("rejects a wrong password with a generic message and clears the field", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.signIn(USERS.admin.email, "definitely-not-the-password");

    await expect(login.alert).toContainText(GENERIC_LOGIN_ERROR);
    await expect(page).toHaveURL(/\/login/);
    await expect(login.password).toHaveValue("");
  });

  test("gives the same message for an unknown account (no account enumeration)", async ({
    page,
  }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.signIn("nobody-here@greenvalley.example.com", PASSWORD);
    const unknown = (await login.alert.textContent()) ?? "";

    await login.signIn(USERS.admin.email, "definitely-not-the-password");
    await expect(login.alert).toContainText(GENERIC_LOGIN_ERROR);
    expect(unknown).toMatch(GENERIC_LOGIN_ERROR);
  });

  test("validates empty fields before calling the API", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.submit.click();

    await expect(page.getByText("Enter your email address.")).toBeVisible();
    await expect(page.getByText("Enter your password.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows a visible, labelled error to keyboard users (focus moves to the alert)", async ({
    page,
  }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.signIn(USERS.admin.email, "wrong-password-again");
    await expect(login.alert).toBeFocused();
  });
});

test.describe("account lockout", () => {
  test.describe.configure({ mode: "serial" });

  test("locks the account after repeated failures, even for the right password", async ({
    request,
    page,
  }) => {
    const { email } = USERS.lockout;

    // Five consecutive failures lock the account (API setting LOCKOUT_THRESHOLD).
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const result = await apiLogin(request, email, `wrong-password-${String(attempt)}`);
      expect(result.status).toBe(401);
    }

    // The correct password is now refused too, with the same status as any other failure.
    const afterLock = await apiLogin(request, email, PASSWORD);
    expect(afterLock.status).toBe(401);
    expect(afterLock.accessToken).toBeNull();

    // The UI shows the generic message: it never reveals that the account is locked.
    const login = new LoginPage(page);
    await login.goto();
    await login.signIn(email, PASSWORD);
    await expect(login.alert).toContainText(GENERIC_LOGIN_ERROR);
    await expect(login.alert).not.toContainText(/locked/i);
  });
});
