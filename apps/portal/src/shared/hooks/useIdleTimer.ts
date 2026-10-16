/**
 * Idle detection for the session-timeout warning (FRD FR-SEC-007: warn at T-2 min with "Stay
 * signed in"). Activity = pointer, key, wheel, touch or scroll. Timers compare timestamps, so a
 * sleeping laptop or a throttled background tab cannot stretch the session.
 */
import { useCallback, useEffect, useRef, useState } from "react";

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;
const TICK_MS = 1000;

export interface IdleTimerOptions {
  enabled: boolean;
  timeoutMs: number;
  warningMs: number;
  onTimeout: () => void;
  now?: () => number;
}

export interface IdleTimerState {
  /** True while the warning should be shown. */
  warning: boolean;
  /** Whole seconds left before sign-out (meaningful while `warning` is true). */
  secondsLeft: number;
  /** Count the user as active again (e.g. "Stay signed in"). */
  reset: () => void;
}

export function useIdleTimer({
  enabled,
  timeoutMs,
  warningMs,
  onTimeout,
  now = Date.now,
}: IdleTimerOptions): IdleTimerState {
  const lastActive = useRef(0);
  const warningRef = useRef(false);
  const [state, setState] = useState({ warning: false, secondsLeft: Math.ceil(warningMs / 1000) });
  const timeoutRef = useRef(onTimeout);
  useEffect(() => {
    timeoutRef.current = onTimeout;
  }, [onTimeout]);

  const reset = useCallback(() => {
    lastActive.current = now();
    warningRef.current = false;
    setState({ warning: false, secondsLeft: Math.ceil(warningMs / 1000) });
  }, [now, warningMs]);

  useEffect(() => {
    if (!enabled) return;
    lastActive.current = now();
    let timedOut = false;

    // While the warning is open only an explicit choice counts, so a stray scroll does not
    // silently dismiss it for someone who has walked away.
    const markActive = () => {
      if (!warningRef.current) lastActive.current = now();
    };
    const tick = () => {
      if (timedOut) return;
      const remaining = timeoutMs - (now() - lastActive.current);
      if (remaining <= 0) {
        timedOut = true;
        warningRef.current = false;
        timeoutRef.current();
        return;
      }
      const warning = remaining <= warningMs;
      warningRef.current = warning;
      const secondsLeft = Math.ceil(Math.min(remaining, warningMs) / 1000);
      setState((current) =>
        current.warning === warning && current.secondsLeft === secondsLeft
          ? current
          : { warning, secondsLeft },
      );
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, markActive, { passive: true, capture: true });
    }
    document.addEventListener("visibilitychange", onVisible);
    const interval = window.setInterval(tick, TICK_MS);
    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, markActive, { capture: true });
      }
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(interval);
    };
  }, [enabled, timeoutMs, warningMs, now]);

  return { ...state, reset };
}
