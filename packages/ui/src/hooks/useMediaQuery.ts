import { useCallback, useSyncExternalStore } from "react";

/** Tailwind's default breakpoints (px): the single source of truth for responsive behaviour. */
export const BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280, "2xl": 1536 } as const;
export type Breakpoint = keyof typeof BREAKPOINTS;

function canMatch(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function";
}

/**
 * Subscribes to a CSS media query. The server (and the first hydration pass) reports
 * `serverFallback`, so markup rendered on the server is the mobile-first layout by default and
 * the client corrects it right after hydration without a mismatch warning.
 */
export function useMediaQuery(query: string, serverFallback = false): boolean {
  const subscribe = useCallback(
    (notify: () => void) => {
      if (!canMatch()) return () => undefined;
      const list = window.matchMedia(query);
      list.addEventListener("change", notify);
      return () => {
        list.removeEventListener("change", notify);
      };
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => (canMatch() ? window.matchMedia(query).matches : serverFallback),
    () => serverFallback,
  );
}

/**
 * True when the viewport is at least the given Tailwind breakpoint wide. Defaults to `false`
 * (mobile) on the server, matching the mobile-first rule: base styles are the phone layout.
 */
export function useBreakpoint(min: Breakpoint, serverFallback = false): boolean {
  return useMediaQuery(`(min-width: ${String(BREAKPOINTS[min])}px)`, serverFallback);
}

/** True on devices whose primary pointer is a finger (phones and tablets, any width). */
export function useCoarsePointer(): boolean {
  return useMediaQuery("(pointer: coarse)", false);
}

/** True when the user asked the OS to reduce motion. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)", false);
}
