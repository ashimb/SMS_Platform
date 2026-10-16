# @school-platform/portal

The School Management System portal: a Vite + React SPA for office staff, the principal,
teachers and parents. It is served at `portal.<domain>`, with the API at `/api` on the same
origin.

```bash
npm run dev -w apps/portal          # http://localhost:5173 (API mocked by MSW by default)
npm run test -w apps/portal         # Vitest + Testing Library + MSW + axe
npm run typecheck -w apps/portal
npm run build -w apps/portal        # tsc + vite build -> apps/portal/dist (+ service worker)
npm run preview -w apps/portal      # serve dist with the production CSP (nonce per response)
```

## Configuration

`.env.example` documents the variables. None of them are secrets.

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_MOCKING` | `all` (dev only) | `all`: mock every endpoint. `pending`: mock only the endpoints the API lacks. `off`: use the real API. Production builds never include MSW. |
| `API_PROXY_TARGET` | `http://127.0.0.1:8000` | Where the dev server proxies `/api`, keeping the same origin so the refresh cookie works. |

Mock sign-ins (dev and tests) use the password `Correct-Horse-9`:

- `admin@school.test`: admin
- `principal@school.test`: admin, with MFA code `123456`
- `teacher@school.test`: teacher
- `parent@school.test`: parent
- `viewer@school.test`: an account with no portal role

## Structure

```
src/
  main.tsx            boot: reset-token capture, theme, i18n, silent sign-in, render
  app/                App, providers, router, guards/, layouts/ (Admin/Teacher/Parent/Auth), pages/ (403/404)
  features/<module>/  api/ · components/ · pages/ · schemas.ts · types.ts · index.ts
  shared/             components (DataTable, PageHeader, EmptyState, ErrorBoundary, Can, …), hooks, utils, constants
  lib/                api.ts, auth-store.ts, query-client.ts, i18n.ts, theme.ts, pending-api.ts
  locales/{en,bn}/    lazy-loaded namespaces: common, auth, dashboard, students, features
  test/               setup, MSW handlers and fixtures, render helpers
config/               CSP and PWA options (shared by Vite, nginx and the tests)
```

`features/students` is the reference implementation. It shows the whole pattern: a query-key
factory, list and detail queries, mutations that keep the cache in sync, URL-driven filters,
Zod schemas that mirror the API's rules, and 409/422 errors mapped back onto form fields.
Thirteen other modules are designed "coming soon" pages, so navigation is complete.

## Security model

- **Tokens.**
  - The access token and the signed-in user live in memory only (the Zustand store in
    `lib/auth-store.ts`). They are never written to web storage, cookies or IndexedDB, and the
    tests assert this.
  - The refresh token is the API's `HttpOnly; Secure; SameSite=Strict` cookie. On load, the app
    signs in silently through it.
  - Refresh is single-flight: the load-time refresh, "Stay signed in" and every 401 retry share
    one request.
  - If a refresh fails, the user is signed out everywhere in the app and all cached school data
    is removed from memory.
- **Guards and `<Can>`** only shape what the UI shows. The API authorizes every request itself.
- **CSP.**
  - Scripts are same-origin only: there are no inline scripts and no `eval`, and Zod runs
    jitless.
  - Styles allow same-origin files plus a per-response nonce. nginx writes the nonce into
    `index.html`, and `public/csp-nonce.js` stamps it on the `<style>` elements that libraries
    create at runtime.
  - The policy lives in `config/csp.ts`. A test keeps nginx in sync with it.
- **Password-reset links.** The token is moved out of the URL into memory before the app makes
  any request, and the reset page sets `Referrer-Policy: no-referrer`.
- **PWA.** The service worker precaches static assets and an offline page only. `index.html` and
  every `/api` response are never cached. Updates wait for the user to reload.
- **No user enumeration.** Sign-in and forgot-password show the same message whether or not an
  account exists.
- **Redirects.** `?next=` only accepts same-app paths, which blocks open redirects.

## Internationalisation

English is the default, and Bengali (`bn`) is the second language. Namespaces load lazily, one
chunk per language and namespace. Dates and money use `en-IN` / `bn-IN`, always with Latin digits
(0–9).

## Accessibility

The target is WCAG 2.2 AA:

- Pages are tested with axe, with landmarks checked (only colour contrast is skipped in jsdom).
- There's a skip link, focus moves to `<main>` after navigation, and form errors are announced
  and linked to their fields.
- The command palette (Ctrl/⌘+K) follows the ARIA combobox pattern, and motion respects
  `prefers-reduced-motion`.
- Lighthouse scores the sign-in page 100 for accessibility.
