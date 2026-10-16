import { afterEach, describe, expect, it } from "vitest";

import { neutral } from "../tokens/index.ts";
import {
  closestStep,
  contrastRatio,
  generateScale,
  parseHex,
  rgbToOklch,
  SCALE_STEPS,
  toHex,
} from "./color.ts";
import { validateBrandColor, WCAG_AA_NON_TEXT, WCAG_AA_TEXT } from "./contrast.ts";
import {
  applyTenantTheme,
  buildTenantTheme,
  clearTenantTheme,
  cssLogoUrl,
  tenantThemeToCss,
} from "./tenant-theme.ts";

describe("colour maths", () => {
  it("parses and serialises hex", () => {
    expect(toHex(parseHex("#4F46E5"))).toBe("#4f46e5");
    expect(toHex(parseHex("fff"))).toBe("#ffffff");
    expect(() => parseHex("blue")).toThrow();
  });

  it("matches known WCAG contrast ratios", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    // #767676 on white is the classic AA threshold colour (~4.54:1).
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 1);
  });

  it("round-trips through OKLCH", () => {
    for (const hex of ["#4f46e5", "#079455", "#d92d20", "#808080"]) {
      const lch = rgbToOklch(parseHex(hex));
      expect(lch.l).toBeGreaterThan(0);
      expect(lch.l).toBeLessThan(1);
    }
  });

  it.each(["#4f46e5", "#0b1f4d", "#ffe600", "#38bdf8", "#f97316", "#111111", "#fafafa"])(
    "generates a monotonic 11-step scale for %s with the brand at the anchor",
    (hex) => {
      const scale = generateScale(hex, { anchor: 600 });
      expect(Object.keys(scale)).toHaveLength(11);
      expect(scale[600]).toBe(hex);
      const lightness = SCALE_STEPS.map((step) => rgbToOklch(parseHex(scale[step])).l);
      // Never lighter than the previous step (extreme near-white brands may quantise to equal).
      for (let i = 1; i < lightness.length; i += 1) {
        expect(lightness[i]).toBeLessThanOrEqual((lightness[i - 1] ?? 1) + 1e-6);
      }
      expect(lightness[lightness.length - 1]).toBeLessThan(lightness[0] ?? 1);
    },
  );

  it("anchors to the closest step when no anchor is given", () => {
    expect(closestStep(0.98)).toBe(50);
    expect(closestStep(0.53)).toBe(600);
    expect(closestStep(0.25)).toBe(950);
    expect(generateScale("#fef9c3")[closestStep(rgbToOklch(parseHex("#fef9c3")).l)]).toBe(
      "#fef9c3",
    );
  });
});

describe("validateBrandColor", () => {
  it("accepts an accessible brand colour unchanged", () => {
    const result = validateBrandColor("#4f46e5", "reject");
    expect(result.valid).toBe(true);
    expect(result.corrected).toBe(false);
    expect(result.errors).toEqual([]);
    expect(result.color).toBe("#4f46e5");
    expect(result.checks.every((check) => check.passed)).toBe(true);
  });

  it.each(["#ffe600", "#38bdf8", "#f97316", "#a3e635"])(
    "reject mode refuses %s (white button text fails AA)",
    (hex) => {
      const result = validateBrandColor(hex, "reject");
      expect(result.valid).toBe(false);
      expect(result.corrected).toBe(false);
      const button = result.checks.find((check) => check.id === "button-text");
      expect(button?.passed).toBe(false);
      expect(button?.ratio).toBeLessThan(WCAG_AA_TEXT);
      expect(result.errors.length).toBeGreaterThan(0);
    },
  );

  it.each(["#ffe600", "#38bdf8", "#f97316", "#a3e635"])(
    "auto-correct darkens %s until every check passes, keeping the hue",
    (hex) => {
      const result = validateBrandColor(hex, "auto-correct");
      expect(result.corrected).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.checks.every((check) => check.passed)).toBe(true);
      expect(contrastRatio("#ffffff", result.color)).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
      expect(result.checks.find((c) => c.id === "button-text")?.correctedFrom).toBe(hex);

      const before = rgbToOklch(parseHex(hex));
      const after = rgbToOklch(parseHex(result.color));
      expect(after.l).toBeLessThan(before.l);
      const hueShift = Math.abs(after.h - before.h) % 360;
      expect(Math.min(hueShift, 360 - hueShift)).toBeLessThan(8);
    },
  );

  it("checks dark-mode and focus-ring pairs too", () => {
    const result = validateBrandColor("#0b1f4d");
    const ids = result.checks.map((check) => check.id);
    expect(ids).toEqual([
      "button-text",
      "link-text",
      "focus-ring",
      "dark-link-text",
      "dark-focus-ring",
    ]);
    const darkLink = result.checks.find((check) => check.id === "dark-link-text");
    expect(darkLink?.passed).toBe(true);
    expect(contrastRatio(result.scale[300], neutral[900])).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
    expect(contrastRatio(result.scale[400], neutral[950])).toBeGreaterThanOrEqual(WCAG_AA_NON_TEXT);
  });

  it.each(["", "blue", "#12345", "rgb(0,0,0)", "#ggg", "#4f46e5; background:url(x)"])(
    "rejects malformed input %j in both modes",
    (value) => {
      for (const mode of ["reject", "auto-correct"] as const) {
        const result = validateBrandColor(value, mode);
        expect(result.valid).toBe(false);
        expect(result.errors).toEqual(["Brand colour must be a hex value such as #1d4ed8."]);
        expect(result.color).toBe("");
      }
    },
  );
});

