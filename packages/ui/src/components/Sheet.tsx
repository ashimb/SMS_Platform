import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";
import { type ComponentProps, type ReactNode, useRef } from "react";

import { useSwipeToDismiss } from "../hooks/useSwipeToDismiss.ts";
import { cn } from "../lib/cn.ts";
import { focusRing } from "../lib/styles.ts";
import { DialogOverlay } from "./Dialog.tsx";

/**
 * Drawer/Sheet: a dialog that slides in from an edge (filters, detail panels, mobile nav). The
 * bottom variant has a grab handle and dismisses with a swipe down; every edge respects the
 * safe areas (notch, home indicator, gesture bars). For an overlay that is a modal on desktop and
 * a bottom sheet on phones, use ResponsiveSheet.
 */
export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

const sheetVariants = cva(
  "fixed z-50 flex flex-col gap-4 border-border bg-surface-raised p-6 text-fg shadow-4",
  {
    variants: {
      side: {
        right:
          "inset-y-0 right-0 h-full w-[min(28rem,100vw)] border-l pt-[max(1.5rem,var(--sp-safe-top))] pr-[max(1.5rem,var(--sp-safe-right))] pb-[max(1.5rem,var(--sp-safe-bottom))] data-[state=open]:animate-slide-in-right",
        left: "inset-y-0 left-0 h-full w-[min(20rem,100vw)] border-r pt-[max(1.5rem,var(--sp-safe-top))] pb-[max(1.5rem,var(--sp-safe-bottom))] pl-[max(1.5rem,var(--sp-safe-left))] data-[state=open]:animate-slide-in-left",
        bottom:
          "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl border-t pb-[max(1.5rem,var(--sp-safe-bottom))] data-[state=open]:animate-slide-in-bottom",
      },
    },
    defaultVariants: { side: "right" },
  },
);

export interface SheetContentProps extends Omit<
  ComponentProps<typeof DialogPrimitive.Content>,
  "title"
> {
  title: ReactNode;
  description?: ReactNode;
  side?: "right" | "left" | "bottom";
  closeLabel?: string;
}

export function SheetContent({
  title,
  description,
  side = "right",
  closeLabel = "Close",
  className,
  children,
  style,
  ...props
}: SheetContentProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const swipe = useSwipeToDismiss({
    enabled: side === "bottom",
    onDismiss: () => {
      closeRef.current?.click();
    },
  });

  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(sheetVariants({ side }), className)}
        style={{ ...swipe.style, ...style }}
        {...(description ? {} : { "aria-describedby": undefined })}
        {...props}
      >
        {side === "bottom" ? (
          // The handle and title are the drag region; the scrolling body below is left alone.
          <div
            {...swipe.handleProps}
            className="-mt-2 -mb-2 cursor-grab pt-2 pb-2 active:cursor-grabbing"
          >
            <span
              aria-hidden="true"
              className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-border-strong"
            />
            <SheetHeader title={title} description={description} />
          </div>
        ) : (
          <SheetHeader title={title} description={description} />
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        <DialogPrimitive.Close
          ref={closeRef}
          className={cn(
            "absolute top-3 right-3 inline-flex size-11 items-center justify-center rounded-md text-fg-subtle hover:bg-surface-hover hover:text-fg md:pointer-fine:top-4 md:pointer-fine:right-4 md:pointer-fine:size-8",
            focusRing,
          )}
          aria-label={closeLabel}
        >
          <X className="size-5 md:pointer-fine:size-4" aria-hidden="true" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

function SheetHeader({ title, description }: { title: ReactNode; description?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 pr-10">
      <DialogPrimitive.Title className="text-lg font-semibold">{title}</DialogPrimitive.Title>
      {description ? (
        <DialogPrimitive.Description className="text-sm text-fg-muted">
          {description}
        </DialogPrimitive.Description>
      ) : null}
    </div>
  );
}
