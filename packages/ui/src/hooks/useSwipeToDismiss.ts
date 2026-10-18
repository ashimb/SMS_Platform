import { type CSSProperties, type PointerEvent, useCallback, useRef, useState } from "react";

export interface SwipeToDismissOptions {
  /** Called when the sheet was dragged far or fast enough downwards. */
  onDismiss: () => void;
  /** Disabled (e.g. on desktop modals): handlers do nothing. */
  enabled?: boolean;
  /** Distance in px that always dismisses. */
  threshold?: number;
}

/**
 * Swipe-down-to-dismiss for bottom sheets. Spread `handleProps` on the drag region (the grab
 * handle and header, not the scrolling body) and `style` on the sheet. A quick flick also
 * dismisses. Mouse drags work too, so it can be exercised in desktop browsers and tests.
 */
export function useSwipeToDismiss({
  onDismiss,
  enabled = true,
  threshold = 96,
}: SwipeToDismissOptions) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const origin = useRef<{ y: number; time: number } | null>(null);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!enabled || (event.pointerType === "mouse" && event.button !== 0)) return;
      origin.current = { y: event.clientY, time: event.timeStamp };
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [enabled],
  );

  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    if (!origin.current) return;
    setOffset(Math.max(0, event.clientY - origin.current.y));
  }, []);

  const finish = useCallback(
    (event: PointerEvent<HTMLElement>, cancelled: boolean) => {
      const start = origin.current;
      origin.current = null;
      setDragging(false);
      if (!start) return;
      const distance = Math.max(0, event.clientY - start.y);
      const elapsed = Math.max(1, event.timeStamp - start.time);
      const flick = distance > 40 && distance / elapsed > 0.6;
      setOffset(0);
      if (!cancelled && (distance >= threshold || flick)) onDismiss();
    },
    [onDismiss, threshold],
  );

  const style: CSSProperties = enabled
    ? {
        transform: offset > 0 ? `translateY(${String(offset)}px)` : "",
        transition: dragging ? "none" : "",
      }
    : {};

  return {
    offset,
    dragging,
    style,
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (event: PointerEvent<HTMLElement>) => {
        finish(event, false);
      },
      onPointerCancel: (event: PointerEvent<HTMLElement>) => {
        finish(event, true);
      },
      style: { touchAction: "none" } satisfies CSSProperties,
    },
  };
}
