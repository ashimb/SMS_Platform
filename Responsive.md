# RESPONSIVE / MOBILE-FIRST STANDARD (applies to the React portal, Next.js website, and packages/ui)

Parents and teachers will mostly use phones. Every screen shall work flawlessly from 320px wide upward. Design mobile-first, then enhance for larger screens.

## Breakpoints and layout
- Use Tailwind's default breakpoints as the single source of truth (sm 640, md 768, lg 1024, xl 1280, 2xl 1536). Write base styles for mobile, then add `sm:`/`md:`/`lg:` overrides. Never use max-width media queries as the primary approach.
- Use fluid spacing and typography (`clamp()`-based type scale tokens), CSS grid/flex, and container queries (`@container`) for components that live in variable-width parents (cards, stat tiles, data views).
- No horizontal page scroll at any width from 320px to 1920px. Wide content (tables, code, charts) scrolls inside its own `overflow-x-auto` container, never the page body.
- Use `min-h-dvh` / `100dvh` (not `100vh`) for full-height layouts so mobile browser toolbars do not break them.
- Respect safe areas: `viewport-fit=cover` plus `env(safe-area-inset-*)` padding on fixed headers, bottom navigation, and sticky action bars (iOS notch / home indicator, Android gesture bars).
- Required viewport meta: `width=device-width, initial-scale=1, viewport-fit=cover`. Never disable user zoom.

## Touch and interaction
- Minimum touch target 44x44 CSS px (WCAG 2.2 target size), with at least 8px spacing between adjacent targets.
- Form inputs use font-size >= 16px on mobile to prevent iOS zoom-on-focus; use correct `inputmode`, `type`, `autocomplete`, and `enterkeyhint` attributes (tel, email, numeric, one-time-code, etc.).
- Hover-only interactions are forbidden; every hover affordance needs a tap/focus equivalent. Use `@media (hover: hover)` for hover styles.
- Sticky primary action bars on long mobile forms; keyboards must not hide the focused field (scroll into view).
- Respect `prefers-reduced-motion`, `prefers-color-scheme`, and `prefers-contrast`.

## Navigation patterns
- Portal: desktop = collapsible sidebar; tablet = icon rail or drawer; mobile = bottom navigation (max 5 items) plus a "More" sheet, and a compact sticky header. Role-specific items.
- Website: desktop = horizontal mega/simple menu; mobile = full-screen accessible menu sheet with focus trap, ESC to close, and scroll lock; sticky "Apply / Enquire" CTA on mobile.
- Dialogs become bottom sheets/drawers on mobile (swipe/tap-outside to dismiss) and centered modals on desktop. Dropdowns become native-feeling sheets on mobile.

## Data-heavy UI on small screens
- Tables: provide a responsive DataTable that renders as a stacked card list on mobile (key fields visible, the rest in an expandable section or detail view) and a full table from `md` up. Never ship a table that requires pinch-zoom.
- Filters collapse into a "Filters" sheet on mobile with an active-filter count chip. Search stays always visible.
- Forms are single-column on mobile, multi-column from `md`; multi-step wizards for long forms (admission application) with progress indicator and draft save.
- Charts resize to container, simplify on small screens (fewer ticks, legends below), and offer a tabular alternative for accessibility.
- Dashboards: stat cards reflow 1 -> 2 -> 4 columns; quick actions are thumb-reachable at the bottom on mobile.

## Media and performance
- Responsive images (`srcset`/`sizes` or `next/image` with correct `sizes`), explicit width/height to prevent layout shift, lazy loading below the fold, modern formats (AVIF/WebP).
- Mobile performance budget on a mid-range Android on throttled 4G: LCP < 2.5s, INP < 200ms, CLS < 0.1; initial JS for the portal login route as small as practical (route-level code splitting, lazy heavy libs like charts/editor).
- Fonts: subset, `font-display: swap`, system-font fallback stack; limit to 2 families.

## Definition of done for ANY screen
A screen is not done until it has been verified at 320, 375, 414, 768, 1024, 1440 px (portrait and landscape for phones), in light and dark mode, with no horizontal overflow, no clipped content, usable touch targets, and correct empty/loading/error states. Add or update Playwright viewport tests accordingly.