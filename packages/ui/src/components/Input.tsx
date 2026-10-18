import { type ComponentProps, type ReactNode } from "react";

import { cn } from "../lib/cn.ts";
import { controlHeight, fieldBase } from "../lib/styles.ts";
import { useFormField } from "./FormField.tsx";

export interface InputProps extends ComponentProps<"input"> {
  /** Marks the field invalid when used outside <FormField>. */
  invalid?: boolean;
  /** Decorative icon or text inside the start of the field. */
  leading?: ReactNode;
  trailing?: ReactNode;
}

export function Input({
  className,
  invalid,
  leading,
  trailing,
  id,
  type = "text",
  "aria-describedby": describedBy,
  ...props
}: InputProps) {
  const field = useFormField({ id, describedBy });
  const input = (
    <input
      type={type}
      className={cn(
        fieldBase,
        controlHeight,
        "px-3",
        leading !== undefined && "pl-9",
        trailing !== undefined && "pr-9",
        className,
      )}
      {...(invalid ? { "aria-invalid": true } : {})}
      {...field}
      {...props}
    />
  );
  if (leading === undefined && trailing === undefined) return input;
  return (
    <div className="relative">
      {leading !== undefined ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-fg-subtle [&_svg]:size-4"
        >
          {leading}
        </span>
      ) : null}
      {input}
      {trailing !== undefined ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-fg-subtle [&_svg]:size-4"
        >
          {trailing}
        </span>
      ) : null}
    </div>
  );
}
