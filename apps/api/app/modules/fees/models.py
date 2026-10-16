"""Fees models (skeleton).

Scope: Fee heads/structures, concessions, invoices, online/counter payments, receipts, refunds,
ledger, reconciliation.
Requirements: FR-FIN-001 to FR-FIN-018 (FRD).

No tables yet. Tenant-owned models will combine IdMixin, TenantMixin, TimestampMixin and
AuditMixin (plus SoftDeleteMixin for people/academic records) and use tenant-scoped unique
constraints with `tenant_id` first.
"""

from __future__ import annotations

__all__: list[str] = []
