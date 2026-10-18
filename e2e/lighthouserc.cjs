/**
 * Lighthouse CI: mobile performance budgets for the pages that matter most (RESPONSIVE standard,
 * "Mobile performance budget"). The build fails when a budget is exceeded.
 *
 *   npx @lhci/cli@0.15.1 autorun --config=e2e/lighthouserc.cjs
 *
 * It is run with `npx` (see .github/workflows/ci.yml) rather than installed as a dependency: the
 * tool's own dependency tree carries open high-severity advisories that would otherwise land in
 * this repository's lockfile. Lighthouse's default preset is mobile (Moto G Power, slow 4G).
 *
 *   LHCI_SITE_URL    public website   default https://localhost
 *   LHCI_PORTAL_URL  portal SPA       default https://portal.localhost
 *   E2E_PASSWORD     seeded admin password (default: the E2E seed password)
 */
const site = process.env.LHCI_SITE_URL ?? "https://localhost";
const portal = process.env.LHCI_PORTAL_URL ?? "https://portal.localhost";
const chromeArgs = [
  "--no-sandbox",
  "--ignore-certificate-errors",
  "--host-resolver-rules=MAP *.localhost 127.0.0.1",
];

module.exports = {
  ci: {
    collect: {
      url: [`${portal}/login`, `${portal}/`, `${site}/`],
      numberOfRuns: 3,
      // Signs in before auditing the portal dashboard; a no-op for the other URLs.
      puppeteerScript: "./e2e/scripts/lhci-login.cjs",
      puppeteerLaunchOptions: { args: chromeArgs },
      settings: {
        // The signed-in state must survive from the login script into the audit.
        disableStorageReset: true,
        onlyCategories: ["performance", "accessibility", "best-practices"],
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9, aggregationMethod: "median-run" }],
        "categories:accessibility": ["error", { minScore: 0.95, aggregationMethod: "median-run" }],
        "largest-contentful-paint": [
          "error",
          { maxNumericValue: 2500, aggregationMethod: "median" },
        ],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1, aggregationMethod: "median" }],
        "total-blocking-time": ["warn", { maxNumericValue: 300, aggregationMethod: "median" }],
      },
    },
    upload: { target: "filesystem", outputDir: "./e2e/lighthouse-report" },
  },
};
