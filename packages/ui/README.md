# @school-platform/ui

Design tokens, per-tenant theming and accessible React components for the portal and the
public website. Built on Radix primitives, `class-variance-authority` and Tailwind CSS v4.

```bash
npm run tokens            # regenerate src/styles/{tokens,theme}.css from src/tokens/index.ts
npm run build             # tokens:check, then tsc to dist/ and copy the CSS
npm run test:unit         # Vitest + Testing Library + axe (jsdom)
npm run storybook         # http://localhost:6006 (theme and brand switchers in the toolbar)
npm run build-storybook   # static build in storybook-static/
```

## Visual direction

The aim is calm, premium software that a principal, a teacher on a phone and a parent with a
basic Android device all find clear. Every choice below serves legibility first.

- **Restraint.** Neutral surfaces carry the layout. The brand colour is reserved for primary
  actions, links, focus and selection, so a tenant's colour signals "act here" and never fights
  the content.
- **Cool neutrals, soft depth.** A slightly cool grey ramp (`neutral-0…950`) and layered,
  low-opacity shadows (`shadow-1…4`) instead of heavy borders. Raised surfaces (cards, menus,
  dialogs) get depth; flat content stays flat.
- **Typography.** Inter (falling back to Noto Sans and Noto Sans Devanagari, so Hindi names render)
  with tight tracking on headings and a 14–16 px body. Numbers in stats and tables use tabular
  figures.
- **Rounded, but not playful.** `radius-md` (8 px) for controls and `radius-lg`/`xl` for surfaces.
- **Purposeful motion.** Short fades and scale-ins (120–240 ms, standard/emphasised easing) on
  overlays and empty states only. With `prefers-reduced-motion`, every duration becomes 0 ms.
- **Dark mode is designed, not inverted.** Dark surfaces step up in lightness as they rise, and
  dark shadows are deeper. Brand text uses lighter steps (300/400) so it still passes contrast.
- **States are first-class.** Every data view has loading (skeleton), empty (EmptyState with a
  next action) and error states. Destructive actions use the danger variant and confirm in a
  Dialog.

## Tokens

`src/tokens/index.ts` is the single source of truth. `scripts/build-tokens.ts` turns it into:

- `styles/tokens.css`: runtime CSS variables (`--sp-*`) for light, dark (`[data-theme="dark"]` or
  the OS preference) and reduced motion;
- `styles/theme.css`: a Tailwind v4 `@theme inline` mapping, so utilities such as `bg-surface`,
  `text-fg-muted`, `bg-primary` and `shadow-2` resolve to those variables. Default Tailwind
  colours are removed on purpose, so off-palette colours fail the build instead of shipping.

Both files are generated, so don't edit them; `npm run build` fails when they are stale.

Use the **semantic roles** (`bg`, `surface`, `fg`, `fg-muted`, `border`, `primary`,
`primary-fg`, `danger`, …) in app code. Raw scales (`primary-600`, `neutral-200`) are for the
component library.

### Consuming the styles

Tailwind v4 apps import the shared entry, which includes the tokens, the theme and a `@source`
over this package:

```css
@import "@school-platform/config/tailwind/app.css";
```

Apps still on a JS config can use `@school-platform/ui/tailwind-preset`. Plain CSS can use
`@school-platform/ui/styles/tokens.css` on its own.

## Tenant theming

```ts
import { applyTenantTheme, validateBrandColor } from "@school-platform/ui";

const report = applyTenantTheme({ primaryColor: "#38bdf8", font: "nunito-sans", logoUrl: "/logo.svg" });
report.brand?.corrected; // true: #38bdf8 was darkened to #047da9 for 4.5:1 white button text
report.issues;           // anything rejected (bad font key, unsafe logo URL, …)
```

- Only brand tokens change: the primary scale, on-primary text, fonts and the logo.
- `validateBrandColor(hex, mode)` checks white button text on 600, link text on white,
  the focus ring (3:1) and the dark-mode link and ring.
  - `"auto-correct"` (default) darkens or lightens the failing steps in OKLCH until each passes.
  - `"reject"` reports failures and changes nothing; use it in the tenant settings form to show
    the admin why a colour was adjusted.
- Inputs are treated as untrusted:
  - colours must be hex and are re-serialised;
  - fonts come from an allow-list (`FONT_STACKS`);
  - logo URLs must be `https://` or root-relative and are percent-encoded inside `url("…")`.
- For SSR, use `buildTenantTheme()` and `tenantThemeToCss()`, then inline the CSS with the
  request's CSP nonce.

## Components

| Group | Components |
|---|---|
| Actions | Button (primary, secondary, ghost, danger, link; `loading`; `asChild`), DropdownMenu |
| Forms | FormField (label, hint, error and required wiring), Input, Textarea (`showCount`), Select, Checkbox (indeterminate), Switch |
| Display | Badge, Card, Avatar, Skeleton, Spinner, StatCard, PageHeader, EmptyState |
| Overlays | Dialog, Sheet (right/left/bottom), Tooltip, Toast (`Toaster` + `toast`) |
| Navigation | Tabs |
| Data | DataTable (TanStack Table v9: caption, loading, error and empty states) |

### Accessibility rules the components enforce

- Every control gets its accessible name, description and error from `FormField`, linked through
  `aria-describedby`, `aria-invalid` and `aria-required`. Errors are text, never colour alone.
- Visible `:focus-visible` rings on everything interactive, with a 3:1 contrast check per tenant.
- Radix supplies keyboard support, focus trapping and return, and correct ARIA roles. Dialog and
  Sheet require a `title`.
- Buttons are 40 px tall by default (`md`) and 48 px on `lg`; use `sm` (32 px) only in dense desktop toolbars. A loading button sets `aria-busy` and keeps
  its label for screen readers.
- `dangerouslySetInnerHTML` is banned by the shared ESLint config.

### Tests

Every component has Vitest tests that render it and run axe through `expectNoA11yViolations`.
Two axe rules are off in jsdom, for documented reasons (see `src/test/a11y.ts`):

- `color-contrast`: jsdom has no layout or computed colours. Contrast is covered by the token
  and brand validator tests, and by the Storybook a11y addon in a real browser.
- `region`: components are rendered in isolation, without page landmarks.

Storybook runs axe on every story (`a11y.test: "error"`).
