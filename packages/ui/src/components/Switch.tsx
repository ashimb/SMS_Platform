import * as SwitchPrimitive from "@radix-ui/react-switch";
import { type ComponentProps, type ReactNode, useId } from "react";

import { cn } from "../lib/cn.ts";
import { focusRing } from "../lib/styles.ts";

/** The 24px-tall track gets a 44px-tall tap area (it is already 44px wide). */
const switchHitArea = "after:absolute after:-inset-x-px after:-inset-y-3 after:content-['']";
import { useFormField } from "./FormField.tsx";

export interface SwitchProps extends ComponentProps<typeof SwitchPrimitive.Root> {
  label?: ReactNode;
  description?: ReactNode;
}

/** On/off toggle for settings that apply immediately (role="switch", Space/Enter toggle). */
export function Switch({ label, description, className, id, ...props }: SwitchProps) {
  const generated = useId();
  const field = useFormField({ id });
  const switchId = field.id ?? id ?? `switch-${generated}`;
  const descriptionId = description ? `${switchId}-description` : undefined;
  const describedBy = [field["aria-describedby"], descriptionId].filter(Boolean).join(" ");

  const control = (
    <SwitchPrimitive.Root
      id={switchId}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-neutral-300 shadow-inner transition-colors duration-(--sp-duration-base) ease-standard",
        "disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary dark:bg-neutral-700",
        switchHitArea,
        focusRing,
        className,
      )}
      {...(describedBy ? { "aria-describedby": describedBy } : {})}
      {...(field.disabled ? { disabled: true } : {})}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-5 translate-x-0.5 rounded-full bg-white shadow-2 transition-transform duration-(--sp-duration-base) ease-emphasized data-[state=checked]:translate-x-5.5" />
    </SwitchPrimitive.Root>
  );

  if (!label) return control;
  return (
    <div className="flex min-h-11 items-center justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <label htmlFor={switchId} className="cursor-pointer text-sm font-medium text-fg">
          {label}
        </label>
        {description ? (
          <p id={descriptionId} className="text-xs text-fg-muted">
            {description}
          </p>
        ) : null}
      </div>
      {control}
    </div>
  );
}
