import { type ComponentProps } from "react";

import { cn } from "../lib/cn.ts";

const COLUMNS = {
  1: "",
  2: "md:grid-cols-2",
  3: "md:grid-cols-2 xl:grid-cols-3",
} as const;

export interface FormGridProps extends ComponentProps<"div"> {
  /** Columns on wide screens (a phone is always one column). 3 means 2 from `md` and 3 from `xl`. */
  columns?: keyof typeof COLUMNS;
}

/** Form layout: a single column on phones, 2 from `md`, 3 from `xl` (RESPONSIVE standard). */
export function FormGrid({ columns = 2, className, ...props }: FormGridProps) {
  return (
    <div
      className={cn("grid grid-cols-1 gap-x-6 gap-y-1", COLUMNS[columns], className)}
      {...props}
    />
  );
}

/** A grid cell that spans every column (a section heading, a wide field, helper text). */
export function FormGridFull({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("md:col-span-full", className)} {...props} />;
}
