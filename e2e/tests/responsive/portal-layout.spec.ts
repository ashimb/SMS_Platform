import { expect, PORTAL_URL, test } from "../../fixtures/index.ts";
import {
  assertInputFontSize,
  assertMinTargetSize,
  LG,
  MD,
  viewportWidth,
} from "../../helpers/responsive.ts";
import { LoginPage } from "../../pages/LoginPage.ts";

/**
 * Portal responsive behaviour per viewport project: which navigation is shown, how overlays,
 * tables, filters and forms adapt, and touch ergonomics on phones.
 */
test.describe("portal navigation", () => {
  test("phones get the bottom bar, tablets the icon rail, desktops the full sidebar", async ({
    page,
    signedInAs,
  }) => {
    await signedInAs("admin");
    const width = viewportWidth(page);
    const bottomNav = page.getByRole("navigation", { name: "Quick navigation" });
    const sidebar = page.locator("aside");

    if (width < MD) {
      await expect(bottomNav).toBeVisible();
      await expect(sidebar).toBeHidden();
    } else if (width < LG) {
      await expect(bottomNav).toBeHidden();
      await expect(sidebar).toBeVisible();
      // Icon rail: narrow, labels exposed to assistive tech only.
      const box = await sidebar.boundingBox();
      expect(box?.width ?? 0).toBeLessThan(100);
      await expect(sidebar.getByRole("link", { name: "Students" })).toBeVisible();
    } else {
      await expect(bottomNav).toBeHidden();
      await expect(sidebar).toBeVisible();
      const box = await sidebar.boundingBox();
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(250);
      await expect(sidebar.getByText("Students", { exact: true })).toBeVisible();
    }
  });

  test("the More sheet slides up from the bottom on phones and is dismissible", async ({
    page,
    signedInAs,
  }) => {
    test.skip(viewportWidth(page) >= MD, "phone layout only");
    await signedInAs("admin");
    const more = page.getByRole("button", { name: "More" });
    await more.click();
    const sheet = page.getByRole("dialog", { name: "All sections" });
    await expect(sheet).toBeVisible();
    const box = await sheet.boundingBox();
    const viewport = page.viewportSize();
    expect(Math.round((box?.y ?? 0) + (box?.height ?? 0))).toBeGreaterThanOrEqual(
      (viewport?.height ?? 0) - 1,
    );
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(more).toBeFocused();
  });

  test("bottom bar targets are at least 44px", async ({ page, signedInAs }) => {
    test.skip(viewportWidth(page) >= MD, "phone layout only");
    await signedInAs("admin");
    const bar = page.getByRole("navigation", { name: "Quick navigation" });
    await assertMinTargetSize(bar.getByRole("link"));
    await assertMinTargetSize(bar.getByRole("button"));
  });
});

