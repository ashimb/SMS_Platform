# ADR-001: Modular monolith with layered modules

- **Status:** Accepted
- **Date:** 2026-10-15
- **Deciders:** Principal Engineer, Product Owner
- **Related:** FRD §2.3 (module map), §2.4 (code layout), NFR-MAINT-02; ADR-002

## Context

SchoolPlatform v1 serves one school with a small team. The domain has many modules (auth,
people, academics, attendance, exams, admissions, finance, communication, CMS, reports) that share
data and transactions (e.g., admission conversion creates students, guardians, and invoices
atomically). Security is the top priority: every request needs consistent authentication,
authorization, tenant scoping, and audit. The product must later become multi-tenant SaaS.

Microservices would add distributed transactions, network security surfaces, and operational
load the team cannot justify yet. An unstructured monolith would erode module boundaries and
make the security model hard to verify.

## Decision

We will build the backend as a **modular monolith**: one FastAPI deployable (plus an ARQ worker
running the same codebase), organised into domain modules under `apps/api/app/modules/<module>/`.

Within each module, code is layered **router -> service -> repository**:

- **Routers** handle HTTP only: dependencies (auth, tenant context), request/response schemas,
  and declaring the route's permission. Routers never touch the ORM.
- **Services** hold business rules, authorization checks, transactions, and domain events.
  Services never import FastAPI.
- **Repositories** hold SQLAlchemy queries only (no business rules), and enforce tenant scoping
  through a shared base repository (ADR-002).

Modules interact **only through each module's public `__init__.py`** (its service interface and
DTOs), never through another module's repositories or models. Cross-module side effects go through
domain events written to a transactional outbox and processed by the worker.

## Consequences

- One deployable, one database transaction boundary, simple local development and debugging.
- Security controls (auth, policy layer, tenant scoping, audit) are implemented once in `core/`
  and applied uniformly.
- Boundaries need tooling to stay honest; without enforcement the monolith would degrade.
- Scaling is horizontal for the whole app (stateless API/worker replicas), not per module. That is
  enough for the v1 sizing (FRD NFR-SCALE-01). Extracting a module later is possible because
  boundaries are explicit.
- The outbox adds some complexity (idempotent consumers, at-least-once delivery).

## Alternatives considered

| Option | Why not chosen |
|---|---|
| Microservices | Distributed transactions, larger attack surface, and operational cost not justified for one school and a small team |
| Unstructured monolith | Boundaries erode; security model and tenant scoping become hard to verify |
| Serverless functions | Cold starts, harder to run background jobs and long transactions; conflicts with the Docker/Nginx deployment model |

## Compliance and verification

- **import-linter** contracts in `apps/api` (layers: router -> service -> repository; modules may
  import only other modules' public `__init__`) run in pre-commit and CI (`import-linter` job).
- Lint rules: no FastAPI imports in `service.py`/`repository.py`; no ORM imports in `router.py`.
- Code review checklist item for new cross-module dependencies.
