"""Imports models (skeleton).

Scope: Bulk import with mapping, dry run, error reports, rollback; list exports.
Requirements: FR-DIO-001 to FR-DIO-003 (FRD).

No tables yet. Tenant-owned models will combine IdMixin, TenantMixin, TimestampMixin and
AuditMixin (plus SoftDeleteMixin for people/academic records) and use tenant-scoped unique
constraints with `tenant_id` first.
"""

from __future__ import annotations

__all__: list[str] = []
