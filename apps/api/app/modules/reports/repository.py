"""Reports repositories (skeleton).

Scope: Role dashboards, standard report catalogue, permission-scoped exports.
Requirements: FR-RPT-001 to FR-RPT-005 (FRD).

Repositories for tenant-owned models must subclass `app.common.repository.TenantRepository`;
the tenant-isolation suite fails if a tenant-owned model is queried any other way.
"""

from __future__ import annotations

__all__: list[str] = []
