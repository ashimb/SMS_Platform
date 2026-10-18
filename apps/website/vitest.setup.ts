import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom lacks ResizeObserver, which Radix primitives (Select, Checkbox) use.
if (typeof window !== "undefined" && !("ResizeObserver" in window)) {
  class ResizeObserverStub {
    observe = (): void => undefined;
    unobserve = (): void => undefined;
    disconnect = (): void => undefined;
  }
  Object.assign(globalThis, { ResizeObserver: ResizeObserverStub });
}

// Unmount rendered trees between tests (a no-op for node-environment tests).
afterEach(() => {
  cleanup();
});
