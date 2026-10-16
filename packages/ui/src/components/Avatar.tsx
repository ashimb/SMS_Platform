import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/cn.ts";

const avatarVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-subtle font-semibold text-primary-subtle-fg ring-2 ring-surface select-none",
  {
    variants: {
      size: {
        xs: "size-6 text-[0.625rem]",
        sm: "size-8 text-xs",
        md: "size-10 text-sm",
        lg: "size-14 text-lg",
        xl: "size-20 text-2xl",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  /** Person's name: used for the alt text and the initials fallback. */
  name: string;
  src?: string | undefined;
  className?: string;
}

/** First letter of the first and last word ("Priya Sharma" -> "PS"); works for Indic scripts. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0] ? (Array.from(words[0])[0] ?? "") : "";
  const lastWord = words.length > 1 ? (words[words.length - 1] ?? "") : "";
  const last = lastWord ? (Array.from(lastWord)[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function Avatar({ name, src, size, className }: AvatarProps) {
  return (
    <AvatarPrimitive.Root className={cn(avatarVariants({ size }), className)}>
      {src ? (
        <AvatarPrimitive.Image src={src} alt={name} className="size-full object-cover" />
      ) : null}
      <AvatarPrimitive.Fallback {...(src ? { delayMs: 300 } : {})} aria-label={name} role="img">
        <span aria-hidden="true">{initials(name)}</span>
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
