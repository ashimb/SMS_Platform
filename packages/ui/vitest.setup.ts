/** jsdom gaps that Radix primitives rely on, plus per-test DOM cleanup. */
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

/** jsdom has no ResizeObserver; Radix only needs the methods to exist. */
class ResizeObserverStub {
  observe(): void {
    // no-op: layout is not computed in jsdom
  }
  unobserve(): void {
    // no-op
  }
  disconnect(): void {
    // no-op
  }
}

const g = globalThis as Record<string, unknown>;
g["ResizeObserver"] ??= ResizeObserverStub;

/**
 * A small matchMedia that evaluates the queries the UI kit uses against `window.innerWidth`
 * (jsdom default 1024) and a configurable pointer type, so tests run the desktop presentation by
 * default and can switch to a phone with `setViewport(375)`. It understands `(min-width: Npx)`,
 * `(max-width: Npx)`, `(pointer: fine|coarse)` and `(hover: hover|none)`; anything else is false.
 */
type Pointer = "fine" | "coarse";
const environment = { pointer: "fine" as Pointer };
const listeners = new Set<{ query: string; notify: () => void }>();

function evaluate(query: string): boolean {
  const checks = query.split(/\)\s*and\s*\(|,/).map((part) => part.replace(/[()]/g, "").trim());
  return checks.every((check) => {
    const [feature = "", rawValue = ""] = check.split(":").map((part) => part.trim());
    const value = rawValue.replace("px", "");
    if (feature === "min-width") return window.innerWidth >= Number(value);
    if (feature === "max-width") return window.innerWidth <= Number(value);
    if (feature === "pointer") return environment.pointer === value;
    if (feature === "hover") return (environment.pointer === "fine") === (value === "hover");
    return false;
  });
}

/** Test helper: pretend the page is `width` px wide and the primary pointer is a mouse or finger. */
export function setViewport(
  width: number,
  pointer: Pointer = width >= 768 ? "fine" : "coarse",
): void {
  window.innerWidth = width;
  environment.pointer = pointer;
  for (const entry of listeners) entry.notify();
}

if (typeof window !== "undefined") {
  window.matchMedia = ((query: string) =>
    ({
      get matches() {
        return evaluate(query);
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, callback: () => void) => {
        listeners.add({ query, notify: callback });
      },
      removeEventListener: (_type: string, callback: () => void) => {
        for (const entry of listeners) if (entry.notify === callback) listeners.delete(entry);
      },
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList) as typeof window.matchMedia;

  afterEach(() => {
    window.innerWidth = 1024;
    environment.pointer = "fine";
  });

  const proto = Element.prototype as unknown as Record<string, unknown>;
  proto["scrollIntoView"] ??= () => undefined;
  proto["hasPointerCapture"] ??= () => false;
  proto["setPointerCapture"] ??= () => undefined;
  proto["releasePointerCapture"] ??= () => undefined;
}
