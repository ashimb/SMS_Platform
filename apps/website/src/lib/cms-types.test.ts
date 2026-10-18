/* eslint-disable no-script-url -- these tests feed hostile javascript: URLs to the validators on purpose */
import { describe, expect, it } from "vitest";

import {
  eventFixtures,
  galleryFixtures,
  homeFixture,
  noticeFixtures,
  pageFixtures,
  siteFixture,
} from "@/lib/cms-fixtures.ts";
import {
  blockSchema,
  eventListSchema,
  galleryListSchema,
  homeSchema,
  isSafeHref,
  isSafeImageSrc,
  noticeListSchema,
  pageSchema,
  siteSchema,
} from "@/lib/cms-types.ts";

describe("fixtures match the API contract", () => {
  it("validates every fixture with the same schemas as live responses", () => {
    expect(() => siteSchema.parse(siteFixture)).not.toThrow();
    expect(() => homeSchema.parse(homeFixture)).not.toThrow();
    expect(() => noticeListSchema.parse(noticeFixtures)).not.toThrow();
    expect(() => eventListSchema.parse(eventFixtures)).not.toThrow();
    expect(() => galleryListSchema.parse(galleryFixtures)).not.toThrow();
    for (const page of pageFixtures) expect(() => pageSchema.parse(page)).not.toThrow();
  });
});

describe("isSafeHref", () => {
  it.each([
    "/about",
    "/admissions#enquiry",
    "#main",
    "https://example.org/x",
    "mailto:a@b.example",
    "tel:+911234",
  ])("allows %s", (href) => {
    expect(isSafeHref(href)).toBe(true);
  });

  it.each([
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,x",
    "//evil.example",
    "/\\evil.example",
    "vbscript:x",
    "/path\twith-tab",
    "not a url",
    "",
  ])("rejects %j", (href) => {
    expect(isSafeHref(href)).toBe(false);
  });
});

describe("isSafeImageSrc", () => {
  it("allows local and https images only", () => {
    expect(isSafeImageSrc("/images/hero.jpg")).toBe(true);
    expect(isSafeImageSrc("https://cdn.example.org/a.jpg")).toBe(true);
    expect(isSafeImageSrc("http://cdn.example.org/a.jpg")).toBe(false);
    expect(isSafeImageSrc("//cdn.example.org/a.jpg")).toBe(false);
    expect(isSafeImageSrc("data:image/png;base64,AAAA")).toBe(false);
  });
});

describe("blockSchema", () => {
  it("rejects an unknown block type", () => {
    expect(blockSchema.safeParse({ type: "script", id: "x", html: "<script>" }).success).toBe(
      false,
    );
  });

  it("rejects a CTA whose link is unsafe", () => {
    const block = {
      type: "cta",
      id: "c",
      heading: "Hi",
      button: { label: "Go", href: "javascript:alert(1)" },
    };
    expect(blockSchema.safeParse(block).success).toBe(false);
  });

  it("requires at least two columns", () => {
    const block = { type: "columns", id: "c", columns: [{ html: "<p>one</p>" }] };
    expect(blockSchema.safeParse(block).success).toBe(false);
  });
});
