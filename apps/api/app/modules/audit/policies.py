"""Audit policies.

Audit records are readable only with `audit.log.read` (route level) and never writable through
any API. Module-filtered views for admins and accountants (FRD FR-AUD-002) are added with the
corresponding roles.
"""

from __future__ import annotations

from app.core.deps import Principal
from app.core.permissions import P, Policy
from app.modules.audit.models import AuditLog


class AuditLogPolicy(Policy[AuditLog]):
    required_permissions = {"view": P.AUDIT_READ}

    def rule_view(self, principal: Principal, record: AuditLog | None) -> bool:
        return record is None or record.tenant_id == principal.tenant_id
