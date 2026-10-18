import { expect, type Locator, type Page } from "@playwright/test";

import { WEBSITE_URL } from "../fixtures/seed.ts";

export interface EnquiryDetails {
  guardianName: string;
  childName: string;
  email: string;
  phone: string;
  grade: string;
  message?: string;
}

/** Admissions enquiry form on the public website. */
export class EnquiryPage {
  readonly form: Locator;
  readonly submit: Locator;
  readonly consent: Locator;
  readonly success: Locator;
  readonly errorBanner: Locator;

  constructor(readonly page: Page) {
    this.form = page.getByRole("form", { name: "Admissions enquiry" });
    this.submit = this.form.getByRole("button", { name: "Send enquiry" });
    this.consent = this.form.getByRole("checkbox");
    this.success = page.getByRole("status").filter({ hasText: "Your enquiry has been received" });
    this.errorBanner = this.form.getByRole("alert").first();
  }

  async goto(): Promise<void> {
    await this.page.goto(`${WEBSITE_URL}/admissions#enquiry`);
    await expect(this.form).toBeVisible();
  }

  async fill(details: EnquiryDetails): Promise<void> {
    await this.form.getByLabel(/^Parent or guardian name/).fill(details.guardianName);
    await this.form.getByLabel(/^Child's name/).fill(details.childName);
    await this.form.getByLabel(/^Email address/).fill(details.email);
    await this.form.getByLabel(/^Phone number/).fill(details.phone);
    const grade = this.form.getByRole("combobox", { name: /Class applying for/ });
    // Touch layouts use the native OS picker (a <select>); desktops use the custom listbox.
    if ((await grade.evaluate((el) => el.tagName)) === "SELECT") {
      await grade.selectOption({ label: details.grade });
    } else {
      await grade.click();
      await this.page.getByRole("option", { name: details.grade, exact: true }).click();
    }
    if (details.message) await this.form.getByLabel(/^Message/).fill(details.message);
  }

  async agree(): Promise<void> {
    await this.consent.check();
  }
}