test.describe("students list", () => {
  test("a table from md, stacked cards below", async ({ page, signedInAs }) => {
    await signedInAs("admin");
    await page.goto(`${PORTAL_URL}/students`);
    await expect(page.getByText(/^Showing 1–/)).toBeVisible();

    if (viewportWidth(page) < MD) {
      await expect(page.getByRole("table")).toHaveCount(0);
      const cards = page.getByRole("list", { name: "Students" }).getByRole("article");
      await expect(cards.first()).toBeVisible();
      // Secondary fields stay behind "Show details".
      const toggle = cards.first().getByRole("button", { name: "Show details" });
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await toggle.click();
      await expect(cards.first().getByRole("button", { name: "Hide details" })).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      await assertMinTargetSize(cards.first().getByRole("button"));
    } else {
      const table = page.getByRole("table", { name: "Students" });
      await expect(table).toBeVisible();
      await expect(page.getByRole("list", { name: "Students" })).toHaveCount(0);
      // The header row stays visible while rows scroll.
      expect(await table.locator("thead").evaluate((el) => getComputedStyle(el).position)).toBe(
        "sticky",
      );
    }
  });

  test("filters sit in a sheet with a count chip on phones, inline from md", async ({
    page,
    signedInAs,
  }) => {
    await signedInAs("admin");
    await page.goto(`${PORTAL_URL}/students?status=alumni`);
    await expect(page.getByRole("search")).toBeVisible();

    if (viewportWidth(page) < MD) {
      const trigger = page.getByRole("button", { name: /Filters/ });
      await expect(trigger).toContainText("1");
      await trigger.click();
      const sheet = page.getByRole("dialog", { name: "Filters" });
      await expect(sheet.getByRole("combobox", { name: "Status" })).toBeVisible();
      await sheet.getByRole("button", { name: "Show results" }).click();
      await expect(sheet).toBeHidden();
    } else {
      await expect(page.getByRole("button", { name: /^Filters/ })).toHaveCount(0);
      await expect(page.getByRole("combobox", { name: "Status" })).toBeVisible();
    }
  });

  test("on phones the status filter is the native picker (no zoom, OS wheel)", async ({
    page,
    signedInAs,
  }) => {
    test.skip(viewportWidth(page) >= MD, "phone layout only");
    await signedInAs("admin");
    await page.goto(`${PORTAL_URL}/students`);
    await page.getByRole("button", { name: /Filters/ }).click();
    const status = page.getByRole("dialog", { name: "Filters" }).getByRole("combobox");
    expect(await status.evaluate((el) => el.tagName)).toBe("SELECT");
  });
});

test.describe("forms", () => {
  test("the student form is one column on phones with an action bar kept in view", async ({
    page,
    signedInAs,
  }) => {
    await signedInAs("admin");
    await page.goto(`${PORTAL_URL}/students/new`);
    const form = page.getByRole("form", { name: "Add student" });
    await expect(form).toBeVisible();
    const submit = form.locator("button[type=submit]");
    const lefts = await form
      .getByRole("textbox")
      .evaluateAll((els) =>
        els.slice(0, 2).map((el) => Math.round(el.getBoundingClientRect().left)),
      );

    if (viewportWidth(page) < MD) {
      // Fields stack: the first two share the same left edge.
      expect(new Set(lefts).size).toBe(1);
      // The primary action is on screen without scrolling to the end of the form.
      await expect(submit).toBeInViewport();
      await assertInputFontSize(page);
    } else {
      expect(new Set(lefts).size).toBe(2);
    }
  });

  test("sign-in inputs use the right keyboard, autofill and enter key", async ({ page }) => {
    await new LoginPage(page).goto();
    if (viewportWidth(page) < MD) await assertInputFontSize(page);
    const email = page.getByLabel(/^Email/);
    const password = page.getByLabel(/^Password/);
    await expect(email).toHaveAttribute("inputmode", "email");
    await expect(email).toHaveAttribute("autocomplete", "username");
    await expect(email).toHaveAttribute("enterkeyhint", "next");
    await expect(password).toHaveAttribute("autocomplete", "current-password");
    await expect(password).toHaveAttribute("enterkeyhint", "go");
  });

  test("sign-in controls meet the 44px touch target on phones", async ({ page }) => {
    test.skip(viewportWidth(page) >= MD, "phone layout only");
    await new LoginPage(page).goto();
    await assertMinTargetSize(page.getByRole("button", { name: "Sign in" }));
    await assertMinTargetSize(page.locator("main input:not([type=hidden])"));
  });
});

test.describe("overlays", () => {
  test("the account menu is a bottom sheet of large rows on touch screens, a popover with a mouse", async ({
    page,
    signedInAs,
  }) => {
    await signedInAs("admin");
    await page
      .locator("header")
      .getByRole("button", { name: /account|menu/i })
      .last()
      .click();
    const touch = await page.evaluate(() => matchMedia("(pointer: coarse)").matches);
    if (viewportWidth(page) < MD || touch) {
      const sheet = page.getByRole("dialog");
      await expect(sheet).toBeVisible();
      await assertMinTargetSize(sheet.getByRole("menuitem"), 44);
      await page.keyboard.press("Escape");
      await expect(sheet).toBeHidden();
    } else {
      await expect(page.getByRole("menu")).toBeVisible();
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
  });
});
