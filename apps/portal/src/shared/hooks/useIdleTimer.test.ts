import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useIdleTimer } from "./useIdleTimer.ts";

describe("useIdleTimer", () => {
  let now = 0;
  const clock = () => now;

  beforeEach(() => {
    vi.useFakeTimers();
    now = 1_000_000;
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function advance(ms: number) {
    act(() => {
      now += ms;
      vi.advanceTimersByTime(ms);
    });
  }

  it("warns before the timeout, then times out", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() =>
      useIdleTimer({ enabled: true, timeoutMs: 10_000, warningMs: 3_000, onTimeout, now: clock }),
    );
    advance(6_000);
    expect(result.current.warning).toBe(false);
    advance(2_000);
    expect(result.current.warning).toBe(true);
    expect(result.current.secondsLeft).toBe(2);
    advance(2_000);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("activity before the warning resets the countdown; during the warning it does not", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() =>
      useIdleTimer({ enabled: true, timeoutMs: 10_000, warningMs: 3_000, onTimeout, now: clock }),
    );
    advance(5_000);
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown"));
    });
    advance(6_000);
    expect(result.current.warning).toBe(false);

    advance(2_000);
    expect(result.current.warning).toBe(true);
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown"));
    });
    advance(2_000);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("reset() (Stay signed in) dismisses the warning", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() =>
      useIdleTimer({ enabled: true, timeoutMs: 10_000, warningMs: 3_000, onTimeout, now: clock }),
    );
    advance(8_000);
    expect(result.current.warning).toBe(true);
    act(() => {
      result.current.reset();
    });
    advance(6_000);
    expect(result.current.warning).toBe(false);
    expect(onTimeout).not.toHaveBeenCalled();
  });
});
