import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentProps } from "react";

import { cn } from "../lib/cn.ts";
import { focusRing } from "../lib/styles.ts";
import { Spinner } from "./Spinner.tsx";

export const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap select-none",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-(--sp-duration-fast) ease-standard",
    "active:translate-y-px motion-reduce:active:translate-y-0",
    "disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    focusRing,
  ],
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-fg shadow-1 hover:bg-primary-hover",
        secondary:
          "border border-border-strong bg-surface text-fg shadow-1 hover:border-neutral-400 hover:bg-surface-hover",
        ghost: "text-fg hover:bg-surface-hover",
        danger: "bg-danger text-danger-fg shadow-1 hover:bg-danger-hover",
        link: "h-auto px-0 text-primary-subtle-fg underline-offset-4 hover:underline",
      },
      // 44px minimum on phones and any touch device; compact sizes only for a mouse on wide screens.
      size: {
        sm: "h-11 px-4 text-sm md:pointer-fine:h-8 md:pointer-fine:px-3",
        md: "h-11 px-4 text-sm md:pointer-fine:h-10",
        lg: "h-12 px-5 text-base",
        icon: "size-11 md:pointer-fine:size-10",
      },
    },
    compoundVariants: [
      { variant: "link", className: "h-auto min-h-11 px-0 md:pointer-fine:min-h-0" },
    ],
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  /** Render the child element (e.g. a router Link) with button styles. */
  asChild?: boolean;
  /** Shows a spinner, sets aria-busy, and blocks clicks while keeping the label readable. */
  loading?: boolean;
  loadingLabel?: string;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  loadingLabel = "Loading",
  disabled,
  children,
  type,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);

  if (asChild) {
    return (
      <Slot className={classes} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <button
      type={type ?? "button"}
      className={classes}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner size="sm" decorative /> : null}
      {children}
      {loading ? <span className="sr-only">{loadingLabel}</span> : null}
    </button>
  );
}
