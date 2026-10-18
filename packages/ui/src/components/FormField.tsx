import * as LabelPrimitive from "@radix-ui/react-label";
import { createContext, type ReactNode, useContext, useId } from "react";

import { cn } from "../lib/cn.ts";

interface FormFieldContextValue {
  id: string;
  hintId: string | undefined;
  errorId: string | undefined;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
}

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

/** Props a control inside <FormField> should spread: id, aria-describedby, aria-invalid... */
export interface FieldControlProps {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  "aria-required"?: true;
  disabled?: boolean;
}

/** Used by Input/Textarea/Select/Checkbox/Switch to wire themselves to the surrounding field. */
export function useFormField(
  own: { id?: string | undefined; describedBy?: string | undefined } = {},
): FieldControlProps {
  const field = useContext(FormFieldContext);
  // Outside <FormField> the control keeps its own id/description (e.g. paired with a <label>).
  if (!field) {
    return {
      ...(own.id ? { id: own.id } : {}),
      ...(own.describedBy ? { "aria-describedby": own.describedBy } : {}),
    };
  }
  const describedBy = [own.describedBy, field.hintId, field.errorId].filter(Boolean).join(" ");
  return {
    id: own.id ?? field.id,
    ...(describedBy ? { "aria-describedby": describedBy } : {}),
    ...(field.invalid ? { "aria-invalid": true as const } : {}),
    ...(field.required ? { "aria-required": true as const } : {}),
    ...(field.disabled ? { disabled: true } : {}),
  };
}

export interface FormFieldProps {
  label: ReactNode;
  children: ReactNode;
  /** Helper text shown below the control (formats, examples). */
  hint?: ReactNode;
  /** Error message; marks the control invalid and is announced politely. */
  error?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/**
 * Label + control + hint + error with correct associations (WCAG 1.3.1, 3.3.1, 3.3.2).
 * Labels are always visible; "required" is stated in text, not only with an asterisk.
 */
export function FormField({
  label,
  children,
  hint,
  error,
  required = false,
  disabled = false,
  id,
  className,
}: FormFieldProps) {
  const generated = useId();
  const controlId = id ?? `field-${generated}`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;

  return (
    <FormFieldContext.Provider
      value={{ id: controlId, hintId, errorId, invalid: Boolean(error), required, disabled }}
    >
      <div className={cn("flex flex-col gap-1.5", className)}>
        <LabelPrimitive.Root
          htmlFor={controlId}
          className={cn("text-sm font-medium text-fg", disabled && "text-fg-subtle")}
        >
          {label}
          {required ? <span className="ml-1 font-normal text-fg-subtle">(required)</span> : null}
        </LabelPrimitive.Root>
        {children}
        {hint ? (
          <p id={hintId} className="text-xs text-fg-muted">
            {hint}
          </p>
        ) : null}
        {/* The error line keeps its height even when empty, so validation messages appear without
            pushing the rest of the form down (no layout shift). */}
        <p
          id={errorId}
          aria-live="polite"
          className={cn("min-h-4 text-xs font-medium text-danger-subtle-fg", !error && "invisible")}
        >
          {error}
        </p>
      </div>
    </FormFieldContext.Provider>
  );
}
