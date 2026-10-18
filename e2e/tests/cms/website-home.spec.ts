import { expect, test, WEBSITE_URL } from "../../fixtures/index.ts";
import { WebsiteHomePage } from "../../pages/WebsiteHomePage.ts";

test.describe("public website home", () => {
  test(
    "renders the hero, the notice board and the admissions CTA",
    { tag: "@smoke" },
    async ({ page }) => {
      const home = new WebsiteHomePage(page);
      await home.goto();

      await expect(home.hero).toContainText(/every child is known by name/i);
      await expect(page.getByRole("link", { name: /apply for admission/i })).toBeVisible();

      await expect(home.noticeBoard).toBeVisible();
      await expect(home.noticeBoard.getByRole("link").first()).toBeVisible();
      expect(await home.noticeBoard.getByRole("link").count()).toBeGreaterThan(1);

      await expect(home.admissionsCta).toBeVisible();
    },
  );

  test("the admissions CTA leads to the enquiry form", async ({ page }) => {
    const home = new WebsiteHomePage(page);
    await home.goto();
    await home.admissionsCta.click();

    await expect(page).toHaveURL(/\/admissions#enquiry$/);
    await expect(page.getByRole("form", { name: "Admissions enquiry" })).toBeVisible();
  });

  test("is branded on the first paint (tenant theme is in the server HTML)", async ({
    request,
  }) => {
    const html = await (await request.get(`${WEBSITE_URL}/`)).text();
    expect(html).toContain('id="tenant-theme"');
    expect(html).toMatch(/--sp-primary-600:#[0-9a-f]{6}/i);
  });

  test("exposes SEO metadata and EducationalOrganization structured data", async ({ page }) => {
    await page.goto(`${WEBSITE_URL}/`);
    await expect(page).toHaveTitle(/Green Valley/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.{40,}/);
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);

    const json = await page.locator('script[type="application/ld+json"]').first().textContent();
    const data = JSON.parse(json ?? "{}") as Record<string, unknown>;
    expect(data["@type"]).toBe("EducationalOrganization");
    expect(data["name"]).toBeTruthy();
  });

  test("serves a sitemap and robots.txt", async ({ request }) => {
    const sitemap = await request.get(`${WEBSITE_URL}/sitemap.xml`);
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain("/admissions");

    const robots = await request.get(`${WEBSITE_URL}/robots.txt`);
    expect(await robots.text()).toMatch(/Disallow: \/api\//);
  });

  test("navigation works and unknown pages return a real 404", async ({ page, request }) => {
    await page.goto(`${WEBSITE_URL}/`);
    const nav = page.getByRole("navigation", { name: "Main" });
    if (await nav.isVisible()) {
      await nav.getByRole("link", { name: "Notices" }).click();
      await expect(page).toHaveURL(/\/notices$/);
      await expect(page.getByRole("heading", { level: 1, name: "Notices" })).toBeVisible();
    }
    const missing = await request.get(`${WEBSITE_URL}/this-page-does-not-exist`);
    expect(missing.status()).toBe(404);
  });

  test("renders CMS pages through the block renderer", async ({ page }) => {
    await page.goto(`${WEBSITE_URL}/facilities`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "A campus built for learning" })).toBeVisible();
  });
});