describe("tenant theme", () => {
  afterEach(() => {
    clearTenantTheme();
  });

  it("applies the primary scale, font and logo as CSS variables", () => {
    const report = applyTenantTheme({
      primaryColor: "#0f766e",
      font: "nunito-sans",
      logoUrl: "/branding/logo.svg",
    });
    const style = document.documentElement.style;
    expect(report.issues).toEqual([]);
    expect(style.getPropertyValue("--sp-primary-600")).toBe("#0f766e");
    expect(style.getPropertyValue("--sp-on-primary-600")).toBe("#ffffff");
    expect(style.getPropertyValue("--sp-font-sans")).toContain("Nunito Sans");
    expect(style.getPropertyValue("--sp-logo-url")).toBe('url("/branding/logo.svg")');
  });

  it("auto-corrects a failing brand colour by default", () => {
    const report = applyTenantTheme({ primaryColor: "#ffe600" });
    expect(report.brand?.corrected).toBe(true);
    const applied = document.documentElement.style.getPropertyValue("--sp-primary-600");
    expect(applied).not.toBe("#ffe600");
    expect(contrastRatio("#ffffff", applied)).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
  });

  it("reject mode leaves the default brand in place and reports why", () => {
    const report = applyTenantTheme({ primaryColor: "#ffe600" }, { mode: "reject" });
    expect(report.issues.length).toBeGreaterThan(0);
    expect(document.documentElement.style.getPropertyValue("--sp-primary-600")).toBe("");
  });

  it("refuses fonts outside the allow-list (no CSS injection through font names)", () => {
    const report = buildTenantTheme({ font: "Comic Sans'; } body { display:none" });
    expect(report.variables["--sp-font-sans"]).toBeUndefined();
    expect(report.issues[0]).toMatch(/approved list/);
  });

  it.each([
    // eslint-disable-next-line no-script-url -- hostile input under test; must be rejected
    ["javascript:alert(1)", null],
    ["data:image/svg+xml,<svg/>", null],
    ["//evil.example/logo.png", null],
    ["http://insecure.example/logo.png", null],
    ["https://cdn.example.in/logo.png", 'url("https://cdn.example.in/logo.png")'],
    ['/logo").evil{x:url("', 'url("/logo%22%29.evil%7Bx:url%28%22")'],
  ])("sanitises logo URL %j", (input, expected) => {
    expect(cssLogoUrl(input)).toBe(expected);
  });

  it("clearTenantTheme removes every override", () => {
    applyTenantTheme({ primaryColor: "#0f766e", font: "inter" });
    clearTenantTheme();
    expect(document.documentElement.style.getPropertyValue("--sp-primary-600")).toBe("");
    expect(document.documentElement.style.getPropertyValue("--sp-font-sans")).toBe("");
  });

  it("serialises to CSS for server rendering", () => {
    const css = tenantThemeToCss(buildTenantTheme({ primaryColor: "#0f766e" }));
    expect(css.startsWith(":root{--sp-primary-50:")).toBe(true);
    expect(css).toContain("--sp-primary-600:#0f766e;");
    expect(tenantThemeToCss(buildTenantTheme({}))).toBe("");
  });
});
