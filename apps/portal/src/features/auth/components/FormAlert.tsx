import { CircleAlert, CircleCheck, Info } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";

import { cn } from "@/shared/utils/cn.ts";

const TONES = {
  error: {
    icon: CircleAlert,
    className: "border-danger-200 bg-danger-subtle text-danger-subtle-fg dark:border-danger-800",
  },
  success: {
    icon: CircleCheck,
    className:
      "border-success-200 bg-success-subtle text-success-subtle-fg dark:border-success-800",
  },
  info: {
    icon: Info,
    className: "border-info-200 bg-info-subtle text-info-subtle-fg dark:border-info-800",
  },
} as const;

/**
 * Form-level message. Errors take focus when they appear (FRD: "focus moves to banner") and are
 * announced; info/success messages are announced politely.
 */
export function FormAlert({
  tone,
  children,
  focusKey,
}: {
  tone: keyof typeof TONES;
  children: ReactNode;
  /** Change it to move focus again (e.g. per submit attempt). */
  focusKey?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (tone === "error") ref.current?.focus();
  }, [tone, focusKey]);
  const { icon: Icon, className } = TONES[tone];
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-3 rounded-lg border p-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-1">{children}</div>
    </div>
  );
}
