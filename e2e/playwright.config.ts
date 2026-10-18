import { defineConfig, devices } from "@playwright/test";

/**
 * E2E configuration (FRD §12.6, §12.7).
 *
 * Projects: desktop Chromium, Firefox and WebKit, plus mobile Chrome and Safari viewports.
 * `@smoke` tags the subset that runs on every PR: `npx playwright test --grep @smoke`.
 *
 * URLs (all against the Docker stack behind the edge proxy):
 *   E2E_BASE_URL    public website and API   default https://localhost
 *   E2E_PORTAL_URL  portal SPA               default https://portal.localhost
 * E2E_IGNORE_HTTPS_ERRORS=1 is only for the self-signed dev certificate; never set it against
 * staging or production.
 *
 * Browsers resolve *.localhost to the loopback address by themselves; Chromium and Firefox are
 * also told explicitly so the run does not depend on the operating system's resolver.
 */
const baseURL = process.env["E2E_BASE_URL"] ?? "https://localhost";
const ignoreHTTPSErrors = process.env["E2E_IGNORE_HTTPS_ERRORS"] === "1";

const chromiumArgs = ["--host-resolver-rules=MAP *.localhost 127.0.0.1"];
const firefoxPrefs = { "network.dns.localDomains": "portal.localhost,www.localhost" };

/**
 * Responsive projects (RESPONSIVE standard): one Chromium project per verified viewport, running
 * only tests/responsive. Phones and tablets emulate touch (coarse pointer, mobile viewport meta);
 * the iPad landscape and 1440 desktop projects use a fine pointer.
 */
const touch = { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } as const;
const responsiveViewports = {
  "rs-320-se": { viewport: { width: 320, height: 568 }, ...touch },
  "rs-375-iphone-se": { viewport: { width: 375, height: 667 }, ...touch },
  "rs-390-iphone-14": { viewport: { width: 390, height: 844 }, ...touch },
  "rs-412-pixel-7": { viewport: { width: 412, height: 915 }, ...touch },
  "rs-768-ipad-portrait": { viewport: { width: 768, height: 1024 }, ...touch },
  "rs-1024-ipad-landscape": { viewport: { width: 1024, height: 768 }, ...touch },
  "rs-1440-desktop": { viewport: { width: 1440, height: 900 } },
} as const;

export default defineConfig({
  testDir: "./tests",
  // Visual baselines live next to the specs; they are per platform (font rendering differs).
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: "disabled" } },
  globalSetup: "./global-setup.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env["CI"]),
  // One retry: a test that passes only on retry is reported as flaky, and its trace is kept.
  retries: 1,
  ...(process.env["CI"] ? { workers: 2 } : {}),
  reporter: process.env["CI"] ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    ignoreHTTPSErrors,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      testIgnore: /responsive\//,
      use: { ...devices["Desktop Chrome"], launchOptions: { args: chromiumArgs } },
    },
    {
      name: "firefox",
      testIgnore: /responsive\//,
      use: { ...devices["Desktop Firefox"], launchOptions: { firefoxUserPrefs: firefoxPrefs } },
    },
    { name: "webkit", testIgnore: /responsive\//, use: { ...devices["Desktop Safari"] } },
    {
      name: "mobile-chrome",
      testIgnore: /responsive\//,
      use: { ...devices["Pixel 7"], launchOptions: { args: chromiumArgs } },
    },
    { name: "mobile-safari", testIgnore: /responsive\//, use: { ...devices["iPhone 14"] } },
    ...Object.entries(responsiveViewports).map(([name, device]) => ({
      name,
      testMatch: /responsive\/.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        ...device,
        launchOptions: { args: chromiumArgs },
      },
    })),
  ],
});
