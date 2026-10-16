# Deferred Work Register

Everything consciously left for later, per phase. Keep this file current: when a phase finishes,
add its section. When an item is done, move it to **Resolved** with the phase that resolved it.

Legend: 🔒 security-relevant · ⚙ ops/infra · 🧩 functional · 🧪 testing · 📦 size/performance.
"Target" is the recommended phase or trigger, not a commitment.

---

## Phase 1 — Monorepo root, tooling, infrastructure

| # | Item | Why deferred | Target |
|---|---|---|---|
| P1-01 ⚙ | **Validate `infra/nginx/nginx.conf` with `nginx -t` and run the Playwright edge smoke tests locally** (headers, 413, `/healthz`). Docker was not running during Phase 1. | Environment | Next time the stack is up (`make certs && docker compose up nginx`) |
| P1-02 ⚙ | Brotli compression is off: the official nginx image has no `ngx_brotli`. Config is ready but commented out. | Needs a custom or brotli-enabled image, or a CDN | Deployment phase |
| P1-03 🔒 | MinIO dev image is `pgsty/minio` (community build). The official `minio/minio` image is no longer published. | Upstream change | Re-evaluate (MinIO fork vs. Garage/SeaweedFS) before staging. Production uses managed S3. |
| P1-04 ⚙ | No buckets are auto-created in dev MinIO (`<prefix>-quarantine/private/public/exports`). | Belongs with the files module | Files module phase |
| P1-05 🔒 | nginx `ssl_stapling` and `set_real_ip_from` (load balancer CIDR) are commented placeholders. ACME certificate issuance isn't automated. | Needs real domain and infrastructure | Deployment phase |
| P1-06 🔒 | Edge nginx sends only a baseline CSP. **Portal: done in Phase 4** (the portal image sends a strict CSP with a per-response style nonce; see apps/portal/config/csp.ts). The website's nonce-based CSP is still to do. | Website not built | Website phase |
| P1-07 🔒 | Edge accepts any `Host` (default server). Unknown hosts are rejected by the API resolver, but nginx should return 444/421 for hosts outside the tenant domain list. | Domain list unknown | Deployment / multi-tenant phase |
| P1-08 ⚙ | `docker compose build` for the website was never run: no app code yet. (Portal image built and verified in Phase 4.) | Phase scope | Website phase |
| P1-09 ⚙ | GNU `make` isn't installed on the dev Windows machine. Makefile targets were not executed. | Environment | Install make (Git Bash/WSL) or use the documented raw commands |
| P1-10 🧪 | CI (`.github/workflows/ci.yml`) has never run on GitHub. No remote exists yet. Validated locally with actionlint only, without shellcheck. | No remote | First push |
| P1-11 🔒 | Container image scanning (Trivy/Grype), SBOM and image signing (FRD FR-SEC-041) are not in CI yet. Only npm-audit and pip-audit are. | Not requested in Phase 1 | Hardening phase, before staging |
| P1-12 🧪 | CI `e2e-smoke` only starts nginx until all three apps exist. No browser projects yet (chromium/mobile-safari are configured but unused). | Apps don't exist | Portal phase |
| P1-13 ⚙ | `pre-commit install` must be run by each developer (now possible: pre-commit 4.7.0 and uv are installed). | Developer action | Now |
| P1-14 ⚙ | Nothing is committed. `school-platform/` is its own git repo with no commits and no remote. | Awaiting go-ahead | Now |
| P1-15 ⚙ | The `docs/BRD_v1.md` and `docs/FRD_v1.md` placeholders get replaced once the drafts are approved (by decision, drafts are not copied). | BRD/FRD still drafts | After approval |

## Phase 2 — Backend foundation (`apps/api`)

### Security and auth

