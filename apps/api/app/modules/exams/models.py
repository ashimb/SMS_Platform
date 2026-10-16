"""Exams models (skeleton).

Scope: Assessment structures, grading schemes, marks entry, approval workflow, report cards,
publication.
Requirements: FR-EXM-001 to FR-EXM-010 (FRD).

No tables yet. Tenant-owned models will combine IdMixin, TenantMixin, TimestampMixin and
AuditMixin (plus SoftDeleteMixin for people/academic records) and use tenant-scoped unique
constraints with `tenant_id` first.
"""

from __future__ import annotations

__all__: list[str] = []
