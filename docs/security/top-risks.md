# Top security risks (ranked by impact)

Source: the baseline audit of Phases 1–5 (`docs/status/baseline-2026-10-18.md`), verified against
the code, the migrated schema and the test runs on 2026-10-18. Ranking is by security impact if
the weakness is exploited, assuming the product is deployed. Item IDs (P1-xx … P5-xx) refer to
`docs/DEFERRED.md`, which holds the full context and the planned phase for each.

Status legend: **Open** = no mitigation yet · **Partial** = some mitigation, gap remains.

| # | Risk | Impact | Status | Tracked as | Natural fix point |
|---|---|---|---|---|---|
| 1 | Privileged accounts can be password-only; no recovery path | Account takeover of admins; cannot rotate a compromised password | Open | P2-01, P2-02, P2-03, P2-05 | Auth hardening |
| 2 | Tenant isolation enforced only in application code | Cross-tenant data leak once a second tenant is enabled | Partial | P2-20; schema gaps | **Phase 7 (first)** |
| 3 | PII plaintext at rest; backups unencrypted | Any DB or backup copy exposes everything | Open | P2-11, P2-29 | Before any C4 field is added |
| 4 | Audit trail tamper-evident, not tamper-proof | History can be rewritten by anyone with DB write access | Partial | P2-12, P2-13 | Deployment / ops |
| 5 | Unauthenticated account lockout (DoS); coarse rate limiter | Attacker keeps admin locked out; shared school NAT trips limits | Open | P2-17 | Auth hardening |
| 6 | Wide proxy-header trust | Spoofed client IPs defeat rate limits and falsify audit `ip` | Open | P2-14, P1-07 | Deployment |
| 7 | Single JWT signing key, no `kid`, no rotation | Key compromise forces a global re-login with no overlap | Open | P2-10 | Before production |
| 8 | Website CSP allows inline scripts; mock data source default | XSS defence rests on the sanitiser alone; enquiries silently dropped if misconfigured | Partial | P5-01, P5-07 | Hardening / CMS phase |
| 9 | Session management gaps | Stolen session is hard to revoke; no per-role idle limits | Open | P2-04, P2-09 | Auth hardening |
| 10 | Supply chain and delivery unproven | CI gate red; no image scan/SBOM/signing; nothing built under Docker | Open | P1-10, P1-11, P5-02, P5-05 | Hardening, first push |

## Detail

### 1. Privileged accounts can be password-only, with no recovery path
MFA is optional for every role, including admin and principal (P2-02). There are no recovery codes
(P2-01) and no password reset, change or invitation endpoints (P2-05), so a compromised admin
password cannot be rotated through the product and a forgotten one cannot be recovered. The
portal's forgot/reset pages call endpoints that do not exist. Step-up authentication for
sensitive actions is also absent (P2-03).

### 2. Tenant isolation is enforced only in application code
Host-based tenant resolution is not implemented (P2-20). In the schema only `users` and `roles`
carry `UNIQUE(tenant_id, id)`, so only they can be the target of a composite tenant foreign key;
`students`, `audit_logs` and `tenant_settings` cannot. Today this is safe (single tenant; 48
isolation tests pass). When a second tenant is enabled, one missed repository scope becomes a
cross-tenant leak with no database backstop. No table has a `public_id`. This is the first item
Phase 7 must close.

### 3. PII is plaintext at rest and backups are unencrypted
There is no field-level encryption (P2-11). `students.date_of_birth` is already stored in clear;
only TOTP secrets are encrypted. `infra/scripts/backup_mysql.sh` produces gzip plus a SHA-256
checksum only, so a copied dump exposes all data.

### 4. The audit trail is tamper-evident, not tamper-proof
Append-only behaviour is enforced by the ORM. The application database user can still `UPDATE`
and `DELETE` (grants not restricted, P2-12) and the hash chain is not anchored outside the
database (P2-13). Anyone with DB write access can rewrite history and recompute the chain.

### 5. Unauthenticated lockout and a coarse rate limiter
Five wrong passwords lock any known e-mail address for 15 minutes regardless of source, so an
attacker can keep an administrator locked out. Rate limiting is a fixed window per client IP
with one limit for all authentication endpoints (P2-17); schools often sit behind one NAT.
Good: authentication limiters and session revocation **fail closed** when Redis is unavailable.

### 6. Proxy-header trust is wide
The API image sets `FORWARDED_ALLOW_IPS="*"` (P2-14), nginx accepts any `Host` (P1-07), and the
website trusts `X-Real-IP`. If any service is reachable other than through nginx, client IPs
(rate limits, audit records) can be spoofed.

### 7. Single JWT signing key
One Ed25519 key, no `kid`, no overlap window (P2-10). Rotation or compromise means a forced
global re-login. Development uses an ephemeral key per process.

### 8. Website CSP and data-source default
The website CSP is static and allows inline scripts and styles to keep ISR (P5-01); XSS
protection rests on the (tested) HTML sanitiser. `WEBSITE_DATA_SOURCE` defaults to `mock`, so a
production deployment that omits it serves fixture content and silently discards enquiries.

### 9. Session management gaps
One global 12-hour refresh TTL, no server-side idle timeout, no concurrent-session cap, no
device list, revoke or "sign out everywhere" (P2-04, P2-09). With no password change, revoking a
stolen session is a manual operation.

### 10. Supply chain and delivery are unproven
The CI gate `npm audit --audit-level=high` currently fails on `braces` (dev-only, unpatched
upstream; fix pending approval, see the baseline report §3). No image scanning, SBOM or signing
(P1-11). CI has never run on a remote (P1-10). No Docker image, compose stack or full-stack E2E
was executed in the baseline audit (P5-02). The dev MinIO image is a community build (P1-03).

## How to use this register
- Re-rank after each phase; move closed items to a "Resolved" section with the phase that fixed
  them, and keep `docs/DEFERRED.md` in sync.
- New findings from reviews or audits are appended here first, then ranked.
