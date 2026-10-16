/**
 * Colour maths: sRGB <-> OKLCH conversion, WCAG 2.x contrast, and perceptual scale generation.
 *
 * OKLCH (Björn Ottosson's Oklab in polar form) is used for scales because equal steps in
 * lightness look equal to people, so every tenant's brand gets a balanced 50-950 ramp.
 * Contrast uses the WCAG 2.2 relative-luminance formula (what auditors and axe measure).
 */

export interface Rgb {
  r: number; // 0-1
  g: number;
  b: number;
}

export interface Oklch {
  l: number; // 0-1
  c: number; // chroma, ~0-0.37
  h: number; // hue degrees 0-360
}

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isHexColor(value: string): boolean {
  return HEX_PATTERN.test(value.trim());
}

export function parseHex(value: string): Rgb {
  const match = HEX_PATTERN.exec(value.trim());
  if (!match?.[1]) throw new Error(`Invalid hex colour: ${value}`);
  let hex = match[1];
  if (hex.length === 3) hex = [...hex].map((ch) => ch + ch).join("");
  const int = Number.parseInt(hex, 16);
  return { r: ((int >> 16) & 255) / 255, g: ((int >> 8) & 255) / 255, b: (int & 255) / 255 };
}

export function toHex({ r, g, b }: Rgb): string {
  const channel = (v: number) =>
    Math.round(Math.min(1, Math.max(0, v)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

// ---- sRGB <-> linear <-> Oklab <-> OKLCH -------------------------------------------------------

const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const fromLinear = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

export function rgbToOklch(rgb: Rgb): Oklch {
  const r = toLinear(rgb.r);
  const g = toLinear(rgb.g);
  const b = toLinear(rgb.b);
  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const c = Math.sqrt(A * A + B * B);
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h };
}

function oklchToLinearRgb({ l, c, h }: Oklch): Rgb {
  const rad = (h * Math.PI) / 180;
  const A = c * Math.cos(rad);
  const B = c * Math.sin(rad);
  const l_ = (l + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m_ = (l - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s_ = (l - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return {
    r: 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    g: -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    b: -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  };
}

const inGamut = ({ r, g, b }: Rgb) => [r, g, b].every((v) => v >= -0.0001 && v <= 1.0001);

/** OKLCH -> sRGB, reducing chroma until the colour fits the sRGB gamut (keeps L and hue). */
export function oklchToRgb(color: Oklch): Rgb {
  let { c } = color;
  let linear = oklchToLinearRgb({ ...color, c });
  while (!inGamut(linear) && c > 0) {
    c = Math.max(0, c - 0.002);
    linear = oklchToLinearRgb({ ...color, c });
  }
  return { r: fromLinear(linear.r), g: fromLinear(linear.g), b: fromLinear(linear.b) };
}

// ---- WCAG contrast -----------------------------------------------------------------------------

export function relativeLuminance(color: string | Rgb): number {
  const { r, g, b } = typeof color === "string" ? parseHex(color) : color;
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG contrast ratio, 1-21. */
export function contrastRatio(a: string | Rgb, b: string | Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Whichever of the candidates reads best on `background` (e.g. white vs near-black text). */
export function bestTextColor(background: string, candidates: readonly string[]): string {
  let best = candidates[0] ?? "#000000";
  for (const candidate of candidates) {
    if (contrastRatio(candidate, background) > contrastRatio(best, background)) best = candidate;
  }
  return best;
}

// ---- Scales ------------------------------------------------------------------------------------

export const SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type ScaleStep = (typeof SCALE_STEPS)[number];
export type ColorScale = Record<ScaleStep, string>;

/** Target OKLCH lightness per step, tuned so 600 carries white text and 700 reads as text. */
const STEP_LIGHTNESS: Record<ScaleStep, number> = {
  50: 0.975,
  100: 0.945,
  200: 0.89,
  300: 0.815,
  400: 0.72,
  500: 0.625,
  600: 0.535,
  700: 0.465,
  800: 0.395,
  900: 0.33,
  950: 0.25,
};

/** Chroma multiplier per step: pale and very dark steps are less saturated. */
const STEP_CHROMA: Record<ScaleStep, number> = {
  50: 0.12,
  100: 0.22,
  200: 0.42,
  300: 0.65,
  400: 0.88,
  500: 1,
  600: 1,
  700: 0.92,
  800: 0.8,
  900: 0.66,
  950: 0.5,
};

export interface ScaleOptions {
  /**
   * Put the exact base colour at this step. Default: the step whose target lightness is closest.
   * Brand scales anchor at 600 (the solid button colour) so the school's colour is used as is.
   */
  anchor?: ScaleStep;
}

const LIGHTEST = 0.985;
const DARKEST = 0.16;

/**
 * Build a 50-950 scale around `baseHex`, keeping its hue and saturation character. Lightness
 * is remapped around the anchor so the scale stays monotonic even for very light or very dark
 * brand colours (each step is always darker than the one before).
 */
export function generateScale(baseHex: string, options: ScaleOptions = {}): ColorScale {
  const base = rgbToOklch(parseHex(baseHex));
  const anchor = options.anchor ?? closestStep(base.l);
  const anchorTarget = STEP_LIGHTNESS[anchor];
  const chroma = Math.max(base.c, 0.02);
  const scale = {} as ColorScale;
  for (const step of SCALE_STEPS) {
    const target = STEP_LIGHTNESS[step];
    let l: number;
    if (step === anchor) {
      l = base.l;
    } else if (target > anchorTarget) {
      // Very light brands still get lighter tints: keep a little headroom below pure white.
      const ceiling = Math.max(LIGHTEST, Math.min(0.998, base.l + 0.01));
      l = base.l + ((target - anchorTarget) * (ceiling - base.l)) / (LIGHTEST - anchorTarget);
    } else {
      const floor = Math.min(DARKEST, base.l - 0.04);
      l = floor + ((target - DARKEST) * (base.l - floor)) / (anchorTarget - DARKEST);
    }
    scale[step] = toHex(oklchToRgb({ l, c: chroma * STEP_CHROMA[step], h: base.h }));
  }
  scale[anchor] = toHex(parseHex(baseHex));
  return scale;
}

export function closestStep(lightness: number): ScaleStep {
  let best: ScaleStep = 500;
  for (const step of SCALE_STEPS) {
    if (Math.abs(STEP_LIGHTNESS[step] - lightness) < Math.abs(STEP_LIGHTNESS[best] - lightness)) {
      best = step;
    }
  }
  return best;
}

/** Darken (or lighten) a colour in OKLCH until it reaches `minRatio` against `against`. */
export function adjustForContrast(
  color: string,
  against: string,
  minRatio: number,
  direction: "darken" | "lighten",
): string | null {
  const start = rgbToOklch(parseHex(color));
  for (let i = 0; i <= 100; i += 1) {
    const l = direction === "darken" ? start.l - i * 0.01 : start.l + i * 0.01;
    if (l < 0 || l > 1) break;
    const candidate = toHex(oklchToRgb({ ...start, l }));
    if (contrastRatio(candidate, against) >= minRatio) return candidate;
  }
  return null;
}
