import { expect, test, WEBSITE_URL } from "../../fixtures/index.ts";
import { EnquiryPage } from "../../pages/EnquiryPage.ts";

const DETAILS = {
  guardianName: "Priya Nair",
  childName: "Ananya Nair",
  email: "priya.nair@example.com",
  phone: "+91 98765 43210",
  grade: "Class VI",
  message: "We would like to visit the campus on Saturday.",
};

test.describe("admissions enquiry form", () => {
  test("shows validation errors and sends nothing when the form is incomplete", async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/enquiry")) requests.push(request.url());
    });

    const enquiry = new EnquiryPage(page);
    await enquiry.goto();
    await enquiry.submit.click();

    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
    await expect(page.getByText("Enter a valid phone number.")).toBeVisible();
    await expect(page.getByText("Choose the class you are enquiring about.")).toBeVisible();
    await expect(page.getByText("Please agree so we can contact you.")).toBeVisible();
    expect(requests).toEqual([]);
  });

  test(
    "submits a valid enquiry and shows the confirmation with a reference",
    {
      tag: "@smoke",
    },
    async ({ page }) => {
      const enquiry = new EnquiryPage(page);
      await enquiry.goto();
      await enquiry.fill(DETAILS);
      await enquiry.agree();
      await enquiry.submit.click();

      await expect(enquiry.success).toBeVisible();
      await expect(enquiry.success).toContainText(/ENQ-[0-9A-F]{8}/);
      await expect(enquiry.success).toBeFocused();
    },
  );

  test("reports a server failure without losing the form", async ({ page }) => {
    await page.route("**/api/enquiry", (route) =>
      route.fulfill({
        status: 502,
        contentType: "application/json",
        body: '{"error":"upstream_unavailable"}',
      }),
    );
    const enquiry = new EnquiryPage(page);
    await enquiry.goto();
    await enquiry.fill(DETAILS);
    await enquiry.agree();
    await enquiry.submit.click();

    await expect(enquiry.errorBanner).toContainText(/could not send your enquiry/i);
    await expect(enquiry.form.getByLabel(/^Email address/)).toHaveValue(DETAILS.email);
  });

  test("explains rate limiting", async ({ page }) => {
    await page.route("**/api/enquiry", (route) =>
      route.fulfill({
        status: 429,
        headers: { "retry-after": "600" },
        contentType: "application/json",
        body: '{"error":"rate_limited"}',
      }),
    );
    const enquiry = new EnquiryPage(page);
    await enquiry.goto();
    await enquiry.fill(DETAILS);
    await enquiry.agree();
    await enquiry.submit.click();

    await expect(enquiry.errorBanner).toContainText(/try again in about 10 minutes/i);
  });
});

test.describe("enquiry endpoint (server-side checks)", () => {
  const url = `${WEBSITE_URL}/api/enquiry`;
  const payload = { ...DETAILS, consent: true, website: "" };
  const sameOrigin = { origin: WEBSITE_URL, "x-sp-csrf": "1" };

  test("accepts a valid same-origin request", async ({ request }) => {
    const response = await request.post(url, { headers: sameOrigin, data: payload });
    expect(response.status()).toBe(202);
    expect(((await response.json()) as { reference: string }).reference).toMatch(/^ENQ-/);
    expect(response.headers()["cache-control"]).toContain("no-store");
  });

  test("rejects a request without the CSRF header", async ({ request }) => {
    const response = await request.post(url, { headers: { origin: WEBSITE_URL }, data: payload });
    expect(response.status()).toBe(403);
  });

  test("rejects a cross-site request", async ({ request }) => {
    const response = await request.post(url, {
      headers: { origin: "https://evil.example", "x-sp-csrf": "1" },
      data: payload,
    });
    expect(response.status()).toBe(403);
  });

  test("validates on the server even if the browser checks are bypassed", async ({ request }) => {
    const response = await request.post(url, {
      headers: sameOrigin,
      data: { ...payload, email: "not-an-email", consent: false },
    });
    expect(response.status()).toBe(422);
    const body = (await response.json()) as { errors: Record<string, string> };
    expect(Object.keys(body.errors)).toEqual(expect.arrayContaining(["email", "consent"]));
  });

  test("a honeypot submission looks successful but is not forwarded", async ({ request }) => {
    const response = await request.post(url, {
      headers: sameOrigin,
      data: { ...payload, website: "https://spam.example" },
    });
    expect(response.status()).toBe(202);
  });

  test("rejects non-JSON bodies", async ({ request }) => {
    const response = await request.post(url, {
      headers: { ...sameOrigin, "content-type": "text/plain" },
      data: "hello",
    });
    expect(response.status()).toBe(415);
  });
});
