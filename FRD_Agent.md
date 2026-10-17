# PROJECT CONTEXT

You are working on "SchoolPlatform", a product consisting of:

1. A public school website with a Content Management System (CMS).
2. A School Management System (SMS) portal for admins, teachers, parents, and students.

## Product stance

- Launches as SINGLE-TENANT (one school), but must be architected with provision for future MULTI-TENANCY (shared DB, tenant_id on all tenant-owned data, tenant-scoped uniqueness, per-tenant settings and theming). Multi-tenant onboarding, billing, and a super-admin portal are explicitly OUT of scope for v1 but must be noted as future phase.
- Target market: schools in India (primarily K-12; CBSE/ICSE/State boards). Assume INR, Indian academic calendar (April-March), Indian phone/SMS/WhatsApp/UPI norms, and English plus optional Hindi/regional-language content. Flag any assumption.

## Technology stack (constraints for feasibility, do not redesign)

- Frontend: React (TypeScript, strict), Tailwind CSS, TanStack Query, React Hook Form + Zod. Public site may use Next.js for SEO; portal is a Vite SPA.
- Backend: FastAPI (Python), SQLAlchemy, Alembic, Pydantic. Modular monolith with layered architecture (router -> service -> repository).
- Database: MySQL 8 (InnoDB, utf8mb4). Redis optional. Object storage (S3-compatible).
- Deployment: Docker, Nginx reverse proxy with TLS, CI/CD, environment-based config.
- Testing: unit, integration (real MySQL), and Playwright E2E.

## NON-NEGOTIABLE PRIORITY #1: SECURITY

Security is the utmost requirement of this product. It outranks features, speed of delivery, and convenience. Schools hold sensitive data about minors (identity, health, addresses, guardian contacts, fee and academic records). Requirements must explicitly address, at minimum:

- Authentication: strong password policy, secure hashing (Argon2/bcrypt), MFA (at least for admin/staff roles), short-lived access tokens with rotating refresh tokens, account lockout/throttling, secure password reset, session/device management.
- Authorization: RBAC plus resource-level policies (e.g., a teacher sees only assigned sections; a parent sees only their own children), deny-by-default, enforced server-side.
- Tenant isolation: no cross-tenant data access under any condition; tenant_id never accepted from client input; automated isolation tests.
- Data protection: encryption in transit (TLS 1.2+) and at rest, field-level protection for highly sensitive data, secrets management, secure backups and tested restores.
- Compliance: India's Digital Personal Data Protection Act, 2023 (consent, children's data and verifiable parental consent, data principal rights, breach notification, retention and erasure); also note IT Act obligations. Flag where legal review is needed. Do not give legal conclusions as final.
- Application security: OWASP Top 10 and ASVS-aligned controls, input validation, output encoding, CSRF/XSS/SQLi/SSRF/IDOR prevention, secure file upload (type/size validation, malware scanning, no public guessable URLs), rate limiting, CORS, security headers/CSP, dependency and container scanning, SAST/DAST in CI.
- Auditability: immutable audit trail for changes to grades, attendance, fees, student records, permissions, and logins; tamper-evident logs; admin access reviews.
- Privacy: data minimisation, PII masking in logs, consent management, export/erasure workflows, retention policies.
- Operations: monitoring, alerting, incident response, vulnerability disclosure, penetration testing before go-live.
  Every functional requirement you write must state its security and access-control implications.

## NON-NEGOTIABLE PRIORITY #2: UI/UX THAT IS APPEALING AND SELLABLE

The product must look and feel premium, modern, and trustworthy so that school owners and principals are impressed in a demo and parents/teachers enjoy using it daily. Requirements must address:

- A cohesive design system (design tokens for color, type, spacing, elevation, radius, motion), per-tenant theming (logo, brand colors) without code changes.
- Public website: stunning, fast, SEO-optimised, with polished hero sections, imagery/gallery, notices/events, admissions call-to-action, and strong first impressions on mobile.
- Portal: role-specific dashboards with clear information hierarchy, quick actions, meaningful empty/loading/error states, delightful micro-interactions, and minimal clicks for frequent tasks (e.g., marking attendance in under 30 seconds).
- Mobile-first and responsive; parents will mostly use phones. Consider PWA capabilities.
- Accessibility to WCAG 2.2 AA, light/dark mode, localisation readiness, performance budgets (Core Web Vitals targets), and consistent patterns across modules.
- A "demo-ability" lens: identify the signature screens and flows that sell the product and specify them in extra detail.

## DOMAIN MODULES (v1 scope to be refined by you)

Shared kernel (auth, users, roles/permissions, audit, notifications, files, tenant settings); People (students, guardians, staff); Academics (academic year, classes/sections, subjects, timetable, attendance, exams, grading, report cards); Admissions (enquiries, applications, workflow); Finance (fee structures, invoices, payments with online gateway, receipts, dues/reminders); Communication (notices, SMS/email/WhatsApp, parent messaging); CMS and public website (pages, posts/notices, events, gallery, banners, menus, SEO metadata, media library, publishing workflow); Reports/analytics.

## GENERAL RULES FOR YOUR OUTPUT

- Use precise, testable, unambiguous language. Use "shall" for mandatory, "should" for recommended, "may" for optional.
- Assign unique IDs to every requirement and priority (MoSCoW) and phase (MVP / v1.1 / Future).
- Do NOT invent facts about the client. Where information is missing, list it under "Assumptions" and "Open Questions" with a recommended default.
- Prefer completeness and traceability over brevity. Output in well-structured Markdown with tables where useful.
- Stay within the stated stack; flag any requirement that would force a stack change.

