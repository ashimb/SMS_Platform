# SchoolPlatform

A school website with a CMS, plus a School Management System portal for admins, teachers, parents
and students. It launches for one school, and the data model is built so it can become
multi-tenant SaaS later.

> **Status:** Phase 2 — backend foundation in `apps/api` (see [apps/api/README.md](apps/api/README.md)).
> `apps/portal`, `apps/website` and the shared `packages/*` are built in later phases.

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Docker Engine / Desktop with Compose v2 | Compose ≥ 2.20 | Uses `depends_on.required` |
| Node.js + npm | Node 24 LTS, npm ≥ 11 | Workspaces for the portal, website, packages and e2e |
| uv | latest | Python tooling for `apps/api` (manages the venv and lockfile) |
| pre-commit | ≥ 4.0 | `pipx install pre-commit` or `uv tool install pre-commit` |
| GNU make, bash, openssl | any recent | On Windows, use Git Bash or WSL |

## Quick start

```bash
cp .env.example .env          # then replace every change-me value
npm ci                        # JS tooling (eslint, prettier, commitlint, playwright)
pre-commit install            # pre-commit + commit-msg hooks
make certs                    # self-signed TLS cert for localhost / portal.localhost / www.localhost
make up                       # build and start the dev stack (needs the apps from later phases)
make migrate && make seed     # database schema + default tenant (from the API phase)
```

| Dev URL | What |
|---|---|
| https://www.localhost | Public website (via nginx) |
| https://portal.localhost | Portal SPA (via nginx) |
| https://portal.localhost/api/ | API (via nginx); also http://127.0.0.1:8000 directly |
| http://127.0.0.1:8025 | Mailpit (captured email) |
| http://127.0.0.1:9001 | MinIO console (S3-compatible storage) |

To run production-like without the dev override: `docker compose -f docker-compose.yml up -d`.

## Repository map

```
apps/
  api/            FastAPI modular monolith + ARQ worker (Python, uv)
  portal/         Vite + React SPA / PWA for all signed-in roles
  website/        Next.js public website rendered from CMS content
packages/
  ui/             Design system: tokens, Tailwind preset, components
  api-client/     TypeScript client generated from the API's OpenAPI schema
  config/         Shared TS/ESLint/Tailwind configuration
e2e/              Playwright tests (smoke project runs on every PR)
infra/
  docker/         Multi-stage Dockerfiles for portal and website (the API's is apps/api/Dockerfile)
  nginx/          Edge proxy config (TLS, security headers, rate limits)
  scripts/        backup_mysql.sh, restore_check.sh, dev_certs.sh
docs/
  adr/            Architecture Decision Records (template, ADR-001, ADR-002)
  DEFERRED.md     Register of work left for later, per phase (keep it current)
  BRD_v1.md, FRD_v1.md
.github/workflows/ci.yml
```

## Make targets

`make help` lists them all: `up`, `down`, `logs [s=service]`, `migrate`, `makemigration m="..."`,
`seed`, `test`, `test-api`, `test-e2e`, `lint`, `format`, `gen-client`, `certs`, `env`, `backup`,
`restore-check`.

## Engineering standards (summary)

- **Architecture:** modular monolith ([ADR-001](docs/adr/0001-modular-monolith.md)). Layering is
  router → service → repository. Routers never touch the ORM, services never import FastAPI, and
  repositories hold no business rules. Modules talk only through each other's public
  `__init__.py`, and import-linter enforces this.
- **Multi-tenancy:** one shared database with `tenant_id` on every tenant-owned table, enforced in
  the base repository ([ADR-002](docs/adr/0002-shared-db-tenant-id-repository-enforcement.md)).
  `tenant_id` is never taken from client input.
- **Python:** Ruff (lint + format), mypy `--strict`, type hints everywhere.
- **TypeScript:** `strict: true`, ESLint, Prettier.
- **Commits:** Conventional Commits, checked by commitlint (e.g. `feat(api): add tenant context`).
- **Data:** money is `DECIMAL`, never float. People and academic records use soft delete. Every
  table has audit fields.
- **Dependencies:** installed at the latest stable version through the package manager. The
  lockfiles (`package-lock.json`, `apps/api/uv.lock`) are the source of truth for versions.

## Security notes

- **Secrets:** never commit them. `.env` is git-ignored and only `.env.example` (placeholders) is
  tracked. gitleaks runs in pre-commit and CI. In production, inject secrets from a secrets manager.
- **Tokens:** JWT access tokens are short-lived and held in memory only. Refresh tokens live in
  `httpOnly` + `Secure` + `SameSite` cookies, rotate on every use, and are stored hashed. Tokens
  never go in localStorage or sessionStorage.
- **Edge (`infra/nginx/nginx.conf`):**
  - TLS 1.2/1.3 only, with HTTP redirected to HTTPS.
  - Security headers: HSTS, `nosniff`, `X-Frame-Options: DENY` and `frame-ancestors 'none'`,
    Referrer-Policy and Permissions-Policy. The apps add their own nonce-based CSP.
  - Request body limit of 1 MB, per-IP rate limits (stricter for auth and public forms), and
    `server_tokens off`.
- **Containers:**
  - Pinned base-image tags and multi-stage builds, with no dev dependencies in the final images.
  - Every image runs as a non-root user, with a read-only root filesystem where possible,
    `no-new-privileges` and all capabilities dropped.
  - MySQL and Redis sit on an internal network with no host ports. Only the dev override
    publishes them, on 127.0.0.1.
- **CI:**
  - `npm audit --audit-level=high` and `pip-audit --strict` fail the build on findings. pip-audit
    has no severity filter, so it fails on any known vulnerability.
  - The tenant-isolation suite blocks merges.
  - Third-party GitHub Actions are pinned to commit SHAs.
- **Backups:** `make backup` writes a compressed, checksummed dump. `make restore-check` restores
  it into a scratch database and runs sanity checks. Run restore drills quarterly (FRD
  FR-SEC-038).
- **Reporting vulnerabilities:** a `security.txt` and disclosure policy arrive with the website
  (FRD FR-SEC-042).
