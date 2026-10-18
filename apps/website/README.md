# @school-platform/website

The public school website: Next.js (App Router, TypeScript strict, Tailwind v4 with the shared
design tokens). Pages are static with ISR and are purged on demand when content is published.

## Run

```bash
cp apps/website/.env.example apps/website/.env.local
npm run dev -w apps/website            # http://localhost:3000, fixture content
npm run build -w apps/website && npm run start -w apps/website
```

Checks: `npm run typecheck`, `npm run lint`, `npm run test:unit` and `npm run build`, each with
`-w apps/website`.

## How it is built

| Area | Where | Notes |
|---|---|---|
| Content | `src/lib/cms-client.ts`, `cms-types.ts`, `cms-fixtures.ts` | Typed, zod-validated responses. `WEBSITE_DATA_SOURCE=mock` (default) serves fixtures until the API's cms module exists; `api` reads `/api/public/v1/...` |
| Blocks | `src/components/blocks/` | `BlockRenderer` + a registry typed per block type (hero, rich-text, image, gallery, cta, faq, columns). Adding a block type to the schema without a renderer is a compile error |
| Rich text | `src/components/security/SafeHtml.tsx`, `src/lib/sanitize.ts` | The only `dangerouslySetInnerHTML` sink (ESLint bans it elsewhere); DOMPurify allow-list, tested with XSS payloads |
| Theming | `src/lib/theme.ts`, `app/layout.tsx` | The tenant's brand colour, font and logo become CSS variables rendered into `<head>` on the server: no flash of unbranded content |
| Enquiry form | `components/enquiry/EnquiryForm.tsx`, `app/api/enquiry/route.ts` | React Hook Form + the same zod schema on both sides; honeypot, `X-SP-CSRF` header + same-origin check, rate limit, 8 KB cap, no PII in logs or responses |
| Revalidation | `app/api/revalidate/route.ts`, `src/lib/signature.ts` | HMAC-SHA256 over `timestamp.body`, constant-time compare, 5-minute window, tag/path allow-lists; refuses everything while `REVALIDATE_SECRET` is unset |
| SEO | `src/lib/seo.ts`, `app/sitemap.ts`, `app/robots.ts` | Metadata API, Open Graph, `EducationalOrganization` JSON-LD via `schema-dts` |
| Headers | `config/security-headers.mjs`, `next.config.mjs` | CSP, HSTS, `frame-ancestors`, referrer and permissions policies, `poweredByHeader: false`, strict `images.remotePatterns` (`WEBSITE_MEDIA_HOSTS`) |
| UI kit | `src/components/ui.tsx` | `@school-platform/ui` is imported only through this `"use client"` boundary (the kit creates React context at import time, which server components cannot evaluate) |

### Why the CSP is not nonce-based

A per-request nonce forces dynamic rendering of every page, which disables ISR and CDN caching.
The policy is static and strict apart from `'unsafe-inline'` for scripts and styles. See
`docs/DEFERRED.md` P5-01.

### Publishing content (webhook)

```bash
body='{"tags":["cms:notices"],"paths":["/notices"]}'
ts=$(date +%s)
sig="sha256=$(printf '%s.%s' "$ts" "$body" | openssl dgst -sha256 -hmac "$REVALIDATE_SECRET" -hex | sed 's/^.* //')"
curl -X POST https://localhost/api/revalidate -H "X-SP-Timestamp: $ts" -H "X-SP-Signature: $sig" \
     -H 'Content-Type: application/json' -d "$body"
```

Tags: `cms`, `cms:site`, `cms:home`, `cms:notices`, `cms:notice:<slug>`, `cms:events`,
`cms:event:<slug>`, `cms:gallery`, `cms:pages`, `cms:page:<slug>`.

### Placeholder art

`node apps/website/scripts/generate-images.mjs` regenerates `public/images/*.jpg` (deterministic).

## Full-stack E2E

```bash
cp .env.example .env && bash infra/scripts/dev_certs.sh
E2E="-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.e2e.yml"
docker compose $E2E up -d --build --wait mysql redis api portal website nginx
docker compose $E2E run --rm api alembic upgrade head
docker compose $E2E run --rm api python -m scripts.seed_e2e
E2E_IGNORE_HTTPS_ERRORS=1 npx playwright test --grep @smoke      # from e2e/ (or npm run test:e2e:smoke)
```

Website only (no API): build, start with `SITE_URL=http://localhost:3100 npx next start -p 3100`,
then `E2E_WEBSITE_ONLY=1 E2E_BASE_URL=http://localhost:3100 npx playwright test tests/cms tests/admissions`.
