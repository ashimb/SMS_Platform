"""Files repositories (skeleton).

Scope: Secure file service: pre-signed uploads to quarantine, malware scan, re-encoding, private
storage, signed downloads.
Requirements: FR-MED-001, FR-MED-002, FR-SEC-021 (FRD).

Repositories for tenant-owned models must subclass `app.common.repository.TenantRepository`;
the tenant-isolation suite fails if a tenant-owned model is queried any other way.
"""

from __future__ import annotations

__all__: list[str] = []
