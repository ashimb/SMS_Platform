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
