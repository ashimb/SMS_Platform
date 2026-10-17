# FRD — Needs Your Attention

Notes on [FRD_SchoolPlatform.md](FRD_SchoolPlatform.md) v0.1 (draft, 2026-10-15): items to resolve before the FRD is approved. The BRD-level items in [BRD_Attention_Notes.md](BRD_Attention_Notes.md) are still open and also apply.

## 1. Source document

- [ ] The FRD prompt's `<BRD>` slot was still a placeholder, so the FRD was built from [BRD_SchoolPlatform.md](BRD_SchoolPlatform.md) v0.1.
- [ ] The prompt calls the BRD "approved", but it is still a **draft**. Once the BRD is approved, the FRD must be re-checked against it (CNF-01).

## 2. Legal review (⚖) — FRD "Requirements Needing Client or Legal Clarification", L-01 to L-13

- [ ] L-01 DPDP exemptions for schools: which purposes need verifiable parental consent
- [ ] L-02 Wording of the privacy notice and consent texts
- [ ] L-03 Response deadlines for data-principal requests (default assumed: 15 working days)
- [ ] L-04 Breach notification: Data Protection Board 72-hour report; when CERT-In's 6-hour rule applies
- [ ] L-05 Retention periods and legal holds
- [ ] L-06 Withholding results or Transfer Certificates for unpaid fees (off by default)
- [ ] L-07 Aadhaar collection and storage
- [ ] L-08 Re-consent when a student turns 18
- [ ] L-09 Biometric attendance (future)
- [ ] L-10 Board mandatory-disclosure format; UDISE+/APAAR export formats
- [ ] L-11 State fee-regulation limits; GST on fee heads
- [ ] L-12 Wording of the payment-failure message ("auto-refund in 5–7 days"), to be confirmed with the gateway
- [ ] L-13 Whether RTE reserved seats apply to the school

## 3. Client decisions — C-01 to C-12 (each has a recommended default in the FRD)

- [ ] C-01 Payment gateway, and who pays transaction charges
- [ ] C-02 MFA mandatory for **all** staff, teachers included (recommended)
- [ ] C-03 Which guardians can pay fees; whether partial payments are allowed (default minimum 25%)
- [ ] C-04 Which class student accounts start from (default VI); whether students see their own results
- [ ] C-05 Whether parents see class averages and ranks (default hidden)
- [ ] C-06 How approved leave counts toward attendance %
- [ ] C-07 Tuition-fee certificate format
- [ ] C-08 Managed cloud services vs self-hosted containers; domain layout (`www.` / `portal.`)
- [ ] C-09 Launch website template (default *Modern*); who approves content
- [ ] C-10 WhatsApp receipts sent as a link (default) or as a PDF
- [ ] C-11 Period-wise attendance at MVP (default: daily only)
- [ ] C-12 No real school data in staging for trial migration (recommended)

## 4. Changes to the tech stack (⚠) — FRD §16.4

- [ ] **CNF-02 Redis becomes required** for queues, rate limits, token revocation and scheduler locks
- [ ] **CNF-03 PDF generation:** WeasyPrint in Python preferred; headless Chromium container as the fallback
- [ ] Extra container for virus scanning (ClamAV)
- [ ] CNF-04 iOS Safari has no Background Sync, so offline attendance syncs when the app is reopened
- [ ] CNF-07 A strict CSP needs nonce support in Next.js middleware (hashes for static pages)
- [ ] CNF-08 Biometric devices may need an on-premise connector (future)

## 5. Conflicts between requirements: proposed resolutions need sign-off

- [ ] CNF-05 BRD says MFA "should" apply to teachers; the FRD makes it **mandatory** for all staff
- [ ] CNF-06 The audit hash chain slows writes at SaaS scale; batch anchoring planned for v2
- [ ] CNF-10 30-day parent sessions, allowed only on remembered devices, with step-up checks
- [ ] CNF-11 Results holds allowed, but not for unpaid fees
- [ ] CNF-12 DPDP erasure vs keeping financial records: legal retention takes precedence
- [ ] CNF-13 WhatsApp messages carry links rather than details (data minimisation)
- [ ] CNF-14 Website talks to the API through its own origin

## 6. Security mapping versions

- [ ] CNF-09: FR-SEC items map to **ASVS 5.0 chapter names** and **OWASP Top 10:2021**. The Security Lead should confirm which versions the team will certify against, and re-map if the Top 10 2025 edition is adopted.

## 7. Values the FRD sets that the BRD didn't fix — please review

- [ ] Access token TTL **10 min** (BRD said ≤ 15); idle and absolute session lengths per role (FRD §3.1)
- [ ] Argon2id parameters; OTP and rate-limit numbers (FR-SEC-004, FR-SEC-022)
- [ ] Refunds above ₹50,000 escalate to the Owner; step-up above ₹10,000
- [ ] Performance targets, design-point volumes and load scenarios (FRD §11, §12.8)
- [ ] Tool names (Semgrep, Trivy, k6, ZAP, WeasyPrint, nh3, etc.) are **examples** for the Engineering Lead and Security Lead to confirm
- [ ] Two short-form FRs were added to cover BRD gaps: **FR-EXM-010** (holistic progress card) and **FR-ADM-011** (reserved-seat tracking)

## 8. Deliberately not covered by an FR

- [ ] BR-045 auto-generated timetable (Future); BR-122 tenant offboarding (v2); BR-127 support SLAs (operational, not functional). See FRD §17.3.

## 9. Facts to verify before relying on them

- [ ] DPDP Rules timelines (72-hour report), CERT-In 6-hour reporting, WhatsApp template categories, iOS 16.4+ web push. All are stated as understood, not verified against current official sources.

## 10. Housekeeping

- [ ] The FRD and these notes are not committed to git (nor are the BRD files)
- [ ] Optional: publish the BRD and FRD as shareable docs for reviewers