| # | Item | Why deferred | Target |
|---|---|---|---|
| P2-01 🔒 | **MFA recovery codes** (10 one-time codes, Argon2-hashed) are not generated. `TODO(auth hardening)` in `auth/service.py`. | Not in Phase 2 scope ("working skeleton") | Auth hardening phase |
| P2-02 🔒 | MFA is optional for every role. Mandatory MFA for privileged roles and staff (FRD FR-AUTH-001 A1, CNF-05), with enrolment forced at first login, is not enforced. | Needs role/policy config | Auth hardening |
| P2-03 🔒 | Step-up authentication for sensitive actions (FR-AUTH-009/FR-SEC-010) is not implemented. | Depends on sensitive endpoints existing | Auth hardening, plus each module that adds sensitive actions |
| P2-04 🔒 | Session/device list and revoke endpoints, "sign out everywhere" and new-device alerts (FR-AUTH-008) are missing. Data exists in `refresh_tokens`. | Scope | Auth hardening |
| P2-05 🔒 | Password reset, change password and invitation/activation flows (FR-AUTH-005/006/007) are missing. | Scope | Auth hardening |
| P2-06 🔒 | Parent/applicant OTP sign-in (FR-AUTH-002) and SMS-pumping protection (FR-SEC-004) are missing. | Needs SMS/WhatsApp providers | Notifications phase |
| P2-07 🔒 | Passkeys (WebAuthn) and staff SSO (OIDC) are v1.1 items. | v1.1 | v1.1 |
| P2-08 🔒 | The breached-password check uses a 16-entry built-in list. The FRD requires ≥ 100,000 entries, updated per release. | Data file sourcing | Auth hardening |
| P2-09 🔒 | Per-role session lengths (FRD §3.1) are missing. Refresh TTL is global (12 h), and there's no idle timeout or concurrent-session cap. | Needs role-aware session policy | Auth hardening |
| P2-10 🔒 | Signing-key rotation with `kid` headers (FR-SEC-005/029) is missing. Today there's a single Ed25519 key, with no `kid` and no overlap window. | Ops design | Before production |
| P2-11 🔒 | **Field-level encryption for C4 data** (envelope AES-256-GCM, blind indexes, FR-SEC-028) isn't built. Only TOTP secrets are encrypted (Fernet). Student health, identifiers and category fields were left out of the model on purpose until it exists. | Large piece; needs KMS decision | Before any C4 field is added (guardians/students extension) |
| P2-12 🔒 | Production DB grants are not created yet: **INSERT/SELECT only** on `audit_logs` and later on ledger and consent tables (FR-AUD-001 AC-2, FR-FIN-018). Today append-only is enforced by the ORM only. | Deployment concern | Deployment phase (init SQL / migration for grants) |
| P2-13 🔒 | Audit chain anchoring to WORM storage and a scheduled verifier with alerting (FR-AUD-003) are missing. `verify_chain()` exists and is tested. | Needs worker schedule and storage | Worker/ops phase |
| P2-14 🔒 | `FORWARDED_ALLOW_IPS="*"` in the API image must be narrowed to the edge network CIDR in production. | Network CIDRs unknown | Deployment phase |
| P2-15 🔒 | CSRF protection for cookie endpoints uses a custom-header check (`X-SP-CSRF: 1`), not the HMAC double-submit token in FRD FR-SEC-006. Equivalent against cross-site requests while CORS is closed, but it diverges from the FRD text. | Simpler, same protection while same-origin | Revisit if CORS is ever opened; update the FRD otherwise |
| P2-16 🔒 | **Access tokens are in the response body** (client memory), following the Master Rules. The FRD described access-token cookies. The FRD needs updating to match. | Decision follows Master Rules | FRD revision |
| P2-17 🔒 | Rate limiting is a fixed window (not sliding) with one auth limit for all auth endpoints. No per-account login limit beyond lockout, and no global tenant cap (FR-SEC-022 matrix). | Good enough for foundation | Hardening phase |
| P2-18 🔒 | Security-event alerting (FR-SEC-031/039: refresh reuse, tenant mismatch, enumeration) is missing. Events are only logged. | Needs monitoring stack | Ops/observability phase |
| P2-19 🔒 | Sentry init and scrubbing are written but untested against a real DSN. | No DSN | Ops phase |

### Tenancy and data

