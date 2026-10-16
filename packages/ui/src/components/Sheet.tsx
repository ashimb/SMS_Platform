import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";
import { type ComponentProps, type ReactNode } from "react";

import { cn } from "../lib/cn.ts";
import { focusRing } from "../lib/styles.ts";
import { DialogOverlay } from "./Dialog.tsx";

/** Drawer/Sheet: a dialog that slides in from an edge (filters, detail panels, mobile nav). */
export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

const sheetVariants = cva(
  "fixed z-50 flex flex-col gap-4 border-border bg-surface-raised p-6 text-fg shadow-4",
  {
    variants: {
      side: {
        right:
          "inset-y-0 right-0 h-full w-[min(28rem,100vw)] border-l data-[state=open]:animate-slide-in-right",
        left: "inset-y-0 left-0 h-full w-[min(20rem,100vw)] border-r data-[state=open]:animate-slide-in-left",
        bottom:
          "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl border-t pb-[max(1.5rem,env(safe-area-inset-bottom))] data-[state=open]:animate-slide-in-bottom",
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
  ...props
}: SheetContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(sheetVariants({ side }), className)}
        {...(description ? {} : { "aria-describedby": undefined })}
        {...props}
      >
        {side === "bottom" ? (
          <span
            aria-hidden="true"
            className="mx-auto -mt-2 h-1 w-10 rounded-full bg-border-strong"
          />
        ) : null}
        <div className="flex flex-col gap-1 pr-8">
          <DialogPrimitive.Title className="text-lg font-semibold">{title}</DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="text-sm text-fg-muted">
              {description}
            </DialogPrimitive.Description>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        <DialogPrimitive.Close
          className={cn(
            "absolute top-4 right-4 inline-flex size-8 items-center justify-center rounded-md text-fg-subtle hover:bg-surface-hover hover:text-fg",
            focusRing,
          )}
          aria-label={closeLabel}
        >
          <X className="size-4" aria-hidden="true" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
