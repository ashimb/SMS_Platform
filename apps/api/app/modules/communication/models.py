"""Communication models (skeleton).

Scope: Notices and circulars, delivery tracking, emergency broadcast, parent-teacher messaging.
Requirements: FR-COM-001, FR-COM-002, FR-COM-005, FR-COM-006, FR-COM-010, FR-COM-011 (FRD).

No tables yet. Tenant-owned models will combine IdMixin, TenantMixin, TimestampMixin and
AuditMixin (plus SoftDeleteMixin for people/academic records) and use tenant-scoped unique
constraints with `tenant_id` first.
"""

from __future__ import annotations

__all__: list[str] = []
