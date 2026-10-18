import { expect, test } from "@playwright/test";

/**
 * Edge (nginx) smoke checks. These need only the nginx container, so they run on every PR
 * even before the application services exist.
 */

test.describe("edge proxy", () => {
  test("health endpoint responds", { tag: "@smoke" }, async ({ request }) => {
    const res = await request.get("/healthz");
    expect(res.status()).toBe(200);
    expect((await res.text()).trim()).toBe("ok");
  });

  test(
    "security headers are present on HTTPS responses",
    { tag: "@smoke" },
    async ({ request }) => {
      const res = await request.get("/healthz");
      const headers = res.headers();

      expect(headers["strict-transport-security"]).toContain("max-age=");
      expect(headers["x-content-type-options"]).toBe("nosniff");
      expect(headers["x-frame-options"]).toBe("DENY");
      expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
      expect(headers["permissions-policy"]).toBeTruthy();
      expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    },
  );

  test("server version is not disclosed", async ({ request }) => {
    const res = await request.get("/healthz");
    const server = res.headers()["server"] ?? "";
    expect(server).not.toMatch(/\d/);
  });

  test("oversized request bodies are rejected", async ({ request }) => {
    const res = await request.post("/api/v1/_size_probe", {
      data: "x".repeat(2 * 1024 * 1024),
      headers: { "content-type": "text/plain" },
    });
    expect(res.status()).toBe(413);
  });
});
