/**
 * Brand-colour validation against WCAG 2.2 AA (FRD FR-TEN-002, UXR-002).
 *
 * The tenant brand is the solid primary colour (step 600) with white labels. Checks:
 *   button-text      white on primary-600                 >= 4.5:1  (text, 1.4.3)
 *   link-text        primary-700 on white surface         >= 4.5:1  (text, 1.4.3)
 *   focus-ring       primary-500 vs light page background >= 3:1    (non-text, 1.4.11)
 *   dark-link-text   primary-300 on dark surface          >= 4.5:1
 *   dark-focus-ring  primary-400 vs dark page background  >= 3:1
 *
 * mode "reject": failures are reported and the colour must not be applied.
 * mode "auto-correct": failing steps are darkened/lightened in OKLCH (hue kept) until they pass.
 */
import { neutral } from "../tokens/index.ts";
import {
  adjustForContrast,
  type ColorScale,
  contrastRatio,
  generateScale,
  isHexColor,
  parseHex,
  type ScaleStep,
  toHex,
} from "./color.ts";

export const WCAG_AA_TEXT = 4.5;
export const WCAG_AA_NON_TEXT = 3;
export const ON_PRIMARY = "#ffffff";

export type ValidationMode = "reject" | "auto-correct";

export interface ContrastCheck {
  id: "button-text" | "link-text" | "focus-ring" | "dark-link-text" | "dark-focus-ring";
  description: string;
  foreground: string;
  background: string;
  ratio: number;
  required: number;
  passed: boolean;
  /** Set when auto-correct replaced the step colour. */
  correctedFrom?: string;
}

export interface BrandValidation {
  input: string;
  /** True when the input colour passes every check without changes. */
  valid: boolean;
  /** True when auto-correct changed at least one step. */
  corrected: boolean;
  /** Final solid brand colour (scale step 600). */
  color: string;
  scale: ColorScale;
  checks: ContrastCheck[];
  errors: string[];
}

interface CheckSpec {
  id: ContrastCheck["id"];
  description: string;
  step: ScaleStep;
  background: string;
  required: number;
  /** "fg": the step is the foreground; "bg": the step is the background behind ON_PRIMARY. */
  role: "fg" | "bg";
  direction: "darken" | "lighten";
}

const LIGHT_SURFACE = neutral[0];
const LIGHT_BG = neutral[25];
const DARK_SURFACE = neutral[900];
const DARK_BG = neutral[950];

const CHECKS: readonly CheckSpec[] = [
  {
    id: "button-text",
    description: "White button label on the brand colour",
    step: 600,
    background: ON_PRIMARY,
    required: WCAG_AA_TEXT,
    role: "bg",
    direction: "darken",
  },
  {
    id: "link-text",
    description: "Brand-coloured text and links on a white surface",
    step: 700,
    background: LIGHT_SURFACE,
    required: WCAG_AA_TEXT,
    role: "fg",
    direction: "darken",
  },
  {
    id: "focus-ring",
    description: "Focus ring against the light page background",
    step: 500,
    background: LIGHT_BG,
    required: WCAG_AA_NON_TEXT,
    role: "fg",
    direction: "darken",
  },
  {
    id: "dark-link-text",
    description: "Brand-coloured text on a dark surface",
    step: 300,
    background: DARK_SURFACE,
    required: WCAG_AA_TEXT,
    role: "fg",
    direction: "lighten",
  },
  {
    id: "dark-focus-ring",
    description: "Focus ring against the dark page background",
    step: 400,
    background: DARK_BG,
    required: WCAG_AA_NON_TEXT,
    role: "fg",
    direction: "lighten",
  },
];

function evaluate(spec: CheckSpec, scale: ColorScale): ContrastCheck {
  const color = scale[spec.step];
  const foreground = spec.role === "fg" ? color : ON_PRIMARY;
  const background = spec.role === "fg" ? spec.background : color;
  const ratio = contrastRatio(foreground, background);
  return {
    id: spec.id,
    description: spec.description,
    foreground,
    background,
    ratio: Math.round(ratio * 100) / 100,
    required: spec.required,
    passed: ratio >= spec.required,
  };
}

/** Validate (and in auto-correct mode, fix) a tenant brand colour. */
export function validateBrandColor(
  input: string,
  mode: ValidationMode = "auto-correct",
): BrandValidation {
  if (!isHexColor(input)) {
    return {
      input,
      valid: false,
      corrected: false,
      color: "",
      scale: {} as ColorScale,
      checks: [],
      errors: ["Brand colour must be a hex value such as #1d4ed8."],
    };
  }

  const normalized = toHex(parseHex(input));
  let scale = generateScale(normalized, { anchor: 600 });
  const initial = CHECKS.map((spec) => evaluate(spec, scale));
  const valid = initial.every((check) => check.passed);

  if (valid || mode === "reject") {
    return {
      input,
      valid,
      corrected: false,
      color: scale[600],
      scale,
      checks: initial,
      errors: initial
        .filter((check) => !check.passed)
        .map(
          (check) =>
            `${check.description}: contrast ${check.ratio}:1 is below the required ${check.required}:1.`,
        ),
    };
  }

  // Auto-correct. Fix the solid colour first (it anchors the whole scale), then individual steps.
  const corrections = new Map<ContrastCheck["id"], string>();
  const button = CHECKS[0];
  if (button && !evaluate(button, scale).passed) {
    const fixed = adjustForContrast(scale[600], ON_PRIMARY, WCAG_AA_TEXT, "darken");
    if (fixed) {
      corrections.set("button-text", scale[600]);
      scale = generateScale(fixed, { anchor: 600 });
    }
  }
  for (const spec of CHECKS.slice(1)) {
    const check = evaluate(spec, scale);
    if (check.passed) continue;
    const fixed = adjustForContrast(
      scale[spec.step],
      spec.background,
      spec.required,
      spec.direction,
    );
    if (fixed) {
      corrections.set(spec.id, scale[spec.step]);
      scale = { ...scale, [spec.step]: fixed };
    }
  }

  const checks = CHECKS.map((spec) => {
    const check = evaluate(spec, scale);
    const from = corrections.get(spec.id);
    return from ? { ...check, correctedFrom: from } : check;
  });
  const errors = checks
    .filter((check) => !check.passed)
    .map((check) => `${check.description}: could not reach ${check.required}:1.`);

  return {
    input,
    valid: false,
    corrected: corrections.size > 0,
    color: scale[600],
    scale,
    checks,
    errors,
  };
}
