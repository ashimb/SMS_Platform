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

# YOUR ROLE

Act as a senior Business Analyst and Product Strategist with deep experience in EdTech and School Management Systems in India. Produce a complete Business Requirements Document (BRD) for SchoolPlatform.

# DELIVERABLE: BRD (Markdown)

Include the following sections:

1. Document control (version, author, status, change log)
2. Executive summary
3. Business background, problem statement, and opportunity
4. Business objectives and measurable success criteria (KPIs, e.g., admission conversion, fee collection efficiency, reduction in admin hours, parent engagement, NPS, uptime)
5. Scope: in scope, out of scope, future phases (explicitly cover the multi-tenant/SaaS roadmap)
6. Stakeholders and user personas (Owner/Trustee, Principal, Admin/Office staff, Accountant, Teacher, Class Teacher, Parent/Guardian, Student, Prospective parent/visitor, Website content editor, Platform operator). For each: goals, pain points, key jobs-to-be-done, tech comfort level.
7. Current-state (as-is) school workflows and pain points, and the future-state (to-be) workflows for: admissions, student onboarding, daily attendance, timetable, exams and report cards, fee collection, parent communication, website/notice publishing, staff management.
8. Business requirements (BR-001...), grouped by module, each with: description, rationale, priority (MoSCoW), phase, success measure, and owner.
9. Business rules and policies (e.g., fee rules, late fees, concessions, attendance thresholds, grading schemes, academic-year rollover, promotion/detention rules, data retention). Parameterise anything that varies by school.
10. Security, privacy, and compliance business requirements (treated as top priority). Include DPDP Act 2023 implications, children's data handling, parental consent, breach response, audit and retention, and the business risk of a data breach (reputational, legal, financial).
11. Brand, UI/UX, and market-positioning requirements: what makes the product "sellable"; demo-critical experiences; competitive differentiation; per-school branding.
12. Competitive landscape: a short, careful comparison of typical school ERP offerings and gaps this product should exploit. Do not fabricate specific competitor claims; label as hypotheses to verify.
13. Monetisation and commercial model considerations (single-school licence now; SaaS subscription later). Mark as assumptions.
14. Constraints, dependencies, and third-party integrations (payment gateway, SMS/WhatsApp, email, biometric/RFID attendance, DigiLocker/UDISE+ or board reporting, accounting export). Mark which are MVP vs future.
15. Assumptions, risks (with likelihood, impact, mitigation), and open questions (with recommended defaults).
16. Release phasing and high-level roadmap (MVP, v1.1, v2/multi-tenant).
17. Glossary of school-domain terms.
18. Appendix: requirements traceability seed table (BR ID -> module -> persona -> priority).

# QUALITY BAR

- Every business requirement must be traceable to a business objective.
- Include at least one business risk entry specifically about security/data breach and one about UX adoption by non-technical staff.
- End with a "Review checklist" confirming completeness against the sections above.
