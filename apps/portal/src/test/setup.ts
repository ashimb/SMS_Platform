/**
 * Vitest setup: jest-dom matchers, MSW (unhandled requests fail the test), i18n, per-test reset
 * of the auth store, mock API state and DOM, plus jsdom gaps that Radix and recharts rely on.
 */
import "@testing-library/jest-dom/vitest";
import "@/lib/zod-config.ts";

import { cleanup, configure } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

import { auth } from "@/lib/auth-store.ts";
import { i18next, initI18n } from "@/lib/i18n.ts";

import { resetMockState } from "./mocks/handlers.ts";
import { server } from "./mocks/server.ts";

// Pages are lazy route chunks plus i18n namespaces; under parallel workers the first render can
// exceed Testing Library's 1 s default (cold Vite transforms of lazy pages in each worker).
configure({ asyncUtilTimeout: 10_000 });

class ResizeObserverStub {
  observe(): void {
    // no-op: jsdom has no layout
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
 * matchMedia that evaluates min/max-width against window.innerWidth (jsdom: 1024) and a fine
 * pointer, so tests get the desktop presentation of responsive components by default; a test can
 * set window.innerWidth (and call `window.dispatchEvent(new Event("resize"))`) to see a phone.
 */
function evaluateMedia(query: string): boolean {
  return query.split(/\)\s*and\s*\(|,/).every((part) => {
    const [feature = "", rawValue = ""] = part
      .replace(/[()]/g, "")
      .split(":")
      .map((x) => x.trim());
    const value = rawValue.replace("px", "");
    if (feature === "min-width") return window.innerWidth >= Number(value);
    if (feature === "max-width") return window.innerWidth <= Number(value);
    if (feature === "pointer") return value === "fine";
    if (feature === "hover") return value === "hover";
    return false;
  });
}
window.matchMedia = ((query: string) =>
  ({
    get matches() {
      return evaluateMedia(query);
    },
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList) as typeof window.matchMedia;
window.scrollTo = () => undefined;
const proto = Element.prototype as unknown as Record<string, unknown>;
proto["scrollIntoView"] ??= () => undefined;
proto["hasPointerCapture"] ??= () => false;
proto["setPointerCapture"] ??= () => undefined;
proto["releasePointerCapture"] ??= () => undefined;

beforeAll(async () => {
  server.listen({ onUnhandledFrame: "error" });
  await initI18n("en");
  // Preload every namespace so assertions never race lazy translation chunks.
  await i18next.loadNamespaces(["common", "auth", "dashboard", "students", "features"]);
});

beforeEach(() => {
  auth.reset();
  resetMockState();
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  document.documentElement.removeAttribute("data-theme");
  window.localStorage.clear();
  window.sessionStorage.clear();
});

afterAll(() => {
  server.close();
});
