import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { findOverflow, installOverflowDetector } from "./overflow.ts";

const VIEWPORT = 320;

function box(element: Element, right: number, width = 100, height = 20): void {
  element.getBoundingClientRect = () =>
    ({ left: right - width, right, top: 0, bottom: height, width, height, x: 0, y: 0 }) as DOMRect;
}

beforeEach(() => {
  document.body.innerHTML = "";
  Object.defineProperty(document.documentElement, "clientWidth", {
    value: VIEWPORT,
    configurable: true,
  });
  Object.defineProperty(document.documentElement, "scrollWidth", {
    value: VIEWPORT,
    configurable: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("findOverflow", () => {
  it("reports nothing when everything fits", () => {
    document.body.innerHTML = '<div id="a"></div>';
    box(document.getElementById("a") as HTMLElement, 300);
    expect(findOverflow()).toEqual({ viewportWidth: VIEWPORT, documentOverflow: 0, elements: [] });
  });

  it("names elements that are wider than the viewport", () => {
    document.body.innerHTML = '<div id="wide" class="grid gap-2"></div>';
    box(document.getElementById("wide") as HTMLElement, 420);
    Object.defineProperty(document.documentElement, "scrollWidth", { value: 420 });

    const report = findOverflow();
    expect(report.documentOverflow).toBe(100);
    expect(report.elements).toEqual(["div#wide.grid.gap-2"]);
  });

  it("allows content inside a deliberate horizontal scroller", () => {
    document.body.innerHTML =
      '<div id="scroller" style="overflow-x:auto"><table id="table"></table></div>';
    box(document.getElementById("scroller") as HTMLElement, 300);
    box(document.getElementById("table") as HTMLElement, 900, 900);
    expect(findOverflow().elements).toEqual([]);
  });

  it("ignores fixed elements and hidden ones", () => {
    document.body.innerHTML =
      '<div id="fixed" style="position:fixed"></div><div id="hidden" style="display:none"></div>';
    box(document.getElementById("fixed") as HTMLElement, 900);
    box(document.getElementById("hidden") as HTMLElement, 900);
    expect(findOverflow().elements).toEqual([]);
  });
});

describe("installOverflowDetector", () => {
  it("reports overflow once layout changes and stops when uninstalled", () => {
    vi.useFakeTimers();
    const onReport = vi.fn();
    document.body.innerHTML = '<div id="wide"></div>';
    box(document.getElementById("wide") as HTMLElement, 500);
    Object.defineProperty(document.documentElement, "scrollWidth", { value: 500 });

    const stop = installOverflowDetector({ onReport, debounceMs: 10 });
    vi.advanceTimersByTime(20);
    expect(onReport).toHaveBeenCalledOnce();
    expect(onReport.mock.calls[0]?.[0]).toMatchObject({ documentOverflow: 180 });

    // The same problem is not reported again on every resize.
    window.dispatchEvent(new Event("resize"));
    vi.advanceTimersByTime(20);
    expect(onReport).toHaveBeenCalledOnce();

    stop();
    window.dispatchEvent(new Event("resize"));
    vi.advanceTimersByTime(20);
    expect(onReport).toHaveBeenCalledOnce();
  });
});
