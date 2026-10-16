import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { type ComponentProps, type ReactNode, useId } from "react";

import { cn } from "../lib/cn.ts";
import { focusRing } from "../lib/styles.ts";
import { useFormField } from "./FormField.tsx";

export interface CheckboxProps extends ComponentProps<typeof CheckboxPrimitive.Root> {
  /** Inline label rendered next to the box (click target includes the label). */
  label?: ReactNode;
  description?: ReactNode;
}

/** Checkbox with optional label; supports the "indeterminate" state for select-all patterns. */
export function Checkbox({ label, description, className, id, ...props }: CheckboxProps) {
  const generated = useId();
  const field = useFormField({ id });
  const checkboxId = field.id ?? id ?? `checkbox-${generated}`;
  const descriptionId = description ? `${checkboxId}-description` : undefined;
  const describedBy = [field["aria-describedby"], descriptionId].filter(Boolean).join(" ");

  const box = (
    <CheckboxPrimitive.Root
      id={checkboxId}
      className={cn(
        "peer grid size-5 shrink-0 place-items-center rounded-sm border border-border-strong bg-surface shadow-1 transition-colors duration-(--sp-duration-fast)",
        "hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-fg",
        "data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-fg",
        "aria-invalid:border-danger",
        focusRing,
        className,
      )}
      {...(describedBy ? { "aria-describedby": describedBy } : {})}
      {...(field["aria-invalid"] ? { "aria-invalid": true } : {})}
      {...(field.disabled ? { disabled: true } : {})}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="data-[state=checked]:animate-scale-in">
        {props.checked === "indeterminate" ? (
          <Minus className="size-3.5" strokeWidth={3} aria-hidden="true" />
        ) : (
          <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (!label) return box;
  return (
    <div className="flex items-start gap-3">
      <div className="pt-0.5">{box}</div>
      <div className="flex flex-col gap-0.5">
        <label
          htmlFor={checkboxId}
          className="cursor-pointer text-sm font-medium text-fg peer-disabled:cursor-not-allowed"
        >
          {label}
        </label>
        {description ? (
          <p id={descriptionId} className="text-xs text-fg-muted">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
