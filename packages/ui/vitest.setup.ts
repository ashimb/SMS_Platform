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

if (typeof window !== "undefined") {
  window.matchMedia ??= (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;

  const proto = Element.prototype as unknown as Record<string, unknown>;
  proto["scrollIntoView"] ??= () => undefined;
  proto["hasPointerCapture"] ??= () => false;
  proto["setPointerCapture"] ??= () => undefined;
  proto["releasePointerCapture"] ??= () => undefined;
}
