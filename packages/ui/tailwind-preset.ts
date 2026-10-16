/**
 * Tailwind preset mapping utilities to the design tokens (CSS variables).
 *
 * Tailwind v4 (used by the apps) reads the theme from CSS: import
 * `@school-platform/config/tailwind/app.css`, which loads `src/styles/theme.css`, the CSS form
 * of this same mapping. This JS preset serves tools that still read a JS config, such as a
 * `@config` file or editor tooling. Both are generated from src/tokens.
 */
import type { Config } from "tailwindcss";

import { SCALE_STEPS } from "./src/theme/color.ts";
import {
  elevation,
  motion,
  neutral,
  radius,
  semantic,
  status,
  typography,
} from "./src/tokens/index.ts";

const v = (name: string) => `var(--sp-${name})`;

const scale = (name: string) =>
  Object.fromEntries(SCALE_STEPS.map((step) => [step, v(`${name}-${step}`)]));

const colors: Record<string, string | Record<string, string>> = {
  white: "#ffffff",
  black: "#000000",
  transparent: "transparent",
  current: "currentColor",
  neutral: Object.fromEntries(Object.keys(neutral).map((step) => [step, v(`neutral-${step}`)])),
  primary: { ...scale("primary"), DEFAULT: v("primary") },
  ...Object.fromEntries(
    Object.keys(status).map((name) => [name, { ...scale(name), DEFAULT: v(name) }]),
  ),
  ...Object.fromEntries(
    Object.keys(semantic.light)
      .filter((role) => role !== "primary" && !(role in status))
      .map((role) => [role, v(role)]),
  ),
};

const preset = {
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    colors,
    fontFamily: {
      sans: [v("font-sans")],
      display: [v("font-display")],
      mono: [v("font-mono")],
    },
    fontSize: Object.fromEntries(
      Object.keys(typography.scale).map((key) => [
        key,
        [v(`text-${key}`), { lineHeight: v(`leading-${key}`) }],
      ]),
    ),
    borderRadius: Object.fromEntries(Object.keys(radius).map((key) => [key, v(`radius-${key}`)])),
    boxShadow: Object.fromEntries(
      Object.keys(elevation.light).map((level) => [level, v(`shadow-${level}`)]),
    ),
    extend: {
      transitionDuration: Object.fromEntries(
        Object.keys(motion.duration).map((key) => [key, v(`duration-${key}`)]),
      ),
      transitionTimingFunction: Object.fromEntries(
        Object.keys(motion.easing).map((key) => [key, v(`ease-${key}`)]),
      ),
    },
  },
} satisfies Partial<Config>;

export default preset;
