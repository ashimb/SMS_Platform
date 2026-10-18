import { useFormField } from "@school-platform/ui";
import { type ComponentProps, useState } from "react";

import { cn } from "@/shared/utils/cn.ts";

const LENGTH = 6;

/**
 * Six-box one-time-code input (FRD FR-AUTH-001 UI). It is ONE real input (so screen readers,
 * paste, SMS/authenticator autofill via autocomplete="one-time-code", and password managers all
 * work), drawn over six decorative boxes.
 */
export function OtpInput({
  value,
  onChange,
  onFocus,
  onBlur,
  className,
  id,
  ...props
}: Omit<ComponentProps<"input">, "value" | "onChange" | "type"> & {
  value: string;
  onChange: (value: string) => void;
}) {
  const field = useFormField({ id });
  const [focused, setFocused] = useState(false);
  const digits = value.padEnd(LENGTH, " ").slice(0, LENGTH).split("");
  const invalid = field["aria-invalid"] === true;
  const activeIndex = Math.min(value.length, LENGTH - 1);

  return (
    <div className={cn("relative", className)}>
      <div aria-hidden="true" className="grid grid-cols-6 gap-2">
        {digits.map((digit, index) => (
          <span
            // Fixed-length positional boxes: the index is the identity.
            key={index}
            className={cn(
              "flex h-14 items-center justify-center rounded-lg border bg-surface font-display text-2xl font-semibold text-fg shadow-1 transition-colors",
              invalid ? "border-danger" : "border-border-strong",
              focused && index === activeIndex && "border-primary ring-2 ring-ring",
            )}
          >
            {digit.trim()}
          </span>
        ))}
      </div>
      <input
        {...field}
        {...props}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        enterKeyHint="go"
        pattern="[0-9]*"
        maxLength={LENGTH}
        value={value}
        onChange={(event) => {
          onChange(event.target.value.replace(/\D/g, "").slice(0, LENGTH));
        }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        className="absolute inset-0 h-full w-full cursor-text rounded-lg bg-transparent text-transparent caret-transparent outline-none"
      />
    </div>
  );
}
