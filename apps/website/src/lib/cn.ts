/** Join class names, skipping falsy values. (Tailwind conflicts are avoided by construction.) */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
