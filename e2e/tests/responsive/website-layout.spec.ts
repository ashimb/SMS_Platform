import { expect, test, WEBSITE_URL } from "../../fixtures/index.ts";
import {
  assertInputFontSize,
  assertMinTargetSize,
  LG,
  MD,
  SM,
  viewportWidth,
} from "../../helpers/responsive.ts";
import { EnquiryPage } from "../../pages/EnquiryPage.ts";

test.describe("website navigation", () => {
  test("the full menu appears below lg; on phones it fills the screen, traps focus and closes on Escape", async ({
    page,
  }) => {
    await page.goto(`${WEBSITE_URL}/`);
    const width = viewportWidth(page);
    const opener = page.getByRole("button", { name: "Open menu" });

    if (width >= LG) {
      await expect(opener).toBeHidden();
      await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
      return;
    }

    await expect(page.getByRole("navigation", { name: "Main" })).toBeHidden();
    await expect(opener).toBeVisible();
    await assertMinTargetSize(opener);
    await opener.click();

    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu).toBeVisible();
    const box = await menu.boundingBox();
    const viewport = page.viewportSize();
    if (width < SM) {
      expect(Math.round(box?.width ?? 0)).toBe(viewport?.width);
      expect(Math.round(box?.height ?? 0)).toBe(viewport?.height);
    }

    // Focus is inside the dialog and tabbing never leaves it.
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      const inside = await menu.evaluate((el) => el.contains(document.activeElement));
      expect(inside, `focus escaped the menu after ${String(i + 1)} tab(s)`).toBe(true);
    }
    // Page scroll is locked behind it.
    const locked = await page.evaluate(
      () =>
        document.body.hasAttribute("data-scroll-locked") ||
        getComputedStyle(document.body).overflow === "hidden",
    );
    expect(locked).toBe(true);
    await assertMinTargetSize(menu.getByRole("link"));

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test("a sticky Enquire / Apply bar sits at the bottom of phones, clear of the footer", async ({
    page,
  }) => {
    await page.goto(`${WEBSITE_URL}/about`);
    const cta = page.getByTestId("mobile-cta");

    if (viewportWidth(page) >= SM) {
      await expect(cta).toBeHidden();
      return;
    }
    await expect(cta).toBeVisible();
    await assertMinTargetSize(cta.getByRole("link", { name: /Enquire/ }));
    const box = await cta.boundingBox();
    const viewport = page.viewportSize();
    expect(Math.round((box?.y ?? 0) + (box?.height ?? 0))).toBe(viewport?.height);

    // At the very end of the page the footer is not hidden behind the bar.
    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    const footerBox = await page.locator("footer").last().boundingBox();
    const ctaTop = (await cta.boundingBox())?.y ?? 0;
    expect((footerBox?.y ?? 0) + (footerBox?.height ?? 0)).toBeLessThanOrEqual(ctaTop + 2);

    // The admissions page already has the form: no bar there.
    await page.goto(`${WEBSITE_URL}/admissions`);
    await expect(cta).toHaveCount(0);
  });

  test("header controls are at least 44px on touch viewports", async ({ page }) => {
    test.skip(viewportWidth(page) >= LG, "desktop nav uses compact pointer sizing");
    await page.goto(`${WEBSITE_URL}/`);
    const header = page.locator("header").first();
    await assertMinTargetSize(header.getByRole("link").and(page.locator(":visible")));
    await assertMinTargetSize(header.getByRole("button"));
  });
});

test.describe("enquiry form", () => {
  test("uses mobile-friendly inputs, 16px text and no layout shift when errors appear", async ({
    page,
  }) => {
    const enquiry = new EnquiryPage(page);
    await enquiry.goto();
    if (viewportWidth(page) < MD) await assertInputFontSize(page);

    const email = enquiry.form.getByLabel(/^Email address/);
    await expect(email).toHaveAttribute("inputmode", "email");
    await expect(email).toHaveAttribute("enterkeyhint", "next");
    await expect(enquiry.form.getByLabel(/^Phone number/)).toHaveAttribute("inputmode", "tel");

    // Inline validation reserves its space: the submit button does not move.
    const pageTop = () =>
      enquiry.submit.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    const before = await pageTop();
    await email.fill("not-an-email");
    await email.blur();
    await expect(enquiry.form.getByText(/valid email/i).first()).toBeVisible();
    const after = await pageTop();
    expect(Math.abs(after - before)).toBeLessThanOrEqual(2);
  });

  test("the class picker is the native OS picker on touch viewports", async ({ page }) => {
    test.skip(viewportWidth(page) >= LG, "desktop uses the custom listbox");
    const enquiry = new EnquiryPage(page);
    await enquiry.goto();
    const grade = enquiry.form.getByRole("combobox", { name: /Class applying for/ });
    expect(await grade.evaluate((el) => el.tagName)).toBe("SELECT");
  });
});

test.describe("document", () => {
  test("allows pinch zoom and covers the notch", async ({ page }) => {
    await page.goto(`${WEBSITE_URL}/`);
    const content = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(content).toContain("viewport-fit=cover");
    expect(content).not.toMatch(/user-scalable\s*=\s*(no|0)/);
    expect(content).not.toMatch(/maximum-scale\s*=\s*1(\.0)?\b/);
  });
});
