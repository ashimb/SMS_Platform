# ADR-002: Shared database with `tenant_id`, enforced in the repository layer; single tenant at launch

- **Status:** Accepted
- **Date:** 2026-10-15
- **Deciders:** Principal Engineer, Security Lead, Product Owner
- **Related:** BRD BR-116 – BR-119, SBR-020 – SBR-023; FRD §2.5, FR-SEC-014 – FR-SEC-016, §12.4; ADR-001

## Context

SchoolPlatform launches for **one school** but must become multi-tenant SaaS without a rewrite.
Schools hold sensitive data about minors, so cross-tenant data exposure is unacceptable under any
condition (DPDP Act 2023 exposure, reputational harm). We need an isolation model that is cheap to
run for one tenant, scales to many, and can be **proven** by automated tests.

## Decision

We will use **one shared MySQL 8 database (shared schema)** with tenant isolation by `tenant_id`:

1. Every tenant-owned table has `tenant_id BINARY(16) NOT NULL`, the first column of its composite
   indexes. Unique constraints are tenant-scoped (e.g., `UNIQUE (tenant_id, admission_no)`).
   Foreign keys between tenant-owned tables are composite `(tenant_id, x_id)` so the database itself
   rejects cross-tenant references.
2. The tenant is **resolved once per request** from the `Host` header by a `TenantContext`
   dependency. **`tenant_id` is never accepted from client input**: request schemas forbid it, and
   headers like `X-Tenant-Id` are ignored.
3. The authenticated session/JWT carries `tid`; it must equal the host-resolved tenant, otherwise
   the request is rejected and logged as a security event.
4. **The base repository enforces scoping**: every select/update/delete on a tenant-owned model gets
   `tenant_id = :current` automatically (SQLAlchemy `with_loader_criteria`); inserts take
   `tenant_id` from the context. A query without tenant context fails closed. Raw SQL is banned by
   lint outside a reviewed allow-list.
5. `tenant_id` is also carried in **storage object keys** (`t/{tenant_id}/...`), **cache and
   rate-limit keys** (`t:{tenant_id}:...`), and **background job payloads** (the worker restores the
   context before running, and rejects jobs without it).
6. At launch exactly **one default tenant is seeded**. Multi-tenant onboarding, billing, and a
   super-admin portal are out of scope for v1.

## Consequences

- Low cost and simple operations for one tenant; the same model serves many tenants later.
- Isolation depends on application discipline; this is mitigated by enforcement at three layers
  (repository guard, composite FKs, automated tests) instead of developer care alone.
- Every query pays a small cost for the extra predicate; `tenant_id`-first indexes keep it cheap.
- Per-tenant backup/restore and data residency per tenant are harder than with database-per-tenant;
  planned as v2 work (per-tenant encryption keys, tenant export/offboarding).
- Noisy-neighbour risk at SaaS scale; addressed later with per-tenant rate limits and read replicas.

## Alternatives considered

| Option | Why not chosen |
|---|---|
| Database per tenant | Strongest isolation, but higher operational cost (migrations × N, connections, backups) for v1's single tenant; can be offered later as a premium tier |
| Schema per tenant | Similar operational cost; MySQL schemas are databases, so no real benefit over database-per-tenant |
| Row-level security in the DB | MySQL has no native RLS; emulation with views/definers is brittle |
| Single-tenant schema (no `tenant_id`) | Fastest now, but a costly, risky migration when SaaS starts |

## Compliance and verification

- **Tenant-isolation suite** (`pytest -m tenant_isolation`, FRD §12.4 ISO-001 … ISO-018) runs
  against ≥ 2 seeded tenants on real MySQL in CI, and blocks merges.
- Migration lint: every new table must have `tenant_id` (or be on the explicit global-table
  allow-list), the composite-FK pattern, and audit fields.
- Lint rule banning raw SQL outside `core/sql/`; Security Lead review on `core/tenancy` changes.
