# SchoolPlatform — Business Requirements Document (BRD)

> **Classification:** Internal – Confidential
> **Product:** SchoolPlatform — Public School Website + CMS, and School Management System (SMS) Portal
> **Market:** K-12 schools in India (CBSE / ICSE / State boards)

---

## 1. Document Control

| Field | Value |
|---|---|
| Document ID | BRD-SP-001 |
| Title | SchoolPlatform Business Requirements Document |
| Version | 0.1 |
| Status | **Draft – for stakeholder review** (not approved for build) |
| Date | 2026-10-15 |
| Author | Senior Business Analyst / Product Strategist (AI-assisted draft) |
| Document owner | Product Owner, SchoolPlatform (Ashim Bera) |
| Required reviewers | School Owner/Trustee, Principal, Office Administrator, Accountant, Security Lead, Engineering Lead, UX/Design Lead, Legal Counsel (DPDP/IT Act) |
| Approval authority | Product Owner + School Owner/Trustee (business); Security Lead (security sections); Legal Counsel (Section 10 compliance items) |
| Related documents (to be produced) | SRS / Functional Specification, Solution Architecture, Threat Model, Data Protection Impact Assessment (DPIA), Design System Spec, Test Strategy |

### 1.1 Change Log

| Version | Date | Author | Summary of change |
|---|---|---|---|
| 0.1 | 2026-10-15 | BA (AI-assisted) | Initial complete draft covering Sections 1–18 and review checklist |

### 1.2 Conventions

| Convention | Meaning |
|---|---|
| **shall** | Mandatory requirement |
| **should** | Recommended; omission requires documented justification |
| **may** | Optional |
| **MoSCoW** | **M** = Must, **S** = Should, **C** = Could, **W** = Won't (this release) |
| **Phase** | **MVP** = first go-live; **v1.1** = first enhancement release after go-live; **Future** = v2+ including multi-tenant SaaS |
| **ID prefixes** | `OBJ` objective · `BR` business requirement · `SBR` security/privacy business requirement · `UXR` UI/UX requirement · `DEMO` signature demo flow · `RULE` business rule · `INT` integration · `ASM` assumption · `RSK` risk · `OQ` open question · `P` persona |
| **Owner** | The business role accountable for accepting the requirement (not the implementer) |
| **⚖ Legal review** | Marks items where legal counsel must confirm interpretation. Nothing in this document is a final legal conclusion. |
| **⚠ Stack flag** | Marks items that may stretch or alter the stated technology stack |

---

## 2. Executive Summary

SchoolPlatform is a combined **public school website (with CMS)** and **School Management System portal** for administrators, teachers, parents, and students. It launches for **one school (single-tenant)** but is architected from day one with **provision for multi-tenancy** — `tenant_id` on all tenant-owned data, tenant-scoped uniqueness, and per-tenant settings/theming — so that it can later become a SaaS product sold to many schools.

Two priorities are non-negotiable and outrank feature breadth and delivery speed:

1. **Security and privacy.** The platform holds sensitive data about minors (identity, health, addresses, guardian contacts, fees, academic records). A breach would be existential for the school's reputation and for the product's commercial future, and carries significant penalties under India's Digital Personal Data Protection Act, 2023 (DPDP Act). Every functional requirement in this BRD states its access-control and security implications.
2. **A premium, sellable UI/UX.** The product must impress school owners and principals in a 20-minute demo and must be enjoyable for parents (mostly on phones) and fast for teachers (e.g., attendance in under 30 seconds).

**MVP scope** covers: the shared kernel (authentication with MFA, RBAC + resource-level policies, audit, notifications, files, tenant settings and theming); People (students, guardians, staff); Academics (academic year, classes/sections, subjects, timetable, attendance, exams, grading, report cards); Admissions (enquiry-to-enrolment); Finance (fee structures, invoices, UPI/online payments, receipts, dues reminders); Communication (notices, SMS/email/WhatsApp, parent-teacher messaging); CMS and public website; and role dashboards with standard reports.

**Deferred:** multi-tenant onboarding, billing and super-admin portal; native mobile apps (a PWA ships instead); biometric/RFID attendance; transport GPS; library, hostel, inventory and payroll modules; LMS/online classes.

**Key business outcomes targeted** (Section 4): measurably faster fee collection, higher admission enquiry-to-enrolment conversion, fewer administrative hours, strong parent adoption, high NPS, ≥ 99.5% availability, and zero high-severity security incidents.

**Top decisions needed from the client** (Section 15.3): board(s) and grading scheme; payment gateway and who bears transaction charges; WhatsApp/SMS provider and DLT registration status; whether report cards may be withheld for dues (⚖); data retention periods (⚖); Hindi/regional-language need at MVP.

---

## 3. Business Background, Problem Statement, and Opportunity

### 3.1 Background

Many Indian K-12 schools run on a patchwork of tools: paper registers, spreadsheets, a legacy desktop fee package, a static or agency-built website that is rarely updated, and personal WhatsApp groups for parent communication. Data is fragmented, duplicated, and often stored on personal devices with no access control. Under the DPDP Act, schools are *Data Fiduciaries* processing children's personal data, which raises the bar for consent, security safeguards, and breach notification.

### 3.2 Problem Statement

