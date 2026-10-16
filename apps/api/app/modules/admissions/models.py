"""Admissions models (skeleton).

Scope: Enquiries, pipeline, admission cycles and forms, applications, decisions, enrolment
conversion.
Requirements: FR-ADM-001 to FR-ADM-011 (FRD).

No tables yet. Tenant-owned models will combine IdMixin, TenantMixin, TimestampMixin and
AuditMixin (plus SoftDeleteMixin for people/academic records) and use tenant-scoped unique
constraints with `tenant_id` first.
"""

from __future__ import annotations

__all__: list[str] = []
