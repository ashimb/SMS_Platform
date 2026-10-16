/**
 * Colour mode (light / dark / system) and tenant branding.
 *
 * - Colour mode sets `data-theme` on <html>; "system" removes it so the token CSS follows the OS.
 * - Branding goes through `applyTenantTheme()` from @school-platform/ui, which validates the brand
 *   colour for WCAG AA (auto-correcting failing colours), allow-lists fonts and sanitises the logo
 *   URL before anything reaches CSS.
 */
import { applyTenantTheme, type TenantTheme, type TenantThemeReport } from "@school-platform/ui";
import { useSyncExternalStore } from "react";

import type { Schemas } from "./api.ts";
import { readPreference, writePreference } from "./preferences.ts";

export type ColorMode = "light" | "dark" | "system";

const listeners = new Set<() => void>();
let current: ColorMode = "system";

export function applyColorMode(mode: ColorMode, root: HTMLElement = document.documentElement) {
  // Switch instantly: without this, every element with a colour transition fades separately.
  root.classList.add("sp-theme-switching");
  if (mode === "system") delete root.dataset["theme"];
  else root.dataset["theme"] = mode;
  void root.offsetHeight; // apply the new colours while transitions are off
  requestAnimationFrame(() => {
    root.classList.remove("sp-theme-switching");
  });
}

/** Apply the saved preference; called once before the first render. */
export function initColorMode(): ColorMode {
  current = readPreference("sp-color-mode") ?? "system";
  applyColorMode(current);
  return current;
}

export function setColorMode(mode: ColorMode): void {
  current = mode;
  writePreference("sp-color-mode", mode);
  applyColorMode(mode);
  for (const listener of listeners) listener();
}

export function useColorMode(): ColorMode {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
    () => "system",
  );
}

export interface TenantBranding {
  name: string;
  /** Short monogram shown when there is no logo (e.g. "SV" for "Sunrise Vidyalaya"). */
  monogram: string;
  logoUrl: string | null;
  theme: TenantTheme;
}

export function monogramFor(name: string): string {
  const words = name
    .split(/\s+/)
    .filter((word) => /^\p{L}/u.test(word))
    .filter((word) => !/^(of|the|and|school)$/i.test(word));
  const letters = words.slice(0, 2).map((word) => [...word][0] ?? "");
  return (letters.join("") || [...name][0] || "S").toUpperCase();
}

/**
 * Map the public tenant profile to branding. The API exposes only the school name today; brand
 * colours, fonts and logo arrive with tenant branding (FRD FR-TEN-002). Until then the default
 * design tokens apply.
 */
export function brandingFromTenant(tenant: Schemas["TenantPublicOut"]): TenantBranding {
  return { name: tenant.name, monogram: monogramFor(tenant.name), logoUrl: null, theme: {} };
}

export function applyBranding(branding: TenantBranding): TenantThemeReport {
  return applyTenantTheme(branding.theme);
}