| # | Item | Why deferred | Target |
|---|---|---|---|
| P2-20 🧩 | `HostTenantResolver` exists, but there's no `tenant_domains` table or host map loader. `TENANT_RESOLUTION=host` rejects every host. | v1 is single tenant | Multi-tenant (v2) |
| P2-21 🧩 | Tenant settings are a free-form JSON column. The typed rule-parameter registry (FR-CFG-002) is missing. | Needs module rules first | Settings/config phase |
| P2-22 🧩 | **Cursor pagination** is the FRD default (§7.1), but only offset pagination is implemented. | Simpler for foundation | Before large lists (attendance, audit) |
| P2-23 🧩 | Optimistic locking (`version` column, `ETag`/`If-Match`, 409 `VERSION_CONFLICT`) is missing. | Scope | Next module phase (apply to all mutable records) |
| P2-24 🧩 | `Idempotency-Key` handling (FRD §7.1) is missing. Required for payments, attendance submit and notices. | No such endpoints yet | Attendance/fees phases |
| P2-25 🧩 | **Transactional outbox** for domain events. `TODO(outbox phase)` in `common/events.py`. Events currently dispatch in-process after commit, which is at-most-once. | Needs worker usage | Notifications phase |
| P2-26 🧩 | No cleanup job for expired or revoked `refresh_tokens` rows. Retention jobs (FR-SEC-037) in general are missing. | Worker schedule | Worker/privacy phase |
| P2-27 🧩 | Teacher section scoping (POL-02) and guardian child scoping (POL-03) in `StudentPolicy` are missing. Today it's tenant-wide for permission holders. | Needs teaching assignments and guardian links | Staff/guardians phases |
| P2-28 🧩 | Principal permissions are loaded from the DB on every request (two queries). No caching. | Correctness first | Performance pass (cache per session with invalidation on role change) |
| P2-29 🧩 | Student identity fields only. C4 field groups (health, Aadhaar/APAAR/PEN, category), documents, certificates and lifecycle transitions (FR-STU-001…008) are missing. | Needs field encryption (P2-11) and files module | Students extension |
| P2-30 🧩 | Custom roles, scoped role assignments, maker-checker and access reviews (FR-IAM-002…004) are missing. Only system roles are seeded. | Scope | IAM phase |
| P2-31 🧩 | The 14 skeleton modules are importable stubs with no models, routes or logic: notifications, files, guardians, staff, academics, timetable, attendance, exams, admissions, fees, communication, cms, reports, imports. | By design | Their respective phases |
| P2-32 🧩 | Data-principal rights, the consent ledger and the breach workflow (FR-SEC-032…039) are missing. | Privacy phase | Privacy phase (before go-live) |

### Ops, image and testing

| # | Item | Why deferred | Target |
|---|---|---|---|
| P2-33 📦 | **API image size.** About 132 MB compressed to pull or push, about 449 MB unpacked. Docker Desktop's `image ls` shows 581 MB because its containerd store keeps both. Biggest parts: the Debian + Python base (~135 MB, shared with every Python image) and the venv (~284 MB). The venv breaks down as: 75 MB precompiled bytecode, phonenumbers 46 MB (39 MB is geocoding data we don't use), botocore 30, fontTools 29 and Pillow 21 (both for WeasyPrint), SQLAlchemy 28, uvloop 16, cryptography 16. The PDF system libraries add 29 MB. Possible cuts, at about −40 to −120 MB: `phonenumberslite` instead of `phonenumbers`; skipping bytecode precompile (slower cold start); a separate PDF-worker image holding WeasyPrint, fontTools and Pango. | Works as is; trade-offs need a decision | When PDFs are built (report cards/receipts) or before production |
| P2-34 ⚙ | Indic (Devanagari) fonts are not in the image, so PDFs can't render Hindi names yet (FR-EXM-005 AC-2). | Report-card phase | Exams/fees PDF phase |
| P2-35 ⚙ | Dev logs are console format and JSON only outside development. The image was verified with `APP_ENV=development`; production-mode JSON output wasn't tested inside the container. | Low risk | Deployment phase |
| P2-36 ⚙ | `docker compose up` of the full dev stack (API + worker + MySQL + Redis + MinIO + Mailpit + nginx) has not been run end to end. The API image was verified standalone. | Needs portal/website images too | Portal phase |
| P2-37 🧪 | testcontainers prints its own `DeprecationWarning`s (wait strategies); they're filtered in pytest config. | Upstream | Remove the filter when testcontainers updates |
| P2-38 🧪 | pip-audit fails on *any* advisory, since it has no severity filter. That's stricter than "high/critical". Exceptions need `--ignore-vuln` plus an ADR. | Tool limitation | Policy decision when the first exception is needed |
| P2-39 🧪 | No load tests (k6, FRD §12.8) or DAST (ZAP) yet. | Needs a running stack | Hardening phase, before staging |
| P2-40 🧪 | The import-linter contracts were checked once with planted violations (both caught). There's no automated "contract self-test" in CI. | Low value vs. cost | Optional |