| # | Problem | Who is affected | Business impact |
|---|---|---|---|
| PS-1 | Student, fee, and academic data sits in disconnected spreadsheets, registers, and legacy software | Admin, Accountant, Principal | Re-entry, errors, no single source of truth, slow decisions |
| PS-2 | Fee collection is manual (counter queues, cheques, cash) with weak follow-up on dues | Accountant, Parents, Owner | Delayed cash flow, high outstanding dues, reconciliation effort |
| PS-3 | Admission enquiries are tracked on paper/phone; follow-ups are missed; no source attribution | Admissions staff, Owner | Lost enrolments, wasted marketing spend |
| PS-4 | Parent communication runs through personal WhatsApp groups and paper circulars | Teachers, Parents, Principal | Privacy exposure (phone numbers shared, minors' photos circulated), no delivery proof, teacher burnout |
| PS-5 | Attendance and marks are entered on paper, then re-typed; report cards are assembled manually | Teachers, Class Teachers | Teacher hours lost; errors in report cards; delayed results |
| PS-6 | The website is outdated, slow on mobile, and not editable by school staff | Prospective parents, Owner | Poor first impression, weak admissions pipeline, poor SEO |
| PS-7 | No audit trail, shared logins, no MFA, data on personal devices | Owner, Principal, Data principals (children & parents) | High breach likelihood; DPDP non-compliance exposure; reputational damage |
| PS-8 | Existing ERP tools (where used) are often perceived as dated and hard for non-technical staff | All staff | Low adoption, workarounds, shelfware *(hypothesis to validate in discovery)* |

### 3.3 Opportunity

- **For the launch school:** one secure, beautiful system that replaces fragmented tools, improves cash flow, increases admissions, saves staff time, and demonstrates DPDP-aligned stewardship of children's data to parents.
- **For the product:** a reference implementation that becomes the demo and case study for a multi-tenant SaaS offering to other Indian schools, differentiated on **security-by-design**, **premium UX**, and **an integrated website + ERP** (Section 12).

### 3.4 Why Now

- The DPDP Act, 2023 and the DPDP Rules (notified in November 2025, with phased commencement) create compliance obligations that informal tools cannot meet. ⚖ *Commencement dates of specific obligations to be confirmed by legal counsel.*
- UPI is now the default digital payment habit for Indian parents, making online fee collection low-friction.
- National initiatives such as APAAR ID and UDISE+ increase the need for clean, structured student data (exports are a future-phase item).
- Parents are mobile-first; schools compete for admissions on digital first impressions.

---

## 4. Business Objectives and Measurable Success Criteria

> **Baselines are unknown** and shall be measured during discovery (first 4 weeks) before targets are finalised. Targets below are **recommended defaults** measured at 12 months after go-live unless stated.

| ID | Objective | KPI(s) | Baseline | Recommended target | Measurement method |
|---|---|---|---|---|---|
| **OBJ-01** | Protect student, guardian, and staff data; earn trust | (a) High/critical security incidents; (b) critical/high pen-test findings open at go-live; (c) % privileged users with MFA | Unknown | (a) 0; (b) 0; (c) 100% | Incident register; pen-test report; IAM report |
| **OBJ-02** | Comply with DPDP Act 2023 and related obligations | (a) Data-principal requests resolved within policy SLA; (b) consent recorded for all applicable processing; (c) breach-response drill completed | Not in place | (a) ≥ 95% within SLA; (b) 100%; (c) ≥ 1 per year | Privacy request log; consent ledger; drill report |
| **OBJ-03** | Improve fee collection efficiency and cash flow | (a) % of fees collected by due date; (b) % of payments made online; (c) outstanding dues at term end; (d) accountant hours on reconciliation/week | Unknown | (a) +15 percentage points; (b) ≥ 70%; (c) −30%; (d) −50% | Finance reports; time study |
| **OBJ-04** | Increase admission conversion | (a) Enquiry → application conversion; (b) application → enrolment conversion; (c) % enquiries with follow-up within 24 h | Unknown | (a) +20% relative; (b) +10% relative; (c) ≥ 90% | Admissions funnel report |
| **OBJ-05** | Reduce administrative and teacher workload | (a) Teacher time to mark daily attendance; (b) days from last exam to report-card publish; (c) admin hours/week on data entry | Unknown | (a) ≤ 30 s per section (p75); (b) ≤ 5 working days; (c) −40% | In-app timing telemetry; workflow timestamps; time study |
| **OBJ-06** | Drive parent engagement and satisfaction | (a) % of enrolled families with an active parent account; (b) monthly active parents; (c) notice read rate within 24 h; (d) parent NPS | Unknown | (a) ≥ 85% by month 3; (b) ≥ 70%; (c) ≥ 80%; (d) ≥ +40 | Product analytics (privacy-preserving); in-app survey |
| **OBJ-07** | Deliver a premium, sellable product experience | (a) Staff NPS / SUS score; (b) demo-to-trial conversion (SaaS phase); (c) WCAG 2.2 AA conformance of signature screens | n/a | (a) SUS ≥ 80; (b) baseline to be set in Future phase; (c) 100% of signature screens pass audit | SUS survey; CRM; accessibility audit |
| **OBJ-08** | Strengthen the school's digital presence | (a) Core Web Vitals "Good" at p75 on mobile; (b) organic search sessions; (c) website-originated enquiries | Unknown | (a) LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1; (b) +50%; (c) ≥ 40% of all enquiries | CrUX / RUM; analytics; CRM source attribution |
| **OBJ-09** | Operate reliably | (a) Monthly availability of portal and website; (b) RPO / RTO achieved in restore drills | n/a | (a) ≥ 99.5% (MVP), ≥ 99.9% (SaaS); (b) RPO ≤ 15 min, RTO ≤ 4 h | Uptime monitoring; drill reports |
| **OBJ-10** | Be SaaS-ready without rework | (a) % tenant-owned tables carrying `tenant_id`; (b) cross-tenant isolation test suite pass rate | n/a | (a) 100%; (b) 100% on every release | Schema lint; CI reports |

---

## 5. Scope

### 5.1 In Scope — MVP

| Module | MVP capabilities |
|---|---|
| Shared kernel | Sign-in (password + MFA for staff, OTP for parents), RBAC + resource-level policies, session/device management, immutable audit trail, notification engine (in-app, email, SMS, WhatsApp, web push), secure file service, tenant settings, per-tenant theming, bulk import/export, consent management |
| People | Student master, guardians (multi-guardian, custody restrictions), staff master, teacher–section–subject assignment, student lifecycle and certificates (TC, bonafide) |
| Academics | Academic year/terms/holiday calendar, classes/sections/streams/subjects, timetable builder with clash detection, daily attendance (mobile, < 30 s), leave requests, homework posting, exams setup, marks entry, grading schemes, approval workflow, branded report cards |
| Admissions | Enquiry capture with source tracking, enquiry CRM pipeline, online application with documents and fee payment, review/decision workflow, conversion to enrolled student, waitlist and capacity |
| Finance | Fee heads/structures/instalments, concessions with maker-checker, automated demands, online payments via gateway (UPI/cards/netbanking), counter payments, receipts, late fees, dues reminders, refunds, daily collection and reconciliation reports |
| Communication | Notices/circulars with targeting and acknowledgement, multi-channel delivery, emergency broadcast, parent–teacher messaging within relationship scope, preferences and opt-outs, delivery logs |
| CMS & public website | Block-based page builder, news/notices/events/gallery/banners/downloads/FAQs, menus, SEO tooling, publishing workflow with versioning, media library, enquiry forms, mandatory-disclosure page, cookie consent |
| Reports & analytics | Role-specific dashboards (Principal, Admin, Accountant, Teacher, Parent), standard reports catalogue, permission-scoped exports |
| Platform | Multi-tenancy provisions (data model, isolation tests), backups and tested restores, monitoring/alerting, CI/CD with security scanning |

### 5.2 In Scope — v1.1

Passkeys (WebAuthn); staff SSO (Google Workspace / Microsoft 365); Hindi UI and multilingual CMS content; teacher substitution management; exam schedule, seating, and hall tickets; staff leave management; staff attendance (manual/app); accounting export (Tally-compatible); PTM scheduling; surveys and NPS; custom report builder; holistic progress card templates; tuition-fee (80C) certificates if not delivered in MVP.

### 5.3 Out of Scope (v1)

| Item | Reason / note |
|---|---|
| Multi-tenant onboarding, tenant self-signup, subscription billing, super-admin portal | Future phase (see 5.4); only *data-model provisions* are in v1 |
| Native iOS/Android apps | PWA covers v1; native apps are a Future option ⚠ Stack flag (would add a mobile stack) |
| Payroll, HR statutory compliance (PF/ESI/TDS) | Specialised domain; integrate with existing payroll |
| Library, hostel, inventory, canteen, cafeteria POS | Future modules |
| Transport GPS tracking and route optimisation | Future; route-based transport *fees* are in MVP |
| LMS, online classes, content library, AI tutoring | Future; homework posting is in MVP |
| Biometric/RFID/face-recognition attendance | Future integration; also raises DPDP sensitivity (biometric data) |
| Online examinations / proctoring | Future |
| CCTV, visitor management hardware | Out of scope |
| Full accounting ledger (GL, balance sheet) | SchoolPlatform is a sub-ledger; export to accounting system |
| Board result submission (e.g., direct API to board portals) | Future; dependent on board-provided interfaces (to verify) |

### 5.4 Future Phases — Multi-Tenant / SaaS Roadmap

| Phase | Capability | Notes |
|---|---|---|
| v2.0 SaaS foundation | Tenant provisioning workflow (operator-driven), tenant resolution by subdomain and custom domain with automated TLS, per-tenant config/theming UI, tenant-level feature flags | Builds on v1 provisions (BR-116–BR-122) |
| v2.0 | Super-admin / platform-operator portal: tenant lifecycle, health, usage metering, support access with consent and audit | Operator access to tenant data only via audited, time-boxed, consented "break-glass" |
| v2.1 | Subscription billing (plans, per-student pricing, invoicing with GST, dunning), usage-based messaging pass-through | GST on SaaS fees to be confirmed ⚖ |
| v2.1 | Self-service onboarding wizard, data import templates, sample-data demo tenants | Demo tenants never contain real data |
| v2.2 | School groups / chains (multi-campus under one trust), cross-campus reporting with strict scoping | Tenant hierarchy design required |
| v2.x | Tenant data export and offboarding; per-tenant encryption keys; optional data-residency guarantees; per-tenant backup restore | Supports enterprise sales and DPDP erasure on contract end |
| v3 | Marketplace/integrations (biometric, transport GPS, LMS), native apps, AI assistants (with strict child-data safeguards) | Each needs a DPIA |

### 5.5 Multi-Tenancy Provisions Mandatory in v1

v1 shall implement the following even though only one tenant exists (detailed in BR-116–BR-122 and SBR-020–SBR-024):

1. A `tenants` entity; `tenant_id` (non-null, indexed, foreign key) on **every** tenant-owned table.
2. Tenant context resolved **server-side only** (from the request host and/or the authenticated session); `tenant_id` is **never** accepted from request bodies, query strings, or headers controlled by the client.
3. Uniqueness constraints scoped per tenant (e.g., `UNIQUE(tenant_id, admission_no)`).
4. A repository-layer guard that automatically applies tenant scoping to every query, with a CI check that fails the build on unscoped access to tenant-owned tables.
5. Per-tenant settings and theming stored as data (not code).
6. Automated cross-tenant isolation tests running against at least two seeded tenants on every build.

---

## 6. Stakeholders and User Personas

### 6.1 Stakeholder Register

| Stakeholder | Interest | Influence | Involvement |
|---|---|---|---|
| School Owner / Trustee / Management Committee | ROI, reputation, compliance, admissions growth | High (sponsor, budget) | Approves scope, budget, policies |
| Principal | Academic quality, discipline, parent trust, staff productivity | High | Approves academic rules, workflows, report cards |
| Office Administrator(s) | Fewer manual tasks, accurate records | Medium | Primary data steward; UAT |
| Accountant / Finance head | Accurate collections, reconciliation, audit readiness | Medium–High | Approves finance rules; UAT |
| Teachers / Class Teachers | Less paperwork, fast tools, clear boundaries with parents | Medium (adoption risk) | Pilot users; feedback |
| Parents / Guardians | Visibility, convenience, privacy of their child | Medium (adoption, NPS) | Pilot group; surveys |
| Students | Access to timetable, homework, results | Low–Medium | Feedback (older classes) |
| Prospective parents | Information, easy enquiry | Medium (revenue) | Usability testing of website |
| Website content editor (often admin/marketing staff) | Easy, safe publishing | Low–Medium | CMS UAT |
| Platform operator (vendor/IT) | Stability, security, low ops toil | High (technical) | Runs, monitors, patches |
| Legal counsel / Data Protection Officer (or designated grievance officer) | DPDP/IT Act compliance | High (veto on compliance) | Reviews Section 10, consent texts, retention |
| Third-party providers (payment gateway, SMS/WhatsApp/email, hosting) | Contractual service | Medium | Integration; Data Processing Agreements |
| Regulators / boards (Data Protection Board of India, CERT-In, affiliating board, state education dept.) | Compliance | High (external) | Notification/reporting where required |

### 6.2 User Personas

Tech-comfort scale: 1 (very low; needs hand-holding) – 5 (power user).

#### P01 — Owner / Trustee
- **Goals:** growing enrolment, healthy cash flow, reputation, compliance, minimal surprises.
- **Pain points:** no real-time view of collections or admissions; depends on staff for numbers; worried about data leaks and legal exposure.
- **Jobs-to-be-done:** "Show me today's collections and dues"; "How is admission season tracking vs last year?"; "Are we compliant and safe?"
- **Tech comfort:** 2–3. Primary device: phone. Uses the product a few times a week.
- **Security notes:** read-mostly access to aggregate dashboards; no default access to individual health or custody data; MFA mandatory.

#### P02 — Principal
- **Goals:** academic outcomes, discipline, staff accountability, parent trust.
- **Pain points:** chasing teachers for marks/attendance; late report cards; parent complaints via informal channels.
- **JTBD:** monitor daily attendance and exceptions; approve results and report cards; broadcast notices; review staff activity; handle escalations.
- **Tech comfort:** 3. Devices: laptop and phone.
- **Security notes:** broad read access; approval rights; step-up auth for publishing results, role changes, bulk exports; MFA mandatory.

#### P03 — Admin / Office Staff
- **Goals:** fast, error-free data entry; fewer phone calls; easy certificates.
- **Pain points:** duplicate entry across registers and spreadsheets; parents calling for information; generating TCs/bonafide letters manually.
- **JTBD:** admit and onboard students; maintain records; issue certificates; manage enquiries; publish notices; import data.
- **Tech comfort:** 2–3. Device: desktop at office.
- **Security notes:** high-volume PII access → field-level restrictions (health, custody, Aadhaar masked), export controls, MFA mandatory, activity audited.

#### P04 — Accountant
- **Goals:** every rupee accounted for; quick reconciliation; audit-ready books.
- **Pain points:** cash/cheque handling; mismatches with bank/gateway settlements; manual dues lists; concession disputes.
- **JTBD:** configure fee structures; collect at counter; reconcile online payments; run defaulter lists; issue refunds; export to accounting.
- **Tech comfort:** 3–4 (often familiar with accounting software). Device: desktop.
- **Security notes:** finance-only scope; maker-checker on concessions/refunds; receipts cannot be deleted; MFA mandatory.

#### P05 — Teacher (Subject Teacher)
- **Goals:** spend time teaching, not on paperwork; clear boundaries with parents.
- **Pain points:** paper registers; re-typing marks; parents messaging on personal phones at all hours.
- **JTBD:** mark attendance (if assigned); enter marks for assigned subject-sections; post homework; reply to parent messages during set hours.
- **Tech comfort:** 2–4 (wide variance). Device: phone primarily; some desktop.
- **Security notes:** access limited to assigned sections/subjects; cannot see fee or health data except permitted alerts (e.g., allergy flag); MFA required (TOTP or OTP; see OQ-07).

#### P06 — Class Teacher
- **Goals:** a well-run section; complete, accurate report cards; informed parents.
- **Pain points:** compiling marks from all subject teachers; tracking leave and chronic absence; remarks for 40+ students.
- **JTBD:** daily attendance for own section; approve leave; review consolidated marks; write remarks; communicate with section parents.
- **Tech comfort:** 2–4. Device: phone + desktop.
- **Security notes:** full academic view of own section; limited guardian contact view; no access to other sections' data.

#### P07 — Parent / Guardian
- **Goals:** know my child is safe and progressing; pay fees easily; never miss a notice.
- **Pain points:** dozens of WhatsApp groups; lost paper circulars; counter queues for fees; no visibility into attendance until PTM.
- **JTBD:** see attendance/homework/results; pay fees by UPI in seconds; download receipts; apply for leave; read and acknowledge notices; message the class teacher.
- **Tech comfort:** 1–5 (very wide; many use only WhatsApp and UPI). Device: Android phone predominantly *(assumption ASM-05)*; low-end devices and patchy 4G.
- **Security notes:** sees only own linked children; custody restrictions enforced; OTP sign-in; step-up for changing contact details; non-custodial guardians may be restricted by court order data (Restricted class).

#### P08 — Student
- **Goals:** know timetable, homework, results.
- **Pain points:** missing homework information; unclear schedules.
- **JTBD:** view timetable, homework, notices, own results (older classes).
- **Tech comfort:** 3–5 (age-dependent). Device: parent's or own phone.
- **Security notes:** minors; access only to self; no messaging with other students in v1; no behavioural tracking or targeted advertising (SBR-033); student accounts optional and enabled from a configurable class (default Class VI) *(OQ-09)*.

#### P09 — Prospective Parent / Website Visitor
- **Goals:** judge school quality quickly; find fees, admissions process, facilities, location; enquire easily.
- **Pain points:** outdated sites, slow on mobile, no clear admission CTA, PDFs that won't open.
- **JTBD:** browse the site on a phone; view gallery and results; submit an enquiry or start an application; contact via WhatsApp/phone.
- **Tech comfort:** 2–5. Device: phone (majority).
- **Security notes:** anonymous; enquiry forms protected against spam/abuse; consent for contact; cookie consent for non-essential analytics.

#### P10 — Website Content Editor
- **Goals:** publish news, events, galleries quickly without breaking the design.
- **Pain points:** dependency on an agency; fear of breaking the site; image-size problems.
- **JTBD:** create/edit pages and posts; upload media; schedule publication; submit for approval.
- **Tech comfort:** 2–3. Device: desktop.
- **Security notes:** CMS-only role; publishing requires approver (configurable); photos of students require consent flag; no access to SMS data.

#### P11 — Platform Operator
- **Goals:** stable, secure, observable system; safe deployments; quick recovery.
- **Pain points:** manual deployments; noisy alerts; unclear incident processes.
- **JTBD:** deploy; monitor; respond to incidents; rotate secrets; run backups/restores; manage environments.
- **Tech comfort:** 5.
- **Security notes:** no routine access to school data; production data access only via audited break-glass with approval; least-privilege cloud IAM.

---

## 7. Current-State (As-Is) and Future-State (To-Be) Workflows

> As-is descriptions reflect **typical** Indian K-12 practice and shall be validated with the launch school during discovery (ASM-01).

### 7.1 Admissions

| | Description |
|---|---|
| **As-is** | Parent calls or walks in → details written in a register → printed prospectus/form sold at counter → form filled by hand with photocopies of documents → office checks eligibility manually → interaction/test date communicated by phone → decision posted on notice board or by call → admission fee paid at counter → data re-typed into fee software and registers. |
| **Pain points** | Missed follow-ups; no source attribution; queues; lost documents; data re-entry; no visibility for management; enquiries data kept indefinitely on paper. |
| **To-be** | 1. Enquiry captured from website form, WhatsApp click-to-chat, walk-in or phone, with UTM/source and contact consent. 2. Auto-acknowledgement sent; counsellor auto-assigned; follow-up task due within 24 h. 3. Parent completes mobile-friendly online application (OTP-verified mobile, save-and-resume, document upload) and pays the application fee by UPI. 4. Office screens in a pipeline (Kanban) view; schedules interaction; records outcome. 5. Offer sent; admission fee paid online. 6. One click converts the applicant into an enrolled student with guardian accounts — **no re-entry**. 7. Unsuccessful applicant data is purged/anonymised per retention policy. |
| **Key BRs** | BR-065 – BR-074, BR-079, BR-029–BR-031 |

### 7.2 Student Onboarding

| | Description |
|---|---|
| **As-is** | Admitted student details copied into registers; section allotted manually; roll numbers assigned; parents given printed timetable and fee card; ID card details collected separately. |
| **Pain points** | Repeated collection of the same data; errors in names/DOB; parents not onboarded to any digital channel. |
| **To-be** | 1. Student record created from application. 2. Section, roll number, house allotted (bulk tools). 3. Fee structure auto-applied by class/category with concessions requested via workflow. 4. Guardian accounts invited by SMS/WhatsApp link; parent completes consent and profile verification. 5. Welcome pack (timetable, calendar, fee schedule) available in the parent app. |
| **Key BRs** | BR-029 – BR-032, BR-010, BR-075, BR-077, SBR-030 |

### 7.3 Daily Attendance

| | Description |
|---|---|
| **As-is** | Class teacher calls roll and marks a paper register; office compiles totals; absent students' parents are rarely informed same day. |
| **Pain points** | Time-consuming; no real-time view; safety risk (unexplained absence not flagged); monthly percentage computed by hand. |
| **To-be** | 1. Class teacher opens the "Today" screen on phone → section pre-loaded with everyone marked Present. 2. Taps the few absent/late students → Submit (≤ 30 s). Works offline and syncs. 3. Parents of absent students notified automatically after a configurable delay. 4. Principal dashboard shows school-wide attendance by 10:00 with sections not yet marked. 5. Approved leave auto-reflects; chronic-absence and threshold alerts generated. |
| **Key BRs** | BR-048 – BR-053, BR-050, DEMO-03 |

### 7.4 Timetable

| | Description |
|---|---|
| **As-is** | Built in a spreadsheet by a senior teacher over days; clashes found after term starts; substitutions arranged by phone each morning. |
| **Pain points** | Clashes; no single published version; substitution chaos. |
| **To-be** | 1. Admin defines bell schedule and periods. 2. Drag-and-drop builder with real-time teacher/room clash detection. 3. Publish to teachers, students, and parents. 4. (v1.1) Mark teacher absent → system suggests free qualified teachers → substitution notified. |
| **Key BRs** | BR-043, BR-044, BR-045 |

### 7.5 Exams and Report Cards

| | Description |
|---|---|
| **As-is** | Teachers enter marks on paper/spreadsheets → class teacher consolidates → office types report cards in Word/Excel → principal signs physically → printed and handed over at PTM. |
| **Pain points** | Weeks of effort; calculation errors; late changes untracked; no analytics. |
| **To-be** | 1. Exam coordinator configures terms, assessments, max marks, weightage, grading scheme. 2. Subject teachers enter marks in a fast grid (only for assigned sections), with validation and autosave; submit & lock. 3. Class teacher reviews consolidated sheet, adds remarks. 4. Principal approves (step-up auth). 5. Branded PDF report cards generated in batch with QR verification; published to parent app with notification. 6. Post-publish changes require principal approval and create a new version; parent notified. |
| **Key BRs** | BR-055 – BR-064, DEMO-05 |

### 7.6 Fee Collection

| | Description |
|---|---|
| **As-is** | Fee cards/challans issued; parents queue at counter or deposit at bank; accountant writes receipts; dues tracked in ledger/spreadsheet; reminders by phone or notes in diaries. |
| **Pain points** | Queues; cash handling risk; late collection; reconciliation effort; disputes over concessions and late fees. |
| **To-be** | 1. Fee structures and instalments configured per class/category. 2. Demands auto-generated; parents see dues in app. 3. Parent pays via UPI/card/netbanking in ≤ 3 taps from the notification; instant digital receipt on WhatsApp/email. 4. Gateway webhooks confirm payments; settlements reconciled automatically. 5. Counter payments recorded with receipt; cashier day-close. 6. Automated, polite reminder cadence; late fees computed per rule; waivers via approval. 7. Accountant exports to accounting software. |
| **Key BRs** | BR-075 – BR-090, DEMO-04 |

### 7.7 Parent Communication

| | Description |
|---|---|
| **As-is** | Class WhatsApp groups run from teachers' personal numbers; paper circulars in diaries; SMS blasts from a separate tool. |
| **Pain points** | Teachers' personal numbers exposed; parents' numbers exposed to each other; children's photos shared uncontrolled; no read tracking; after-hours messaging burden. |
| **To-be** | 1. Notice composed once → target audience (school/class/section/role/individuals) → channels selected (app, WhatsApp, SMS, email) → scheduled. 2. Delivery and read tracking; "acknowledge" option for important circulars. 3. Parent–teacher messaging inside the app within relationship scope and configured hours; no personal numbers exposed. 4. Emergency broadcast with multi-channel fallback. |
| **Key BRs** | BR-091 – BR-098, DEMO-08 |

### 7.8 Website and Notice Publishing

| | Description |
|---|---|
| **As-is** | Website maintained by an external agency; updates take days; notices uploaded as scanned PDFs; images unoptimised. |
| **Pain points** | Stale content; slow mobile pages; poor SEO; dependency and cost. |
| **To-be** | 1. Editor creates news/event/gallery content using brand-safe blocks. 2. Submits for approval; approver previews on mobile/desktop. 3. Scheduled publish; images auto-optimised; SEO metadata prompted. 4. Notices marked "public" in Communication appear on the website automatically. 5. Full version history and rollback. |
| **Key BRs** | BR-099 – BR-110, DEMO-01, DEMO-07 |

### 7.9 Staff Management

| | Description |
|---|---|
| **As-is** | Staff files in cabinets; qualifications and documents scattered; leave tracked on paper; access to systems via shared logins that are not revoked when staff leave. |
| **Pain points** | Compliance gaps (staff qualification records); security risk from shared/orphaned accounts. |
| **To-be** | 1. Staff master with documents (restricted). 2. Role and section/subject assignments drive system permissions automatically. 3. On exit, deactivation revokes all sessions within 1 business day (default: immediately on deactivation). 4. Quarterly access review signed off by principal. 5. (v1.1) Leave applications and staff attendance. |
| **Key BRs** | BR-034 – BR-038, BR-010, BR-014 |

---

## 8. Business Requirements

**How to read the tables:** *Pri* = MoSCoW; *Obj* = the business objective(s) each requirement traces to (Section 4); *Owner* = the business role that accepts the requirement. Every requirement has a **Security & access** column. All requirements also inherit the cross-cutting controls in Section 10: deny-by-default, server-side enforcement, tenant scoping, audit, and PII masking in logs.

**Owner abbreviations:** PO = Product Owner · PRN = Principal · ADM = Office Administrator · ACC = Accountant · SL = Security Lead · DPO = Data Protection Officer / Grievance Officer · ADMH = Admissions Head · MKT = Marketing/Content Lead · EL = Engineering Lead · OPS = Platform Operator · OWN = Owner/Trustee

### 8.1 Shared Kernel — Identity and Access

| ID | Requirement | Rationale | Pri | Phase | Success measure | Owner | Obj | Security & access implications |
|---|---|---|---|---|---|---|---|---|
| BR-001 | The system **shall** provide a single sign-in experience for all portal roles. Staff sign in with email or mobile number; parents sign in with mobile number. One account can hold multiple roles (e.g., a teacher who is also a parent). | One login per person reduces friction and shared accounts. | M | MVP | 100% of users sign in individually; 0 shared accounts in access review | SL | OBJ-01, OBJ-06 | Login responses shall not reveal whether an identifier exists; role switch re-evaluates permissions server-side. |
| BR-002 | The system **shall** enforce a password policy: minimum 12 characters for staff and 10 for parents/students; maximum ≥ 64; all printable/Unicode characters allowed; common/breached passwords rejected against a maintained list; no forced periodic rotation (rotation on suspected compromise). | Modern guidance (NIST SP 800-63B style): length beats complexity rules. | M | MVP | 100% of new passwords pass policy check | SL | OBJ-01 | Passwords hashed with Argon2id (preferred) or bcrypt with tuned cost; never logged or emailed. |
| BR-003 | MFA **shall** be mandatory for Owner, Principal, Admin, Accountant, Content Approver, and Platform Operator roles, and **should** be mandatory for all teachers. The default method is a TOTP authenticator app; SMS/WhatsApp OTP is allowed only as a fallback with documented risk acceptance. Users receive one-time recovery codes. | Privileged accounts are the primary breach targets. | M | MVP | 100% of privileged users enrolled before first access | SL | OBJ-01 | MFA enrolment enforced at first login; MFA reset requires a second admin and is audited. |
| BR-004 | The system **should** support passkeys (WebAuthn) as a phishing-resistant sign-in/MFA method. | Better security and UX on modern phones. | S | v1.1 | ≥ 30% of staff adopt passkeys within 6 months | SL | OBJ-01, OBJ-07 | Passkey registration requires an authenticated session plus step-up. |
| BR-005 | Parents **shall** be able to sign in with mobile number + one-time code, and **may** set a password. OTPs are 6 digits, single-use, expire in ≤ 5 minutes, and are rate-limited. | Parents' tech comfort varies; OTP is familiar in India. | M | MVP | Parent sign-in success rate ≥ 95% | SL | OBJ-06, OBJ-01 | OTP endpoints protected against enumeration, SMS-pumping fraud (per-number, per-IP, and global caps), and brute force. |
| BR-006 | Sessions **shall** use short-lived access tokens (≤ 15 min) and rotating refresh tokens with reuse detection (reuse revokes the token family). Absolute session lifetimes are configurable (defaults: staff 12 h; parents 30 days on a remembered device). Web clients store tokens in `HttpOnly`, `Secure`, `SameSite` cookies. | Limits damage from token theft. | M | MVP | Reuse detection verified by test; 0 tokens in browser-accessible storage | SL | OBJ-01 | CSRF protection required for cookie-based auth; logout revokes the server-side refresh token. |
| BR-007 | The system **shall** throttle authentication: progressive delays; temporary lockout after a configurable number of failures (default 5 in 15 min; lockout 15 min); IP and device rate limits; a challenge/CAPTCHA after repeated failures. Users are notified of lockouts. | Prevents credential stuffing and brute force. | M | MVP | Automated tests prove lockout and rate limits | SL | OBJ-01 | Lockout is time-boxed, with self-service unlock via a verified channel, so an attacker cannot lock a user out indefinitely. |
| BR-008 | Password reset **shall** use single-use, high-entropy tokens that expire in ≤ 15 min, delivered to a verified channel, with generic responses (no user enumeration). A successful reset revokes all sessions and notifies the user on all channels. | Reset flows are a common account-takeover vector. | M | MVP | Pen test finds no reset-flow weaknesses | SL | OBJ-01 | Reset of privileged accounts additionally requires MFA. |
| BR-009 | Users **shall** be able to view and revoke their active sessions and devices. Admins can revoke any user's sessions. New-device sign-ins by staff trigger an alert. | Gives control after loss or theft. | M | MVP | Revocation effective within 60 s | SL | OBJ-01 | Session list shows device, approximate location, and last activity; revocation audited. |
| BR-010 | The system **shall** require step-up authentication (MFA/OTP within the last 5 minutes) for sensitive actions: bulk PII export; role/permission changes; changing guardian contact details; fee refunds or waivers above a threshold; publishing or re-opening results; changing payment/bank settings; disabling MFA. | Protects high-impact actions from session hijack. | M | MVP | 100% of listed actions require step-up (tested) | SL | OBJ-01 | The step-up list is configurable but cannot be reduced below the default set without Security Lead approval. |
| BR-011 | The account lifecycle **shall** cover invitation (time-limited link), activation, role changes, suspension, deactivation, and archival. Staff deactivation revokes all sessions immediately. Parent accounts are linked to students at enrolment and become read-only/archived after withdrawal, per retention rules. | Orphaned accounts are a major risk. | M | MVP | 0 active accounts for exited staff in quarterly review | ADM | OBJ-01 | Staff **cannot** self-register; parents register only against a school-issued invitation or a verified mobile number on record. |
| BR-012 | Authorization **shall** be role-based (RBAC), with a permission catalogue, default system roles (Owner, Principal, Vice-Principal, Admin, Accountant, Exam Coordinator, Class Teacher, Teacher, Content Editor, Content Approver, Admissions Counsellor, Parent, Student, Platform Operator), and custom roles built from permissions. The default is **deny**. | Schools vary in structure; least privilege. | M | MVP | Permission matrix signed off by PRN and SL | SL | OBJ-01 | Permissions enforced in the service layer on every API call; hiding UI elements is cosmetic only. |
| BR-013 | Authorization **shall** also apply resource-level policies: teachers see only assigned sections/subjects; class teachers their own section; parents only their linked children (subject to custody restrictions); students only themselves; accountants only finance data; counsellors only admissions data. Policies apply equally to lists, search, reports, exports, files, and notifications. | Prevents IDOR and over-exposure. | M | MVP | Automated authorization test matrix passes 100% | SL | OBJ-01 | Every object fetch checks ownership/scope; IDs in URLs are non-sequential (UUID/ULID). |
| BR-014 | The system **shall** enforce separation of duties (maker-checker) for fee concessions/waivers, refunds, receipt cancellation, result publication, role assignment, and changes to fee structures after demands are issued. Nobody can approve their own request or raise their own privileges. | Reduces fraud and error. | M | MVP | 0 self-approvals possible (tested) | ACC, PRN | OBJ-01, OBJ-03 | Approval chain configurable per school; approvals audited with reason. |
| BR-015 | The system **shall** generate a quarterly (configurable) access-review report for Principal sign-off, listing users, roles, scopes, last login, and dormant accounts, with one-click deactivation of dormant accounts. | Detects privilege creep. | M | MVP | Review signed every quarter | PRN, SL | OBJ-01, OBJ-02 | Sign-off recorded in the audit trail. |
| BR-016 | Staff **may** sign in with Google Workspace or Microsoft 365 SSO (OIDC) where the school uses them, with MFA enforced by the identity provider or by SchoolPlatform. | Convenience for schools on these suites. | C | v1.1 | ≥ 80% of staff use SSO where enabled | SL | OBJ-07 | Accounts link only to pre-provisioned users; no just-in-time account creation. |

### 8.2 Shared Kernel — Platform Services

| ID | Requirement | Rationale | Pri | Phase | Success measure | Owner | Obj | Security & access implications |
|---|---|---|---|---|---|---|---|---|
| BR-017 | The system **shall** keep an append-only, tamper-evident (hash-chained) audit trail of: sign-ins and failures; MFA events; permission/role changes; create/update/delete of student, guardian, and staff records; attendance; marks/grades; report-card publication; fee structures, invoices, payments, receipts, concessions, refunds; exports; consent changes; settings changes. Each entry records actor, role, timestamp (IST, NTP-synced), action, object, before/after values (sensitive fields masked), IP, user agent, and reason where required. | Accountability, dispute resolution, DPDP compliance, and incident forensics. | M | MVP | 100% of listed events audited; daily integrity check passes | SL | OBJ-01, OBJ-02 | No role, including Platform Operator, can edit or delete audit entries through the application. Audit viewing restricted to Principal, Owner, and Security roles. Retained per RULE-RET-08. |
| BR-018 | The system **shall** provide a notification engine for in-app, email, SMS, WhatsApp, and web push, with templates, variables, per-recipient language, scheduling, quiet hours, retries, channel fallback, and delivery-status tracking. | One engine serves all modules. | M | MVP | ≥ 98% delivery success for transactional messages | PO | OBJ-06 | Messages carry the minimum PII (e.g., "Fee due for Aarav", never marks or health details) and deep-link into the authenticated app. ⚠ Stack flag: needs a background job runner (see INT-12). |
| BR-019 | The system **shall** provide a secure file service: allow-listed file types; per-use size limits; content-type sniffing; malware scan before a file becomes available; image re-encoding (strips EXIF/GPS); private object storage; access only through short-lived signed URLs issued after an authorization check. | Uploads are a frequent attack vector; student photos are sensitive. | M | MVP | 0 publicly guessable file URLs (verified by pen test) | SL | OBJ-01 | Files inherit the permissions of their parent record. Public website media is copied to a separate public bucket only on publish. ⚠ Stack flag: malware scanning needs a scanner container (e.g., ClamAV), which fits the Docker deployment. |
| BR-020 | Admins **shall** manage tenant settings without code changes: school profile, affiliation details, academic-year defaults, time zone (default IST), currency (INR), number/date formats, module on/off switches, document numbering formats, and communication sender identities. | Parameterisation is needed for SaaS reuse. | M | MVP | All listed settings configurable through the UI | ADM | OBJ-10 | Settings changes need the Admin/Principal role and are audited; payment settings also need step-up. |
| BR-021 | Admins **shall** configure branding (logo, favicon, primary/secondary colours, approved font pairing, imagery) on a live-preview theming screen. The system derives accessible colour scales automatically and blocks combinations that fail WCAG 2.2 AA contrast. | Per-school branding is a key selling point. | M | MVP | Re-brand completed in ≤ 10 min in usability testing | MKT | OBJ-07, OBJ-10 | Uploaded logos are sanitised (SVG sanitised or rasterised to prevent script injection). |
| BR-022 | All UI text **shall** be externalised for localisation. MVP ships in English with Indian formats (₹ with lakh/crore grouping, DD-MM-YYYY, IST). Hindi UI **should** ship in v1.1; regional languages **may** follow. | Localisation readiness; parent reach. | M (readiness) / S (Hindi) | MVP / v1.1 | 0 hard-coded strings (lint); Hindi covers 100% of parent screens in v1.1 | PO | OBJ-06 | Translations are treated as content; no executable markup allowed in strings. |
| BR-023 | The portal **shall** offer global search (students, guardians, staff, receipts, applications) that returns only records within the user's authorization scope, with sensitive fields masked in results. | Saves admin time. | S | MVP | Typical lookup in ≤ 3 s | ADM | OBJ-05 | Queries logged without PII; rate-limited to prevent scraping. |
| BR-024 | Admins **shall** bulk-import students, guardians, staff, subjects, and opening fee balances from CSV/XLSX templates, with column mapping, a validation preview, a row-level error report, and atomic commit/rollback. | Essential for go-live data migration. | M | MVP | Launch-school data migrated with < 0.5% manual correction | ADM | OBJ-05 | Imports require step-up; import files are scanned and deleted after a configurable period (default 30 days). |
| BR-025 | Users **shall** be able to export lists and reports (CSV/XLSX/PDF) only within their authorization scope. Bulk exports containing C3/C4 data (Section 10.1) require step-up, are watermarked with user and timestamp, audited, and protected against spreadsheet formula injection. | Exports are a leading leak vector. | M | MVP | 100% of exports audited | SL | OBJ-01 | Export permission is separate from view permission; configurable row limits. |
| BR-026 | The system **shall** provide a single approvals inbox covering concessions, refunds, leave, content publication, admission decisions, profile-change requests, and result publication, with mobile-friendly approve/reject and comments. | Fewer clicks for principals. | S | MVP | Median approval turnaround ≤ 24 h | PRN | OBJ-05, OBJ-07 | Approvers see only the data needed for the decision. |
| BR-027 | The system **shall** provide in-app onboarding: role-specific first-run tours, contextual help, short how-to videos (English; Hindi in v1.1), and a "what's new" panel. | Adoption by non-technical staff. | S | MVP | ≥ 80% of staff complete the onboarding tour | PO | OBJ-07, OBJ-05 | Help content contains no real student data. |
| BR-028 | Consent and preference management **shall** be part of the shared kernel (see SBR-028 – SBR-034), so every module can check consent before processing for purposes that need it (e.g., public display of student photos, promotional messages). | DPDP requires purpose-specific consent. | M | MVP | 100% of consent-dependent features check consent | DPO | OBJ-02 | Consent records are immutable and versioned, with the notice text that was shown. |

### 8.3 People — Students, Guardians, Staff

| ID | Requirement | Rationale | Pri | Phase | Success measure | Owner | Obj | Security & access implications |
|---|---|---|---|---|---|---|---|---|
| BR-029 | The system **shall** maintain a student master record: identity (name, DOB, gender, photo); admission number (unique per tenant); class/section/roll; optional national identifiers (APAAR ID, PEN, UDISE-related fields); address; category (for statutory reporting); medical notes and allergies; previous school; siblings; documents. Every field carries a data classification (C1–C4). | Single source of truth. | M | MVP | 100% of active students have complete mandatory fields | ADM | OBJ-05, OBJ-01 | Health, category/caste, disability, and identifiers are C4 Restricted: visible only to roles with explicit permission, with field-level encryption at rest. Teachers see an alert flag (e.g., "allergy") but not the full medical notes unless permitted. |
| BR-030 | The system **shall** support multiple guardians per student (relationship, primary contact, fee payer, pickup authorisation, communication preference), guardians shared across siblings, and a **custody/access restriction** flag (backed by documentation, classed Restricted) that blocks a specific guardian's portal access and contact. | Family structures vary; court orders must be respected. | M | MVP | Restriction enforced on 100% of access paths (tested) | ADM, PRN | OBJ-01, OBJ-06 | Restriction changes need Principal approval and step-up; a restricted guardian receives no notifications about the child. |
| BR-031 | The system **shall** manage the student lifecycle: applicant → enrolled → promoted/detained → transferred/withdrawn → alumni, with effective dates, reasons, and the effect on fees, attendance, and access. | Accurate records and statutory registers. | M | MVP | 100% of status transitions audited | ADM | OBJ-05 | Parents of withdrawn students lose access to new data but keep access to past receipts and certificates per retention policy. |
| BR-032 | Admins **shall** bulk-allocate sections, roll numbers (alphabetical, admission order, or custom rule), and houses. | Saves time at year start. | S | MVP | Section allocation for one grade in ≤ 5 min | ADM | OBJ-05 | Changes notified to affected parents and teachers. |
| BR-033 | The system **shall** generate certificates from templates (Transfer Certificate, bonafide, character, fee-paid) with tenant-scoped serial numbers, a signature image, and a QR code linking to a verification page that confirms authenticity without revealing extra PII. TC issuance checks dues status per policy (⚖ RULE-FEE-09). | Frequent office task; fraud prevention. | M | MVP | Certificate issued in ≤ 2 min | ADM | OBJ-05 | Verification page rate-limited; QR token non-guessable; cancellations audited, never deleted. |
| BR-034 | The system **shall** maintain staff records: profile, employment type, designation, department, qualifications, joining/leaving dates, documents, emergency contact, and optional sensitive fields (PAN, bank details, Aadhaar — see BR-039). | Staff compliance and administration. | M | MVP | 100% of active staff profiles complete | ADM | OBJ-05 | Sensitive staff fields are C4, visible only to HR/Admin/Owner with permission. |
| BR-035 | Teacher–subject–section assignments **shall** be kept per academic year and **shall** drive authorization scopes automatically (attendance, marks, messaging, homework). | Authorization must follow real responsibilities. | M | MVP | 0 manual permission grants needed for standard teacher access | PRN | OBJ-01, OBJ-05 | Assignment changes take effect immediately and are audited. |
| BR-036 | Parents and staff **shall** be able to request profile changes (address, contact, photo). Changes to identity data (name, DOB) need a supporting document and admin approval. | Keeps data accurate; prevents fraud. | S | MVP | Median approval ≤ 2 working days | ADM | OBJ-05 | Changing contact details requires step-up OTP to both the old and new numbers, and both are notified. |
| BR-037 | Staff **should** apply for leave in-app, with balance tracking and approval routing. | Paper leave is error-prone. | S | v1.1 | ≥ 90% of leave requests digital | PRN | OBJ-05 | Leave reasons (possibly health-related) visible only to approvers. |
| BR-038 | Staff attendance **may** be captured by app check-in (optional geofence) in v1.1, and by biometric devices in Future. | Staff accountability. | C | v1.1 / Future | Adoption ≥ 80% where enabled | PRN | OBJ-05 | Location captured only at check-in, never tracked continuously. Biometric data out of scope for v1 (DPIA required). |
| BR-039 | Aadhaar number **shall not** be mandatory for any workflow. If collected, it is stored encrypted, displayed masked (last 4 digits), never bulk-exported without step-up, and collected only where a lawful basis is confirmed (⚖ Aadhaar Act/regulations). | Data minimisation and legal limits on Aadhaar storage. | M | MVP | 0 unmasked Aadhaar displays (tested) | DPO | OBJ-02, OBJ-01 | C4 Restricted; every access logged. |

### 8.4 Academics — Structure, Timetable, Homework

| ID | Requirement | Rationale | Pri | Phase | Success measure | Owner | Obj | Security & access implications |
|---|---|---|---|---|---|---|---|---|
| BR-040 | Admins **shall** configure academic years (default April–March), terms, working days, holidays, and events. Exactly one academic year is "current" per tenant; past years are read-only. | Indian academic calendar; data integrity. | M | MVP | Year configured in ≤ 30 min | ADM | OBJ-05 | Editing past-year data needs Principal permission and a reason (audited). |
| BR-041 | Admins **shall** configure classes (Nursery/LKG/UKG, I–XII), sections, streams for XI–XII (Science/Commerce/Humanities), subjects (scholastic, co-scholastic, electives, languages), and class–subject mappings. | Reflects Indian K-12 structure. | M | MVP | Launch-school structure configured in ≤ 1 day | ADM | OBJ-05 | Mid-year structural changes restricted to Admin/Principal. |
| BR-042 | The system **shall** support academic-year rollover: create next year by copying the current structure; bulk-promote students per RULE-PROM rules with exceptions (detained, withdrawn); carry forward fee dues; reassign sections; archive the previous year. | A high-stress annual task. | M | MVP | Rollover done in ≤ 1 working day with preview and rollback | ADM, PRN | OBJ-05 | Requires step-up and dual approval (Admin + Principal); fully audited; a dry-run preview is mandatory. |
| BR-043 | Admins **shall** build timetables per section from bell schedules and periods, using drag-and-drop with real-time clash detection (teacher double-booking, room, maximum periods per teacher per day), and publish versions to teachers, students, and parents. | Prevents clashes; one published source. | M | MVP | 0 clashes in the published timetable | ADM | OBJ-05 | Only Admin/timetable coordinator can edit; everyone else sees their own timetable. |
| BR-044 | The system **should** support daily substitution: mark a teacher absent, get suggestions of free teachers by subject and load, then notify the substitute and update the day's timetable. | Daily operational pain. | S | v1.1 | Substitution arranged in ≤ 5 min | ADM | OBJ-05 | The reason for a teacher's absence is not visible to other staff. |
| BR-045 | The system **may** auto-generate timetables from constraints. | Differentiator, but complex. | C | Future | — | PO | OBJ-07 | n/a |
| BR-046 | Teachers **should** post homework/classwork for their assigned sections and subjects, with due date and attachments. Parents and students see it in the app and get a daily digest. | High-frequency driver of parent engagement. | S | MVP | ≥ 60% of teachers post homework weekly | PRN | OBJ-06 | Attachments use the secure file service; teachers can post only to assigned sections. |
| BR-047 | The system **shall** publish a school calendar (holidays, exams, events, PTMs) visible to relevant roles and, optionally, on the public website. | Planning and transparency. | M | MVP | Calendar viewed by ≥ 50% of parents monthly | ADM | OBJ-06 | Public items explicitly marked; internal events never leak to the website. |

### 8.5 Academics — Attendance

| ID | Requirement | Rationale | Pri | Phase | Success measure | Owner | Obj | Security & access implications |
|---|---|---|---|---|---|---|---|---|
| BR-048 | Class teachers **shall** mark daily attendance for their section on a mobile-first screen where every student defaults to Present and the teacher taps only the exceptions. Marking 40 students with ≤ 5 exceptions **shall** take ≤ 30 seconds (p75). Marking **should** work offline and sync when connectivity returns. | Signature UX promise; classrooms often have poor connectivity. | M | MVP | p75 time-to-submit ≤ 30 s (telemetry) | PRN | OBJ-05, OBJ-07 | Only the assigned class teacher (or a delegated substitute) can mark. The offline queue is encrypted in browser storage and cleared on logout. ⚠ Stack flag: offline sync needs a PWA service worker and conflict rules (within the React stack). |
| BR-049 | Attendance codes **shall** be configurable (defaults: Present, Absent, Late, Half-day, Leave-approved, Medical leave). Period-wise attendance is an optional school setting. | Schools vary. | M | MVP | Codes configured without code change | ADM | OBJ-05 | — |
| BR-050 | Guardians of a student marked Absent without approved leave **shall** be notified automatically after a configurable delay (default 30 minutes after submission) on their preferred channel. | Child safety; parent engagement. | M | MVP | ≥ 95% of absence alerts delivered within 1 h | PRN | OBJ-06 | Restricted guardians excluded; message contains no sensitive reason codes. |
| BR-051 | Parents **shall** submit leave requests (dates, reason, optional document); class teachers approve or reject; approved leave applies to attendance automatically. | Replaces diary notes. | M | MVP | ≥ 70% of leave requests digital by term 2 | PRN | OBJ-06, OBJ-05 | Medical documents are C4, visible only to the class teacher and admin. |
| BR-052 | Teachers **shall** be able to edit attendance until a configurable cut-off (default 18:00 IST the same day). Later changes need a class teacher/admin with a mandatory reason and are audited with before/after values. | Integrity of statutory records. | M | MVP | 100% of post-cut-off edits have a reason | PRN | OBJ-01 | Edits audited (BR-017). |
| BR-053 | The system **shall** compute attendance percentages and raise alerts when a student falls below configurable thresholds (default warning at 80%, critical at 75%; board eligibility rules to be confirmed per RULE-ATT-03). It shall also show sections not yet marked by a configurable time (default 10:00). | Exam eligibility and safeguarding. | M | MVP | Alerts raised within 1 h of a threshold breach | PRN | OBJ-05, OBJ-06 | Alerts visible only to the class teacher, principal, and the student's guardians. |
| BR-054 | The system **may** integrate with biometric/RFID/face-recognition devices for student and staff attendance. | Some schools already own devices. | C | Future | — | PO | OBJ-05 | Biometric data is highly sensitive: requires a DPIA, explicit consent, and ⚖ legal review. ⚠ Stack flag: may need an on-premise connector/agent. |

### 8.6 Academics — Exams, Grading, Report Cards

| ID | Requirement | Rationale | Pri | Phase | Success measure | Owner | Obj | Security & access implications |
|---|---|---|---|---|---|---|---|---|
| BR-055 | Exam coordinators **shall** configure assessment structures per class: terms; assessment types (e.g., periodic tests, half-yearly, annual, practical, internal assessment, projects); max marks; components; weightage/aggregation rules. | Boards and schools vary. | M | MVP | Launch-school structure configured without code changes | PRN | OBJ-05 | Structure locks once marks entry begins; changes need Principal approval. |
| BR-056 | Grading schemes **shall** be configurable: marks-to-grade bands (e.g., CBSE-style 8- or 9-point scales), grade points, co-scholastic grading (e.g., A–C), descriptive indicators, rounding rules, and pass criteria. | Multi-board support. | M | MVP | CBSE and one State-board scheme available as templates | PRN | OBJ-05 | — |
| BR-057 | Subject teachers **shall** enter marks, only for their assigned subject-sections, in a keyboard-friendly grid (with a mobile layout) offering validation (≤ max marks; allowed codes such as AB/ML/NA), autosave, paste-from-spreadsheet, a progress indicator, and submit-and-lock. | Speed and accuracy. | M | MVP | Marks for 40 students entered in ≤ 3 min | PRN | OBJ-05 | Teachers cannot see other subjects' marks unless they are the class teacher; locked marks can be edited only through the BR-058 unlock. |
| BR-058 | Results **shall** pass an approval workflow: subject teacher submits → class teacher reviews the consolidated view and adds remarks → exam coordinator/principal approves → publish. Every step is audited; unlock requests need a reason. | Quality control and accountability. | M | MVP | 100% of published results have a full approval trail | PRN | OBJ-01, OBJ-05 | Publishing requires step-up (BR-010). |
| BR-059 | The system **shall** generate branded PDF report cards from configurable templates per class/board, including scholastic and co-scholastic results, attendance, remarks, signatures, and a QR verification code. Batch generation for a class of 50 shall finish in ≤ 2 minutes. | Signature, demo-critical output. | M | MVP | Report cards published within 5 working days of the last exam | PRN | OBJ-05, OBJ-07 | PDFs generated server-side and stored privately; accessible only to the student's authorised guardians and the student. |
| BR-060 | Report cards **shall** be published to the parent/student app with a notification. The school **may** hold online access for specific students (e.g., pending clarification). ⚖ Holding results for unpaid fees must be legally reviewed before it is enabled (RULE-FEE-09). | Flexibility within legal limits. | M | MVP | ≥ 80% of parents view the report card within 72 h | PRN, DPO | OBJ-06 | Holds audited with reason; feature off by default. |
| BR-061 | Changes after publication **shall** require Principal approval with a reason, create a new version (the old one is kept), and notify affected guardians. | Integrity and transparency. | M | MVP | 0 unversioned post-publish changes | PRN | OBJ-01 | Version history visible to Principal and audit roles. |
| BR-062 | The system **should** manage exam timetables, seating plans, and hall tickets. | Common need, but not launch-critical. | S | v1.1 | — | PRN | OBJ-05 | Hall tickets carry minimum PII. |
| BR-063 | The system **should** provide result analytics: subject/section averages, distributions, toppers (internal view), each student's trend across terms, and at-risk student lists. | Academic decision-making. | S | MVP | Principal uses analytics each term | PRN | OBJ-05 | Rankings are staff-only by default; parents see only their own child (no comparative rank unless the school enables it). |
| BR-064 | The system **could** support holistic progress card formats (aligned to NEP 2020 / PARAKH guidance), including self, peer, and teacher assessment sections. | Emerging requirement; board adoption to be verified. | C | v1.1 | — | PRN | OBJ-07 | Peer assessments visible only to teachers. |

### 8.7 Admissions

| ID | Requirement | Rationale | Pri | Phase | Success measure | Owner | Obj | Security & access implications |
|---|---|---|---|---|---|---|---|---|
| BR-065 | The system **shall** capture enquiries from website forms, walk-ins, phone calls, and campaigns, recording source/UTM, class sought, and contact consent. Duplicates are detected by mobile number. | Source attribution; no lost leads. | M | MVP | 100% of enquiries logged with source | ADMH | OBJ-04 | Public forms protected (CAPTCHA/honeypot, rate limits); consent text versioned. |
| BR-066 | Admissions staff **shall** manage enquiries in a pipeline (list + Kanban) with stages, counsellor assignment, follow-up tasks and reminders, notes, call outcomes, and WhatsApp/SMS templates. | Follow-up discipline drives conversion. | M | MVP | ≥ 90% of enquiries followed up within 24 h | ADMH | OBJ-04 | Counsellors see only admissions data, never enrolled students' records. |
| BR-067 | Prospective parents **shall** complete a configurable online application (per class) on mobile, with OTP-verified mobile, save-and-resume, document upload (birth certificate, photo, previous report card, TC), and declaration/consent capture. | Convenience and data quality. | M | MVP | ≥ 70% of started applications completed | ADMH | OBJ-04, OBJ-08 | Uploads malware-scanned; an applicant can reach only their own application through an authenticated session. |
| BR-068 | Applicants **shall** pay application/registration fees online through the payment gateway and receive a receipt. | Removes counter visits. | M | MVP | ≥ 80% of application fees paid online | ACC | OBJ-03, OBJ-04 | Same payment controls as BR-079. |
| BR-069 | The system **shall** support configurable admission stages (screening, document verification, interaction/assessment scheduling, decision, offer, acceptance, admission-fee payment) with notifications at each stage, and one-click conversion of an accepted applicant into an enrolled student with guardian accounts (no re-entry). | End-to-end digital admissions. | M | MVP | 0 re-keyed fields on conversion | ADMH | OBJ-04, OBJ-05 | Decision changes audited; offer letters generated as private PDFs. |
| BR-070 | The system **shall** check age eligibility per class against a configurable cut-off date (RULE-ADM-01) and flag exceptions for approval. | Board/state age norms vary. | M | MVP | 100% of applications checked | ADMH | OBJ-04 | Overrides need Principal approval (audited). |
| BR-071 | The system **could** tag and track applications under reserved categories (e.g., RTE Act Section 12(1)(c) 25% EWS/DG seats where they apply to the school) for reporting, noting that allocation often happens through state portals. ⚖ | Statutory reporting support. | C | v1.1 | — | ADMH, DPO | OBJ-02 | Category data is C4 Restricted. |
| BR-072 | The system **should** manage seat capacity per class/section and waitlists, automatically offering a seat to the next applicant when someone withdraws (manual confirmation configurable). | Avoids over-admission. | S | MVP | 0 over-capacity enrolments without override | ADMH | OBJ-04 | — |
| BR-073 | The system **shall** provide an admissions funnel dashboard by source, class, counsellor, and period, with year-on-year comparison. | Marketing ROI; demo-critical. | M | MVP | Dashboard used weekly in admission season | ADMH, OWN | OBJ-04, OBJ-07 | Owner sees aggregates only; drill-down to individuals restricted to admissions roles. |
| BR-074 | Data of non-converted enquiries and unsuccessful applicants **shall** be deleted or anonymised automatically after configurable periods (RULE-RET-04/05), with notice to the applicant where required. | DPDP storage limitation. | M | MVP | Retention job runs with 0 failures | DPO | OBJ-02 | Anonymised data kept only for aggregate analytics. |

### 8.8 Finance — Fees and Payments

| ID | Requirement | Rationale | Pri | Phase | Success measure | Owner | Obj | Security & access implications |
|---|---|---|---|---|---|---|---|---|
| BR-075 | Accountants **shall** configure fee heads (tuition, admission, annual, development, exam, activity, lab, transport, etc.), fee structures per class and student category, instalment plans (monthly/quarterly/term/annual), and due dates per academic year. | Core finance configuration. | M | MVP | Launch-school fee structures configured without code change | ACC | OBJ-03 | Changes after demands are issued go through maker-checker (BR-014). |
| BR-076 | The system **should** support optional and variable fees: route/stop-based transport fees, activity/club fees, one-time charges, and mid-year joins/exits with pro-rata rules (RULE-FEE-04). | Real-world fee complexity. | S | MVP | 100% of optional fees billed correctly in UAT | ACC | OBJ-03 | — |
| BR-077 | The system **shall** support concessions and scholarships (sibling, staff ward, merit, need-based, management quota) as a percentage or fixed amount per head, with a request → approval workflow and a validity period. | Concession disputes and revenue leakage. | M | MVP | 100% of concessions have an approver | ACC, PRN | OBJ-03, OBJ-01 | Maker-checker; concession reports available to the Owner. |
| BR-078 | The system **shall** generate fee demands/invoices automatically on schedule, numbered sequentially per tenant per financial year, and show them in the parent app. | Ends manual demand slips. | M | MVP | 100% of demands generated on schedule | ACC | OBJ-03 | Parents see only their children's invoices (the fee payer may see all siblings). |
| BR-079 | Parents **shall** pay online through an RBI-authorised payment aggregator/gateway supporting UPI (intent, collect, QR), cards, netbanking, and wallets via hosted/redirect checkout. A payment counts as confirmed only after **server-side verification** (signed webhook + status API), with idempotency, duplicate-payment protection, and automatic reconciliation against settlement reports. | The main driver of collection efficiency. | M | MVP | ≥ 70% of payments online; 0 payments unreconciled > 3 days | ACC | OBJ-03 | SchoolPlatform never stores or processes card data (PCI DSS scope minimised). Webhook signatures verified; amounts computed server-side, never trusted from the client. |
| BR-080 | Accountants **shall** record counter payments (cash, cheque, DD, bank transfer, POS) with a receipt, track cheque status (cleared/bounced, with bounce charges per RULE-FEE-07), and run a cashier day-close report. | Hybrid reality. | M | MVP | Day-close variance = 0 | ACC | OBJ-03 | The counter role cannot change amounts on existing receipts. |
| BR-081 | The system **shall** issue receipts instantly (PDF, sequential, school-branded), deliver them by WhatsApp/email, and make them downloadable in the app. Receipts **shall never be deleted**; they can only be cancelled with a reason and approval, keeping the number. | Trust, audit, legal record. | M | MVP | 100% of receipts delivered within 5 min of confirmation | ACC | OBJ-03, OBJ-01 | Receipt links require authentication or short-lived signed tokens. |
| BR-082 | Late fees **should** be computed automatically per RULE-FEE-05 (fixed, per day, or slab; grace period; cap), with waivers through approval. | Consistency; fewer disputes. | S | MVP | 0 manual late-fee calculations | ACC | OBJ-03 | Waivers go through maker-checker. |
| BR-083 | The system **shall** send automated, polite dues reminders on a configurable cadence (defaults: 7 days before, on the due date, and 3 and 10 days after) through preferred channels, with escalation lists for accountant follow-up. Parents can opt out only of non-mandatory channels. | Better collection without staff effort. | M | MVP | Dues at term end −30% vs baseline | ACC | OBJ-03 | Reminders never disclose dues to students or restricted guardians; Principal reviews the tone of templates. |
| BR-084 | The system **shall** support refunds (full/partial) and adjustments (credit notes, carry-forward) with an approval workflow, linked to the original payment, and initiate gateway refunds where supported. | Common and error-prone. | M | MVP | 100% of refunds linked to approvals | ACC | OBJ-03, OBJ-01 | Step-up above a threshold (default ₹10,000; configurable). |
| BR-085 | The system **shall** provide finance reports: daily collection by mode, day-book, head-wise collection, outstanding/defaulter lists, concession register, refund register, gateway settlement reconciliation, and projections. | Visibility for Owner and Accountant. | M | MVP | Owner checks the collections dashboard weekly | ACC, OWN | OBJ-03 | Owner sees aggregates; individual defaulter lists restricted to finance roles and the Principal. |
| BR-086 | The system **should** export transactions to accounting software (Tally-compatible format and generic CSV) with ledger mapping. | Avoids double entry. | S | v1.1 | Monthly export needs no manual edits | ACC | OBJ-03, OBJ-05 | Export audited; contains no student PII beyond what accounting needs. |
| BR-087 | The system **shall** handle partial and advance payments with allocation rules (oldest due first, or by head priority; RULE-FEE-06). | Real-world payments. | M | MVP | 0 unallocated payments | ACC | OBJ-03 | — |
| BR-088 | The system **should** generate an annual tuition-fee certificate per student for guardians' income-tax claims. ⚖ Format to be confirmed with the accountant. | Frequent parent request in Jan–Mar. | S | MVP | ≥ 70% of requesting parents self-serve | ACC | OBJ-06 | Only the fee-payer guardian can download it. |
| BR-089 | The system **shall** support financial-year closing, carry forward dues and advances, and lock prior periods against edits except through authorised adjustment entries. | Audit readiness. | M | MVP | Year closed in ≤ 1 day | ACC | OBJ-03, OBJ-01 | Period lock enforced server-side. |
| BR-090 | The school **should** be able to configure who bears gateway charges: the school absorbs them, or a convenience fee per payment mode is passed to the parent, subject to gateway/RBI rules. ⚖ | Commercial flexibility; to be confirmed. | S | MVP | Configuration agreed with the client | ACC, OWN | OBJ-03 | Any convenience fee is shown clearly before payment. |

### 8.9 Communication

| ID | Requirement | Rationale | Pri | Phase | Success measure | Owner | Obj | Security & access implications |
|---|---|---|---|---|---|---|---|---|
| BR-091 | Authorised staff **shall** write a notice/circular once and target it to the whole school, classes, sections, roles, transport routes, or individuals; choose channels (app, WhatsApp, SMS, email, web push); schedule it; attach files; request acknowledgement; and track delivered/read/acknowledged status. Notices may be marked "Public" to appear on the website. | Replaces WhatsApp groups and paper. | M | MVP | Notice read rate ≥ 80% within 24 h | PRN | OBJ-06 | Teachers can target only assigned sections; school-wide notices need the Principal/Admin role; the Public flag goes through the CMS approval workflow. |
| BR-092 | Parents and teachers **should** exchange 1:1 in-app messages within relationship scope (the child's class teacher and subject teachers), within configurable hours, with attachments, read status, and Principal visibility on escalation. Personal phone numbers are never exposed. | Protects teachers and families. | S | MVP | ≥ 50% of parent–teacher contact moves in-app by term 2 | PRN | OBJ-06, OBJ-01 | Messages retained per RULE-RET-07; report/flag abuse; no student-to-student messaging in v1. |
| BR-093 | The system **shall** integrate with SMS (TRAI DLT-compliant: registered entity, sender ID/header, and templates), the WhatsApp Business Platform (approved templates, opt-in), and transactional email (SPF, DKIM, DMARC configured). | Indian messaging compliance and deliverability. | M | MVP | ≥ 98% transactional delivery; 0 DLT rejections from template mismatch | PO | OBJ-06, OBJ-02 | Provider credentials in the secrets manager; providers bound by Data Processing Agreements. |
| BR-094 | Principals **shall** send emergency broadcasts (e.g., closures, safety) at high priority, fanning out across channels with fallback (app → WhatsApp → SMS) and bypassing quiet hours. | Safety. | M | MVP | 95% of guardians reached within 15 min | PRN | OBJ-06 | Restricted to Principal/Owner; step-up required; audited. |
| BR-095 | Users **shall** manage communication preferences (language, channels, quiet hours). Transactional and safety messages cannot be fully switched off; promotional messages are opt-in only. | DPDP consent; respect for users. | M | MVP | Preference centre available to 100% of users | DPO | OBJ-02, OBJ-06 | Consent changes logged (SBR-031). |
| BR-096 | The system **should** log every outbound message with status and per-channel cost, and provide monthly usage reports. | Cost control; dispute resolution. | S | MVP | Monthly cost report available | PO, ACC | OBJ-03 | Logs keep template ID and variables, with PII minimised/masked. |
| BR-097 | The system **could** schedule parent–teacher meetings with slot booking. | Popular feature. | C | v1.1 | — | PRN | OBJ-06 | Parents can book only their own child's teachers. |
| BR-098 | The system **should** run surveys and NPS polls for parents and staff. | Measures OBJ-06/07. | S | v1.1 | NPS measured every term | PO | OBJ-06, OBJ-07 | Anonymous option; results shown only for groups of at least 5 (default) to prevent re-identification. |

### 8.10 CMS and Public Website

| ID | Requirement | Rationale | Pri | Phase | Success measure | Owner | Obj | Security & access implications |
|---|---|---|---|---|---|---|---|---|
| BR-099 | Content editors **shall** build pages without code from a library of pre-designed, brand-aware blocks (hero with image/video, stats counters, about, leadership message, facilities, academics, results highlights, testimonials, gallery, events, notices, CTA band, FAQs, contact/map). Blocks are responsive and accessible by construction. | Premium look without agency dependence. | M | MVP | A non-technical editor publishes a new page in ≤ 20 min | MKT | OBJ-08, OBJ-07 | Rich text sanitised server-side (allow-list); editors get no raw HTML/script blocks; embeds only from allow-listed providers (e.g., YouTube, Google Maps). |
| BR-100 | The CMS **shall** support these content types: pages; news/posts; notices; events (date, venue, registration link); gallery albums; banners/announcement bar; downloadable documents (fee schedule, mandatory disclosure, forms); FAQs; optional staff profiles. | Covers a typical school site. | M | MVP | All launch-site content migrated | MKT | OBJ-08 | Staff profiles published only with the staff member's consent. |
| BR-101 | Editors **shall** manage menus (header, footer, quick links) with drag-and-drop ordering and nested items. | Navigation control. | M | MVP | — | MKT | OBJ-08 | — |
| BR-102 | The website **shall** provide SEO tooling: per-page meta title/description; Open Graph/social cards; canonical URLs; clean slugs; a 301-redirect manager; XML sitemap; robots.txt; structured data (School/EducationalOrganization, Event, BreadcrumbList); server-side rendering/static generation. | Organic discovery. | M | MVP | 100% of pages have meta; sitemap valid; Lighthouse SEO ≥ 95 | MKT | OBJ-08 | Draft/preview pages are `noindex` and access-controlled. |
| BR-103 | Content **shall** follow a publishing workflow (draft → in review → approved → scheduled/published → archived) with configurable approvers, preview at device sizes, full version history, compare, and one-click rollback. | Prevents embarrassing errors. | M | MVP | 0 unapproved publications | MKT, PRN | OBJ-08, OBJ-01 | Publish rights limited to the Approver role; audited. |
| BR-104 | The media library **shall** optimise images automatically (responsive sizes, WebP/AVIF, lazy loading), require alt text, support folders/tags, show where each item is used, and require a **"consent confirmed"** flag before publishing images in which students are identifiable. | Performance, accessibility, child privacy. | M | MVP | 100% of published images have alt text; 0 student images without the consent flag | MKT, DPO | OBJ-08, OBJ-02 | EXIF/GPS stripped; originals stored privately; consent withdrawal triggers the takedown workflow (SBR-034). |
| BR-105 | The website **shall** have prominent admissions CTAs and enquiry forms (short form ≤ 5 fields) feeding BR-065, plus WhatsApp click-to-chat and click-to-call. | Conversion. | M | MVP | ≥ 40% of enquiries come from the website | ADMH | OBJ-04, OBJ-08 | Spam protection; data minimisation; consent checkbox never pre-ticked. |
| BR-106 | The website **should** include a mandatory public disclosure section structured to the affiliating board's requirements (e.g., CBSE affiliation bye-laws require disclosure of specified information; to be verified for the launch school's board). | Regulatory expectation. | S | MVP | Disclosure page complete and reviewed | PRN, DPO | OBJ-02 | Disclosure must not include unnecessary personal data. |
| BR-107 | The public website **shall** meet Core Web Vitals "Good" at p75 on mobile (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1) and score ≥ 90 for Lighthouse performance on a mid-range Android profile. | First impressions; SEO. | M | MVP | Measured with RUM/CrUX after launch | EL | OBJ-08, OBJ-07 | The CDN must never cache authenticated or preview content. |
| BR-108 | The CMS **should** support multilingual content (English + Hindi, extendable) with a language switcher and `hreflang`. | Reach. | S | v1.1 | — | MKT | OBJ-08 | — |
| BR-109 | The website **shall** use privacy-respecting analytics with a cookie/consent banner; non-essential cookies are set only after consent. | DPDP consent; trust. | M | MVP | 0 non-essential cookies before consent (tested) | DPO | OBJ-02, OBJ-08 | No third-party ad trackers; no tracking of children inside the authenticated portal (SBR-033). |
| BR-110 | The website **shall** show contact details, map, office hours, social links, and an accessibility statement (WCAG 2.2 AA). | Basic trust signals. | M | MVP | Accessibility audit passed | MKT | OBJ-08, OBJ-07 | — |

### 8.11 Reports and Analytics

| ID | Requirement | Rationale | Pri | Phase | Success measure | Owner | Obj | Security & access implications |
|---|---|---|---|---|---|---|---|---|
| BR-111 | The portal **shall** provide role-specific dashboards. **Owner:** collections, dues, admissions funnel, strength, compliance status. **Principal:** today's attendance, unmarked sections, pending approvals, academic alerts, notices. **Admin:** tasks, enquiries, requests. **Accountant:** collections, dues, reconciliation exceptions. **Teacher:** today's timetable, attendance to mark, marks pending, messages. **Parent:** a card per child with attendance, homework, dues, notices, results. | Clear information hierarchy; demo-critical. | M | MVP | Each persona completes their top task from the dashboard in ≤ 2 clicks | PO | OBJ-07, OBJ-05 | Widgets apply the same authorization as the underlying data; aggregate widgets suppress small counts where re-identification is possible. |
| BR-112 | The system **shall** provide a catalogue of standard reports: student strength (class/section/gender/category); attendance (daily/monthly/defaulters); fee collection and dues; concessions; admissions funnel; results analysis; staff lists; communication delivery. | Operational and management needs. | M | MVP | The top 20 reports requested in discovery are available | PO | OBJ-05 | Access controlled per report; exports per BR-025. |
| BR-113 | The system **could** provide a custom report builder (choose fields, filters, grouping) with saved views and scheduled email delivery. | Power users. | C | v1.1 | — | PO | OBJ-05 | Builder offers only fields the user may see; scheduled emails send links, not PII attachments. |
| BR-114 | The system **could** produce data in the formats needed for statutory/board returns (e.g., UDISE+ fields, board registration lists, APAAR-related data). | Cuts annual reporting effort. | C | Future | — | ADM | OBJ-05, OBJ-02 | Bulk statutory exports need step-up and Principal approval. |
| BR-115 | All reports **should** show an "as of" timestamp and be reproducible for a given date where the data is versioned (attendance, results, fees). | Trust in the numbers. | S | MVP | — | PO | OBJ-05 | — |

### 8.12 Platform and Multi-Tenancy Provisions

| ID | Requirement | Rationale | Pri | Phase | Success measure | Owner | Obj | Security & access implications |
|---|---|---|---|---|---|---|---|---|
| BR-116 | Every tenant-owned record **shall** carry a non-null `tenant_id`. Tenant context **shall** be resolved server-side (request host and authenticated session) and **never** taken from client input. | SaaS readiness without rework. | M | MVP | Schema lint: 100% of tenant-owned tables compliant | EL, SL | OBJ-10, OBJ-01 | The repository layer applies the tenant filter automatically; raw queries prohibited without review. |
| BR-117 | Business-unique fields (admission no., receipt no., invoice no., employee code, usernames) **shall** be unique per tenant, not globally. | Different schools reuse numbering. | M | MVP | Constraint tests pass | EL | OBJ-10 | — |
| BR-118 | Tenant settings, branding, templates, roles, and feature flags **shall** be stored as tenant-scoped data. | Configure, don't code. | M | MVP | A new tenant can be configured without a deploy (verified in staging) | EL | OBJ-10 | — |
| BR-119 | CI **shall** run automated cross-tenant isolation tests against ≥ 2 seeded tenants, covering every API endpoint, file access, search, export, report, background job, and notification path. Any failure blocks release. | Proves isolation continuously. | M | MVP | 100% pass on every release | SL | OBJ-10, OBJ-01 | Tests include attempts to inject foreign `tenant_id` values and object IDs. |
| BR-120 | Platform-operator tooling in v1 **shall** cover environment configuration, deployments, backups/restores, feature flags, and health monitoring. A super-admin portal is **Won't** for v1. | Keeps v1 lean. | M (tooling) / W (portal) | MVP / Future | — | OPS | OBJ-09 | Operators have no default access to tenant data; break-glass procedure per SBR-018. |
| BR-121 | The architecture **should** support per-tenant domains/subdomains with automated TLS certificates; v1 uses the launch school's own domain. | SaaS readiness. | S | Future | — | OPS | OBJ-10 | Host-header validation; tenants resolved only from known domains. |
| BR-122 | The system **should** support full tenant data export and secure deletion (offboarding). | DPDP erasure at contract end; enterprise sales. | S | Future | — | DPO, EL | OBJ-10, OBJ-02 | A deletion certificate is issued; backups expire per retention. |

### 8.13 Service-Level and Operational Business Requirements

| ID | Requirement | Rationale | Pri | Phase | Success measure | Owner | Obj | Security & access implications |
|---|---|---|---|---|---|---|---|---|
| BR-123 | Portal and website **shall** achieve ≥ 99.5% monthly availability, excluding announced maintenance held outside 07:00–21:00 IST. The SaaS phase targets ≥ 99.9%. | Daily operational reliance. | M | MVP | Uptime reports | OPS | OBJ-09 | Maintenance announced ≥ 48 h ahead. |
| BR-124 | Backups **shall** meet RPO ≤ 15 minutes and RTO ≤ 4 hours, be encrypted, be stored in a separate account/location, and be restore-tested at least quarterly. | Resilience to ransomware and failure. | M | MVP | Quarterly restore drill passes | OPS, SL | OBJ-09, OBJ-01 | Backup access restricted and audited; backups follow retention/erasure rules. |
| BR-125 | Portal API reads **should** respond in ≤ 300 ms p95 and writes in ≤ 800 ms p95 under expected peak load (assumed: 2,000 students, 5,000 parent accounts, 30% concurrent on result-publish day). | UX quality at peak moments. | S | MVP | Load test report | EL | OBJ-07, OBJ-09 | Rate limits stop abuse without blocking legitimate peaks. |
| BR-126 | The product **shall** support the current and previous major versions of Chrome, Edge, Safari, Firefox, and Samsung Internet, plus Android 10+ / iOS 16.4+ for PWA features. | The real device landscape. | M | MVP | Cross-browser E2E suite passes | EL | OBJ-07 | Outdated browsers get a secure-upgrade notice instead of degraded, insecure behaviour. |
| BR-127 | The vendor **should** provide support with defined SLAs (defaults: P1 response 1 h / workaround 4 h during school hours; P2 response 4 h; P3 next working day) and a status page. | Trust and adoption. | S | MVP | SLA attainment ≥ 95% | OPS, PO | OBJ-09 | Support staff reach data only through audited, consented sessions. |

---

## 9. Business Rules and Policies

All rules are **tenant-configurable parameters**. The "Default" column is the recommended starting value, which the launch school must confirm. Rules marked ⚖ depend on board, state, or central regulation and require legal/regulatory confirmation before go-live.

### 9.1 Fee Rules

| ID | Rule | Parameter(s) | Recommended default | ⚖ |
|---|---|---|---|---|
| RULE-FEE-01 | A fee structure applies to a student by academic year + class + fee category (e.g., General, Staff ward, Scholarship, RTE). | Categories; effective dates | Categories: General, Staff ward, Sibling, Scholarship, RTE | — |
| RULE-FEE-02 | Each fee head follows an instalment plan with due dates. | Frequency; due day | Quarterly; due on the 10th of the first month of each quarter (Apr, Jul, Oct, Jan) | — |
| RULE-FEE-03 | Concessions apply per head as % or fixed amount; several concessions may stack only if the school allows it, and never below zero. | Stacking allowed (Y/N); max total % | No stacking; highest single concession applies | — |
| RULE-FEE-04 | Mid-year joiners/leavers are billed pro-rata by instalment or by month. | Pro-rata basis | By instalment: full instalment if joining before its due date, otherwise from the next instalment | ⚖ (state fee rules) |
| RULE-FEE-05 | Late fee applies after the due date plus a grace period. | Type (fixed/per-day/slab); grace days; cap | Fixed ₹ amount after 10 grace days, capped per instalment (amount set by school) | ⚖ (state fee regulation may cap) |
| RULE-FEE-06 | Payments are allocated to dues in a configurable order. | Order | Oldest instalment first; within an instalment, tuition first | — |
| RULE-FEE-07 | A bounced cheque reverses its receipt allocation (the receipt is marked bounced, never deleted) and may attract a bounce charge. | Charge amount; block cheque mode after N bounces | Charge set by school; cheque mode blocked after 2 bounces | — |
| RULE-FEE-08 | Refund eligibility depends on fee head and timing (e.g., caution deposit refundable; admission fee non-refundable). | Refundable heads; deadlines | Per school policy, published to parents before payment | ⚖ (state fee regulation; consumer law) |
| RULE-FEE-09 | Withholding TC, results, or report-card access for unpaid dues. | Enabled (Y/N); scope | **Disabled by default.** Enable only after legal confirmation | ⚖ (RTE Act and state rules may restrict, especially for elementary classes) |
| RULE-FEE-10 | Annual fee revision limits. | Max % increase; approval body | No system cap; Owner approval required; warn when % exceeds a configured value | ⚖ (state fee regulation acts, where applicable) |
| RULE-FEE-11 | Amounts are rounded to the nearest rupee at invoice level. | Rounding mode | Round half up at invoice total | — |
| RULE-FEE-12 | Receipt and invoice numbers are sequential per tenant per financial year (April–March), with a configurable prefix. | Prefix; reset cycle | `RCPT/2026-27/000001`; resets each FY | — |
| RULE-FEE-13 | Tax treatment of fee heads (e.g., GST applicability for non-core services such as transport or uniforms). | Taxable heads; rates | Treat all heads as non-taxable until the accountant/CA confirms | ⚖ (GST — CA to confirm) |
| RULE-FEE-14 | Gateway charges borne by school or passed on as a convenience fee. | Bearer; per-mode fee | School absorbs UPI charges; card convenience fee only if the school opts in | ⚖ (gateway/RBI rules) |

### 9.2 Attendance Rules

| ID | Rule | Parameter(s) | Recommended default | ⚖ |
|---|---|---|---|---|
| RULE-ATT-01 | Daily attendance is marked once per day per section (period-wise optional). | Mode | Daily | — |
| RULE-ATT-02 | Edit window for teachers; later edits need class teacher/admin + reason. | Cut-off time | 18:00 IST the same day | — |
| RULE-ATT-03 | Minimum attendance percentage for exam eligibility. | % ; applicable classes; medical exemption rules | 75% (commonly applied board norm for classes X and XII; confirm for the school's board and other classes) | ⚖ (board bye-laws) |
| RULE-ATT-04 | Absence notification delay after submission. | Minutes | 30 | — |
| RULE-ATT-05 | Consecutive-absence alert to the class teacher and principal. | Days | 3 consecutive school days without approved leave | — |
| RULE-ATT-06 | Late-arrival threshold, and whether lates convert to absences. | Minutes; conversion ratio | Late after 15 min past start; no conversion | — |
| RULE-ATT-07 | Half-day counts as a fraction of a day. | Fraction | 0.5 | — |
| RULE-ATT-08 | Holidays and non-working days are excluded from percentage calculations. | Calendar | From the academic calendar (BR-040) | — |

### 9.3 Examination and Grading Rules

| ID | Rule | Parameter(s) | Recommended default | ⚖ |
|---|---|---|---|---|
| RULE-EXM-01 | Each class uses one grading scheme per academic year. | Scheme | Board template (e.g., CBSE-style scale) chosen per class band | ⚖ (board) |
| RULE-EXM-02 | Pass criteria per subject and overall. | Min % per subject; aggregate rule | 33% per subject (common board norm; confirm) | ⚖ (board) |
| RULE-EXM-03 | Rounding of marks and percentages. | Decimal places; mode | Percentages to 2 decimals; grade computed from unrounded value | — |
| RULE-EXM-04 | Grace marks / moderation. | Allowed (Y/N); max | Not allowed unless Principal approves (audited) | ⚖ (board) |
| RULE-EXM-05 | Treatment of absent (AB) / medical (ML) codes in aggregation. | Rule per code | AB = 0 for aggregate; ML excluded from denominator with Principal approval | — |
| RULE-EXM-06 | Publication needs the full approval chain (BR-058). | Approvers | Class teacher → Principal | — |
| RULE-EXM-07 | Rank/position visibility to parents. | Enabled (Y/N) | Disabled (child-wellbeing default) | — |

### 9.4 Promotion, Detention, and Academic-Year Rollover

| ID | Rule | Parameter(s) | Recommended default | ⚖ |
|---|---|---|---|---|
| RULE-PROM-01 | Whether detention is permitted per class, reflecting the applicable no-detention / detention policy (e.g., RTE amendments allowing regular examinations and detention in classes V and VIII where adopted by the state/board). | Detention allowed per class; re-exam window | Detention disabled for all classes until confirmed | ⚖ (central/state policy) |
| RULE-PROM-02 | Promotion criteria where detention is allowed. | Pass criteria; attendance | RULE-EXM-02 + RULE-ATT-03 | ⚖ |
| RULE-PROM-03 | Supplementary/compartment examinations. | Max subjects; schedule | Up to 1–2 subjects as per board; results update promotion status | ⚖ (board) |
| RULE-PROM-04 | Rollover carries forward outstanding dues and advances to the new year. | Carry-forward (Y/N) | Yes, as "previous year dues" head | — |
| RULE-PROM-05 | Section reshuffle at rollover. | Keep / reshuffle | Keep the same section unless admin reshuffles | — |
| RULE-PROM-06 | Students with unresolved status (e.g., pending re-exam) stay in the "provisional" state. | Max days provisional | 45 days | — |

### 9.5 Admission Rules

| ID | Rule | Parameter(s) | Recommended default | ⚖ |
|---|---|---|---|---|
| RULE-ADM-01 | Minimum/maximum age per class as of a cut-off date. | Ages; cut-off date | Class I: 6+ years as of the state-notified cut-off date (NEP 2020 direction; state adoption varies) | ⚖ (state/board) |
| RULE-ADM-02 | Priority criteria (sibling, staff ward, alumni, distance). | Criteria; weights | Sibling and staff-ward flags shown; no automatic scoring | ⚖ (some states regulate criteria) |
| RULE-ADM-03 | Mandatory documents per class. | Document list | Birth certificate, photo, address proof, previous report card (Class II+), TC (Class II+) | — |
| RULE-ADM-04 | Seat-hold period after an offer before it lapses. | Days | 7 days to pay admission fee | — |
| RULE-ADM-05 | Application fee refundability. | Refundable (Y/N) | Non-refundable, stated clearly before payment | ⚖ |
| RULE-ADM-06 | Reserved-seat handling (e.g., RTE 25% EWS/DG) where applicable. | Applicable (Y/N); classes | Tracking only; allocation per state process | ⚖ |

### 9.6 Communication Rules

| ID | Rule | Parameter(s) | Recommended default |
|---|---|---|---|
| RULE-COM-01 | Quiet hours for non-urgent notifications. | Start/end | 21:00–07:00 IST |
| RULE-COM-02 | Parent–teacher messaging hours (outside them, messages queue and an auto-reply shows). | Hours; days | 07:30–18:00, working days |
| RULE-COM-03 | Emergency broadcasts bypass quiet hours and opt-outs for safety messages. | Roles | Principal, Owner |
| RULE-COM-04 | Channel priority for transactional messages. | Order | App push → WhatsApp → SMS → email |
| RULE-COM-05 | Promotional messages need opt-in consent. | — | Opt-in only (never pre-ticked) |

### 9.7 Data Retention Rules (⚖ all periods to be confirmed by legal counsel)

| ID | Data category | Recommended default retention | Action at end | Basis / note |
|---|---|---|---|---|
| RULE-RET-01 | Core student identity and admission/withdrawal register entries | Permanent (statutory register) — minimised alumni record | Reduce to minimal alumni record after exit + 3 years | ⚖ State education rules / board requirements for registers and TC records |
| RULE-RET-02 | Final annual results and issued certificates | Permanent (needed for verification and duplicate certificates) | — | ⚖ |
| RULE-RET-03 | Detailed internal assessments, homework, daily attendance | Enrolment + 3 years | Delete | Storage limitation |
| RULE-RET-04 | Non-converted enquiries | 12 months after last interaction | Delete / anonymise | DPDP purpose limitation |
| RULE-RET-05 | Unsuccessful/withdrawn applications and their documents | 6 months after the admission cycle closes | Delete documents; anonymise record | DPDP storage limitation |
| RULE-RET-06 | Financial records (invoices, receipts, payments, refunds) | 8 years after end of the financial year | Archive, then delete | ⚖ Income-tax / trust / audit requirements (CA to confirm) |
| RULE-RET-07 | In-app messages | 2 years after creation | Delete | Dispute and safeguarding window |
| RULE-RET-08 | Audit trail: security/access events | Minimum 1 year (recommended 3 years) | Delete after period | ⚖ DPDP Rules log-retention requirement; CERT-In Directions (180 days, maintained within India) |
| RULE-RET-09 | Audit trail: academic/financial change events | Same as the underlying record | With the record | Integrity of records |
| RULE-RET-10 | Medical/health notes; custody documents | Enrolment + 1 year | Delete | C4 data minimisation |
| RULE-RET-11 | Guardian contact details | Enrolment + 1 year (fee-payer details kept with financial records) | Delete / minimise | DPDP |
| RULE-RET-12 | Staff records | Employment + 8 years | Archive, then delete | ⚖ Labour/tax law |
| RULE-RET-13 | Application logs (PII-masked) | 180 days | Delete | Operations; CERT-In |
| RULE-RET-14 | Consent records | Life of the processing + 3 years | Delete | Proof of consent ⚖ |
| RULE-RET-15 | Bulk import files | 30 days | Delete | Minimisation |
| RULE-RET-16 | Website images of students | Until consent is withdrawn, or student exit + 3 years | Unpublish and delete | Consent-based |
| RULE-RET-17 | Encrypted backups | 35 days rolling (plus monthly snapshots for 12 months, if required) | Expire | Erased data disappears from backups on expiry (documented) |

---

## 10. Security, Privacy, and Compliance Business Requirements

> **This section has the highest priority in the BRD.** If a requirement here conflicts with any functional, UX, or schedule requirement, this section wins unless the Security Lead and Owner sign a documented risk acceptance. Interpretations of law are **not** legal conclusions; items marked ⚖ require confirmation by qualified Indian legal counsel.

### 10.1 Data Classification

| Class | Description | Examples | Minimum controls |
|---|---|---|---|
| **C1 Public** | Intended for publication | Published website pages, public notices, school contact details | Integrity controls; publishing workflow |
| **C2 Internal** | Operational, low sensitivity | Timetables, class lists without contacts, calendar | Authentication; RBAC |
| **C3 Confidential (PII)** | Personal data of students, guardians, staff | Names with class, contact numbers, addresses, attendance, marks, fee status, photos | RBAC + resource policies; encryption at rest; masked in logs; export controls; audit |
| **C4 Restricted** | Highly sensitive personal data, or data whose exposure causes serious harm | Health/medical notes, disability, custody/court orders, caste/category, Aadhaar/identifiers, bank/PAN, credentials and MFA secrets, biometric (future) | All C3 controls + field-level encryption with managed keys; need-to-know permissions; step-up for access/export; every read logged |

### 10.2 Security Principles

1. **Security over convenience:** no feature ships if it fails a security release gate (10.9).
2. **Deny by default; least privilege;** every access decision is enforced on the server.
3. **Defence in depth:** network, application, data, and process controls stack.
4. **Privacy by design and by default:** minimal collection; the most private settings are the defaults.
5. **Assume breach:** detection, containment, and recovery are designed in up front.
6. **Verifiable:** every control has an automated test, a monitoring signal, or an audit artefact.

### 10.3 Security Business Requirements

#### Governance and secure development

| ID | Requirement | Pri | Phase | Owner | Obj |
|---|---|---|---|---|---|
| SBR-001 | A named **Security Lead** **shall** be accountable for the security programme, with authority to block releases. | M | MVP | OWN | OBJ-01 |
| SBR-002 | A **threat model** (e.g., STRIDE) and a **DPIA** **shall** be completed before MVP build starts and updated for each major feature that touches C3/C4 data. | M | MVP | SL, DPO | OBJ-01, OBJ-02 |
| SBR-003 | The delivery pipeline **shall** include SAST, dependency/SCA scanning, secret scanning, container image scanning, IaC/config scanning, and DAST against staging. Critical/high findings block release unless risk-accepted by the Security Lead. | M | MVP | SL, EL | OBJ-01 |
| SBR-004 | An independent **penetration test** (web, API, PWA, authentication, multi-tenant isolation) **shall** be completed before go-live with zero open critical/high findings, then repeated annually and after major changes. | M | MVP | SL | OBJ-01 |
| SBR-005 | Controls **shall** align with **OWASP ASVS Level 2** across the application (Level 3 recommended for authentication, session management, and payments), and address the **OWASP Top 10**. | M | MVP | SL | OBJ-01 |
| SBR-006 | A **vulnerability disclosure policy** and `security.txt` **shall** be published, with a monitored contact and response SLA (acknowledge within 3 working days). | M | MVP | SL | OBJ-01 |
| SBR-007 | Vulnerabilities **shall** be remediated within SLA: critical ≤ 7 days, high ≤ 30 days, medium ≤ 90 days (from discovery). | M | MVP | EL | OBJ-01 |

#### Authentication and authorization (business-level summary; detail in BR-001 – BR-016)

| ID | Requirement | Pri | Phase | Owner | Obj |
|---|---|---|---|---|---|
| SBR-008 | Strong authentication **shall** be implemented per BR-001 – BR-010: password policy, Argon2id/bcrypt, MFA for privileged roles, short-lived access tokens with rotating refresh tokens, lockout/throttling, secure reset, session/device management, step-up. | M | MVP | SL | OBJ-01 |
| SBR-009 | Authorization **shall** be deny-by-default RBAC plus resource-level policies (BR-012, BR-013), enforced in the service layer for every request, including background jobs, exports, files, and notifications. An automated authorization test matrix (role × endpoint × resource ownership) **shall** run in CI. | M | MVP | SL | OBJ-01 |
| SBR-010 | Object identifiers exposed to clients **shall** be non-sequential, and every object access **shall** check ownership/scope (IDOR prevention). | M | MVP | EL | OBJ-01 |

#### Data protection

| ID | Requirement | Pri | Phase | Owner | Obj |
|---|---|---|---|---|---|
| SBR-011 | All traffic **shall** use TLS 1.2+ (TLS 1.3 preferred) with HSTS (including preload once stable); internal service traffic is encrypted or confined to a private network. | M | MVP | OPS | OBJ-01 |
| SBR-012 | Data at rest **shall** be encrypted: database storage, object storage, and backups. | M | MVP | OPS | OBJ-01 |
| SBR-013 | C4 fields **shall** use application-level field encryption (envelope encryption with keys held in a managed KMS/secrets manager). Where lookups are needed, blind indexes/hashes are used instead of plaintext. | M | MVP | SL, EL | OBJ-01 |
| SBR-014 | Secrets (DB credentials, gateway keys, messaging tokens, signing keys) **shall** live in a secrets manager — never in source code, images, or logs — with rotation at least annually and immediately on suspected exposure. | M | MVP | OPS | OBJ-01 |
| SBR-015 | Primary data and backups **should** be hosted in Indian data centres (recommended trust and sales default). Any processor outside India **shall** be checked against government-notified restrictions on cross-border transfer. ⚖ | S | MVP | DPO, OPS | OBJ-02 |
| SBR-016 | Backups **shall** be encrypted, immutable (or protected against deletion) for the retention window, held in a separate account/location, and restore-tested quarterly (BR-124). | M | MVP | OPS | OBJ-01, OBJ-09 |

#### Application security

| ID | Requirement | Pri | Phase | Owner | Obj |
|---|---|---|---|---|---|
| SBR-017 | The application **shall** implement: server-side input validation for all inputs (schema-based); parameterised queries only (no string-built SQL); context-aware output encoding; HTML sanitisation for rich text; CSRF protection for cookie-authenticated requests; SSRF protection (egress allow-list; no user-supplied URLs fetched server-side without validation); strict CORS allow-list; security headers (CSP without `unsafe-inline` for scripts, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, frame-ancestors); rate limiting per IP/user/tenant on all public and authentication endpoints; secure file upload per BR-019; safe deserialisation; generic error messages without stack traces. | M | MVP | SL, EL | OBJ-01 |
| SBR-018 | Platform operators **shall** have no standing access to tenant data. Production data access needs a **break-glass** request with reason and approval, is time-boxed (default ≤ 4 h), is fully recorded/audited, and is reported to the school's Principal. | M | MVP | SL, OPS | OBJ-01, OBJ-02 |
| SBR-019 | Dependencies and base images **shall** be pinned, kept supported, and patched per SBR-007. A software bill of materials (SBOM) **should** be produced for each release. | M | MVP | EL | OBJ-01 |

#### Tenant isolation

| ID | Requirement | Pri | Phase | Owner | Obj |
|---|---|---|---|---|---|
| SBR-020 | `tenant_id` **shall never** be accepted from client input; it is derived on the server from the resolved host/session (BR-116). | M | MVP | SL | OBJ-01, OBJ-10 |
| SBR-021 | Cross-tenant isolation tests **shall** run on every build (BR-119), and a failing test blocks release. | M | MVP | SL | OBJ-01, OBJ-10 |
| SBR-022 | Caches, search indexes, object-storage paths, queues, rate-limit keys, and signed URLs **shall** all be tenant-scoped. | M | MVP | EL | OBJ-10 |
| SBR-023 | Background jobs and scheduled tasks **shall** carry and re-validate tenant context; jobs without tenant context fail closed. | M | MVP | EL | OBJ-10 |
| SBR-024 | Per-tenant encryption keys and per-tenant restore **should** be supported in the SaaS phase. | S | Future | SL | OBJ-10 |

#### Audit, logging, and monitoring

| ID | Requirement | Pri | Phase | Owner | Obj |
|---|---|---|---|---|---|
| SBR-025 | The audit trail (BR-017) **shall** be append-only and hash-chained, with periodic anchoring (e.g., daily digest copied to write-once storage) so tampering is detectable. | M | MVP | SL | OBJ-01, OBJ-02 |
| SBR-026 | Security monitoring **shall** alert on: authentication failure spikes; logins from new devices for privileged users; privilege changes; bulk exports; unusual data-access volume; webhook signature failures; isolation-guard violations; malware detections. Alerts route to an on-call rota with response SLAs. | M | MVP | SL, OPS | OBJ-01 |
| SBR-027 | Logs **shall** mask PII and never contain passwords, tokens, OTPs, full Aadhaar, or payment credentials. Clocks are NTP-synchronised; logs are retained per RULE-RET-08/13 and maintained in a way that meets CERT-In Directions (⚖ confirm applicability). | M | MVP | SL | OBJ-01, OBJ-02 |

#### Privacy and DPDP Act compliance

| ID | Requirement | Pri | Phase | Owner | Obj |
|---|---|---|---|---|---|
| SBR-028 | The school (as Data Fiduciary) **shall** present a clear, itemised **privacy notice** — data collected, purposes, rights, how to withdraw consent, how to complain to the Data Protection Board, and grievance contact — in English and, on request, in languages listed in the Eighth Schedule of the Constitution. ⚖ | M | MVP | DPO | OBJ-02 |
| SBR-029 | Consent, where it is the basis for processing, **shall** be free, specific, informed, unconditional, and unambiguous, given by clear affirmative action, per purpose. Withdrawing consent shall be as easy as giving it. | M | MVP | DPO | OBJ-02 |
| SBR-030 | For students under 18, the system **shall** obtain and record **verifiable consent of the parent/lawful guardian** before processing that requires consent. Verification uses the school-verified guardian record (from admission documents) plus OTP to the registered mobile. The DPDP Rules provide exemptions for educational institutions for specified processing (e.g., educational activities and child safety); the scope of these exemptions **shall** be confirmed by legal counsel and recorded per processing purpose. ⚖ | M | MVP | DPO | OBJ-02 |
| SBR-031 | All consents and withdrawals **shall** be recorded in an immutable **consent ledger** (who, for whom, purpose, notice version, timestamp, channel, method of verification). | M | MVP | DPO | OBJ-02 |
| SBR-032 | The system **shall** support **data-principal rights** workflows: access (summary of data and processing), correction, completion, updating, erasure (subject to legal retention), grievance redressal, and nomination. Requests are tracked with SLA (recommended default: 15 working days; ⚖ confirm against the period prescribed in the DPDP Rules). | M | MVP | DPO | OBJ-02 |
| SBR-033 | The platform **shall not** perform tracking, behavioural monitoring, or targeted advertising directed at children, and **shall not** process children's data in ways likely to harm their well-being. Third-party analytics, ad SDKs, and session-replay tools are prohibited in the portal; website analytics are first-party/privacy-preserving and consent-gated. ⚖ (confirm scope of any educational-institution exemption) | M | MVP | DPO | OBJ-02 |
| SBR-034 | Publishing identifiable student images or names on the website/social media **shall** require recorded guardian consent per purpose. On withdrawal, content is taken down from the website within 72 hours (target), with a takedown log. | M | MVP | DPO, MKT | OBJ-02 |
| SBR-035 | A **data-minimisation review** of every form and report **shall** happen before go-live and annually; fields without a documented purpose are removed. | M | MVP | DPO | OBJ-02 |
| SBR-036 | Retention rules (Section 9.7) **shall** be enforced by automated jobs with reports and exception handling (legal hold). | M | MVP | DPO, EL | OBJ-02 |
| SBR-037 | All processors (hosting, payment gateway, SMS, WhatsApp, email, malware scanning, monitoring) **shall** be engaged under contracts/DPAs covering security safeguards, breach notification, sub-processors, and deletion on termination. | M | MVP | DPO | OBJ-02 |
| SBR-038 | Contact details of the school's DPO/grievance officer (or designated person) **shall** be published on the website and in the app. ⚖ (whether the school is a Significant Data Fiduciary is unlikely but to be confirmed) | M | MVP | DPO | OBJ-02 |

#### Incident response and resilience

| ID | Requirement | Pri | Phase | Owner | Obj |
|---|---|---|---|---|---|
| SBR-039 | A **personal-data breach response procedure** **shall** define detection, triage, containment, evidence preservation, impact assessment, and notification: intimation to the **Data Protection Board of India** and to **affected data principals** without delay, with a detailed report within the period prescribed by the DPDP Rules (72 hours per the Rules as notified; ⚖ confirm), and reporting of cyber incidents to **CERT-In** within 6 hours of noticing where the CERT-In Directions apply (⚖ confirm). | M | MVP | SL, DPO | OBJ-01, OBJ-02 |
| SBR-040 | An **incident response plan** with roles (incident commander, communications, legal, technical), contact trees, and pre-approved parent communication templates **shall** exist, with at least one tabletop drill before go-live and annually. | M | MVP | SL | OBJ-01 |
| SBR-041 | Staff **shall** complete security and privacy awareness training (phishing, passwords/MFA, handling children's data, device hygiene) at onboarding and annually; completion is tracked. | M | MVP | PRN, SL | OBJ-01, OBJ-02 |
| SBR-042 | An acceptable-use policy for staff devices **shall** define how the portal may be used on personal phones (screen lock required, no screenshots/exports of C3/C4 to personal chat apps, report lost devices to trigger session revocation). | S | MVP | PRN, SL | OBJ-01 |
| SBR-043 | IT Act obligations **shall** be reviewed by counsel, including: s.43A and the SPDI Rules, 2011 (to be superseded as DPDP provisions commence — s.44(2) of the DPDP Act omits s.43A ⚖ confirm timing); s.72A (disclosure in breach of lawful contract); and the CERT-In Directions (April 2022) on incident reporting, log retention, and clock sync. | M | MVP | DPO | OBJ-02 |

### 10.4 DPDP Act 2023 — Implications Map

| DPDP obligation (summary, not legal text) | Implication for SchoolPlatform | Covered by | ⚖ |
|---|---|---|---|
| Notice before or at the time of seeking consent | Versioned, itemised notice in the parent onboarding and admissions flows | SBR-028, BR-067 | Notice text by counsel |
| Lawful basis: consent or "certain legitimate uses" | Map every processing purpose to a basis; consent only where needed | SBR-029, DPIA | Yes |
| Children's data: verifiable parental consent; no harmful processing; no tracking/behavioural monitoring/targeted ads | Guardian verification + OTP; consent ledger; no ad/analytics trackers in the portal | SBR-030, SBR-031, SBR-033 | Yes — exemptions for educational institutions |
| Reasonable security safeguards | All of Section 10.3 | SBR-001 – SBR-027 | — |
| Breach intimation to the Board and affected principals | Breach procedure and templates | SBR-039, SBR-040 | Timelines |
| Erase data when purpose is served / consent withdrawn (subject to law) | Automated retention and erasure jobs | SBR-036, RULE-RET-* | Retention periods |
| Data-principal rights and grievance redressal | Privacy request workflow with SLA; published grievance contact | SBR-032, SBR-038 | SLA |
| Processor obligations | DPAs with all vendors | SBR-037 | Contract templates |
| Cross-border transfer restrictions (government-notified) | India hosting preferred; vendor location checks | SBR-015 | Yes |
| Accuracy and completeness | Profile-change workflows; parent self-service correction | BR-036, SBR-032 | — |

### 10.5 Children's Data Handling Principles

1. Collect only what is needed for education, safety, statutory reporting, and fees.
2. Students get no social features in v1 (no student-to-student messaging, public profiles, or comments).
3. Comparative performance (ranks) is hidden from parents by default (RULE-EXM-07).
4. Images of children are published only with guardian consent, with EXIF/GPS stripped; full names are not shown alongside photos by default.
5. Health, custody, and category data are C4 with need-to-know access.
6. Notifications never include sensitive details; recipients sign in to see them.
7. The product carries no advertising, sells no data, and uses no child data for training analytics/AI models without a DPIA and explicit lawful basis.

### 10.6 Parental Consent Flow (MVP)

1. **Admission** captures guardian identity, relationship, and mobile number, checked by the office against documents → guardian record marked *verified*.
2. **Invitation** sent to the verified mobile number → guardian signs in with OTP (proving control of the number).
3. **Privacy notice** displayed (versioned); guardian reviews purposes split into: (a) processing under legitimate use/exemption (informational, with ⚖ basis confirmed); (b) optional consents (e.g., photo publication on website/social media, promotional messages, optional data like extracurricular profiles).
4. Guardian gives or declines each optional consent individually → stored in the consent ledger.
5. Guardian can change consents at any time from **Settings → Privacy**; dependent features react immediately (e.g., photo flagged for takedown).
6. When the student turns 18, the system prompts for re-consent directly from the student for ongoing optional processing. ⚖

### 10.7 Breach Response Timeline (target)

| Time from detection | Action | Owner |
|---|---|---|
| T+0 | Alert triaged; incident commander assigned; evidence preservation begins | On-call / SL |
| ≤ T+2 h | Containment (revoke sessions/keys, block vectors); initial impact scoping | SL, OPS |
| ≤ T+6 h | Report to CERT-In if the incident is reportable under its Directions ⚖ | SL |
| Without delay | Intimation to the Data Protection Board and affected data principals (nature, extent, likely impact, mitigation, safety steps for parents) ⚖ | DPO, PRN |
| ≤ T+72 h | Detailed report to the Board per DPDP Rules ⚖ | DPO |
| ≤ T+14 days | Post-incident review; root-cause fix; control improvements; parent communication follow-up | SL, PO |

### 10.8 Business Risk of a Data Breach

| Dimension | Potential impact |
|---|---|
| **Reputational** | Loss of parent trust; media coverage involving minors; withdrawals and lower admissions; for the product, the loss of SaaS sales credibility, likely fatal in early market entry. |
| **Legal / regulatory** | DPDP Act penalties (per the Schedule: up to ₹250 crore for failing to take reasonable security safeguards; up to ₹200 crore for failing to notify a breach; up to ₹200 crore for failing obligations relating to children ⚖ amounts and applicability for counsel to confirm); possible civil claims; board/state education department scrutiny. |
| **Financial** | Incident response, forensics, legal fees, notification costs, remediation, potential refunds/contract penalties, and higher insurance premiums. Cyber-insurance **should** be evaluated (OQ-15). |
| **Operational** | System downtime during containment; manual fallback for attendance/fees; staff time diverted. |
| **Safeguarding** | Exposure of custody arrangements, addresses, or health information could put children at physical risk. This is the most serious harm and the main reason C4 controls exist. |

### 10.9 Security Release Gates (Go-Live Criteria)

Go-live **shall not** proceed unless all of the following are true:

- [ ] Threat model and DPIA completed and signed (SBR-002)
- [ ] Pen test: 0 open critical/high findings (SBR-004)
- [ ] CI security scans green or risk-accepted (SBR-003)
- [ ] 100% of privileged users enrolled in MFA (BR-003)
- [ ] Authorization matrix and tenant isolation suites at 100% pass (SBR-009, SBR-021)
- [ ] Backup restore drill successful within RTO (BR-124)
- [ ] Incident response tabletop completed (SBR-040)
- [ ] Privacy notice, consent texts, and retention schedule approved by counsel (SBR-028, Section 9.7)
- [ ] DPAs signed with all processors (SBR-037)
- [ ] Staff security training ≥ 90% complete (SBR-041)

---

## 11. Brand, UI/UX, and Market-Positioning Requirements

### 11.1 Positioning Statement (draft)

> *For Indian K-12 schools that want to look modern and run smoothly, SchoolPlatform is the beautiful, secure school website and management system in one. Unlike patchwork tools and dated ERPs, it is built security-first for children's data, delights parents on their phones, and lets teachers finish daily tasks in seconds.*

### 11.2 What Makes the Product Sellable

| Pillar | Proof point in the product | Demo moment |
|---|---|---|
| **Looks premium on day one** | Brand theming in minutes; polished public website templates | DEMO-01, DEMO-07 |
| **Parents love it** | One-tap UPI payment, instant receipts, clear child dashboard, WhatsApp-native notifications | DEMO-04 |
| **Teachers save time** | 30-second attendance; fast marks grid; homework in 3 taps | DEMO-03, DEMO-05 |
| **Owners see the money and the pipeline** | Live collections and admissions funnel dashboards | DEMO-02, DEMO-06 |
| **Safe by design** | MFA, audit trail, consent centre, India hosting, DPDP-aligned workflows | Trust Centre walkthrough (DEMO-02) |
| **One system, not five** | Notice published once → website + app + WhatsApp | DEMO-08 |

### 11.3 Design System Requirements

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| UXR-001 | A single design system **shall** serve both the public website and the portal, defined as **design tokens**: colour (brand primary/secondary, neutrals, semantic success/warning/danger/info, surface/elevation), typography (type scale, weights, line heights; Latin and Devanagari-capable font pairing), spacing (4-pt base), radius, elevation/shadow, motion (durations, easing), z-index, and breakpoints. Tokens are the only source of these values in code (Tailwind theme driven by tokens). | M | MVP |
| UXR-002 | Per-tenant theming **shall** override brand tokens (logo, primary/secondary colour, optional accent font from an approved list) at runtime without a code change or redeploy, with automatic generation of accessible tints/shades and contrast validation (BR-021). | M | MVP |
| UXR-003 | A component library **shall** cover at least: buttons, inputs, selects, date pickers (Indian formats), file upload with progress, tables with sort/filter/pagination and mobile card fallback, tabs, modals/drawers, toasts, badges/status chips, avatars, empty states, skeleton loaders, steppers, charts (following one accessible charting standard), command palette, and approval cards. Each component documents states (default/hover/focus/active/disabled/loading/error) and accessibility behaviour. | M | MVP |
| UXR-004 | Light and dark modes **shall** be supported in the portal (system preference by default, user override). The public website **should** support dark mode where the school's theme allows. | M (portal) / S (site) | MVP |
| UXR-005 | Motion **shall** be purposeful (≤ 250 ms for most transitions) and **shall** respect `prefers-reduced-motion`. | M | MVP |
| UXR-006 | Iconography **shall** use one consistent icon set; illustrations for empty states **should** follow a single, warm, school-appropriate style. | S | MVP |
| UXR-007 | Content style guide **shall** define voice (warm, respectful, plain English; avoid jargon), Indian English spellings, number/date/currency formats, and tone for sensitive messages (fee reminders, absence alerts). | M | MVP |

### 11.4 Public Website Requirements

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| UXR-010 | The website **shall** ship with at least **3 professionally designed theme templates** (e.g., *Heritage* — classic/trust; *Modern* — bold/clean; *Vibrant* — primary-school friendly), all built on the same blocks and tokens. | M | MVP |
| UXR-011 | The home page **shall** feature a polished hero (image/video with text overlay meeting contrast rules, primary "Apply for Admission" CTA and secondary "Book a Visit"/"Enquire" CTA), key stats, principal's message, highlights (results, facilities), latest notices/events, gallery strip, testimonials, and a footer with contact/map. | M | MVP |
| UXR-012 | The site **shall** be mobile-first: sticky bottom action bar on phones (Call · WhatsApp · Enquire), thumb-reachable navigation, images sized for mobile, and no horizontal scrolling at 320 px width. | M | MVP |
| UXR-013 | Notices and downloadable documents **should** be HTML-first (readable on phones), with PDF downloads optional. | S | MVP |
| UXR-014 | Gallery **shall** support albums, lightbox with swipe, lazy loading, and captions, with consent rules (BR-104). | M | MVP |
| UXR-015 | Admissions page **shall** clearly present process steps, timelines, age criteria, fee-structure download, FAQs, and the enquiry/application CTA. | M | MVP |

### 11.5 Portal Requirements

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| UXR-020 | Every role **shall** land on a dashboard showing the 3–5 things they need **today**, ordered by urgency, each with a one-tap quick action (e.g., "Mark attendance — 7B", "3 approvals pending", "₹12,500 due — Pay now"). | M | MVP |
| UXR-021 | Frequent tasks **shall** meet click/time budgets: attendance ≤ 30 s; fee payment by parent ≤ 3 taps from notification to UPI app; notice creation ≤ 60 s; homework post ≤ 3 taps + text; receipt lookup ≤ 10 s. | M | MVP |
| UXR-022 | Every list and screen **shall** define meaningful **empty states** (explain + primary action), **loading states** (skeletons, not spinners, for content > 300 ms), and **error states** (plain-language cause, what to do next, retry; no raw error codes or stack traces). | M | MVP |
| UXR-023 | Micro-interactions **should** give satisfying feedback: optimistic updates with undo for reversible actions (e.g., attendance toggle), success confirmations (e.g., subtle celebration on full attendance submitted), progress indicators for batch jobs (report cards). | S | MVP |
| UXR-024 | Forms **shall** use inline validation (React Hook Form + Zod, mirrored by server validation), clear labels (never placeholder-only), save-draft for long forms, and preservation of input on error. | M | MVP |
| UXR-025 | Data tables **shall** support sorting, filtering, saved views, column choice, bulk actions, and responsive card layouts on mobile. | M | MVP |
| UXR-026 | A command palette / quick search (Ctrl/⌘ + K) **should** let staff jump to students, receipts, and actions. | S | MVP |
| UXR-027 | Parents with multiple children **shall** switch child context in one tap, with a clear visual indicator (name, photo, class) of whose data is shown. | M | MVP |
| UXR-028 | Destructive or high-impact actions **shall** use explicit confirmation stating the consequence (e.g., "Publish results for 7A to 42 families?"), never ambiguous "OK/Cancel". | M | MVP |

### 11.6 Mobile and PWA

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| UXR-030 | The portal **shall** be an installable **PWA** (manifest, icons themed per tenant, splash screen) with web push notifications (Android; iOS 16.4+ when installed to home screen). | M | MVP |
| UXR-031 | Offline support **shall** cover: attendance marking with queued sync (BR-048); cached last-viewed timetable, notices, and receipts (C3 data cached only if the device is the user's remembered device, encrypted, and purged on logout). | M | MVP |
| UXR-032 | The parent experience **shall** perform well on low-end Android devices (2–3 GB RAM) over slow 3G/4G: initial portal JS ≤ 200 KB gzipped for the parent shell; images responsive; a **data-saver mode** that defers images. | M | MVP |
| UXR-033 | Touch targets **shall** be ≥ 44 × 44 px for primary actions (WCAG 2.2 minimum is 24 × 24 px; 44 px is the product standard). | M | MVP |
| UXR-034 | Native apps are **Won't** for v1 (⚠ Stack flag: would add a mobile stack; PWA chosen). | W | Future |

### 11.7 Accessibility (WCAG 2.2 AA)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| UXR-040 | All website and portal screens **shall** conform to **WCAG 2.2 Level AA**, verified by automated checks in CI (e.g., axe in Playwright) and manual audits of signature screens with screen readers (NVDA/TalkBack/VoiceOver). | M | MVP |
| UXR-041 | WCAG 2.2-specific criteria **shall** be explicitly tested: Focus Not Obscured (2.4.11), Dragging Movements alternative (2.5.7 — e.g., the timetable builder must offer a non-drag way to assign periods), Target Size Minimum (2.5.8), Consistent Help (3.2.6), Redundant Entry (3.3.7), Accessible Authentication (3.3.8 — allow paste and password managers; OTP autofill; no cognitive puzzles as the only CAPTCHA). | M | MVP |
| UXR-042 | Colour **shall** never be the only carrier of meaning (e.g., attendance status uses icon + text + colour). | M | MVP |
| UXR-043 | Charts **shall** have text alternatives/data tables and accessible palettes. | M | MVP |

### 11.8 Localisation Readiness

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| UXR-050 | Layouts **shall** tolerate 30–40% text expansion and Devanagari script without clipping; fonts **shall** include Devanagari support. | M | MVP |
| UXR-051 | Notification templates **shall** exist per language; recipients get messages in their preferred language when available, otherwise English. | S | v1.1 |
| UXR-052 | Names **shall** support Unicode (including Indian scripts) and not assume first/last name structure (single-name and multi-part names allowed). | M | MVP |

### 11.9 Performance Budgets

| Surface | Metric | Budget (p75 mobile unless stated) |
|---|---|---|
| Public website | LCP | ≤ 2.5 s |
| Public website | INP | ≤ 200 ms |
| Public website | CLS | ≤ 0.1 |
| Public website | Initial JS (gzipped) | ≤ 170 KB |
| Public website | Hero image | ≤ 200 KB in modern formats at mobile width |
| Portal | Time to interactive dashboard (repeat visit, 4G) | ≤ 2.5 s |
| Portal | Route transition | ≤ 500 ms perceived (skeletons) |
| Portal API | Reads / writes p95 | ≤ 300 ms / ≤ 800 ms (BR-125) |
| Report cards | Batch of 50 PDFs | ≤ 2 min (BR-059) |

### 11.10 Signature Demo Flows ("Demo-ability" Lens)

Each signature flow **shall** be scripted, seeded with realistic **synthetic** demo data (never real student data), and tested end-to-end with Playwright so demos never break.

#### DEMO-01 — "Your school, live in 60 seconds" (Public website on mobile)
- **Audience:** Owner/Principal. **Device:** phone.
- **Flow:** Open the school site on a phone → fast hero loads instantly with the school's photo and colours → scroll: stats count up, principal's message, results highlights, gallery swipe, upcoming events → sticky bar: tap "WhatsApp" or "Enquire" → 4-field enquiry form → instant "Thank you" with next steps.
- **Must-haves:** LCP ≤ 2.5 s on throttled 4G; smooth scroll; accessible contrast; enquiry appears in the admissions pipeline in real time on the presenter's laptop (cross-device "wow").
- **Security notes:** form rate-limited; consent checkbox; no trackers before consent.

#### DEMO-02 — Principal's Morning Dashboard + Trust Centre
- **Audience:** Principal/Owner. **Device:** laptop and phone.
- **Flow:** Sign in with MFA (passkey/TOTP shown as a strength) → dashboard: today's attendance 94% with 2 sections not yet marked (nudge button), fee collected this month vs target (progress ring), admissions funnel this season, 3 pending approvals (approve concession with one tap + reason) → open **Trust Centre**: MFA coverage 100%, last backup restore test date, recent sensitive actions in the audit log, consent statistics, data hosted in India.
- **Must-haves:** clear hierarchy; everything at a glance; dark mode toggle; numbers animate in subtly.
- **Security notes:** dashboard aggregates only; audit log read-only; approving needs step-up.

#### DEMO-03 — 30-Second Attendance
- **Audience:** Teachers and Principal. **Device:** phone.
- **Flow:** Teacher opens app → "Mark attendance — Class 7B" card → grid of student photos/names all Present → tap 3 absent, 1 late (haptic + colour + icon) → Submit → success animation → presenter shows parents' phones receiving an absence alert (after demo-shortened delay) and the principal dashboard updating.
- **Must-haves:** timer visible in demo mode; works in airplane mode and syncs when back online; large touch targets.
- **Security notes:** only assigned section visible; offline queue encrypted.

#### DEMO-04 — Parent Pays Fees in Three Taps
- **Audience:** Owner, Accountant, Parents. **Device:** phone.
- **Flow:** WhatsApp/push reminder "Quarter 2 fees due ₹18,500 for Aarav (7B)" → tap → app opens on the dues card (already signed in on remembered device) → "Pay with UPI" → UPI app intent → success → branded receipt instantly in app and WhatsApp → accountant's dashboard shows the payment reconciled.
- **Must-haves:** ≤ 3 taps to the UPI app; transparent breakdown and any convenience fee; receipt downloadable; sibling dues combinable.
- **Security notes:** amount server-computed; payment confirmed via verified webhook; receipt link authenticated.

#### DEMO-05 — Results to Report Cards in Minutes
- **Audience:** Principal, exam coordinator, teachers. **Device:** laptop.
- **Flow:** Subject teacher pastes marks from a spreadsheet → validation highlights one invalid cell → fix → submit → class teacher sees the consolidated sheet with auto-computed grades and adds remarks with suggested phrases → principal approves (step-up) → generate 42 branded PDF report cards with progress bar → publish → parent opens a beautiful mobile report card with a QR verification code.
- **Must-haves:** fast grid; elegant PDF with school branding; version history visible.
- **Security notes:** teacher scope enforced; publish audited; PDFs private.

#### DEMO-06 — Admissions Pipeline
- **Audience:** Owner, admissions head. **Device:** laptop.
- **Flow:** Kanban of enquiries by stage with source tags (Website, Walk-in, Instagram campaign) → drag an enquiry to "Visit scheduled" (with keyboard alternative) → send templated WhatsApp → open a completed online application with documents → accept → one click "Enrol" → student and guardian accounts created → funnel chart updates with year-on-year comparison.
- **Must-haves:** zero re-entry; visible conversion rates by source.
- **Security notes:** counsellor scope; applicant documents malware-scanned and private.

#### DEMO-07 — Re-brand in 60 Seconds (sales demo for SaaS)
- **Audience:** prospective school owners. **Device:** laptop.
- **Flow:** Settings → Branding → upload a logo → system suggests palette from logo → pick a theme template → live preview of website home and parent app side-by-side → publish → both update instantly.
- **Must-haves:** contrast auto-fix; tasteful results with any logo.
- **Security notes:** logo sanitisation; change audited; step-up for publish.

#### DEMO-08 — One Notice, Everywhere
- **Audience:** Principal, admin. **Device:** laptop + phone.
- **Flow:** Compose "Annual Day on 20 Dec" → audience: Classes I–V → channels: App + WhatsApp + Website (public) → attach a poster → schedule now → parent phone receives WhatsApp + push → website "Notices" shows it → delivery/read dashboard fills in live.
- **Must-haves:** composition ≤ 60 s; live delivery stats.
- **Security notes:** public flag goes through approval; WhatsApp template compliant; no student PII in the public notice.

### 11.11 Per-School Branding Requirements

- Branding applies consistently to: website, portal (light/dark), PWA icon/splash, emails, SMS sender header (subject to DLT), WhatsApp business profile (subject to platform approval), PDFs (receipts, report cards, certificates, offer letters), and the login page.
- Brand assets **shall** be managed in one place (BR-021) and versioned.
- "Powered by SchoolPlatform" attribution **may** appear in the footer (configurable per commercial plan; ASM-12).

### 11.12 UX Research and Validation

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| UXR-060 | Usability tests **shall** be conducted with at least 5 users from each of: teachers, office staff, parents (including low tech-comfort), before MVP sign-off, focusing on signature flows. | M | MVP |
| UXR-061 | Target System Usability Scale (SUS) ≥ 80 for staff flows and ≥ 75 for parent flows in pre-launch testing. | S | MVP |
| UXR-062 | Product analytics (first-party, privacy-preserving, no child-level tracking) **should** measure task completion times for the budgets in UXR-021. | S | MVP |

---

## 12. Competitive Landscape

> **Caution:** Everything below is a **hypothesis to verify** through hands-on trials, sales demos, customer interviews, and public documentation before it is used in sales material. No claims are made about any named vendor's capabilities, pricing, or security posture.

### 12.1 Offering Categories (hypotheses)

| Category | Typical strengths (hypothesis) | Typical gaps (hypothesis) | How SchoolPlatform should exploit the gap | How to verify |
|---|---|---|---|---|
| **A. Legacy desktop/on-premise school ERP** | Deep fee and accounting features; long-standing customer relationships; offline operation | Dated UI; weak mobile/parent experience; on-premise backups and security depend on the school; little online payment or website integration | Premium mobile UX, cloud security operated by professionals, integrated website and parent app | Trial installs; interviews with schools using them |
| **B. Broad cloud school ERPs** | Wide module coverage (library, transport, hostel, HR); established sales networks; parent apps | Possible module sprawl and inconsistent UX between modules; configuration heavy; security/privacy posture not always visibly marketed; website often a separate add-on | Consistent design system, "fewer clicks" promise, Trust Centre, integrated CMS | Demo requests; review public docs and app-store reviews (themes, not claims) |
| **C. App-first / communication-first platforms** (often freemium) | Fast onboarding; strong teacher/parent apps; attractive pricing | Possibly shallower finance, exams, or admissions depth; monetisation models may conflict with child-data minimisation (to verify) | Full SMS depth plus no-ads, no-tracking child-data stance | Trials; read privacy policies |
| **D. Agency-built websites + separate ERP** | Custom-looking websites | Websites go stale; no single sign-on or data flow; separate vendors; SEO/performance vary | One platform: notices, events, and admissions flow from the ERP to the website automatically | Audit sample school websites (CWV, update frequency) |
| **E. Informal tools** (WhatsApp groups, Google Forms/Sheets, paper) | Free, familiar | No access control or audit; privacy exposure; no reconciliation | Replace them with equally easy, but safe, flows (WhatsApp-native notifications without exposing phone numbers) | Discovery interviews |

### 12.2 Vendors to Benchmark (names only; no claims made)

Candidates for the market-research benchmark include, among others: Fedena, Entab (CampusCare), Teachmint, MyClassboard, and regional ERP vendors used by schools in the launch school's city. The research team **shall** record findings with sources and dates.

### 12.3 Intended Differentiators

1. **Security and DPDP-readiness as a visible feature** (Trust Centre, MFA by default, consent centre, India hosting).
2. **Premium, consistent UX** across website and portal with per-school branding in minutes.
3. **Website + ERP in one**, with content flowing automatically (notices, events, admissions).
4. **Speed promises** that are measured and demonstrable (30-second attendance, 3-tap fee payment).
5. **Child-first ethics**: no ads, no data selling, no tracking of children.

---

## 13. Monetisation and Commercial Model Considerations

> All items in this section are **assumptions** (ASM-12) for discussion. They are not commitments and need commercial and tax validation (⚖ GST on software/SaaS fees; payment-aggregator rules for any payment-related revenue).

### 13.1 Phase 1 — Single-School Licence (now)

| Component | Assumed model |
|---|---|
| Implementation fee | One-time: discovery, configuration, data migration, training, website content setup |
| Annual licence + support | Annual fee (per-student band or flat), covering hosting, updates, support SLA (BR-127), security testing |
| Messaging | SMS/WhatsApp/email charged at cost-plus or passed through on the school's own provider accounts (school-owned accounts recommended for DLT/WhatsApp ownership) |
| Payment gateway | Merchant account in the school's name; gateway charges per RULE-FEE-14. SchoolPlatform **should not** handle settlement funds (avoids payment-aggregator regulatory obligations ⚖) |
| Custom development | Day-rate change requests, kept outside the product core to protect SaaS reusability |

### 13.2 Phase 2 — SaaS Subscription (future)

| Element | Assumed approach |
|---|---|
| Pricing metric | Per enrolled student per year (INR), with minimum annual fee; billed annually in advance (Indian school budgeting norm — to validate) |
| Tiers (illustrative) | **Essentials:** SMS core (people, attendance, fees, notices, parent app). **Growth:** + admissions CRM, CMS website with templates, exams/report cards. **Premium:** + advanced analytics, custom domain, SSO, priority support, extended audit retention |
| Add-ons | Additional website templates, Hindi/regional localisation packs, messaging bundles, data migration services, onboarding training |
| Trials | Demo tenant with synthetic data (never real data) |
| Sales motion | Demo-led (Section 11.10), principal/owner as buyer, referral programme among school networks |
| Unit-economics drivers | Hosting per tenant; messaging margins; support load per school; onboarding effort (reduce with self-service import, BR-024) |

### 13.3 Commercial Risks

- Price sensitivity in the Indian K-12 market, with freemium competitors (RSK-17).
- Long sales cycles aligned to the academic calendar (decisions often made Jan–Mar for April go-live).
- Cost of security assurance (pen tests, monitoring) must be priced in rather than cut.

---

## 14. Constraints, Dependencies, and Third-Party Integrations

### 14.1 Constraints

| ID | Constraint |
|---|---|
| CON-01 | Technology stack is fixed (React/TypeScript/Tailwind/TanStack Query/RHF+Zod; Next.js for public site; Vite SPA portal; FastAPI/SQLAlchemy/Alembic/Pydantic; MySQL 8 InnoDB utf8mb4; optional Redis; S3-compatible storage; Docker; Nginx with TLS; CI/CD). |
| CON-02 | Modular monolith with router → service → repository layering; security and tenant checks belong in service/repository layers. |
| CON-03 | Security requirements (Section 10) outrank features and schedule. |
| CON-04 | Testing: unit, integration against real MySQL, Playwright E2E; isolation and authorization suites are release gates. |
| CON-05 | Indian regulatory constraints: DPDP Act/Rules, IT Act, CERT-In Directions, TRAI DLT for SMS, WhatsApp Business policies, RBI payment rules. |
| CON-06 | Go-live timing constrained by the academic calendar (avoid exam/result periods; ideally before admission season or the April start). |

### 14.2 Dependencies

| ID | Dependency | Lead-time risk |
|---|---|---|
| DEP-01 | School's TRAI DLT entity registration, sender ID, and template approvals | Medium (can take days to weeks) |
| DEP-02 | WhatsApp Business Platform onboarding via a Business Solution Provider, verified business, template approvals | Medium |
| DEP-03 | Payment gateway merchant onboarding/KYC in the school's/trust's name | Medium |
| DEP-04 | Domain/DNS control for website, email authentication (SPF/DKIM/DMARC) | Low |
| DEP-05 | Data exports from current systems and spreadsheets | High (quality varies) |
| DEP-06 | Legal counsel availability for DPDP review | Medium |
| DEP-07 | Brand assets (logo, photography with consent) | Medium |
| DEP-08 | Independent pen-test vendor booking | Medium |

### 14.3 Integrations

| ID | Integration | Purpose | Phase | Notes / security |
|---|---|---|---|---|
| INT-01 | Payment gateway / aggregator (RBI-authorised) | Online fees and application fees (UPI, cards, netbanking, wallets) | **MVP** | Hosted checkout; signed webhooks; idempotency; settlement report reconciliation; no card data stored |
| INT-02 | SMS provider (DLT-compliant) | OTP, alerts, reminders | **MVP** | DLT templates; OTP abuse caps |
| INT-03 | WhatsApp Business Platform (via BSP) | Notifications, receipts, reminders | **MVP** | Opt-in; approved templates; minimal PII |
| INT-04 | Transactional email service | Notifications, receipts, password reset | **MVP** | SPF/DKIM/DMARC; no sensitive content in body |
| INT-05 | Web Push (VAPID) | PWA push notifications | **MVP** | Payloads contain no PII beyond first name and generic text |
| INT-06 | S3-compatible object storage | Files, media, PDFs, backups | **MVP** | Private buckets; signed URLs; encryption at rest |
| INT-07 | Malware scanning (e.g., ClamAV container) | Upload scanning | **MVP** | Quarantine on detection |
| INT-08 | Maps embed | Website contact/location | **MVP** | Allow-listed embed only |
| INT-09 | CAPTCHA / bot protection (privacy-respecting) | Public forms, auth endpoints | **MVP** | Accessible alternative (UXR-041) |
| INT-10 | Monitoring, logging, APM, uptime | Operations and security monitoring | **MVP** | PII masking before shipping logs; India region preferred |
| INT-11 | KMS / secrets manager | Keys and secrets | **MVP** | Rotation; access audited |
| INT-12 | Background job queue/scheduler (Redis-backed, e.g., ARQ/RQ/Celery) | Notifications, reminders, PDFs, retention jobs, imports | **MVP** | ⚠ Stack flag: makes Redis **required** rather than optional (alternatively a MySQL-backed queue at lower throughput) |
| INT-13 | Server-side PDF generation (e.g., WeasyPrint or headless Chromium) | Receipts, report cards, certificates | **MVP** | ⚠ Stack flag: headless Chromium adds a container dependency; WeasyPrint stays within Python |
| INT-14 | CDN / WAF | Website performance and edge protection | **MVP (should)** | Never cache authenticated content |
| INT-15 | Privacy-friendly web analytics | Website KPIs (OBJ-08) | **MVP** | Consent-gated; no portal tracking of children |
| INT-16 | Accounting export (Tally-compatible / CSV) | Finance | v1.1 | File export; no live integration in v1.1 |
| INT-17 | Google Workspace / Microsoft 365 SSO (OIDC) | Staff sign-in | v1.1 | Pre-provisioned accounts only |
| INT-18 | Biometric / RFID attendance devices | Attendance | Future | DPIA; may need on-premise agent ⚠ |
| INT-19 | DigiLocker (as document issuer) | Issue certificates/report cards digitally | Future | Requires issuer onboarding; to verify feasibility |
| INT-20 | UDISE+ / APAAR / board portals | Statutory data submissions | Future | Likely file-based exports; verify formats |
| INT-21 | Transport GPS | Bus tracking | Future | Location data of children → DPIA |

### 14.4 Stack Flags Summary

| Item | Impact on stated stack | Recommendation |
|---|---|---|
| Background jobs (INT-12) | Redis moves from optional to required | Accept Redis as required for MVP |
| Malware scanning (INT-07) | Additional container | Accept; runs inside the Docker deployment |
| PDF generation (INT-13) | Possible headless browser container | Prefer WeasyPrint (Python); fall back to Chromium if layout fidelity requires |
| Offline attendance (BR-048) | Service worker + IndexedDB in the Vite SPA | Within stack |
| Native apps (UXR-034) | New mobile stack | Deferred; PWA in v1 |
| Biometric connector (BR-054) | Possible on-premise agent | Future, separate component |
| Public site on Next.js | Node runtime alongside FastAPI | Permitted by the stated stack |

---

## 15. Assumptions, Risks, and Open Questions

### 15.1 Assumptions

| ID | Assumption | Impact if wrong |
|---|---|---|
| ASM-01 | The "typical" as-is workflows in Section 7 broadly match the launch school; they will be validated in discovery. | Workflow redesign; scope change |
| ASM-02 | Launch school: K-12, single board (CBSE assumed), approx. 1,500–2,000 students and 100–150 staff. | Sizing, performance, grading templates |
| ASM-03 | Single campus. | Multi-campus requires tenant hierarchy earlier |
| ASM-04 | English-medium instruction; Hindi is the most requested second language. | Localisation priorities |
| ASM-05 | Most parents use Android phones; a meaningful minority on iOS. | PWA push coverage on iOS |
| ASM-06 | The school will own its domain, DLT registration, WhatsApp business number, and payment merchant account. | Dependency delays; ownership disputes |
| ASM-07 | Academic and financial years both run April–March. | Rollover and FY-closing logic |
| ASM-08 | Existing data is available in spreadsheets or exportable from legacy software. | Migration effort |
| ASM-09 | The school will not be notified as a Significant Data Fiduciary. ⚖ | Additional obligations (DPO, audits, DPIA) |
| ASM-10 | Hosting with a cloud provider that has an Indian region. | Data residency claims |
| ASM-11 | The school designates a DPO/grievance contact. | DPDP compliance gap |
| ASM-12 | Commercial models in Section 13 are indicative only. | Pricing/packaging changes |
| ASM-13 | Teachers have smartphones; classroom connectivity is intermittent. | Attendance UX; offline needs |
| ASM-14 | No payroll integration is needed in v1. | Scope change |
| ASM-15 | The vendor operates as Data Processor on behalf of the school (Data Fiduciary). | Contract and liability structure |
| ASM-16 | Budget and team size are not yet known; roadmap windows are indicative. | Timeline |

### 15.2 Risks

Likelihood/Impact scale: Low · Medium · High · Very High.

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| **RSK-01** | **Security / data breach** exposing children's personal data (e.g., via credential stuffing, phishing of staff, IDOR, misconfigured storage, insider export) | Medium | **Very High** (reputational, legal penalties under DPDP, safeguarding harm, loss of SaaS credibility) | Section 10 controls; MFA for staff; authorization and isolation test suites; pen test gate; export controls and monitoring; incident response plan and drills; cyber-insurance evaluation | SL |
| **RSK-02** | **Low adoption by non-technical staff** (office staff, older teachers) leading to paper workarounds and duplicated data | High | High | Signature flows designed for speed; usability testing with low tech-comfort users (UXR-060); role-specific onboarding (BR-027); Hindi help; champions programme; on-site training in the first 2 weeks; phased rollout; measure task times | PO, PRN |
| RSK-03 | Low parent adoption of the app/PWA | Medium | High | WhatsApp-first notifications with deep links; OTP login; invite campaigns at PTMs; fee payment as the "hook"; simple child dashboard | PO |
| RSK-04 | DPDP interpretation uncertainty and phased commencement of the Rules | Medium | High | Early legal review; design for the strictest reasonable reading; configurable consent and retention | DPO |
| RSK-05 | Scope creep (requests for library, transport GPS, payroll in MVP) | High | Medium | MoSCoW discipline; change control; v1.1 backlog | PO |
| RSK-06 | Poor data-migration quality (duplicates, wrong DOBs, missing guardians) | High | Medium | Import validation (BR-024); data-cleansing sprint; parent self-correction (BR-036) | ADM |
| RSK-07 | Messaging compliance delays (DLT, WhatsApp approvals) | Medium | Medium | Start registrations in week 1; email/in-app fallback | PO |
| RSK-08 | Payment gateway onboarding delays or reconciliation errors | Medium | High | Early KYC; sandbox testing; automated reconciliation; manual exception queue | ACC |
| RSK-09 | Single-tenant shortcuts erode multi-tenancy provisions | Medium | High | BR-116–BR-119 as release gates; schema lint; architecture reviews | EL |
| RSK-10 | Third-party outage (gateway, SMS, WhatsApp, cloud) | Medium | Medium | Channel fallback; status monitoring; graceful degradation; clear user messaging | OPS |
| RSK-11 | Performance collapse at peak (result publication, fee due dates) | Medium | High | Load testing (BR-125); staggered notifications; caching of non-sensitive data | EL |
| RSK-12 | Insider misuse (staff exporting or photographing data) | Medium | High | Least privilege; export step-up and watermarking; audit monitoring; AUP and training (SBR-041/042) | SL, PRN |
| RSK-13 | Board/state rule variation makes configuration complex | High | Medium | Parameterised rules (Section 9); board templates; legal flags | PO |
| RSK-14 | Key-person dependency in vendor team | Medium | Medium | Documentation; runbooks; pairing | EL |
| RSK-15 | Messaging cost overrun | Medium | Low | Usage reports (BR-096); prefer app/WhatsApp over SMS; budgets and alerts | ACC |
| RSK-16 | Accessibility non-compliance discovered late | Low | Medium | Automated a11y tests in CI; design-system-level accessibility | UX Lead |
| RSK-17 | Price pressure from freemium competitors (SaaS phase) | High | Medium | Differentiate on security, UX, integrated website; ROI case (collection efficiency) | PO |

### 15.3 Open Questions (with Recommended Defaults)

| ID | Question | Recommended default if unanswered | Needed by |
|---|---|---|---|
| OQ-01 | Which board(s) and class range does the launch school follow? | CBSE, Nursery–XII | Discovery week 1 |
| OQ-02 | Student, staff, and parent counts; expected growth? | 2,000 students / 150 staff / 3,500 guardians | Discovery week 1 |
| OQ-03 | Current fee heads, categories, instalments, late-fee and concession policies? | Quarterly instalments; RULE-FEE defaults | Discovery week 2 |
| OQ-04 | Preferred payment gateway, and who bears transaction charges? | School-owned merchant account; school absorbs UPI charges | Discovery week 2 |
| OQ-05 | Existing SMS/WhatsApp providers; DLT registration status? | Register DLT and WhatsApp in the school's name in week 1 | Week 1 |
| OQ-06 | May TC/results be withheld for dues? | **No** — feature disabled pending legal advice | Before Finance build |
| OQ-07 | MFA method for teachers: TOTP app mandatory, or SMS/WhatsApp OTP acceptable? | TOTP recommended; OTP fallback with risk acceptance | Before Auth build |
| OQ-08 | Is Hindi (or another regional language) required at MVP? | English at MVP; Hindi in v1.1 | Design phase |
| OQ-09 | From which class should students get their own accounts? | Class VI and above; younger students via parent account | Design phase |
| OQ-10 | Which systems and data exist today for migration? | Spreadsheets + legacy fee software export | Discovery week 2 |
| OQ-11 | Hosting preference and data residency requirement? | Indian cloud region; separate backup region in India | Architecture phase |
| OQ-12 | Who writes and who approves website content? | Admin office writes; Principal approves | Design phase |
| OQ-13 | Do existing photo consents exist for students shown on the current website/social media? | Assume none; collect fresh consent before migrating identifiable photos | Before website launch |
| OQ-14 | Retention periods acceptable to the school and counsel? | Section 9.7 defaults | Before go-live |
| OQ-15 | Does the school hold, or want, cyber-insurance? | Evaluate before go-live | Before go-live |
| OQ-16 | Are biometric/RFID devices already installed? | No; Future integration | Discovery |
| OQ-17 | Are transport fees (route-based) needed in MVP? | Yes, fees only (no GPS) | Discovery week 2 |
| OQ-18 | Which accounting software is used? | Tally (export in v1.1) | Discovery |
| OQ-19 | Is a single parent identity needed across multiple schools (SaaS)? | Per-tenant identity in v1; global identity evaluated in v2 | Architecture phase |
| OQ-20 | Target go-live date and budget envelope? | Phased: website + admissions first, full MVP for the next academic-year start | Immediately |
| OQ-21 | Who is the school's DPO/grievance officer? | Principal's office designates a named person | Before go-live |
| OQ-22 | Are reserved seats (e.g., RTE 25%) applicable to the school? | Assume applicable to private unaided schools; tracking only | Discovery |

---

## 16. Release Phasing and High-Level Roadmap

> Windows are **indicative** (ASM-16) and expressed relative to project start. Calendar alignment must avoid exam and result periods. Given today's date (October 2026), a recommended option is a **Release 0** (website + admissions) ahead of the admission season, then the **full MVP** for the start of an academic year (e.g., April 2027 if achievable, otherwise mid-year after term 1 exams). This option needs confirmation against budget and team capacity (OQ-20).

| Phase | Indicative window | Scope | Exit criteria |
|---|---|---|---|
| **Discovery & design** | Weeks 1–6 | Validate workflows and rules; answer OQs; threat model and DPIA; design system and signature-screen prototypes; usability tests on prototypes; start DLT/WhatsApp/gateway onboarding | BRD v1.0 approved; SRS drafted; prototypes SUS ≥ 75 |
| **Release 0 — Website & Admissions** | Weeks 6–16 | Shared kernel (auth/MFA, RBAC, audit, files, theming, notifications basics); CMS & public website; enquiry capture and CRM; online application + application fee | Security gates for in-scope features; CWV targets met; pen test of public surfaces |
| **MVP — Core SMS** | Weeks 12–32 | People; academics structure; timetable; attendance; homework; exams & report cards; finance end-to-end; communication; dashboards and reports; PWA; data migration; training | All Section 10.9 gates; UAT sign-off by Principal, Accountant, Admin; pilot with 2–3 sections for 2 weeks |
| **Hypercare** | 4–6 weeks after go-live | On-site support; adoption tracking; quick fixes | Adoption KPIs trending to OBJ-05/06 targets |
| **v1.1** | 3–6 months after MVP | Passkeys; SSO; Hindi UI; multilingual CMS; substitutions; exam schedule/hall tickets; staff leave and attendance; Tally export; PTM scheduling; surveys/NPS; report builder; holistic progress card | Release-specific acceptance; security regression pass |
| **v2.0 — Multi-tenant SaaS foundation** | 6–12 months after MVP | Tenant provisioning; subdomain/custom domains; platform-operator portal; break-glass tooling; demo tenants; per-tenant feature flags | Isolation pen test passes with ≥ 3 tenants; ops runbooks |
| **v2.1+** | Following | Subscription billing; self-service onboarding; school groups; tenant export/offboarding; per-tenant keys; integrations marketplace; native apps (option) | Commercial readiness |

---

## 17. Glossary

| Term | Meaning |
|---|---|
| **Academic Year (AY)** | The school year, typically April–March in India |
| **Admission number** | Unique identifier assigned to a student on admission (tenant-scoped) |
| **APAAR ID** | Automated Permanent Academic Account Registry — a national student identifier ("One Nation, One Student ID") |
| **Bonafide certificate** | Certificate confirming a student is currently enrolled |
| **BSP** | Business Solution Provider for the WhatsApp Business Platform |
| **CBSE** | Central Board of Secondary Education |
| **CERT-In** | Indian Computer Emergency Response Team, the national agency for cyber-incident response |
| **CISCE / ICSE / ISC** | Council for the Indian School Certificate Examinations; ICSE (Class X) and ISC (Class XII) |
| **Class teacher** | Teacher responsible for a section's attendance, discipline, and consolidated results |
| **Co-scholastic** | Non-academic areas assessed (e.g., arts, sports, values), usually graded |
| **Compartment / supplementary exam** | Re-examination for students who fail in a limited number of subjects |
| **Concession** | A discount on fees (sibling, staff ward, merit, need-based) |
| **Consent Manager** | Under DPDP, a registered entity that lets data principals manage consent across fiduciaries |
| **Core Web Vitals (CWV)** | Google's user-experience metrics: LCP, INP, CLS |
| **Data Fiduciary** | Under DPDP, the entity that determines purpose and means of processing (the school) |
| **Data Principal** | The individual the data relates to; for a child, includes the parent/lawful guardian |
| **Data Processor** | Entity processing data on behalf of a fiduciary (e.g., the SchoolPlatform vendor) |
| **Data Protection Board of India (DPB)** | Adjudicatory body under the DPDP Act |
| **Day-book** | Daily record of all financial transactions |
| **Defaulter list** | List of students/guardians with overdue fees |
| **DigiLocker** | Government digital document wallet; institutions can be issuers |
| **DLT** | Distributed Ledger Technology registration mandated by TRAI for commercial SMS (entity, headers, templates) |
| **DPDP Act** | Digital Personal Data Protection Act, 2023 |
| **DPIA** | Data Protection Impact Assessment |
| **EWS / DG** | Economically Weaker Section / Disadvantaged Group (RTE reserved seats) |
| **Fee head** | A category of fee (tuition, transport, exam, etc.) |
| **Hall ticket / admit card** | Document permitting a student to sit an examination |
| **House system** | Grouping of students into houses for co-curricular competitions |
| **IDOR** | Insecure Direct Object Reference — accessing others' records by changing an ID |
| **Instalment** | Scheduled portion of annual fees |
| **Mandatory public disclosure** | Information that affiliated schools must publish on their website per board rules |
| **MFA / TOTP** | Multi-factor authentication / time-based one-time password (authenticator app) |
| **NEP 2020** | National Education Policy 2020 |
| **PARAKH / HPC** | National assessment centre; Holistic Progress Card formats |
| **PEN** | Permanent Education Number (UDISE+ student identifier) |
| **Periodic Test (PT)** | Regular in-term assessments |
| **Promotion / detention** | Moving a student to the next class / retaining in the same class |
| **PTM** | Parent–Teacher Meeting |
| **PWA** | Progressive Web App — installable web app with offline and push capabilities |
| **RBAC / resource policy** | Role-based access control / per-record access rules (e.g., own section, own child) |
| **Roll number** | A student's sequence number within a section |
| **RPO / RTO** | Recovery Point Objective (max data loss) / Recovery Time Objective (max downtime) |
| **RTE Act** | Right of Children to Free and Compulsory Education Act, 2009 |
| **Scholastic** | Academic subjects assessed with marks/grades |
| **Section** | A division of a class (e.g., 7A, 7B) |
| **Step-up authentication** | Re-verification (MFA/OTP) before a sensitive action |
| **Stream** | Subject grouping in Classes XI–XII (Science, Commerce, Humanities) |
| **Tally** | Widely used accounting software in India |
| **Tenant** | One school (customer) within a multi-tenant platform |
| **Transfer Certificate (TC)** | Document issued when a student leaves, required for admission elsewhere |
| **UDISE+** | Unified District Information System for Education Plus — national school data system |
| **UPI** | Unified Payments Interface — India's real-time payment system |

---

## 18. Appendix — Requirements Traceability Seed Table

Persona codes: P01 Owner/Trustee · P02 Principal · P03 Admin/Office · P04 Accountant · P05 Teacher · P06 Class Teacher · P07 Parent/Guardian · P08 Student · P09 Prospective parent/visitor · P10 Content editor · P11 Platform operator.

| BR ID | Module | Persona(s) | Priority | Phase | Objective(s) |
|---|---|---|---|---|---|
| BR-001 | Kernel – Identity | All | M | MVP | OBJ-01, OBJ-06 |
| BR-002 | Kernel – Identity | All | M | MVP | OBJ-01 |
| BR-003 | Kernel – Identity | P01, P02, P03, P04, P10, P11 (P05, P06 should) | M | MVP | OBJ-01 |
| BR-004 | Kernel – Identity | P02–P06 | S | v1.1 | OBJ-01, OBJ-07 |
| BR-005 | Kernel – Identity | P07 | M | MVP | OBJ-06, OBJ-01 |
| BR-006 | Kernel – Identity | All | M | MVP | OBJ-01 |
| BR-007 | Kernel – Identity | All | M | MVP | OBJ-01 |
| BR-008 | Kernel – Identity | All | M | MVP | OBJ-01 |
| BR-009 | Kernel – Identity | All | M | MVP | OBJ-01 |
| BR-010 | Kernel – Identity | P02, P03, P04, P07 | M | MVP | OBJ-01 |
| BR-011 | Kernel – Identity | P03, P07, P11 | M | MVP | OBJ-01 |
| BR-012 | Kernel – Authorization | All | M | MVP | OBJ-01 |
| BR-013 | Kernel – Authorization | P04, P05, P06, P07, P08 | M | MVP | OBJ-01 |
| BR-014 | Kernel – Authorization | P02, P04 | M | MVP | OBJ-01, OBJ-03 |
| BR-015 | Kernel – Authorization | P01, P02 | M | MVP | OBJ-01, OBJ-02 |
| BR-016 | Kernel – Identity | P02–P06 | C | v1.1 | OBJ-07 |
| BR-017 | Kernel – Audit | P01, P02, P11 | M | MVP | OBJ-01, OBJ-02 |
| BR-018 | Kernel – Notifications | All | M | MVP | OBJ-06 |
| BR-019 | Kernel – Files | All | M | MVP | OBJ-01 |
| BR-020 | Kernel – Tenant settings | P03 | M | MVP | OBJ-10 |
| BR-021 | Kernel – Theming | P01, P10 | M | MVP | OBJ-07, OBJ-10 |
| BR-022 | Kernel – Localisation | P07, P08 | M / S | MVP / v1.1 | OBJ-06 |
| BR-023 | Kernel – Search | P03, P04 | S | MVP | OBJ-05 |
| BR-024 | Kernel – Import | P03, P04 | M | MVP | OBJ-05 |
| BR-025 | Kernel – Export | P02, P03, P04 | M | MVP | OBJ-01 |
| BR-026 | Kernel – Approvals | P02 | S | MVP | OBJ-05, OBJ-07 |
| BR-027 | Kernel – Onboarding | P03, P05, P06, P07 | S | MVP | OBJ-07, OBJ-05 |
| BR-028 | Kernel – Consent | P07 | M | MVP | OBJ-02 |
| BR-029 | People – Students | P03, P06 | M | MVP | OBJ-05, OBJ-01 |
| BR-030 | People – Guardians | P02, P03, P07 | M | MVP | OBJ-01, OBJ-06 |
| BR-031 | People – Lifecycle | P03 | M | MVP | OBJ-05 |
| BR-032 | People – Allocation | P03 | S | MVP | OBJ-05 |
| BR-033 | People – Certificates | P03, P07 | M | MVP | OBJ-05 |
| BR-034 | People – Staff | P01, P03 | M | MVP | OBJ-05 |
| BR-035 | People – Staff assignment | P02, P05, P06 | M | MVP | OBJ-01, OBJ-05 |
| BR-036 | People – Change requests | P03, P07 | S | MVP | OBJ-05 |
| BR-037 | People – Staff leave | P02, P05, P06 | S | v1.1 | OBJ-05 |
| BR-038 | People – Staff attendance | P02, P05 | C | v1.1 / Future | OBJ-05 |
| BR-039 | People – Identifiers | P03, P07 | M | MVP | OBJ-02, OBJ-01 |
| BR-040 | Academics – Year | P03 | M | MVP | OBJ-05 |
| BR-041 | Academics – Structure | P03 | M | MVP | OBJ-05 |
| BR-042 | Academics – Rollover | P02, P03 | M | MVP | OBJ-05 |
| BR-043 | Academics – Timetable | P03, P05, P07, P08 | M | MVP | OBJ-05 |
| BR-044 | Academics – Substitution | P03, P05 | S | v1.1 | OBJ-05 |
| BR-045 | Academics – Auto timetable | P03 | C | Future | OBJ-07 |
| BR-046 | Academics – Homework | P05, P07, P08 | S | MVP | OBJ-06 |
| BR-047 | Academics – Calendar | P03, P07, P09 | M | MVP | OBJ-06 |
| BR-048 | Attendance | P02, P06 | M | MVP | OBJ-05, OBJ-07 |
| BR-049 | Attendance | P03 | M | MVP | OBJ-05 |
| BR-050 | Attendance | P07 | M | MVP | OBJ-06 |
| BR-051 | Attendance | P06, P07 | M | MVP | OBJ-06, OBJ-05 |
| BR-052 | Attendance | P03, P05, P06 | M | MVP | OBJ-01 |
| BR-053 | Attendance | P02, P06, P07 | M | MVP | OBJ-05, OBJ-06 |
| BR-054 | Attendance | P03 | C | Future | OBJ-05 |
| BR-055 | Exams | P02 | M | MVP | OBJ-05 |
| BR-056 | Exams | P02 | M | MVP | OBJ-05 |
| BR-057 | Exams | P05 | M | MVP | OBJ-05 |
| BR-058 | Exams | P02, P05, P06 | M | MVP | OBJ-01, OBJ-05 |
| BR-059 | Exams – Report cards | P02, P07 | M | MVP | OBJ-05, OBJ-07 |
| BR-060 | Exams – Publication | P02, P07 | M | MVP | OBJ-06 |
| BR-061 | Exams – Change control | P02, P07 | M | MVP | OBJ-01 |
| BR-062 | Exams – Schedule/hall tickets | P02, P08 | S | v1.1 | OBJ-05 |
| BR-063 | Exams – Analytics | P02, P06 | S | MVP | OBJ-05 |
| BR-064 | Exams – Holistic card | P02 | C | v1.1 | OBJ-07 |
| BR-065 | Admissions | P03, P09 | M | MVP | OBJ-04 |
| BR-066 | Admissions | P03 | M | MVP | OBJ-04 |
| BR-067 | Admissions | P09 | M | MVP | OBJ-04, OBJ-08 |
| BR-068 | Admissions | P04, P09 | M | MVP | OBJ-03, OBJ-04 |
| BR-069 | Admissions | P02, P03 | M | MVP | OBJ-04, OBJ-05 |
| BR-070 | Admissions | P03 | M | MVP | OBJ-04 |
| BR-071 | Admissions | P03 | C | v1.1 | OBJ-02 |
| BR-072 | Admissions | P03 | S | MVP | OBJ-04 |
| BR-073 | Admissions | P01, P03 | M | MVP | OBJ-04, OBJ-07 |
| BR-074 | Admissions | P09 | M | MVP | OBJ-02 |
| BR-075 | Finance | P04 | M | MVP | OBJ-03 |
| BR-076 | Finance | P04 | S | MVP | OBJ-03 |
| BR-077 | Finance | P02, P04 | M | MVP | OBJ-03, OBJ-01 |
| BR-078 | Finance | P04, P07 | M | MVP | OBJ-03 |
| BR-079 | Finance – Payments | P04, P07 | M | MVP | OBJ-03 |
| BR-080 | Finance – Counter | P04 | M | MVP | OBJ-03 |
| BR-081 | Finance – Receipts | P04, P07 | M | MVP | OBJ-03, OBJ-01 |
| BR-082 | Finance – Late fees | P04 | S | MVP | OBJ-03 |
| BR-083 | Finance – Reminders | P04, P07 | M | MVP | OBJ-03 |
| BR-084 | Finance – Refunds | P04 | M | MVP | OBJ-03, OBJ-01 |
| BR-085 | Finance – Reports | P01, P04 | M | MVP | OBJ-03 |
| BR-086 | Finance – Accounting export | P04 | S | v1.1 | OBJ-03, OBJ-05 |
| BR-087 | Finance – Allocation | P04 | M | MVP | OBJ-03 |
| BR-088 | Finance – Tax certificate | P07 | S | MVP | OBJ-06 |
| BR-089 | Finance – Year close | P04 | M | MVP | OBJ-03, OBJ-01 |
| BR-090 | Finance – Gateway charges | P01, P04, P07 | S | MVP | OBJ-03 |
| BR-091 | Communication – Notices | P02, P03, P07 | M | MVP | OBJ-06 |
| BR-092 | Communication – Messaging | P05, P06, P07 | S | MVP | OBJ-06, OBJ-01 |
| BR-093 | Communication – Channels | P07 | M | MVP | OBJ-06, OBJ-02 |
| BR-094 | Communication – Emergency | P02, P07 | M | MVP | OBJ-06 |
| BR-095 | Communication – Preferences | P07 | M | MVP | OBJ-02, OBJ-06 |
| BR-096 | Communication – Logs/cost | P04, P11 | S | MVP | OBJ-03 |
| BR-097 | Communication – PTM | P05, P07 | C | v1.1 | OBJ-06 |
| BR-098 | Communication – Surveys | P05, P07 | S | v1.1 | OBJ-06, OBJ-07 |
| BR-099 | CMS – Page builder | P10 | M | MVP | OBJ-08, OBJ-07 |
| BR-100 | CMS – Content types | P09, P10 | M | MVP | OBJ-08 |
| BR-101 | CMS – Menus | P10 | M | MVP | OBJ-08 |
| BR-102 | CMS – SEO | P09, P10 | M | MVP | OBJ-08 |
| BR-103 | CMS – Workflow | P02, P10 | M | MVP | OBJ-08, OBJ-01 |
| BR-104 | CMS – Media | P10 | M | MVP | OBJ-08, OBJ-02 |
| BR-105 | CMS – Admissions CTA | P09 | M | MVP | OBJ-04, OBJ-08 |
| BR-106 | CMS – Disclosure | P02, P09 | S | MVP | OBJ-02 |
| BR-107 | CMS – Performance | P09 | M | MVP | OBJ-08, OBJ-07 |
| BR-108 | CMS – Multilingual | P09, P10 | S | v1.1 | OBJ-08 |
| BR-109 | CMS – Analytics/consent | P09 | M | MVP | OBJ-02, OBJ-08 |
| BR-110 | CMS – Contact/a11y | P09 | M | MVP | OBJ-08, OBJ-07 |
| BR-111 | Reports – Dashboards | P01–P07 | M | MVP | OBJ-07, OBJ-05 |
| BR-112 | Reports – Catalogue | P02, P03, P04 | M | MVP | OBJ-05 |
| BR-113 | Reports – Builder | P02, P03 | C | v1.1 | OBJ-05 |
| BR-114 | Reports – Statutory | P03 | C | Future | OBJ-05, OBJ-02 |
| BR-115 | Reports – As-of | P02, P04 | S | MVP | OBJ-05 |
| BR-116 | Platform – Tenancy | P11 | M | MVP | OBJ-10, OBJ-01 |
| BR-117 | Platform – Tenancy | P11 | M | MVP | OBJ-10 |
| BR-118 | Platform – Tenancy | P11 | M | MVP | OBJ-10 |
| BR-119 | Platform – Isolation tests | P11 | M | MVP | OBJ-10, OBJ-01 |
| BR-120 | Platform – Operator tooling | P11 | M / W | MVP / Future | OBJ-09 |
| BR-121 | Platform – Domains | P11 | S | Future | OBJ-10 |
| BR-122 | Platform – Offboarding | P01, P11 | S | Future | OBJ-10, OBJ-02 |
| BR-123 | Operations – Availability | All | M | MVP | OBJ-09 |
| BR-124 | Operations – Backup | P11 | M | MVP | OBJ-09, OBJ-01 |
| BR-125 | Operations – Performance | All | S | MVP | OBJ-07, OBJ-09 |
| BR-126 | Operations – Browser support | All | M | MVP | OBJ-07 |
| BR-127 | Operations – Support SLA | P01, P02, P11 | S | MVP | OBJ-09 |
| SBR-001 – SBR-043 | Security, Privacy & Compliance | All | M (SBR-015, 024, 042 = S) | MVP (SBR-024 Future) | OBJ-01, OBJ-02, OBJ-10 |
| UXR-001 – UXR-062 | Brand & UX | All | Per Section 11 | MVP / v1.1 | OBJ-07, OBJ-08, OBJ-06 |

**Objective coverage check (BRs per objective, from the table above):** OBJ-01 (34 + SBRs) · OBJ-02 (13 + SBRs) · OBJ-03 (18) · OBJ-04 (9) · OBJ-05 (37) · OBJ-06 (19) · OBJ-07 (17 + UXRs) · OBJ-08 (12) · OBJ-09 (5) · OBJ-10 (8 + SBRs). Every objective has at least one requirement, and every BR traces to at least one objective.

---

## Review Checklist

| # | Required section / quality criterion | Status | Location / note |
|---|---|---|---|
| 1 | Document control (version, author, status, change log) | ✅ | Section 1 |
| 2 | Executive summary | ✅ | Section 2 |
| 3 | Business background, problem statement, opportunity | ✅ | Section 3 |
| 4 | Objectives with measurable KPIs (admission conversion, fee efficiency, admin hours, parent engagement, NPS, uptime) | ✅ | Section 4 (OBJ-01 – OBJ-10); baselines flagged as unknown |
| 5 | Scope: in, out, future phases incl. multi-tenant/SaaS roadmap | ✅ | Section 5 (5.4 roadmap, 5.5 v1 tenancy provisions) |
| 6 | Stakeholders and all 11 personas (goals, pain points, JTBD, tech comfort) | ✅ | Section 6 (P01 – P11) |
| 7 | As-is and to-be workflows for all 9 named processes | ✅ | Section 7.1 – 7.9 |
| 8 | Business requirements with description, rationale, MoSCoW, phase, success measure, owner — and security/access implications for each | ✅ | Section 8 (BR-001 – BR-127) |
| 9 | Business rules and policies, parameterised (fees, late fees, concessions, attendance, grading, rollover, promotion/detention, retention) | ✅ | Section 9 |
| 10 | Security, privacy, compliance (DPDP, children's data, parental consent, breach response, audit, retention, breach business risk; IT Act) | ✅ | Section 10; ⚖ items flagged for counsel |
| 11 | Brand, UI/UX, market positioning; demo-critical flows in extra detail; per-school branding | ✅ | Section 11 (UXR-*, DEMO-01 – DEMO-08) |
| 12 | Competitive landscape labelled as hypotheses, no fabricated claims | ✅ | Section 12 |
| 13 | Monetisation (single licence now, SaaS later) marked as assumptions | ✅ | Section 13 |
| 14 | Constraints, dependencies, integrations with MVP vs Future | ✅ | Section 14 (INT-01 – INT-21; stack flags 14.4) |
| 15 | Assumptions, risks (likelihood, impact, mitigation), open questions with defaults | ✅ | Section 15 |
| 16 | Release phasing and roadmap (MVP, v1.1, v2/multi-tenant) | ✅ | Section 16 |
| 17 | Glossary of school-domain terms | ✅ | Section 17 |
| 18 | Traceability seed table (BR → module → persona → priority) | ✅ | Section 18 (adds phase and objective) |
| Q1 | Every BR traceable to a business objective | ✅ | Obj column in Section 8; coverage check in Section 18 |
| Q2 | At least one risk on security/data breach | ✅ | RSK-01 |
| Q3 | At least one risk on UX adoption by non-technical staff | ✅ | RSK-02 |
| Q4 | "shall / should / may" language and unique IDs throughout | ✅ | Conventions in 1.2 |
| Q5 | No invented client facts; gaps captured as assumptions/open questions | ✅ | ASM-01 – ASM-16; OQ-01 – OQ-22 |
| Q6 | Stack respected; stack-changing items flagged | ✅ | ⚠ flags; Section 14.4 |
| Q7 | Legal items flagged, no final legal conclusions | ✅ | ⚖ markers throughout; Section 10 preamble |

*End of document.*
