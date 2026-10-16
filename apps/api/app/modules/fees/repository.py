"""Fees repositories (skeleton).

Scope: Fee heads/structures, concessions, invoices, online/counter payments, receipts, refunds,
ledger, reconciliation.
Requirements: FR-FIN-001 to FR-FIN-018 (FRD).

Repositories for tenant-owned models must subclass `app.common.repository.TenantRepository`;
the tenant-isolation suite fails if a tenant-owned model is queried any other way.
"""

from __future__ import annotations

__all__: list[str] = []