## Phase 3 — Shared packages (`packages/config`, `packages/ui`, `packages/api-client`)

### Tooling and versions

| # | Item | Why deferred | Target |
|---|---|---|---|
| P3-01 ⚙ | **TypeScript is held at 6.0.3**, although 7.0.2 is npm `latest`, because typescript-eslint 8.71 supports only TS <6.1. All workspaces declare `^6.0.3`. | Upstream | Upgrade when typescript-eslint supports TS 7 |
| P3-02 ⚙ | `eslint-plugin-jsx-a11y` doesn't support ESLint 10, so the config uses the maintained fork **`eslint-plugin-jsx-a11y-x`** (es-tooling). Its rules are the same, under the `jsx-a11y-x/` prefix. | Upstream | Switch back if the original adds ESLint 10 support |
| P3-03 ⚙ | Root `package.json` overrides `openapi-typescript`'s TypeScript peer (`^5`) to the workspace TS 6. Generation works and is verified. | Upstream peer range | Remove the override when openapi-typescript widens its peer |
| P3-04 ⚙ | The Next config (`tsconfig/next.json`) is untested: no Next app exists yet. | Phase scope | Portal/website phases |

### UI library

| # | Item | Why deferred | Target |
|---|---|---|---|
| P3-05 🧩 | DataTable: no sorting, filtering, row selection or column visibility. (Server pagination is in the portal's `shared/components/DataTable.tsx` wrapper since Phase 4.) | No screens need it yet | When a list needs sorting (API sort params first) |
| P3-06 🧩 | Missing components that screens will likely need: Combobox/async search, DatePicker (with Indian DD/MM/YYYY format), RadioGroup, Pagination, Breadcrumbs, Alert/Banner, Popover, FileUpload (with the files module), side navigation/app shell. | Not in the phase list | Portal phase, as screens need them |
| P3-07 📦 | Fonts are not self-hosted: the stacks name Inter / Noto Sans / Noto Sans Bengali / Noto Sans Devanagari, but no font files ship, so browsers fall back to system fonts. See P4-14. | Belongs to app delivery (CSP `font-src 'self'`) | Website phase (self-host with `@fontsource-variable/*` or files under `/fonts`) |
| P3-08 🧪 | In jsdom, axe runs with `color-contrast` and `region` disabled (see `src/test/a11y.ts`). Real-browser contrast is checked only manually through the Storybook a11y panel. | jsdom can't compute layout or colour | Add the Storybook test runner / `@storybook/addon-vitest` (browser mode) or Playwright + axe over Storybook in CI |
| P3-09 🧪 | No visual regression tests (Chromatic/Playwright screenshots). | Cost/tooling decision | Before the first design freeze |
| P3-10 🧪 | CI runs `npm test` (which covers `test:unit` for ui and api-client) but neither builds Storybook nor runs `tokens:check` as separate steps. `ui build` does run `tokens:check`. | Keeps CI fast for now | Add a `build-storybook` job when P3-08 lands |
| P3-11 🧩 | Tenant theming covers the primary colour, fonts and logo only. Secondary/accent colours, per-tenant radius and favicon aren't supported. FRD FR-TEN-002 doesn't require more. | Not required | Only on a confirmed tenant request |
| P3-12 🔒 | The tenant settings API doesn't yet store or validate brand colours server-side. The client validator must be mirrored in the API (same WCAG checks) so a bad colour can't be saved through the API directly. | Tenant settings endpoints are Phase 2 skeleton | Tenant admin phase |
| P3-14 🧩 | UI-kit components keep English default strings (e.g. "Loading", "Close") with override props. The portal passes translated labels (i18next, en + bn, since Phase 4); any remaining defaults are English. | Kit stays i18n-agnostic | Audit remaining defaults when the website adopts i18n |

### API client

| # | Item | Why deferred | Target |
|---|---|---|---|
| P3-15 🧪 | `src/generated/schema.d.ts` is committed and was generated from the Phase 2 API (15 paths). Nothing in CI checks that it matches the current API. | Needs the API running in CI | CI: start the API, run `npm run gen`, fail on diff (or export `openapi.json` from FastAPI without a server) |
| P3-16 🔒 | No request timeouts or `AbortSignal` defaults, and no retry/backoff for network errors (only the single 401 retry). | Keep minimal | Portal phase (timeouts per call type) |
| P3-17 🔒 | No cross-tab coordination: two tabs refreshing at the same moment can each rotate the cookie, which reuse detection may treat as theft. | Needs a decision (BroadcastChannel / Web Locks) | Portal phase, before multi-tab testing |

## Phase 4 — Portal (`apps/portal`)

### API contract gaps (the portal is ahead of the API)

| # | Item | Why deferred | Target |
|---|---|---|---|
| P4-01 🔒 | `POST /auth/password/forgot` and `/auth/password/reset` (FRD FR-AUTH-005) don't exist in the API. The portal pages are built to the FRD contract (`src/lib/pending-api.ts`) and served by MSW in dev and tests. In production, forgot-password still shows its neutral message; reset shows the generic error. | API: auth hardening (P2-05) | Auth hardening: implement, regenerate the api-client, delete the entries from `pending-api.ts` |
| P4-02 🧩 | `GET /dashboards/{role}` (FRD §8, FR-RPT-001) doesn't exist. The payload shapes in `features/dashboard/schemas.ts` are the portal's **proposal** and need agreeing with the API (user: later, not before the reports phase is planned). Until then dashboards show a designed "almost ready" state (404) with quick actions. | Needs attendance/fees/exams data | Reports phase (agree the contract first) |
| P4-03 🧩 | Tenant branding: `GET /tenant` returns only `slug` and `name`. Brand colour, logo and font (FR-TEN-002) aren't exposed, so the portal uses the default tokens. `brandingFromTenant()` is the single place to map them. | API scope | Tenant settings/branding phase |
| P4-04 🧩 | There's no parent/guardian role in the API. The parent layout and dashboard are tested with mocks only. | Guardians module | Guardians phase |
| P4-05 🔒 | Not in the UI: MFA enrolment-required flow (FR-AUTH-003), recovery-code entry, role-context picker for multi-role users (FR-AUTH-010), session list / "sign out everywhere", parent OTP sign-in. | API lacks them (P2-01/02/04/06) | Auth hardening / notifications |

### Security and sessions

| # | Item | Why deferred | Target |
|---|---|---|---|
| P4-06 🔒 | The idle timeout is client-side, one global value (60 min, warning at T-2 min). Per-role values (ACC 30 min) and server-side idle enforcement are missing (P2-09). Activity isn't shared across tabs, so an idle tab can sign out a busy one. | Needs role session policy | Auth hardening (BroadcastChannel for activity + P3-17) |
| P4-07 🔒 | Edge rate limit `req_auth` (10 r/min, burst 5) also covers `/auth/refresh` and `/auth/me`. Several reloads or tabs in a minute can get 429 and look like a sign-out. | Needs a separate, higher zone | Hardening (separate zone for refresh/me) |
| P4-08 🔒 | No CSP violation reporting (`report-to`/`report-uri`): violations show only in the browser. | Needs a collector endpoint | Ops/observability phase |
| P4-09 🔒 | `eslint-plugin-security` was not added (optional in the spec). Its object-injection rule is very noisy in TS. The shared config already bans eval, `javascript:` URLs and `dangerouslySetInnerHTML`. | Noise vs value | Revisit with semgrep in CI |
| P4-10 🔒 | `dompurify`, `@tiptap/*` and `@dnd-kit/*` are installed (per the spec) but unused. Any future HTML rendering (CMS) must go through a DOMPurify-based `SafeHtml` component, because `dangerouslySetInnerHTML` stays banned. | CMS/timetable not built | CMS and timetable phases |

### UX, i18n and features

| # | Item | Why deferred | Target |
|---|---|---|---|
| P4-11 🧩 | 13 modules are designed "coming soon" pages: guardians, staff, academics, timetable, attendance, exams, admissions, fees, communication, cms, reports, settings, audit. The audit log and tenant settings have API endpoints already. | Phase scope | Their module phases |
| P4-12 🧩 | Students: no archive/soft-delete UI (no API endpoint), no status transitions, no sorting (no API sort parameter), no C4 field groups (P2-29). | API scope | Students extension |
| P4-13 🧩 | Bengali (and English) copy is AI-drafted and needs native review. Decided: Bengali screens use Latin digits (`bn-IN-u-nu-latn`); the spec said Hindi, and the user chose Bengali as the second language. | Review scheduled later (user decision) | Before UAT |
| P4-14 📦 | Fonts are still not self-hosted (P3-07). The stacks now include Noto Sans Bengali. Without font files, browsers use system fonts (Nirmala UI / Noto on most devices). | Licensing/size decision | Website phase (shared font delivery) |
| P4-15 🧩 | Offline: the service worker serves an offline page only. Offline attendance with an encrypted queue (FR-ATT offline flow) is not built. | Attendance module | Attendance phase |
| P4-16 ⚙ | In dev with `VITE_API_MOCKING=all`, the mock "refresh cookie" is in memory, so a page reload signs you out. This is intentional: mocks never write cookies or storage. | By design | — |

### Testing and performance

| # | Item | Why deferred | Target |
|---|---|---|---|
| P4-17 🧪 | No Playwright E2E for portal flows (sign-in, students CRUD) against the real API. Coverage today is component/page tests with MSW plus a manual real-browser CSP check. | Needs the full stack in CI (P1-12) | E2E phase / when the stack runs in CI |
| P4-18 📦 | Lighthouse ran against the **standalone portal image** (no API, so the refresh call gets a 405). Mobile performance is 82–83 (FCP ~3.2 s on simulated slow 4G). The floor is about 205 KB gzipped of initial JS/CSS (React + router about 96 KB). Options: lazy-load the toaster/tooltip providers, trim the `ui` barrel. No Lighthouse CI budget yet. | Good enough for MVP; needs a decision | Hardening (add Lighthouse CI with budgets on staging) |
| P4-19 🧪 | Page tests need a 10 s async timeout. The first render in each worker pays for cold Vite transforms of lazy pages, which flaked at the 1 s default. Not representative of app speed. | Test infrastructure | Optional: warm-up or browser mode |
| P4-20 ⚙ | `husky` + `lint-staged` were **not** installed. pre-commit (Phase 1) already runs prettier/eslint/commitlint on staged files. husky sets `core.hooksPath`, which would silently disable the pre-commit hooks. | Conflicting tools | Keep pre-commit (decision needed only if the team prefers husky) |

---

## Resolved

| # | Item | Resolved in |
|---|---|---|
| P3-13 | Apps now compile workspace packages from source through a `"source"` export condition (Vite `resolve.conditions`, TS `customConditions`), so there's no stale `dist/` or build-order coupling. | Phase 4 |
| — | UI kit: `Input`/`Select`/… dropped their own `id` and `aria-describedby` when used outside `<FormField>`, so a plain `<label htmlFor>` couldn't name them (axe `button-name`). Fixed in `useFormField`, with a test. | Phase 4 |
| — | Composite tenant foreign keys `(tenant_id, x_id) → parent(tenant_id, id)` on `user_roles`, `role_permissions`, `refresh_tokens`, with `UNIQUE (tenant_id, id)` on `users` and `roles`. Enforced by MySQL and covered by tests: a metadata rule plus raw-SQL cross-tenant inserts that MySQL rejects. | Phase 2 (follow-up) |
| — | Bandit false positive in `UserService.activate_mfa`: refactored so no `nosec` is needed. | Phase 2 (follow-up) |
