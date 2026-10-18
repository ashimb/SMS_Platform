/**
 * Dev-only horizontal-overflow detector (RESPONSIVE standard: "no horizontal page scroll at any
 * width"). It logs every element that is wider than the viewport, so a layout bug is caught while
 * the page is being built, and the same `findOverflow` function is run by the Playwright tests.
 *
 *   if (import.meta.env.DEV) void import("@school-platform/ui/dev").then((m) => m.installOverflowDetector());
 *
 * It must never ship to production: import it only behind a development check.
 */

export interface OverflowReport {
  viewportWidth: number;
  /** How far the document is wider than the viewport (0 = no page-level horizontal scroll). */
  documentOverflow: number;
  /** Short descriptions of offending elements (outside deliberate horizontal scrollers). */
  elements: string[];
}

/**
 * Pure DOM measurement. Self-contained on purpose (no outer references): Playwright serialises it
 * into the page with `page.evaluate(findOverflow)`.
 */
export function findOverflow(): OverflowReport {
  const doc = document.documentElement;
  const viewportWidth = doc.clientWidth;
  const elements: string[] = [];

  const describe = (element: Element): string => {
    const id = element.id ? `#${element.id}` : "";
    const cls =
      typeof element.className === "string"
        ? element.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).join(".")
        : "";
    return `${element.tagName.toLowerCase()}${id}${cls ? `.${cls}` : ""}`;
  };
  const insideScroller = (element: Element): boolean => {
    for (
      let parent = element.parentElement;
      parent && parent !== document.body;
      parent = parent.parentElement
    ) {
      const overflowX = getComputedStyle(parent).overflowX;
      if (overflowX === "auto" || overflowX === "scroll") return true;
    }
    return false;
  };

  for (const element of Array.from(document.body.querySelectorAll("*"))) {
    const rect = element.getBoundingClientRect();
    if (rect.width <= 1 || rect.height <= 1) continue;
    const style = getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || style.position === "fixed")
      continue;
    if (rect.right > viewportWidth + 1 && !insideScroller(element)) {
      elements.push(describe(element));
      if (elements.length >= 10) break;
    }
  }

  return {
    viewportWidth,
    documentOverflow: Math.max(0, doc.scrollWidth - viewportWidth),
    elements,
  };
}

export interface OverflowDetectorOptions {
  /** Receives every non-empty report (default: `console.warn`). */
  onReport?: (report: OverflowReport) => void;
  /** Re-check delay after layout changes. */
  debounceMs?: number;
}

/** Starts watching resize and DOM changes. Returns a function that stops the detector. */
export function installOverflowDetector({
  onReport,
  debounceMs = 250,
}: OverflowDetectorOptions = {}): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let last = "";

  const run = () => {
    const report = findOverflow();
    if (report.documentOverflow === 0 && report.elements.length === 0) {
      last = "";
      return;
    }
    const signature = JSON.stringify(report);
    if (signature === last) return;
    last = signature;
    if (onReport) onReport(report);
    else {
      console.warn(
        `[overflow] ${String(report.documentOverflow)}px wider than the ${String(report.viewportWidth)}px viewport`,
        report.elements,
      );
    }
  };
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(run, debounceMs);
  };

  window.addEventListener("resize", schedule);
  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true });
  schedule();

  return () => {
    clearTimeout(timer);
    window.removeEventListener("resize", schedule);
    observer.disconnect();
  };
}
