import { useSyncExternalStore } from "react";

/** Mobile-first breakpoints, matching the design tokens (packages/ui/src/tokens). */
export const MEDIA = {
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
  reducedMotion: "(prefers-reduced-motion: reduce)",
} as const;

export function useMediaQuery(query: string, serverFallback = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => {
        list.removeEventListener("change", onChange);
      };
    },
    () => window.matchMedia(query).matches,
    () => serverFallback,
  );
}
