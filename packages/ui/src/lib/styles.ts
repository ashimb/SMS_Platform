/** Shared class fragments so every interactive element looks and behaves the same. */

/** Visible focus for keyboard users only (WCAG 2.4.7 / 2.4.11); ≥ 3:1 ring colour. */
export const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

/** Text-field look shared by Input, Textarea, and the Select trigger. */
export const fieldBase =
  "w-full rounded-md border border-border-strong bg-surface text-sm text-fg shadow-1 transition-[border-color,box-shadow] duration-(--sp-duration-fast) ease-standard placeholder:text-fg-subtle hover:border-neutral-400 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary-subtle focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-fg-subtle disabled:shadow-none aria-invalid:border-danger aria-invalid:focus-visible:ring-danger-subtle";
