"""CMS repositories (skeleton).

Scope: Website pages and blocks, content types, menus, SEO, publishing workflow, media consent
gating.
Requirements: FR-CMS-001 to FR-CMS-011, FR-MED-003, FR-MED-004 (FRD).

Repositories for tenant-owned models must subclass `app.common.repository.TenantRepository`;
the tenant-isolation suite fails if a tenant-owned model is queried any other way.
"""

from __future__ import annotations

__all__: list[str] = []
