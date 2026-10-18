"use client";

import { useEffect } from "react";

/** Development only: logs the elements that make a page scroll sideways (RESPONSIVE standard). */
export function DevOverflowDetector() {
  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;
    void import("@school-platform/ui/dev").then(({ installOverflowDetector }) => {
      if (!cancelled) stop = installOverflowDetector();
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);
  return null;
}
