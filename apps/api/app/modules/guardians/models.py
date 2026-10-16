"""Guardians models (skeleton).

Scope: Guardian records, student links, custody/access restrictions, invitations, contact changes.
Requirements: FR-GRD-001 to FR-GRD-005 (FRD).

No tables yet. Tenant-owned models will combine IdMixin, TenantMixin, TimestampMixin and
AuditMixin (plus SoftDeleteMixin for people/academic records) and use tenant-scoped unique
constraints with `tenant_id` first.
"""

from __future__ import annotations

__all__: list[str] = []
