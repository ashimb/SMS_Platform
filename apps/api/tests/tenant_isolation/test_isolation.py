"""Tenant isolation (blocking suite, FRD §12.4 / ADR-002).

Tenant A data must never be readable, listable, or updatable from tenant B (and vice versa),
through the API or through repositories. The generic tests at the bottom fail if any tenant-owned
model can be queried without tenant scoping.
"""

from __future__ import annotations

import importlib
import pkgutil
from collections.abc import Callable
from typing import Any
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.common.repository import TENANT_REPOSITORIES, GlobalRepository, TenantRepository
from app.core.errors import TenantScopeError
from app.db.base import Base
from app.db.mixins import TenantMixin
from app.db.session import get_session_factory
from tests.conftest import SeededTenantData, bearer, login
from tests.factories.students import student_payload

pytestmark = pytest.mark.tenant_isolation

Headers = Callable[[str, str], dict[str, str]]


def _import_all_modules() -> None:
    """Import every module's models and repositories so the generic tests see all of them."""
    import app.modules

    for module in pkgutil.iter_modules(app.modules.__path__):
        importlib.import_module(f"app.modules.{module.name}.models")
        importlib.import_module(f"app.modules.{module.name}.repository")


_import_all_modules()


def _tenant_models() -> list[type[Any]]:
    return sorted(
        (
            mapper.class_
            for mapper in Base.registry.mappers
            if issubclass(mapper.class_, TenantMixin)
        ),
        key=lambda cls: cls.__name__,
    )


# ---- Students -----------------------------------------------------------------------------------


@pytest.fixture
def student_in_a(
    client_factory: Callable[..., TestClient], auth_headers: Headers
) -> dict[str, Any]:
    response = client_factory("a").post(
        "/api/v1/students", json=student_payload(), headers=auth_headers("a", "admin")
    )
    assert response.status_code == 201
    return dict(response.json())


def test_student_not_readable_from_other_tenant(
    client_factory: Callable[..., TestClient], auth_headers: Headers, student_in_a: dict[str, Any]
) -> None:
    response = client_factory("b").get(
        f"/api/v1/students/{student_in_a['id']}", headers=auth_headers("b", "admin")
    )
    assert response.status_code == 404
    assert student_in_a["admission_no"] not in response.text


def test_student_not_updatable_from_other_tenant(
    client_factory: Callable[..., TestClient], auth_headers: Headers, student_in_a: dict[str, Any]
) -> None:
    response = client_factory("b").patch(
        f"/api/v1/students/{student_in_a['id']}",
        json={"section": "Z"},
        headers=auth_headers("b", "admin"),
    )
    assert response.status_code == 404
    unchanged = client_factory("a").get(
        f"/api/v1/students/{student_in_a['id']}", headers=auth_headers("a", "admin")
    )
    assert unchanged.json()["section"] == student_in_a["section"]


def test_student_not_listed_or_searchable_in_other_tenant(
    client_factory: Callable[..., TestClient], auth_headers: Headers, student_in_a: dict[str, Any]
) -> None:
    client_b = client_factory("b")
    listing = client_b.get(
        "/api/v1/students", params={"page_size": 200}, headers=auth_headers("b", "admin")
    ).json()
    assert student_in_a["id"] not in {item["id"] for item in listing["items"]}
    search = client_b.get(
        "/api/v1/students",
        params={"q": student_in_a["admission_no"]},
        headers=auth_headers("b", "admin"),
    ).json()
    assert search["total"] == 0


def test_same_admission_number_allowed_in_each_tenant(
    client_factory: Callable[..., TestClient], auth_headers: Headers, student_in_a: dict[str, Any]
) -> None:
    """Uniqueness is tenant-scoped: (tenant_id, admission_no)."""
    response = client_factory("b").post(
        "/api/v1/students",
        json=student_payload(admission_no=student_in_a["admission_no"]),
        headers=auth_headers("b", "admin"),
    )
    assert response.status_code == 201


# ---- Users --------------------------------------------------------------------------------------


