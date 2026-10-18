/**
 * Tenant theming, applied on the server (FRD FR-TEN-002).
 *
 * The root layout renders the returned CSS as an inline <style> in <head>, so the first byte of
 * HTML already carries the school's brand colour, font and logo: there is no flash of unbranded
 * content and no client-side theme code. Values are validated by the UI kit (hex colours are
 * re-serialised, fonts come from an allow-list, logo URLs are encoded), so nothing from the CMS is
 * interpolated into CSS unchecked.
 */
import { buildTenantTheme, type TenantTheme, tenantThemeToCss } from "@school-platform/ui/theme";

import type { SiteProfile } from "@/lib/cms-types.ts";

export interface SiteTheme {
  css: string;
  issues: string[];
}

export function siteTheme(site: SiteProfile): SiteTheme {
  const theme: TenantTheme = {};
  if (site.theme.primaryColor) theme.primaryColor = site.theme.primaryColor;
  if (site.theme.font) theme.font = site.theme.font;
  if (site.logoUrl) theme.logoUrl = site.logoUrl;

  const report = buildTenantTheme(theme, "auto-correct");
  return { css: tenantThemeToCss(report), issues: report.issues };
}
