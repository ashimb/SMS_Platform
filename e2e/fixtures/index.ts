import { test as base } from "@playwright/test";

import { LoginPage } from "../pages/LoginPage.ts";
import type { UserKey } from "./seed.ts";

interface Fixtures {
  /** Signs the page in through the real sign-in form and resolves with the page object. */
  signedInAs: (user: UserKey) => Promise<LoginPage>;
}

/**
 * Browser tests sign in through the UI instead of reusing a saved storage state: refresh tokens
 * rotate and are single-use (a replay revokes the whole session family), so one stored cookie
 * shared by parallel workers or several browsers would log everyone out.
 */
export const test = base.extend<Fixtures>({
  signedInAs: async ({ page }, provide) => {
    await provide(async (user) => {
      const login = new LoginPage(page);
      await login.signInAs(user);
      await login.expectSignedIn();
      return login;
    });
  },
});

export * from "./api.ts";
export * from "./seed.ts";
export { expect } from "@playwright/test";
