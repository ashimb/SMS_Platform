"""Files models (skeleton).

Scope: Secure file service: pre-signed uploads to quarantine, malware scan, re-encoding, private
storage, signed downloads.
Requirements: FR-MED-001, FR-MED-002, FR-SEC-021 (FRD).

No tables yet. Tenant-owned models will combine IdMixin, TenantMixin, TimestampMixin and
AuditMixin (plus SoftDeleteMixin for people/academic records) and use tenant-scoped unique
constraints with `tenant_id` first.
"""

from __future__ import annotations

__all__: list[str] = []
