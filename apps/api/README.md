# SchoolPlatform API

FastAPI modular monolith plus an ARQ worker. It uses SQLAlchemy 2 (sync, PyMySQL), Alembic and
Pydantic v2, with MySQL 8 and Redis. Python 3.14; dependencies are managed with **uv**.

## Run locally

```bash
cd apps/api
uv sync                                    # creates .venv from uv.lock
cp .env.example .env                       # local settings (or use the root docker compose)
uv run alembic upgrade head                # schema
uv run python -m scripts.seed_dev          # default tenant + isolation-test tenant + admins
uv run uvicorn app.main:app --reload       # http://127.0.0.1:8000
uv run arq app.worker.WorkerSettings       # background worker
```

Inside the dev stack (repo root): `make up`, `make migrate`, `make seed`, `make test-api`.

| Endpoint | Purpose |
|---|---|
| `GET /health`, `/health/live` | Liveness (no dependencies) |
| `GET /ready` | Readiness: database and Redis |
| `GET /api/v1/openapi.json`, `/api/docs` | OpenAPI and Swagger UI (**not served in production**) |
| `GET /metrics` | Prometheus metrics (internal network only; nginx does not proxy it) |

## Layout

```
app/
  main.py                 app factory: middleware, routers under /api/v1, health, metrics
  core/                   config, security, tenancy, deps, errors, logging, rate_limit, permissions
    middleware/           request_id, security_headers, audit_context (pure ASGI)
  db/                     base (naming conventions, BINARY(16) UUIDs), mixins, session (guards), uow
  common/                 TenantRepository, pagination, schemas, events, storage, validators
  modules/<20 modules>/   __init__ (public surface), router, schemas, service, repository,
                          models, policies, events, constants
  worker/                 ARQ settings and tenant-scoped tasks
migrations/               Alembic (env.py builds the URL from settings)
scripts/                  seed_dev.py, create_tenant.py
tests/                    unit, integration, tenant_isolation, security (+ conftest, factories)
```

Fully implemented: `auth`, `tenants`, `users`, `rbac`, `audit`, and `students` (the reference for
the layering pattern). The other 14 modules are importable skeletons.

## Rules this code enforces

- **Layering:** router → service → repository. Routers never touch the ORM, services never
  import FastAPI, and repositories hold queries only. Modules use each other only through
  `__init__.py`. Enforced by `uv run lint-imports --config importlinter.ini` (23 contracts).
- **Tenancy:**
  - `TenantContext` is resolved once per request; `tenant_id` is never read from client input.
  - Every query on a tenant-owned model must go through `TenantRepository`. A session guard
    raises `TenantScopeError` for anything else, and inserts without `tenant_id` are rejected.
  - The JWT `tid` must match the request's tenant.
  - Cache, storage and job keys are prefixed with the tenant id.
- **Auth:**
  - Passwords use Argon2id with rehash-on-login. Access tokens are EdDSA JWTs, valid 10 min,
    and kept in client memory only.
  - Refresh tokens are rotating HttpOnly + Secure + SameSite=Strict cookies, stored hashed.
    Reuse of a rotated token revokes the whole session.
  - Accounts lock after 5 failures. TOTP MFA secrets are encrypted at rest.
  - Cookie-authenticated endpoints require the `X-SP-CSRF: 1` header.
- **Errors:** every error uses one envelope, `{"error": {code, message, details, trace_id}}`.
  Stack traces and SQL never reach clients.
- **Audit:** append-only `audit_logs` with a per-tenant SHA-256 hash chain. The audit row is
  written in the same transaction as the change it records.
- **Logs:** structured JSON, with emails, phone numbers, tokens, Aadhaar-like numbers and
  sensitive keys masked.

## Quality gates

```bash
uv run ruff check . && uv run ruff format --check .
uv run mypy app                                  # strict
uv run lint-imports --config importlinter.ini
uv run bandit -r app -c pyproject.toml
uv export --frozen --all-groups --format requirements-txt --no-hashes > req.txt && uv run pip-audit --strict -r req.txt
uv run pytest -q --cov=app                       # needs Docker (testcontainers MySQL 8.4 + Redis)
```

Test markers: `unit`, `integration`, `tenant_isolation`, `security`. Coverage gate: 85%.

## Migrations

`uv run alembic revision --autogenerate -m "..."`, then **review the generated file**. Check
that `tenant_id` comes first in unique constraints and that the downgrade drops tables rather than
FK-backing indexes. Then run `uv run alembic upgrade head`. CI runs upgrade, `alembic check`
(model drift) and a downgrade/upgrade round-trip on a fresh database.
