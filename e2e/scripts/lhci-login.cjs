/**
 * Lighthouse CI puppeteer hook: signs in through the real portal form before the dashboard is
 * audited, so the audit measures the authenticated page, not a redirect to /login. Runs for every
 * collected URL and does nothing unless the URL is a portal page other than the sign-in page.
 * The password is E2E_PASSWORD, falling back to the throwaway seed password of the E2E stack
 * (e2e/fixtures/seed.ts; apps/api/scripts/seed_e2e.py): it exists only in disposable test databases.
 */
const PORTAL = process.env.LHCI_PORTAL_URL ?? "https://portal.localhost";
const EMAIL = process.env.LHCI_EMAIL ?? "admin@greenvalley.example.com";

module.exports = async (browser, context) => {
  const url = new URL(context.url);
  const portal = new URL(PORTAL);
  if (url.origin !== portal.origin || url.pathname.startsWith("/login")) return;

  const password = process.env.E2E_PASSWORD ?? "Gv-E2e-9fK2!xQw7";

  const page = await browser.newPage();
  await page.goto(`${portal.origin}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('input[autocomplete="username"]', { timeout: 30000 });
  await page.type('input[autocomplete="username"]', EMAIL);
  await page.type('input[autocomplete="current-password"]', password);
  await Promise.all([
    page.waitForFunction(() => !location.pathname.startsWith("/login"), { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);
  await page.close();
};
