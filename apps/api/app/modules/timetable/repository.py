"""Timetable repositories (skeleton).

Scope: Bell schedules, timetable builder with clash detection, publishing, substitutions (v1.1).
Requirements: FR-TT-001 to FR-TT-004 (FRD).

Repositories for tenant-owned models must subclass `app.common.repository.TenantRepository`;
the tenant-isolation suite fails if a tenant-owned model is queried any other way.
"""

from __future__ import annotations

__all__: list[str] = []
