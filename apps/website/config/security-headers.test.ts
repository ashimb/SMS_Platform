import { describe, expect, it } from "vitest";

import { buildCsp, parseMediaHosts, securityHeaders } from "./security-headers.mjs";

const directive = (csp: string, name: string) =>
  csp
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name} `));

describe("buildCsp", () => {
  it("locks down framing, plugins, base URI and form targets", () => {
    const csp = buildCsp();
    expect(directive(csp, "default-src")).toBe("default-src 'self'");
    expect(directive(csp, "frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(directive(csp, "object-src")).toBe("object-src 'none'");
    expect(directive(csp, "base-uri")).toBe("base-uri 'none'");
    expect(directive(csp, "form-action")).toBe("form-action 'self'");
    expect(directive(csp, "frame-src")).toBe("frame-src 'none'");
  });

  it("only allows unsafe-eval in development", () => {
    expect(buildCsp({ isDev: false })).not.toContain("unsafe-eval");
    expect(buildCsp({ isDev: true })).toContain("'unsafe-eval'");
  });

  it("limits remote images to the configured HTTPS hosts", () => {
    const img = directive(buildCsp({ mediaHosts: ["cdn.example.org"] }), "img-src");
    expect(img).toBe("img-src 'self' data: blob: https://cdn.example.org");
  });

  it("never allows a wildcard source", () => {
    expect(buildCsp({ mediaHosts: ["cdn.example.org"] })).not.toMatch(/\s\*(\s|;|$)/);
  });
});

describe("securityHeaders", () => {
  const headers = Object.fromEntries(securityHeaders().map((h) => [h.key, h.value]));

  it("sends the standard hardening headers", () => {
    expect(headers["Strict-Transport-Security"]).toContain("max-age=63072000");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Cross-Origin-Opener-Policy"]).toBe("same-origin");
  });

  it("disables powerful browser features", () => {
    for (const feature of ["camera", "microphone", "geolocation", "payment"]) {
      expect(headers["Permissions-Policy"]).toContain(`${feature}=()`);
    }
  });
});

describe("parseMediaHosts", () => {
  it("keeps hostnames and drops anything else", () => {
    expect(
      parseMediaHosts(
        "cdn.example.org, *.media.example.org, https://bad.example, evil.com/path, ;x",
      ),
    ).toEqual(["cdn.example.org", "*.media.example.org"]);
  });

  it("handles unset values", () => {
    expect(parseMediaHosts(undefined)).toEqual([]);
    expect(parseMediaHosts("")).toEqual([]);
  });
});