The approved BRD is provided below. Every functional requirement must trace to one or more BR IDs.
<BRD>
[Paste BRD output here]
</BRD>

# YOUR ROLE

Act as a Principal Systems Analyst and Solution Architect. Produce a complete Functional Requirements Document (FRD) detailed enough for engineering, QA, and UI/UX agents to work from without further clarification.

# DELIVERABLE: FRD (Markdown)

Include the following sections:

1. Document control and traceability approach (FR ID -> BR ID -> module -> test case IDs)
2. System overview and context diagram (describe in text and Mermaid), module map, and tenancy approach (single-tenant now, tenant_id provisioned everywhere)
3. User roles and permission matrix: a complete role x module x action (create/read/update/delete/approve/export) table with resource-level rules (e.g., teacher limited to assigned sections; parent limited to linked children)
4. Functional requirements per module (FR-<MODULE>-001...). For EACH requirement provide:
   - Description, actors, preconditions, trigger
   - Main flow, alternate flows, exception flows
   - Business rules and validations (field-level: type, length, format, mandatory, uniqueness within tenant)
   - Acceptance criteria in Given/When/Then format
   - Security and access-control notes (authN/authZ, data sensitivity, audit events, rate limits)
   - UI/UX notes (screen, key components, states: empty/loading/error/success, mobile behaviour)
   - Notifications/side effects (events emitted)
   - Priority and phase
     Modules: Auth and account management; Tenant settings and branding; Users/roles/permissions; Students; Guardians; Staff; Academic year and structure; Timetable; Attendance; Exams, grading, and report cards; Admissions; Fees and payments; Communication and notifications; CMS and public website; Media library; Reports and dashboards; Audit log; Data import/export; Settings and configuration.
5. End-to-end user journeys / workflows (admission application to enrolment; daily attendance to parent notification; fee invoice to online payment to receipt; exam entry to report card publish; notice publish to website and app) with sequence descriptions and state machines (Mermaid) for key entities (Application, Invoice, Payment, Exam result, CMS post).
6. Data requirements: logical data model (entities, key attributes, relationships) in Mermaid ER, with tenant_id, academic_year_id, soft-delete, audit fields, and tenant-scoped unique constraints identified. Include data classification (public / internal / confidential / restricted) per entity and field-level encryption candidates. Money as DECIMAL; payments and ledger entries append-only.
7. API requirements: conventions (REST, /api/v1, error envelope, pagination, filtering, idempotency keys for payments), a high-level endpoint catalogue per module with method, path, roles, and request/response summary.
8. Integration requirements: payment gateway (webhook verification, reconciliation), SMS/WhatsApp/email providers, file storage, optional biometric/RFID, board/UDISE+ exports.
9. SECURITY FUNCTIONAL REQUIREMENTS (dedicated, extensive section, FR-SEC-xxx): authentication and MFA flows, token lifecycle, session management, password and recovery flows, RBAC enforcement and policy layer, tenant isolation guarantees and isolation test requirements, input validation and output encoding, secure file handling, rate limiting and abuse prevention, security headers and CSP, secrets management, encryption (transit/at rest/field-level), audit logging and tamper evidence, consent management and DPDP rights workflows (access, correction, erasure, grievance), data retention and archival, backup/restore, breach detection and response workflow, admin security dashboard, and secure SDLC gates (SAST, DAST, dependency/container scanning, pen-test). Map each to OWASP ASVS level and OWASP Top 10 categories.
10. UI/UX FUNCTIONAL REQUIREMENTS (FR-UX-xxx): design system and tokens, per-tenant theming, navigation model per role, signature "demo" screens (principal dashboard, teacher attendance, parent home, fee payment, public website home) with detailed layout and interaction specs, component library inventory, empty/loading/error patterns, form UX standards, micro-interactions and motion guidelines, responsive breakpoints, PWA behaviour, dark mode, accessibility (WCAG 2.2 AA) criteria, internationalisation, and performance budgets (Core Web Vitals targets).
11. Non-functional requirements with measurable targets: performance (p95 latencies), scalability, availability/SLO, RPO/RTO, browser/device support, observability, maintainability (coding standards, module boundaries, test coverage targets), localisation, data residency.
12. Testing requirements: unit, integration, tenant-isolation suite, security tests, accessibility tests, and a Playwright E2E scenario catalogue (ID, journey, roles, preconditions, steps, expected results, test data, priority). Include a minimum smoke suite for every PR.
13. Deployment and environment requirements: environments (dev/staging/prod), Docker topology, Nginx/TLS, CI/CD stages and quality gates, configuration and secrets, migrations policy, rollback, monitoring and alerting.
14. Reporting and analytics requirements (operational reports, exports with access control).
15. Data migration and onboarding (bulk import of students/staff/fees with validation and dry-run, error reports).
16. Assumptions, dependencies, open questions (with recommended defaults), and out-of-scope items.
17. Requirements traceability matrix (FR -> BR -> test case) and a release-phase mapping (MVP / v1.1 / Future).

# QUALITY BAR

- No requirement may be vague ("user-friendly", "fast", "secure") without a measurable criterion.
- Every FR touching personal data must list its data classification and audit events.
- Every list/detail endpoint must state its tenant-scoping and resource-level authorization rule.
- Flag any conflict between requirements, and between requirements and the stack, and propose a resolution.
- End with a "Completeness checklist" and a list of requirements needing client/legal clarification.
