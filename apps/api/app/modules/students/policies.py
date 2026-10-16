"""Students policies (deny by default).

Phase 2 rules: tenant-wide access for holders of the permission. Section-level scoping for
teachers (FRD POL-02) and child-level scoping for guardians (POL-03) are added when teaching
assignments and guardian links exist; they will plug into `in_scope` and the `rule_*` methods.
"""

from __future__ import annotations

from app.core.deps import Principal
from app.core.permissions import P, Policy
from app.modules.students.models import Student


class StudentPolicy(Policy[Student]):
    required_permissions = {
        "list": P.STUDENTS_READ,
        "view": P.STUDENTS_READ,
        "create": P.STUDENTS_CREATE,
        "update": P.STUDENTS_UPDATE,
    }

    def in_scope(self, principal: Principal, student: Student) -> bool:
        return principal.has(P.STUDENTS_READ) and student.tenant_id == principal.tenant_id

    def rule_list(self, principal: Principal, student: Student | None) -> bool:
        return True

    def rule_view(self, principal: Principal, student: Student | None) -> bool:
        return student is not None and self.in_scope(principal, student)

    def rule_create(self, principal: Principal, student: Student | None) -> bool:
        return True

    def rule_update(self, principal: Principal, student: Student | None) -> bool:
        return student is not None and self.in_scope(principal, student)
