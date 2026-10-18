import { expect, type Locator, type Page } from "@playwright/test";

import { PASSWORD, PORTAL_URL, type UserKey, USERS } from "../fixtures/seed.ts";

/** Portal sign-in page (apps/portal/src/features/auth). */
export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly alert: Locator;

  constructor(readonly page: Page) {
    this.email = page.getByLabel(/^Email/);
    this.password = page.getByLabel(/^Password/);
    this.submit = page.getByRole("button", { name: "Sign in" });
    this.alert = page.getByRole("alert");
  }

  async goto(next?: string): Promise<void> {
    const query = next ? `?next=${encodeURIComponent(next)}` : "";
    await this.page.goto(`${PORTAL_URL}/login${query}`);
    await expect(this.submit).toBeVisible();
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }

  /** Full sign-in as a seeded account. */
  async signInAs(user: UserKey): Promise<void> {
    await this.goto();
    await this.signIn(USERS[user].email, PASSWORD);
  }

  async expectSignedIn(): Promise<void> {
    await expect(this.page).not.toHaveURL(/\/login/);
    await expect(this.page.getByRole("main")).toBeVisible();
  }
}
