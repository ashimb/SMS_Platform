"""Attendance models (skeleton).

Scope: Daily/period attendance, offline sync, absence alerts, leave requests, edits, thresholds.
Requirements: FR-ATT-001 to FR-ATT-007 (FRD).

No tables yet. Tenant-owned models will combine IdMixin, TenantMixin, TimestampMixin and
AuditMixin (plus SoftDeleteMixin for people/academic records) and use tenant-scoped unique
constraints with `tenant_id` first.
"""

from __future__ import annotations

__all__: list[str] = []
