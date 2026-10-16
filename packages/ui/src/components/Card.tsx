import { type ComponentProps, type ElementType } from "react";

import { cn } from "../lib/cn.ts";

export interface CardProps extends ComponentProps<"div"> {
  /** "raised" adds soft elevation; "flat" relies on the border only. */
  elevation?: "flat" | "raised";
  /** Hover lift for clickable cards (wrap content in a link or button for semantics). */
  interactive?: boolean;
}

export function Card({
  className,
  elevation = "raised",
  interactive = false,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface text-fg",
        elevation === "raised" && "shadow-1",
        interactive &&
          "transition-[box-shadow,transform] duration-(--sp-duration-base) ease-standard hover:-translate-y-0.5 hover:shadow-3 motion-reduce:hover:translate-y-0",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1 p-6 pb-0", className)} {...props} />;
}

export interface CardTitleProps extends ComponentProps<"h3"> {
  /** Heading level to keep the document outline correct (default h3). */
  as?: Extract<ElementType, "h2" | "h3" | "h4">;
}

export function CardTitle({ as: Heading = "h3", className, ...props }: CardTitleProps) {
  return (
    <Heading className={cn("text-lg leading-tight font-semibold text-fg", className)} {...props} />
  );
}

export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-sm text-fg-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("p-6", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 border-t border-border px-6 py-4",
        className,
      )}
      {...props}
    />
  );
}
