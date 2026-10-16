"""Academics models (skeleton).

Scope: Academic years and terms, calendar, classes/sections/streams, subjects, rollover, homework.
Requirements: FR-ACA-001 to FR-ACA-006 (FRD).

No tables yet. Tenant-owned models will combine IdMixin, TenantMixin, TimestampMixin and
AuditMixin (plus SoftDeleteMixin for people/academic records) and use tenant-scoped unique
constraints with `tenant_id` first.
"""

from __future__ import annotations

__all__: list[str] = []
