import { type ComponentProps, useState } from "react";

import { cn } from "../lib/cn.ts";
import { fieldBase } from "../lib/styles.ts";
import { useFormField } from "./FormField.tsx";

export interface TextareaProps extends ComponentProps<"textarea"> {
  invalid?: boolean;
  /** Show "n / maxLength" below the field (requires maxLength). */
  showCount?: boolean;
}

export function Textarea({
  className,
  invalid,
  showCount = false,
  maxLength,
  onChange,
  id,
  "aria-describedby": describedBy,
  ...props
}: TextareaProps) {
  const initial = String(props.value ?? props.defaultValue ?? "").length;
  const [count, setCount] = useState(initial);
  const field = useFormField({ id, describedBy });
  const counter = showCount && maxLength !== undefined;

  return (
    <div className="flex flex-col gap-1">
      <textarea
        className={cn(fieldBase, "min-h-24 resize-y px-3 py-2 leading-relaxed", className)}
        maxLength={maxLength}
        onChange={(event) => {
          setCount(event.target.value.length);
          onChange?.(event);
        }}
        {...(invalid ? { "aria-invalid": true } : {})}
        {...field}
        {...props}
      />
      {counter ? (
        <span className="self-end text-xs text-fg-subtle tabular-nums" aria-live="polite">
          {count} / {maxLength}
        </span>
      ) : null}
    </div>
  );
}
