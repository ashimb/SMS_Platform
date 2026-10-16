"""Reports models (skeleton).

Scope: Role dashboards, standard report catalogue, permission-scoped exports.
Requirements: FR-RPT-001 to FR-RPT-005 (FRD).

No tables yet. Tenant-owned models will combine IdMixin, TenantMixin, TimestampMixin and
AuditMixin (plus SoftDeleteMixin for people/academic records) and use tenant-scoped unique
constraints with `tenant_id` first.
"""

from __future__ import annotations

__all__: list[str] = []