def test_users_isolated(
    client_factory: Callable[..., TestClient],
    auth_headers: Headers,
    tenants: dict[str, SeededTenantData],
) -> None:
    client_b = client_factory("b")
    headers_b = auth_headers("b", "admin")
    user_a = tenants["a"].users["teacher"]

    assert client_b.get(f"/api/v1/users/{user_a.user_id}", headers=headers_b).status_code == 404
    patch = client_b.patch(
        f"/api/v1/users/{user_a.user_id}", json={"full_name": "Hacked Name"}, headers=headers_b
    )
    assert patch.status_code == 404

    listing = client_b.get("/api/v1/users", params={"page_size": 200}, headers=headers_b).json()
    emails = {item["email"] for item in listing["items"]}
    assert not any(email.endswith("@a.example.com") for email in emails)

    fetched = client_factory("a").get(
        f"/api/v1/users/{user_a.user_id}", headers=auth_headers("a", "admin")
    )
    assert fetched.json()["full_name"] != "Hacked Name"


def test_login_with_other_tenants_credentials_fails(
    client_factory: Callable[..., TestClient], tenants: dict[str, SeededTenantData]
) -> None:
    user_a = tenants["a"].users["admin"]
    response = client_factory("b").post(
        "/api/v1/auth/login", json={"email": user_a.email, "password": user_a.password}
    )
    assert response.status_code == 401


def test_token_from_tenant_a_rejected_on_tenant_b_host(
    client_factory: Callable[..., TestClient], tenants: dict[str, SeededTenantData]
) -> None:
    token_a = login(client_factory("a"), tenants["a"].users["admin"].email)
    response = client_factory("b").get("/api/v1/students", headers=bearer(token_a))
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_TOKEN"


def test_refresh_cookie_from_tenant_a_rejected_on_tenant_b(
    client_factory: Callable[..., TestClient], tenants: dict[str, SeededTenantData]
) -> None:
    client_a = client_factory("a")
    login(client_a, tenants["a"].users["admin"].email)
    cookie = client_a.cookies.get("__Secure-sp_rt")
    client_b = client_factory("b")
    client_b.cookies.set(
        "__Secure-sp_rt", cookie or "", domain=tenants["b"].host, path="/api/v1/auth"
    )
    assert client_b.post("/api/v1/auth/refresh", headers={"X-SP-CSRF": "1"}).status_code == 401


# ---- Audit logs ---------------------------------------------------------------------------------


def test_audit_logs_isolated(
    client_factory: Callable[..., TestClient], auth_headers: Headers, student_in_a: dict[str, Any]
) -> None:
    logs_b = (
        client_factory("b")
        .get("/api/v1/audit-logs", params={"page_size": 200}, headers=auth_headers("b", "admin"))
        .json()
    )
    assert student_in_a["id"] not in {item["entity_id"] for item in logs_b["items"]}


def test_audit_chains_are_per_tenant_and_valid(tenants: dict[str, SeededTenantData]) -> None:
    from app.db.uow import UnitOfWork
    from app.modules.audit import AuditService

    for data in tenants.values():
        with UnitOfWork(get_session_factory()) as uow:
            assert AuditService(uow.session, data.tenant).verify_chain()


# ---- Client-supplied tenant ids are ignored -----------------------------------------------------


def test_tenant_id_in_body_is_rejected(
    client_factory: Callable[..., TestClient],
    auth_headers: Headers,
    tenants: dict[str, SeededTenantData],
) -> None:
    payload = student_payload(tenant_id=str(tenants["b"].tenant.tenant_id))
    response = client_factory("a").post(
        "/api/v1/students", json=payload, headers=auth_headers("a", "admin")
    )
    assert response.status_code == 422


def test_tenant_header_is_ignored(
    client_factory: Callable[..., TestClient],
    auth_headers: Headers,
    tenants: dict[str, SeededTenantData],
    student_in_a: dict[str, Any],
) -> None:
    headers = {**auth_headers("b", "admin"), "X-Tenant-Id": str(tenants["a"].tenant.tenant_id)}
    response = client_factory("b").get(f"/api/v1/students/{student_in_a['id']}", headers=headers)
    assert response.status_code == 404


def test_unknown_host_rejected(app: Any) -> None:
    with TestClient(app, base_url="https://unknown-school.test") as client:
        response = client.get("/api/v1/tenant")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "UNKNOWN_HOST"


# ---- Generic guarantees -------------------------------------------------------------------------


