import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { buildCsp, NONCE_PLACEHOLDER } from "./csp.ts";
import { OFFLINE_FALLBACK, pwaOptions } from "./pwa.ts";

type UrlPattern = (context: { request: { mode: string }; url: URL }) => boolean;

describe("PWA caching policy", () => {
  const workbox = pwaOptions.workbox ?? {};
  const runtime = workbox.runtimeCaching ?? [];

  it("never caches API responses", () => {
    for (const rule of runtime) {
      const match = rule.urlPattern as UrlPattern;
      for (const mode of ["navigate", "cors", "same-origin"]) {
        expect(
          match({ request: { mode }, url: new URL("https://portal.example.in/api/v1/students") }),
        ).toBe(false);
      }
      expect(rule.handler).toBe("NetworkOnly");
    }
    expect(JSON.stringify(workbox.globPatterns)).not.toContain("api");
  });

  it("serves navigations from the network, falling back to the offline page", () => {
    expect(workbox.navigateFallback).toBeNull();
    const [navigation] = runtime;
    const match = navigation?.urlPattern as UrlPattern;
    expect(
      match({ request: { mode: "navigate" }, url: new URL("https://portal.example.in/students") }),
    ).toBe(true);
    expect(navigation?.options?.precacheFallback?.fallbackURL).toBe(OFFLINE_FALLBACK);
  });

  it("does not precache index.html (it carries a per-response CSP nonce) or the MSW worker", () => {
    expect(workbox.globIgnores).toEqual(
      expect.arrayContaining(["**/index.html", "**/mockServiceWorker.js"]),
    );
  });

  it("registers from app code (no inline script) and waits for the user to update", () => {
    expect(pwaOptions.injectRegister).toBeNull();
    expect(pwaOptions.registerType).toBe("prompt");
  });
});

describe("Content-Security-Policy", () => {
  const csp = buildCsp("0123456789abcdef0123456789abcdef");

  it("allows only same-origin scripts (no unsafe-inline / unsafe-eval)", () => {
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toMatch(/unsafe-(inline|eval)/);
  });

  it("uses the nonce for styles and blocks framing, plugins and <base>", () => {
    expect(csp).toContain("style-src 'self' 'nonce-0123456789abcdef0123456789abcdef'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'none'");
  });

  it("rejects a malformed nonce", () => {
    expect(() => buildCsp("x'; script-src *")).toThrow();
  });

  it("matches the policy nginx sends in the portal image", () => {
    const dockerfile = readFileSync(
      resolve(process.cwd(), "../../infra/docker/portal.Dockerfile"),
      "utf8",
    );
    const nginxPolicy = buildCsp("NONCEPLACEHOLDER0000", { upgradeInsecureRequests: true }).replace(
      "NONCEPLACEHOLDER0000",
      "$request_id",
    );
    expect(dockerfile).toContain(`add_header Content-Security-Policy "${nginxPolicy}" always;`);
    expect(dockerfile).toContain(`sub_filter '${NONCE_PLACEHOLDER}' $request_id;`);
  });

  it("Zod is configured jitless (no eval probe under 'script-src self')", async () => {
    const { z } = await import("zod");
    await import("../src/lib/zod-config.ts");
    expect(z.config().jitless).toBe(true);
  });

  it("index.html carries the nonce placeholder and no inline script", () => {
    const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
    expect(html).toContain(`content="${NONCE_PLACEHOLDER}"`);
    expect(html).not.toMatch(/<script\b(?![^>]*\bsrc=)[^>]*>/i);
  });
});
