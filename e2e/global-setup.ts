import { request } from "@playwright/test";

import { apiLogin } from "./fixtures/api.ts";
import { PASSWORD, USERS, WEBSITE_URL } from "./fixtures/seed.ts";

/**
 * Runs once before the suite: waits for the stack, then signs in every seeded role through the API
 * so a missing or stale seed fails here, in one clear message, instead of as dozens of timeouts.
 *
 * No storage state is saved: sessions use rotating single-use refresh tokens, so a saved cookie
 * could be used by one test only (see fixtures/index.ts). Browser tests sign in through the UI.
 */
export default async function globalSetup(): Promise<void> {
  // Website-only runs (a standalone `next start`, no API or edge proxy): nothing to wait for or
  // seed. Never set this for the full-stack suite; it skips the seed check.
  if (process.env["E2E_WEBSITE_ONLY"] === "1") return;

  const ignoreHTTPSErrors = process.env["E2E_IGNORE_HTTPS_ERRORS"] === "1";
  const context = await request.newContext({ ignoreHTTPSErrors });
  try {
    const deadline = Date.now() + 120_000;
    for (;;) {
      try {
        const response = await context.get(`${WEBSITE_URL}/healthz`, { timeout: 5_000 });
        if (response.ok()) break;
      } catch {
        // not reachable yet
      }
      if (Date.now() > deadline) throw new Error(`Stack not reachable at ${WEBSITE_URL}`);
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }

    // The edge answers before the API is ready; wait for a sign-in to succeed.
    const missing: string[] = [];
    for (const [key, user] of Object.entries(USERS)) {
      // `lockout` is changed by its own test; `tenantBAdmin` must NOT be able to sign in here.
      if (key === "lockout" || key === "tenantBAdmin") continue;
      let status = 0;
      for (let attempt = 0; attempt < 30 && status !== 200; attempt += 1) {
        status = (await apiLogin(context, user.email, PASSWORD)).status;
        if (status !== 200) await new Promise((resolve) => setTimeout(resolve, 2_000));
      }
      if (status !== 200) missing.push(`${key} (${user.email}): HTTP ${String(status)}`);
    }
    if (missing.length > 0) {
      throw new Error(
        `Cannot sign in seeded accounts:\n  ${missing.join("\n  ")}\n` +
          "Seed them first: docker compose run --rm api python -m scripts.seed_e2e",
      );
    }
  } finally {
    await context.dispose();
  }
}
