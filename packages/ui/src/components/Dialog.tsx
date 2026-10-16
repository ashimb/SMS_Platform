import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { type ComponentProps, type ReactNode } from "react";

import { cn } from "../lib/cn.ts";
import { focusRing } from "../lib/styles.ts";

/**
 * Modal dialog (Radix): focus is trapped and returned to the trigger on close, Escape closes,
 * background is inert, and a title is mandatory (announced as the dialog name).
 */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogOverlay({
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

export interface DialogContentProps extends Omit<
  ComponentProps<typeof DialogPrimitive.Content>,
  "title"
> {
  title: ReactNode;
  description?: ReactNode;
  size?: "sm" | "md" | "lg";
  /** Label of the close (X) button. */
  closeLabel?: string;
  hideClose?: boolean;
}

const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" } as const;

export function DialogContent({
  title,
  description,
  size = "md",
  closeLabel = "Close",
  hideClose = false,
  className,
  children,
  ...props
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface-raised p-6 text-fg shadow-4",
          "max-h-[calc(100dvh-2rem)] overflow-y-auto data-[state=open]:animate-scale-in",
          widths[size],
          className,
        )}
        {...(description ? {} : { "aria-describedby": undefined })}
        {...props}
      >
        <div className="flex flex-col gap-1.5 pr-8">
          <DialogPrimitive.Title className="text-lg leading-tight font-semibold">
            {title}
          </DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="text-sm text-fg-muted">
              {description}
            </DialogPrimitive.Description>
          ) : null}
        </div>
        <div className="mt-5">{children}</div>
        {hideClose ? null : (
          <DialogPrimitive.Close
            className={cn(
              "absolute top-4 right-4 inline-flex size-8 items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg",
              focusRing,
            )}
            aria-label={closeLabel}
          >
            <X className="size-4" aria-hidden="true" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}
