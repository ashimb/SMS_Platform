import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "../lib/cn.ts";
import { fieldBase } from "../lib/styles.ts";
import { useFormField } from "./FormField.tsx";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: readonly SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  /** Required when the select is not inside a <FormField> with a visible label. */
  "aria-label"?: string;
  className?: string;
}

/**
 * Accessible single select (Radix): typeahead, arrow keys, Home/End, Escape, and a native
 * hidden <select> for form submission.
 */
export function Select({
  options,
  placeholder = "Select…",
  invalid,
  className,
  id,
  "aria-label": ariaLabel,
  disabled,
  ...rootProps
}: SelectProps) {
  const field = useFormField({ id });
  return (
    <SelectPrimitive.Root
      {...rootProps}
      {...((disabled ?? field.disabled) ? { disabled: true } : {})}
    >
      <SelectPrimitive.Trigger
        className={cn(
          fieldBase,
          "flex h-10 items-center justify-between gap-2 px-3 text-left data-placeholder:text-fg-subtle",
          className,
        )}
        {...(field.id ? { id: field.id } : {})}
        {...(field["aria-describedby"] ? { "aria-describedby": field["aria-describedby"] } : {})}
        {...(invalid || field["aria-invalid"] ? { "aria-invalid": true } : {})}
        {...(ariaLabel ? { "aria-label": ariaLabel } : {})}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon className="text-fg-subtle">
          <ChevronDown className="size-4" aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-50 max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) overflow-hidden rounded-lg border border-border bg-surface-raised p-1 text-fg shadow-3 data-[state=open]:animate-scale-in"
        >
          <SelectPrimitive.Viewport>
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                {...(option.disabled ? { disabled: true } : {})}
                className="relative flex h-9 cursor-pointer items-center rounded-md pr-3 pl-8 text-sm outline-none select-none data-disabled:cursor-not-allowed data-disabled:text-fg-subtle data-highlighted:bg-surface-hover"
              >
                <SelectPrimitive.ItemIndicator className="absolute left-2 inline-flex text-primary-subtle-fg">
                  <Check className="size-4" aria-hidden="true" />
                </SelectPrimitive.ItemIndicator>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
