/**
 * Design tokens (single source of truth).
 *
 * `scripts/build-tokens.ts` turns these into `src/styles/tokens.css` (CSS variables for light
 * and dark themes) and `src/styles/theme.css` (Tailwind v4 theme mapping). Components only use
 * semantic tokens (`bg-surface`, `text-fg-muted`, `bg-primary`), never raw palette values, so
 * tenant theming and dark mode are pure CSS-variable swaps.
 *
 * Visual direction: refined cool neutrals, one confident brand colour, soft layered elevation,
 * generous radii, calm motion. See packages/ui/README.md.
 */
import { type ColorScale, generateScale, SCALE_STEPS } from "../theme/color.ts";

export const PREFIX = "sp";

/** Default brand (indigo). Tenants override it at runtime with applyTenantTheme(). */
export const DEFAULT_BRAND = "#4f46e5";

export const neutral = {
  0: "#ffffff",
  25: "#fcfcfd",
  50: "#f8f9fb",
  100: "#f1f3f7",
  200: "#e4e7ee",
  300: "#cfd5df",
  400: "#98a1b3",
  500: "#667085",
  600: "#475467",
  700: "#344054",
  800: "#1f2937",
  900: "#111827",
  950: "#0b1020",
} as const;

/** Status colours: fixed for every tenant (consistent meaning and guaranteed contrast). */
export const status = {
  success: generateScale("#079455"),
  warning: generateScale("#dc6803"),
  danger: generateScale("#d92d20"),
  info: generateScale("#1570ef"),
} as const;

export const brand: ColorScale = generateScale(DEFAULT_BRAND, { anchor: 600 });

const v = (name: string) => `var(--${PREFIX}-${name})`;

/** Semantic colour roles per theme (values are palette variables or literal colours). */
export const semantic = {
  light: {
    bg: v("neutral-25"),
    surface: v("neutral-0"),
    "surface-raised": v("neutral-0"),
    "surface-sunken": v("neutral-50"),
    "surface-hover": v("neutral-100"),
    overlay: "rgb(11 16 32 / 0.48)",
    fg: v("neutral-900"),
    "fg-muted": v("neutral-600"),
    "fg-subtle": v("neutral-500"),
    "fg-inverse": v("neutral-0"),
    border: v("neutral-200"),
    "border-strong": v("neutral-300"),
    ring: v("primary-500"),
    primary: v("primary-600"),
    "primary-hover": v("primary-700"),
    "primary-fg": v("on-primary-600"),
    "primary-subtle": v("primary-50"),
    "primary-subtle-fg": v("primary-700"),
    ...statusRoles("light"),
  },
  dark: {
    bg: v("neutral-950"),
    surface: v("neutral-900"),
    "surface-raised": v("neutral-800"),
    "surface-sunken": "#070b16",
    "surface-hover": v("neutral-800"),
    overlay: "rgb(0 0 0 / 0.64)",
    fg: v("neutral-50"),
    "fg-muted": v("neutral-300"),
    "fg-subtle": v("neutral-400"),
    "fg-inverse": v("neutral-900"),
    border: v("neutral-800"),
    "border-strong": v("neutral-700"),
    ring: v("primary-400"),
    primary: v("primary-600"),
    "primary-hover": v("primary-500"),
    "primary-fg": v("on-primary-600"),
    "primary-subtle": "color-mix(in oklab, var(--sp-primary-500) 16%, transparent)",
    "primary-subtle-fg": v("primary-300"),
    ...statusRoles("dark"),
  },
} as const;

function statusRoles(theme: "light" | "dark"): Record<string, string> {
  const roles: Record<string, string> = {};
  for (const name of Object.keys(status)) {
    roles[name] = theme === "light" ? v(`${name}-600`) : v(`${name}-500`);
    roles[`${name}-hover`] = theme === "light" ? v(`${name}-700`) : v(`${name}-400`);
    roles[`${name}-fg`] = theme === "light" ? v(`on-${name}-600`) : v(`on-${name}-500`);
    roles[`${name}-subtle`] =
      theme === "light"
        ? v(`${name}-50`)
        : `color-mix(in oklab, var(--sp-${name}-500) 16%, transparent)`;
    roles[`${name}-subtle-fg`] = theme === "light" ? v(`${name}-700`) : v(`${name}-300`);
  }
  return roles;
}

export const typography = {
  fontSans:
    '"Inter Variable", Inter, "Noto Sans", "Noto Sans Bengali", "Noto Sans Devanagari", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  fontDisplay:
    '"Inter Variable", Inter, "Noto Sans", "Noto Sans Bengali", "Noto Sans Devanagari", ui-sans-serif, system-ui, sans-serif',
  fontMono: 'ui-monospace, "SFMono-Regular", "Cascadia Code", Menlo, Consolas, monospace',
  /** [font-size, line-height] — 16px body; display sizes use tighter leading. */
  scale: {
    xs: ["0.75rem", "1rem"],
    sm: ["0.875rem", "1.25rem"],
    base: ["1rem", "1.5rem"],
    lg: ["1.125rem", "1.75rem"],
    xl: ["1.25rem", "1.75rem"],
    "2xl": ["1.5rem", "2rem"],
    "3xl": ["1.875rem", "2.375rem"],
    "4xl": ["2.25rem", "2.75rem"],
    "5xl": ["3rem", "3.5rem"],
  },
  weights: { regular: "400", medium: "500", semibold: "600", bold: "700" },
  tracking: { tight: "-0.02em", normal: "0", wide: "0.02em" },
} as const;

/** 4-point spacing scale (px values; Tailwind's --spacing base is 0.25rem = 4px). */
export const spacing = {
  0: "0",
  0.5: "0.125rem",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
} as const;

export const radius = {
  xs: "0.25rem",
  sm: "0.375rem",
  md: "0.625rem",
  lg: "0.875rem",
  xl: "1.25rem",
  "2xl": "1.75rem",
  full: "9999px",
} as const;

/** Soft, layered elevation: a tight contact shadow plus a wide ambient one. */
export const elevation = {
  light: {
    1: "0 1px 2px rgb(16 24 40 / 0.06), 0 1px 3px rgb(16 24 40 / 0.05)",
    2: "0 2px 4px -1px rgb(16 24 40 / 0.06), 0 6px 16px -4px rgb(16 24 40 / 0.08)",
    3: "0 4px 8px -2px rgb(16 24 40 / 0.06), 0 16px 32px -8px rgb(16 24 40 / 0.12)",
    4: "0 8px 16px -4px rgb(16 24 40 / 0.08), 0 32px 64px -12px rgb(16 24 40 / 0.18)",
  },
  dark: {
    1: "0 1px 2px rgb(0 0 0 / 0.4)",
    2: "0 2px 4px -1px rgb(0 0 0 / 0.4), 0 6px 16px -4px rgb(0 0 0 / 0.45)",
    3: "0 4px 8px -2px rgb(0 0 0 / 0.45), 0 16px 32px -8px rgb(0 0 0 / 0.55)",
    4: "0 8px 16px -4px rgb(0 0 0 / 0.5), 0 32px 64px -12px rgb(0 0 0 / 0.65)",
  },
} as const;

export const motion = {
  duration: { instant: "80ms", fast: "120ms", base: "200ms", slow: "300ms" },
  easing: {
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    emphasized: "cubic-bezier(0.3, 0, 0, 1.2)",
    exit: "cubic-bezier(0.3, 0, 1, 1)",
  },
} as const;

export const breakpoints = {
  sm: "360px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

export { SCALE_STEPS };
export type SemanticRole = keyof (typeof semantic)["light"];
