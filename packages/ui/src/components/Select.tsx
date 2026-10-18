import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

import { useBreakpoint, useCoarsePointer } from "../hooks/useMediaQuery.ts";
import { cn } from "../lib/cn.ts";
import { controlHeight, fieldBase } from "../lib/styles.ts";
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
 * Accessible single select.
 *
 *   - phones and any touch device: the platform's native `<select>`, which opens the operating
 *     system's own picker sheet (large rows, familiar gestures, 16px text so iOS does not zoom);
 *   - wide screens with a mouse: a Radix popover with typeahead, arrow keys, Home/End, Escape and
 *     a native hidden `<select>` for form submission.
 *
 * Both render the same props, so forms need no changes. The first (server) render is the phone
 * layout; the client switches right after hydration.
 */
export function Select(props: SelectProps) {
  const wide = useBreakpoint("md");
  const touch = useCoarsePointer();
  return wide && !touch ? <PopoverSelect {...props} /> : <NativeSelect {...props} />;
}

function NativeSelect({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select…",
  invalid,
  className,
  id,
  name,
  required,
  "aria-label": ariaLabel,
  disabled,
}: SelectProps) {
  const field = useFormField({ id });
  const controlled = value !== undefined;
  const current = controlled ? value : defaultValue;
  const showsPlaceholder = (current ?? "") === "" && !options.some((option) => option.value === "");
  const isDisabled = disabled ?? field.disabled;

  return (
    <div className="relative">
      <select
        {...(field.id ? { id: field.id } : {})}
        {...(name ? { name } : {})}
        {...(controlled ? { value } : { defaultValue: defaultValue ?? "" })}
        {...(isDisabled ? { disabled: true } : {})}
        {...(required ? { required: true } : {})}
        {...(field["aria-describedby"] ? { "aria-describedby": field["aria-describedby"] } : {})}
        {...(invalid || field["aria-invalid"] ? { "aria-invalid": true } : {})}
        {...(ariaLabel ? { "aria-label": ariaLabel } : {})}
        onChange={(event) => {
          onValueChange?.(event.target.value);
        }}
        className={cn(
          fieldBase,
          controlHeight,
          "appearance-none truncate pr-10 pl-3",
          showsPlaceholder && "text-fg-subtle",
          className,
        )}
      >
        {showsPlaceholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            {...(option.disabled ? { disabled: true } : {})}
            className="text-fg"
          >
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-subtle"
      />
    </div>
  );
}

function PopoverSelect({
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
          controlHeight,
          "flex items-center justify-between gap-2 px-3 text-left data-placeholder:text-fg-subtle",
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
