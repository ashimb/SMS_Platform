import { expect, PORTAL_URL, test, WEBSITE_URL } from "../../fixtures/index.ts";

/** Playwright joins repeated headers (edge + app both send some) with ", ". */
function expectHardening(headers: Record<string, string>): void {
  expect(headers["strict-transport-security"]).toContain("max-age=");
  expect(headers["x-content-type-options"]).toContain("nosniff");
  expect(headers["x-frame-options"]).toContain("DENY");
  expect(headers["referrer-policy"]).toContain("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toBeTruthy();
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-powered-by"]).toBeUndefined();
  expect(headers["server"] ?? "").not.toMatch(/\d/);
}

test.describe("security headers", () => {
  test("website pages send the full set", { tag: "@smoke" }, async ({ request }) => {
    for (const path of ["/", "/about", "/admissions", "/notices"]) {
      const response = await request.get(`${WEBSITE_URL}${path}`);
      expect(response.status(), path).toBe(200);
      expectHardening(response.headers());
    }
  });

  test("website CSP locks down framing, plugins, base URI and form targets", async ({
    request,
  }) => {
    const csp = (await request.get(`${WEBSITE_URL}/`)).headers()["content-security-policy"] ?? "";
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'none'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).not.toContain("unsafe-eval");
  });

  test("the enquiry endpoint is routed to the website and is never cached", async ({ request }) => {
    // A rejected request still goes through the website's route handler (not the API).
    const response = await request.post(`${WEBSITE_URL}/api/enquiry`, {
      headers: { "content-type": "text/plain" },
      data: "x",
    });
    expect(response.status()).toBe(415);
    expect(response.headers()["cache-control"]).toContain("no-store");
  });

  test(
    "the portal sends the full set and a strict script policy",
    { tag: "@smoke" },
    async ({ request }) => {
      // Fetched with the portal's Host header rather than navigated: WebKit's instrumentation does
      // not report the app's CSP in response.headers(), and this avoids depending on DNS for
      // *.localhost. The edge routes by Host, exactly as it does for a browser.
      const portal = new URL(PORTAL_URL);
      const response = await request.get(
        `${portal.protocol}//127.0.0.1:${portal.port || "443"}/login`,
        { headers: { host: portal.host, accept: "text/html" } },
      );
      expect(response.status()).toBe(200);
      const headers = response.headers();
      expectHardening(headers);

      // The edge and the portal each send a CSP; repeated headers arrive joined.
      const scriptSrc =
        (headers["content-security-policy"] ?? "")
          .split(";")
          .map((part) => part.trim())
          .find((part) => part.startsWith("script-src")) ?? "";
      expect(scriptSrc).toContain("'self'");
      expect(scriptSrc).not.toContain("'unsafe-inline'");
      expect(scriptSrc).not.toContain("'unsafe-eval'");
    },
  );

  test("the API sends nosniff and no server banner", async ({ request }) => {
    const response = await request.get(`${WEBSITE_URL}/api/v1/tenant`);
    expect(response.status()).toBe(200);
    expect(response.headers()["x-content-type-options"]).toContain("nosniff");
    expect(response.headers()["server"] ?? "").not.toMatch(/uvicorn/i);
  });
});
