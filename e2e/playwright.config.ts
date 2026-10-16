import { defineConfig, devices } from "@playwright/test";

/**
 * E2E configuration.
 *
 * - `smoke`: API-request-only checks against the edge (nginx). Runs on every PR (FRD §12.7).
 * - `chromium` / `mobile-safari`: browser journeys (FRD §12.6), added as apps are built.
 *
 * E2E_BASE_URL defaults to the local Docker stack. E2E_IGNORE_HTTPS_ERRORS=1 is only for the
 * self-signed dev certificate; never set it against staging/production.
 */
const baseURL = process.env.E2E_BASE_URL ?? "https://localhost";
const ignoreHTTPSErrors = process.env.E2E_IGNORE_HTTPS_ERRORS === "1";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    ignoreHTTPSErrors,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "smoke",
      testMatch: /smoke\/.*\.spec\.ts/,
    },
    {
      name: "chromium",
      testIgnore: /smoke\/.*/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-safari",
      testIgnore: /smoke\/.*/,
      use: { ...devices["iPhone 14"] },
    },
  ],
});
