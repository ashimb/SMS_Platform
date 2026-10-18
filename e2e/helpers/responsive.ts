import { expect, type Locator, type Page } from "@playwright/test";

/** Phones are below Tailwind's `md` breakpoint; tablets from md; the icon rail ends at `lg`. */
export const SM = 640;
export const MD = 768;
export const LG = 1024;

export function viewportWidth(page: Page): number {
  const size = page.viewportSize();
  if (!size) throw new Error("page has no viewport size");
  return size.width;
}

interface OverflowResult {
  viewportWidth: number;
  documentOverflow: number;
  elements: string[];
}

/**
 * Fails when the page scrolls sideways: the document is wider than the viewport, or an element
 * pokes out of it (outside a deliberate `overflow-x: auto|scroll` box, fixed bars and hidden
 * elements excluded). Mirrors `findOverflow` in packages/ui/src/dev/overflow.ts, but runs against
 * production builds, where the dev detector is not installed.
 */
export async function assertNoHorizontalOverflow(page: Page, label = page.url()): Promise<void> {
  const result = await page.evaluate<OverflowResult>(() => {
    const doc = document.documentElement;
    const vw = doc.clientWidth;
    const describe = (el: Element) => {
      const id = el.id ? `#${el.id}` : "";
      const cls = Array.from(el.classList).slice(0, 3).join(".");
      return `${el.tagName.toLowerCase()}${id}${cls ? `.${cls}` : ""}`;
    };
    const elements: string[] = [];
    for (const el of Array.from(document.body.querySelectorAll("*"))) {
      if (elements.length >= 8) break;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.position === "fixed") {
        continue;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.right <= vw + 1) continue;
      let clipped = false;
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const ps = getComputedStyle(p);
        if (ps.position === "fixed") {
          clipped = true;
          break;
        }
        const clips =
          ps.overflowX === "auto" ||
          ps.overflowX === "scroll" ||
          ps.overflowX === "hidden" ||
          ps.overflowX === "clip";
        if (clips && p.getBoundingClientRect().right <= vw + 1) {
          clipped = true;
          break;
        }
      }
      if (!clipped) elements.push(describe(el));
    }
    return {
      viewportWidth: vw,
      documentOverflow: Math.max(0, doc.scrollWidth - vw),
      elements,
    };
  });
  expect(
    result.documentOverflow,
    `${label}: page is ${String(result.documentOverflow)}px wider than the ${String(result.viewportWidth)}px viewport; offenders: ${result.elements.join(", ")}`,
  ).toBeLessThanOrEqual(1);
}

/** Every visible matching element must be at least `min` x `min` CSS px (44px touch target). */
export async function assertMinTargetSize(locator: Locator, min = 44): Promise<void> {
  const small = await locator.evaluateAll((elements, size) => {
    const out: string[] = [];
    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.width < size - 0.5 || rect.height < size - 0.5) {
        const label = el.getAttribute("aria-label") ?? (el.textContent ?? "").trim().slice(0, 24);
        out.push(
          `${el.tagName.toLowerCase()} "${label}" ${String(Math.round(rect.width))}x${String(Math.round(rect.height))}`,
        );
      }
    }
    return out;
  }, min);
  expect(small, `targets under ${String(min)}px`).toEqual([]);
}

/** Visible text inputs must use at least 16px text on phones (iOS Safari zooms smaller ones). */
export async function assertInputFontSize(page: Page, min = 16): Promise<void> {
  const small = await page
    .locator("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea")
    .evaluateAll((elements, size) => {
      const out: string[] = [];
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        if (el.getAttribute("tabindex") === "-1" && el.getAttribute("aria-hidden") === "true") {
          continue;
        }
        const px = parseFloat(getComputedStyle(el).fontSize);
        if (px < size) out.push(`${el.tagName.toLowerCase()}#${el.id} ${String(px)}px`);
      }
      return out;
    }, min);
  expect(small, "inputs with text under 16px").toEqual([]);
}
