"""Staff models (skeleton).

Scope: Staff records, teaching assignments, exit/offboarding, leave and attendance (v1.1).
Requirements: FR-STF-001 to FR-STF-005 (FRD).

No tables yet. Tenant-owned models will combine IdMixin, TenantMixin, TimestampMixin and
AuditMixin (plus SoftDeleteMixin for people/academic records) and use tenant-scoped unique
constraints with `tenant_id` first.
"""

from __future__ import annotations

__all__: list[str] = []
