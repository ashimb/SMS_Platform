import { expect, type Locator, type Page } from "@playwright/test";

import { WEBSITE_URL } from "../fixtures/seed.ts";

/** Public website home page (apps/website). */
export class WebsiteHomePage {
  readonly hero: Locator;
  readonly noticeBoard: Locator;
  readonly admissionsCta: Locator;

  constructor(readonly page: Page) {
    this.hero = page.getByRole("heading", { level: 1 });
    this.noticeBoard = page.getByRole("region", { name: /what's happening at school/i });
    this.admissionsCta = page.getByRole("link", { name: /start your enquiry/i });
  }

  async goto(): Promise<void> {
    await this.page.goto(`${WEBSITE_URL}/`);
    await expect(this.hero).toBeVisible();
  }
}
