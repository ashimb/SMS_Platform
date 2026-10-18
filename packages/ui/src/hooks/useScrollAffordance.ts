import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Tells whether a horizontally scrolling element has more content before/after the visible part,
 * so the UI can show an edge fade (the visible overflow affordance for tabs, chip rows, tables).
 */
export function useScrollAffordance<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [state, setState] = useState({ start: false, end: false });

  const update = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    const start = element.scrollLeft > 1;
    const end = element.scrollLeft + element.clientWidth < element.scrollWidth - 1;
    setState((previous) =>
      previous.start === start && previous.end === end ? previous : { start, end },
    );
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    update();
    element.addEventListener("scroll", update, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(element);
    for (const child of Array.from(element.children)) observer?.observe(child);
    return () => {
      element.removeEventListener("scroll", update);
      observer?.disconnect();
    };
  }, [update]);

  return { ref, canScrollStart: state.start, canScrollEnd: state.end };
}
