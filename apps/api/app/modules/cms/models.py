"""CMS models (skeleton).

Scope: Website pages and blocks, content types, menus, SEO, publishing workflow, media consent
gating.
Requirements: FR-CMS-001 to FR-CMS-011, FR-MED-003, FR-MED-004 (FRD).

No tables yet. Tenant-owned models will combine IdMixin, TenantMixin, TimestampMixin and
AuditMixin (plus SoftDeleteMixin for people/academic records) and use tenant-scoped unique
constraints with `tenant_id` first.
"""

from __future__ import annotations

__all__: list[str] = []
