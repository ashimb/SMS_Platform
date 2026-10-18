/** Shared class fragments so every interactive element looks and behaves the same. */

/** Visible focus for keyboard users only (WCAG 2.4.7 / 2.4.11); ≥ 3:1 ring colour. */
export const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

/**
 * Extends the tap area of a small control to 44x44 CSS px without changing how it looks (a
 * transparent pseudo-element reaches 12px further on every side). Add to the control's classes.
 */
export const touchHitArea = "relative after:absolute after:-inset-3 after:content-['']";

/**
 * Control height: 44px (the minimum touch target) by default, compact 40px only on wide screens
 * with a precise pointer. Touch laptops and tablets keep the 44px size.
 */
export const controlHeight = "h-11 md:pointer-fine:h-10";

/**
 * Text-field look shared by Input, Textarea, and the Select trigger. Text is 16px on phones and
 * touch devices (iOS zooms the page on focus when an input is smaller) and 14px with a mouse.
 */
export const fieldBase =
  "w-full rounded-md border border-border-strong bg-surface text-base md:pointer-fine:text-sm text-fg shadow-1 transition-[border-color,box-shadow] duration-(--sp-duration-fast) ease-standard placeholder:text-fg-subtle hover:border-neutral-400 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary-subtle focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-fg-subtle disabled:shadow-none aria-invalid:border-danger aria-invalid:focus-visible:ring-danger-subtle";
