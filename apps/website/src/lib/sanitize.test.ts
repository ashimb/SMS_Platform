/* eslint-disable no-script-url -- these tests feed hostile javascript: URLs to the validators on purpose */
import { describe, expect, it } from "vitest";

import { sanitizeHtml } from "@/lib/sanitize.ts";

describe("sanitizeHtml", () => {
  it("keeps allowed formatting and relative links", () => {
    const html = '<h2>Title</h2><p>Hello <strong>world</strong> <a href="/about">About</a></p>';
    expect(sanitizeHtml(html)).toBe(html);
  });

  it.each([
    ["script tags", "<p>ok</p><script>alert(1)</script>", "<script"],
    ["inline event handlers", '<p onclick="alert(1)">hi</p>', "onclick"],
    ["img with onerror", "<img src=x onerror=alert(1)>", "<img"],
    ["javascript: URLs", '<a href="javascript:alert(1)">x</a>', "javascript:"],
    ["data: URLs", '<a href="data:text/html,<script>alert(1)</script>">x</a>', "data:"],
    ["iframes", '<iframe src="https://evil.example"></iframe>', "<iframe"],
    ["svg payloads", "<svg onload=alert(1)><circle/></svg>", "<svg"],
    ["style attributes", '<p style="background:url(//evil.example)">x</p>', "style="],
    ["forms", '<form action="https://evil.example"><input name="x"></form>', "<form"],
    ["style elements", "<style>body{display:none}</style><p>x</p>", "<style"],
  ])("removes %s", (_name, dirty, forbidden) => {
    expect(sanitizeHtml(dirty).toLowerCase()).not.toContain(forbidden);
  });

  it("drops protocol-relative links", () => {
    expect(sanitizeHtml('<a href="//evil.example/x">x</a>')).not.toContain("href");
  });

  it("forces rel=noopener noreferrer on links that open a new tab", () => {
    const out = sanitizeHtml('<a href="https://example.org" target="_blank">x</a>');
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer"');
  });

  it("removes target from other links", () => {
    const out = sanitizeHtml('<a href="https://example.org" target="_top">x</a>');
    expect(out).not.toContain("target");
  });

  it("allows mailto and tel links", () => {
    const out = sanitizeHtml('<a href="mailto:a@b.example">m</a><a href="tel:+911234">t</a>');
    expect(out).toContain("mailto:a@b.example");
    expect(out).toContain("tel:+911234");
  });
});