def test_generic_suite_discovers_all_tenant_models() -> None:
    names = {model.__name__ for model in _tenant_models()}
    expected = {"AuditLog", "RefreshToken", "Role", "RolePermission", "Student", "TenantSettings",
                "User", "UserRole"}  # fmt: skip
    assert expected <= names


@pytest.mark.parametrize("model", _tenant_models(), ids=lambda m: m.__name__)
def test_unscoped_select_on_tenant_model_fails(tenants: Any, model: type[Any]) -> None:
    """Any ORM query on a tenant-owned model outside TenantRepository must raise."""
    with get_session_factory()() as session:
        with pytest.raises(TenantScopeError):
            session.execute(select(model))
        with pytest.raises(TenantScopeError):
            session.execute(update(model).values(tenant_id=model.tenant_id))
        with pytest.raises(TenantScopeError):
            session.get(model, UUID(int=1))


@pytest.mark.parametrize("model", _tenant_models(), ids=lambda m: m.__name__)
def test_every_tenant_model_has_a_scoped_repository(model: type[Any]) -> None:
    assert any(repo.model is model for repo in TENANT_REPOSITORIES), (
        f"{model.__name__} has no TenantRepository subclass"
    )


@pytest.mark.parametrize("repo_cls", TENANT_REPOSITORIES, ids=lambda r: r.__name__)
def test_every_repository_returns_only_its_tenants_rows(
    tenants: dict[str, SeededTenantData], repo_cls: type[TenantRepository[Any]]
) -> None:
    """For each tenant, every row a repository returns belongs to that tenant."""
    for data in tenants.values():
        with get_session_factory()() as session:
            repo = repo_cls(session, data.tenant)
            rows = repo.list(include_deleted=True)
            assert all(row.tenant_id == data.tenant.tenant_id for row in rows)
            assert repo.count(include_deleted=True) == len(rows)

            compiled = repo.select().compile()
            assert "tenant_id" in str(compiled)
            assert data.tenant.tenant_id in compiled.params.values()


def test_repository_without_scoping_is_caught(tenants: dict[str, SeededTenantData]) -> None:
    """A repository that forgets to scope a custom query is stopped by the session guard."""
    from app.modules.users import User

    class LeakyUserRepository(TenantRepository[Any]):
        model = User

        def everyone(self, session: Session) -> list[Any]:
            return list(session.execute(select(User)).scalars())  # no self.scope()

    TENANT_REPOSITORIES.remove(LeakyUserRepository)  # keep the registry to real repositories
    with get_session_factory()() as session:
        repo = LeakyUserRepository(session, tenants["a"].tenant)
        with pytest.raises(TenantScopeError):
            repo.everyone(session)


def test_repository_refuses_entity_from_other_tenant(
    client_factory: Callable[..., TestClient],
    auth_headers: Headers,
    tenants: dict[str, SeededTenantData],
) -> None:
    from app.modules.students.repository import StudentRepository

    created = client_factory("b").post(
        "/api/v1/students", json=student_payload(), headers=auth_headers("b", "admin")
    )
    assert created.status_code == 201
    with get_session_factory()() as session:
        repo_a = StudentRepository(session, tenants["a"].tenant)
        foreign = StudentRepository(session, tenants["b"].tenant).get(UUID(created.json()["id"]))
        assert foreign is not None
        assert repo_a.get(foreign.id) is None
        with pytest.raises(TenantScopeError):
            repo_a.update(foreign, {"section": "X"})
        with pytest.raises(TenantScopeError):
            repo_a.soft_delete(foreign)


def test_repository_base_classes_reject_wrong_model_kinds() -> None:
    from app.modules.tenants.models import Tenant
    from app.modules.users import User

    with pytest.raises(TypeError):

        class _BadTenantRepo(TenantRepository[Any]):
            model = Tenant

    with pytest.raises(TypeError):

        class _BadGlobalRepo(GlobalRepository[Any]):
            model = User


def test_insert_without_tenant_rejected(tenants: dict[str, SeededTenantData]) -> None:
    from app.modules.rbac.models import Role

    with get_session_factory()() as session:
        session.add(Role(code="orphan", name="Orphan", is_system=False))
        with pytest.raises(TenantScopeError):
            session.flush()


# ---- Composite tenant foreign keys (database-level isolation) -----------------------------------


