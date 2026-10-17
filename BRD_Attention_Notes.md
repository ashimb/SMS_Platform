# BRD — Needs Your Attention

Notes on [BRD_SchoolPlatform.md](BRD_SchoolPlatform.md) v0.1 (draft, 2026-10-15): the items that must be resolved before the BRD is approved.

## 1. Legal review (marked ⚖ in the BRD)

These need a lawyer to confirm the reading of the law. Nothing in the BRD is a final legal conclusion.

- [ ] DPDP Rules exemptions for educational institutions: what they cover and which processing still needs parental consent (SBR-030, SBR-033)
- [ ] Breach-notification deadlines: Data Protection Board (72-hour detailed report) and CERT-In (6 hours) (SBR-039, Section 10.7)
- [ ] Whether results or Transfer Certificates can be withheld for unpaid fees; switched off by default (RULE-FEE-09, BR-060, OQ-06)
- [ ] How long each kind of data is kept (Section 9.7, RULE-RET-01 to RULE-RET-17, OQ-14)
- [ ] Aadhaar collection and storage (BR-039)
- [ ] When IT Act s.43A stops applying, and whether CERT-In Directions apply (SBR-043)
- [ ] Wording of the privacy notice and consent texts (SBR-028)
- [ ] DPDP penalty amounts and how they apply (Section 10.8)
- [ ] State fee regulation, refund rules and GST on fee heads (RULE-FEE-04/05/08/10/13/14)
- [ ] Board and state rules for attendance minimums, pass marks, detention and age cut-offs (RULE-ATT-03, RULE-EXM-02, RULE-PROM-01, RULE-ADM-01)

## 2. Assumptions about the client that need confirming

Listed in Section 15.1 (ASM-01 to ASM-16) and Section 15.3 (OQ-01 to OQ-22). The most important:

- [ ] Board is CBSE, classes Nursery–XII (OQ-01)
- [ ] About 2,000 students and 150 staff (ASM-02, OQ-02)
- [ ] Single campus (ASM-03)
- [ ] Payment gateway, and who pays transaction charges (OQ-04)
- [ ] Status of SMS (DLT) and WhatsApp Business registration (OQ-05)
- [ ] Target go-live date and budget (OQ-20)

## 3. Changes to the tech stack (marked ⚠ in the BRD)

See Section 14.4.

- [ ] **Redis becomes required** (not optional) for background jobs: notifications, reminders, PDFs, retention jobs (INT-12)
- [ ] **Virus scanning** of uploads needs an extra container, e.g. ClamAV (INT-07, BR-019)
- [ ] **PDF generation** needs a library or service: WeasyPrint preferred, headless Chromium as the fallback (INT-13)
- [ ] **Native mobile apps deferred**; an installable web app (PWA) ships in v1 (UXR-034)
- [ ] Biometric device integration may need an on-premise connector (Future; BR-054)

## 4. Competitor section

- [ ] Section 12 lists vendor names (Fedena, Entab CampusCare, Teachmint, MyClassboard) only as candidates to benchmark. It makes **no claims** about them. Every finding needs checking with sources before it goes into sales material.

## 5. Housekeeping

- [ ] The BRD and these notes are not yet committed to git
- [ ] Optional: publish the BRD as a shareable doc for reviewers
