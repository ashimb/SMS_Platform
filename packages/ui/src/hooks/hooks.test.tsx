import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { setViewport } from "../../vitest.setup.ts";
import { useBreakpoint, useCoarsePointer, useMediaQuery } from "./useMediaQuery.ts";
import { useScrollAffordance } from "./useScrollAffordance.ts";
import { useSwipeToDismiss } from "./useSwipeToDismiss.ts";

describe("useMediaQuery / useBreakpoint", () => {
  it("follows the viewport width and updates when it changes", () => {
    const { result } = renderHook(() => ({
      md: useBreakpoint("md"),
      lg: useBreakpoint("lg"),
      raw: useMediaQuery("(min-width: 500px)"),
    }));
    expect(result.current).toEqual({ md: true, lg: true, raw: true });

    act(() => {
      setViewport(600);
    });
    expect(result.current).toEqual({ md: false, lg: false, raw: true });

    act(() => {
      setViewport(375);
    });
    expect(result.current).toEqual({ md: false, lg: false, raw: false });
  });

  it("uses Tailwind's default breakpoints", () => {
    act(() => {
      setViewport(767);
    });
    expect(renderHook(() => useBreakpoint("md")).result.current).toBe(false);
    act(() => {
      setViewport(768);
    });
    expect(renderHook(() => useBreakpoint("md")).result.current).toBe(true);
    act(() => {
      setViewport(1023);
    });
    expect(renderHook(() => useBreakpoint("lg")).result.current).toBe(false);
  });

  it("reports a coarse (touch) pointer", () => {
    expect(renderHook(() => useCoarsePointer()).result.current).toBe(false);
    act(() => {
      setViewport(1024, "coarse");
    });
    expect(renderHook(() => useCoarsePointer()).result.current).toBe(true);
  });
});

describe("useScrollAffordance", () => {
  function Scroller() {
    const { ref, canScrollStart, canScrollEnd } = useScrollAffordance<HTMLDivElement>();
    return (
      <div
        ref={ref}
        data-testid="scroller"
        data-start={String(canScrollStart)}
        data-end={String(canScrollEnd)}
      />
    );
  }

  it("knows whether more content is hidden at either edge", () => {
    render(<Scroller />);
    const element = screen.getByTestId("scroller");
    Object.defineProperties(element, {
      clientWidth: { value: 200, configurable: true },
      scrollWidth: { value: 600, configurable: true },
    });

    act(() => {
      fireEvent.scroll(element);
    });
    expect(element.dataset["start"]).toBe("false");
    expect(element.dataset["end"]).toBe("true");

    element.scrollLeft = 150;
    act(() => {
      fireEvent.scroll(element);
    });
    expect(element.dataset["start"]).toBe("true");
    expect(element.dataset["end"]).toBe("true");

    element.scrollLeft = 400;
    act(() => {
      fireEvent.scroll(element);
    });
    expect(element.dataset["end"]).toBe("false");
  });
});

describe("useSwipeToDismiss", () => {
  function Sheet({ onDismiss, enabled = true }: { onDismiss: () => void; enabled?: boolean }) {
    const swipe = useSwipeToDismiss({ onDismiss, enabled });
    return (
      <div data-testid="sheet" style={swipe.style}>
        <div data-testid="handle" {...swipe.handleProps} />
      </div>
    );
  }

  const drag = (to: number, ms = 400) => {
    const handle = screen.getByTestId("handle");
    fireEvent.pointerDown(handle, { clientY: 100, pointerId: 1, timeStamp: 0 });
    fireEvent.pointerMove(handle, { clientY: 100 + to / 2, pointerId: 1, timeStamp: ms / 2 });
    fireEvent.pointerUp(handle, { clientY: 100 + to, pointerId: 1, timeStamp: ms });
  };

  it("dismisses after a long downward drag", () => {
    const onDismiss = vi.fn();
    render(<Sheet onDismiss={onDismiss} />);
    drag(160);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("dismisses after a quick flick", () => {
    const onDismiss = vi.fn();
    render(<Sheet onDismiss={onDismiss} />);
    drag(60, 50);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("springs back after a short slow drag", () => {
    const onDismiss = vi.fn();
    render(<Sheet onDismiss={onDismiss} />);
    drag(40, 600);
    expect(onDismiss).not.toHaveBeenCalled();
    expect(screen.getByTestId("sheet").style.transform).toBe("");
  });

  it("ignores upward drags and does nothing when disabled", () => {
    const onDismiss = vi.fn();
    const { rerender } = render(<Sheet onDismiss={onDismiss} />);
    drag(-200);
    expect(onDismiss).not.toHaveBeenCalled();

    rerender(<Sheet onDismiss={onDismiss} enabled={false} />);
    drag(300);
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
