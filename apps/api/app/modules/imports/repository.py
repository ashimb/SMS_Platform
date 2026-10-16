"""Imports repositories (skeleton).

Scope: Bulk import with mapping, dry run, error reports, rollback; list exports.
Requirements: FR-DIO-001 to FR-DIO-003 (FRD).

Repositories for tenant-owned models must subclass `app.common.repository.TenantRepository`;
the tenant-isolation suite fails if a tenant-owned model is queried any other way.
"""

from __future__ import annotations

__all__: list[str] = []
