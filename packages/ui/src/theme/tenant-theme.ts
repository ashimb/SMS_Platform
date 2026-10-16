/**
 * Per-tenant theming at runtime (FRD FR-TEN-002, FR-UX-003).
 *
 *   const report = applyTenantTheme({ primaryColor: "#0f766e", font: "nunito-sans",
 *                                     logoUrl: "/branding/logo.svg" });
 *
 * Only brand tokens change (primary scale, on-primary text colour, font, logo). Neutral, status,
 * spacing and elevation tokens are fixed, so every tenant keeps the same accessible structure.
 *
 * Security: values come from tenant settings (admin input), so nothing is interpolated into CSS
 * unchecked. Colours must be hex (re-serialised), fonts come from an allow-list, and logo URLs
 * must be https:// or root-relative and are percent-encoded inside url("...").
 */
import { SCALE_STEPS } from "./color.ts";
import { type BrandValidation, validateBrandColor, type ValidationMode } from "./contrast.ts";

export const FONT_STACKS = {
  inter:
    '"Inter Variable", Inter, "Noto Sans", "Noto Sans Bengali", "Noto Sans Devanagari", ui-sans-serif, system-ui, sans-serif',
  "noto-sans":
    '"Noto Sans", "Noto Sans Bengali", "Noto Sans Devanagari", ui-sans-serif, system-ui, sans-serif',
  "source-sans-3":
    '"Source Sans 3", "Noto Sans Bengali", "Noto Sans Devanagari", ui-sans-serif, system-ui, sans-serif',
  "nunito-sans":
    '"Nunito Sans", "Noto Sans Bengali", "Noto Sans Devanagari", ui-sans-serif, system-ui, sans-serif',
  merriweather:
    'Merriweather, "Noto Serif Bengali", "Noto Serif Devanagari", ui-serif, Georgia, serif',
} as const;

export type FontKey = keyof typeof FONT_STACKS;

export interface TenantTheme {
  primaryColor?: string;
  /** Applied to body text. */
  font?: string;
  /** Applied to headings; defaults to `font`. */
  displayFont?: string;
  logoUrl?: string;
}

export interface TenantThemeReport {
  /** CSS custom properties that were (or would be) set. */
  variables: Record<string, string>;
  brand: BrandValidation | null;
  /** Problems that prevented part of the theme from applying. */
  issues: string[];
}

export interface ApplyOptions {
  mode?: ValidationMode;
  target?: HTMLElement;
}

const BRAND_VARIABLES = [
  ...SCALE_STEPS.map((step) => `--sp-primary-${step}`),
  "--sp-on-primary-600",
  "--sp-on-primary-500",
  "--sp-font-sans",
  "--sp-font-display",
  "--sp-logo-url",
];

function isFontKey(value: string): value is FontKey {
  return Object.hasOwn(FONT_STACKS, value);
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/** Returns a safe CSS url() value, or null when the URL is not allowed. */
export function cssLogoUrl(value: string): string | null {
  const trimmed = value.trim();
  const isRootRelative = trimmed.startsWith("/") && !trimmed.startsWith("//");
  if (!isRootRelative && !isHttpsUrl(trimmed)) return null;
  const encoded = encodeURI(trimmed).replace(
    /["'()\\]/g,
    (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `url("${encoded}")`;
}

/** Pure: compute the CSS variables for a tenant theme (also usable for SSR). */
export function buildTenantTheme(
  theme: TenantTheme,
  mode: ValidationMode = "auto-correct",
): TenantThemeReport {
  const variables: Record<string, string> = {};
  const issues: string[] = [];
  let brand: BrandValidation | null = null;

  if (theme.primaryColor !== undefined) {
    brand = validateBrandColor(theme.primaryColor, mode);
    const usable = brand.errors.length === 0 && Object.keys(brand.scale).length > 0;
    if (usable) {
      for (const step of SCALE_STEPS) variables[`--sp-primary-${step}`] = brand.scale[step];
      variables["--sp-on-primary-600"] = "#ffffff";
      variables["--sp-on-primary-500"] = "#ffffff";
    } else {
      issues.push(...brand.errors);
    }
  }

  if (theme.font !== undefined) {
    if (isFontKey(theme.font)) {
      variables["--sp-font-sans"] = FONT_STACKS[theme.font];
      variables["--sp-font-display"] = FONT_STACKS[theme.font];
    } else {
      issues.push(`Font "${theme.font}" is not in the approved list.`);
    }
  }
  if (theme.displayFont !== undefined) {
    if (isFontKey(theme.displayFont)) {
      variables["--sp-font-display"] = FONT_STACKS[theme.displayFont];
    } else {
      issues.push(`Font "${theme.displayFont}" is not in the approved list.`);
    }
  }

  if (theme.logoUrl !== undefined) {
    const url = cssLogoUrl(theme.logoUrl);
    if (url) variables["--sp-logo-url"] = url;
    else issues.push("Logo URL must be https:// or a root-relative path.");
  }

  return { variables, brand, issues };
}

/** Apply a tenant theme to the document (or `target`). Returns what was applied and why not. */
export function applyTenantTheme(
  theme: TenantTheme,
  options: ApplyOptions = {},
): TenantThemeReport {
  const report = buildTenantTheme(theme, options.mode ?? "auto-correct");
  const target = options.target ?? globalThis.document?.documentElement;
  if (target) {
    for (const [name, value] of Object.entries(report.variables)) {
      target.style.setProperty(name, value);
    }
  }
  return report;
}

/** Remove every tenant override and fall back to the default tokens. */
export function clearTenantTheme(target?: HTMLElement): void {
  const element = target ?? globalThis.document?.documentElement;
  if (!element) return;
  for (const name of BRAND_VARIABLES) element.style.removeProperty(name);
}

/** CSS text for server rendering (e.g. inlined with a nonce in the document head). */
export function tenantThemeToCss(report: TenantThemeReport, selector = ":root"): string {
  const body = Object.entries(report.variables)
    .map(([name, value]) => `${name}:${value};`)
    .join("");
  return body ? `${selector}{${body}}` : "";
}