def _tenant_tables() -> set[str]:
    return {model.__tablename__ for model in _tenant_models()}


def test_foreign_keys_between_tenant_tables_include_tenant_id() -> None:
    """Every FK from a tenant-owned table to another tenant-owned table must be composite."""
    tenant_tables = _tenant_tables()
    offenders: list[str] = []
    for table in Base.metadata.sorted_tables:
        if table.name not in tenant_tables:
            continue
        for fk in table.foreign_key_constraints:
            if fk.referred_table.name not in tenant_tables:
                continue  # tenants / global catalogue tables
            local = [col.name for col in fk.columns]
            remote = [element.column.name for element in fk.elements]
            if local[:1] != ["tenant_id"] or remote[:1] != ["tenant_id"]:
                offenders.append(f"{table.name}{local} -> {fk.referred_table.name}{remote}")
    assert not offenders, f"Non-composite tenant FKs: {offenders}"


def test_referenced_tenant_tables_have_tenant_parent_key() -> None:
    tenant_tables = _tenant_tables()
    referenced = {
        fk.referred_table.name
        for table in Base.metadata.sorted_tables
        if table.name in tenant_tables
        for fk in table.foreign_key_constraints
        if fk.referred_table.name in tenant_tables
    }
    for name in referenced:
        uniques = [
            [c.name for c in constraint.columns]
            for constraint in Base.metadata.tables[name].constraints
            if constraint.__class__.__name__ == "UniqueConstraint"
        ]
        assert ["tenant_id", "id"] in uniques, f"{name} lacks UNIQUE (tenant_id, id)"


@pytest.mark.parametrize(
    ("table", "column"),
    [
        ("user_roles", "user_id"),
        ("user_roles", "role_id"),
        ("role_permissions", "role_id"),
        ("refresh_tokens", "user_id"),
    ],
)
def test_database_rejects_cross_tenant_reference(
    tenants: dict[str, SeededTenantData], table: str, column: str
) -> None:
    """Even raw SQL that bypasses every application guard cannot link tenants."""
    from datetime import UTC, datetime, timedelta
    from uuid import uuid7

    from sqlalchemy import insert
    from sqlalchemy.exc import IntegrityError

    from app.modules.rbac.models import Permission, Role
    from app.modules.users import User

    tenant_a, tenant_b = tenants["a"].tenant, tenants["b"].tenant
    with get_session_factory()() as session:
        user_a = session.execute(
            select(User.id)
            .where(User.tenant_id == tenant_a.tenant_id)
            .limit(1)
            .execution_options(skip_tenant_scope=True)
        ).scalar_one()
        role_a = session.execute(
            select(Role.id)
            .where(Role.tenant_id == tenant_a.tenant_id)
            .limit(1)
            .execution_options(skip_tenant_scope=True)
        ).scalar_one()
        role_b = session.execute(
            select(Role.id)
            .where(Role.tenant_id == tenant_b.tenant_id)
            .limit(1)
            .execution_options(skip_tenant_scope=True)
        ).scalar_one()
        user_b = session.execute(
            select(User.id)
            .where(User.tenant_id == tenant_b.tenant_id)
            .limit(1)
            .execution_options(skip_tenant_scope=True)
        ).scalar_one()
        permission = session.execute(select(Permission.id).limit(1)).scalar_one()

        now = datetime.now(UTC).replace(tzinfo=None)
        # A tenant-B row pointing at tenant A's user/role; the other reference stays valid.
        values: dict[str, Any] = {"id": uuid7(), "tenant_id": tenant_b.tenant_id}
        values["created_at"] = values["updated_at"] = now
        if table == "user_roles":
            values |= {"user_id": user_a if column == "user_id" else user_b,
                       "role_id": role_a if column == "role_id" else role_b}  # fmt: skip
        elif table == "role_permissions":
            values |= {"role_id": role_a, "permission_id": permission}
        else:
            values |= {"user_id": user_a, "family_id": uuid7(), "token_hash": uuid7().hex * 2,
                       "expires_at": now + timedelta(hours=1)}  # fmt: skip

        with pytest.raises(IntegrityError, match="foreign key constraint"):
            session.execute(insert(Base.metadata.tables[table]).values(**values))
        session.rollback()
