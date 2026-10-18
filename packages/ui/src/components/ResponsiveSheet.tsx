import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { type ComponentProps, type ReactNode, useRef } from "react";

import { type Breakpoint, useBreakpoint } from "../hooks/useMediaQuery.ts";
import { useSwipeToDismiss } from "../hooks/useSwipeToDismiss.ts";
import { cn } from "../lib/cn.ts";
import { focusRing } from "../lib/styles.ts";

/**
 * ResponsiveSheet: one overlay API, two presentations (RESPONSIVE standard, "Dialogs become
 * bottom sheets on mobile and centered modals on desktop").
 *
 *   - from the breakpoint up (default `md`): a centered modal;
 *   - below it: a bottom sheet with a grab handle that dismisses with a swipe down, a tap outside
 *     or Escape, and respects the home-indicator safe area.
 *
 * Both are Radix dialogs, so focus is trapped and returned to the trigger, the background is
 * inert and scroll is locked while open. A title is mandatory (it names the dialog).
 */
export const ResponsiveSheet = DialogPrimitive.Root;
export const ResponsiveSheetTrigger = DialogPrimitive.Trigger;
export const ResponsiveSheetClose = DialogPrimitive.Close;

export function ResponsiveSheetOverlay({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-overlay backdrop-blur-[2px] data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in",
        className,
      )}
      {...props}
    />
  );
}

export interface ResponsiveSheetContentProps extends Omit<
  ComponentProps<typeof DialogPrimitive.Content>,
  "title"
> {
  title: ReactNode;
  description?: ReactNode;
  /** Width of the centered modal (the bottom sheet is always full width). */
  size?: "sm" | "md" | "lg";
  /** Label of the close (X) button. */
  closeLabel?: string;
  hideClose?: boolean;
  /** Viewport width at which the sheet becomes a modal. */
  breakpoint?: Breakpoint;
}

const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" } as const;

export function ResponsiveSheetContent({
  title,
  description,
  size = "md",
  closeLabel = "Close",
  hideClose = false,
  breakpoint = "md",
  className,
  children,
  ...props
}: ResponsiveSheetContentProps) {
  const modal = useBreakpoint(breakpoint);
  const closeRef = useRef<HTMLButtonElement>(null);
  const swipe = useSwipeToDismiss({
    enabled: !modal,
    onDismiss: () => {
      closeRef.current?.click();
    },
  });

  const header = (
    <div className="flex flex-col gap-1.5 pr-12">
      <DialogPrimitive.Title className="text-lg leading-tight font-semibold">
        {title}
      </DialogPrimitive.Title>
      {description ? (
        <DialogPrimitive.Description className="text-sm text-fg-muted">
          {description}
        </DialogPrimitive.Description>
      ) : null}
    </div>
  );

  // The close button is also the target of the swipe gesture, so a bottom sheet always has one
  // (hidden when `hideClose` is set).
  const closeButton =
    hideClose && modal ? null : (
      <DialogPrimitive.Close
        ref={closeRef}
        aria-label={closeLabel}
        {...(hideClose ? { hidden: true, tabIndex: -1 } : {})}
        className={cn(
          "absolute top-3 right-3 inline-flex size-11 items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg md:pointer-fine:top-4 md:pointer-fine:right-4 md:pointer-fine:size-8",
          focusRing,
        )}
      >
        <X className="size-5 md:pointer-fine:size-4" aria-hidden="true" />
      </DialogPrimitive.Close>
    );

  return (
    <DialogPrimitive.Portal>
      <ResponsiveSheetOverlay />
      {modal ? (
        <DialogPrimitive.Content
          data-responsive-sheet="modal"
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface-raised p-6 text-fg shadow-4",
            "max-h-[calc(100dvh-2rem)] overflow-y-auto data-[state=open]:animate-scale-in",
            widths[size],
            className,
          )}
          {...(description ? {} : { "aria-describedby": undefined })}
          {...props}
        >
          {header}
          <div className="mt-5">{children}</div>
          {closeButton}
        </DialogPrimitive.Content>
      ) : (
        <DialogPrimitive.Content
          data-responsive-sheet="bottom"
          style={swipe.style}
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-2xl border-t border-border bg-surface-raised text-fg shadow-4 data-[state=open]:animate-slide-in-bottom",
            className,
          )}
          {...(description ? {} : { "aria-describedby": undefined })}
          {...props}
        >
          {/* Grab handle and header: the drag region (the scrolling body below is left alone). */}
          <div
            {...swipe.handleProps}
            className="shrink-0 cursor-grab px-5 pt-2 pb-3 active:cursor-grabbing"
          >
            <span
              aria-hidden="true"
              className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-border-strong"
            />
            {header}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.5rem,var(--sp-safe-bottom))]">
            {children}
          </div>
          {closeButton}
        </DialogPrimitive.Content>
      )}
    </DialogPrimitive.Portal>
  );
}

export function ResponsiveSheetFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}
