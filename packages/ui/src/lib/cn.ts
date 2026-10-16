import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

import { semantic, status } from "../tokens/index.ts";

const colorNames = [
  ...Object.keys(semantic.light),
  ...["neutral", "primary", ...Object.keys(status)],
];

/** tailwind-merge that knows the design-system token names (so text-fg-muted ≠ a font size). */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: colorNames,
      shadow: ["1", "2", "3", "4"],
      radius: ["xs", "sm", "md", "lg", "xl", "2xl"],
      text: ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl"],
      ease: ["standard", "emphasized", "exit"],
    },
  },
});

/** Merge class names; later classes win over conflicting earlier ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
