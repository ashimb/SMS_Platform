"""Communication repositories (skeleton).

Scope: Notices and circulars, delivery tracking, emergency broadcast, parent-teacher messaging.
Requirements: FR-COM-001, FR-COM-002, FR-COM-005, FR-COM-006, FR-COM-010, FR-COM-011 (FRD).

Repositories for tenant-owned models must subclass `app.common.repository.TenantRepository`;
the tenant-isolation suite fails if a tenant-owned model is queried any other way.
"""

from __future__ import annotations

__all__: list[str] = []
