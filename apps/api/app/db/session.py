"""Engine, session factory, and tenant-safety guards.

Guards installed on every Session (fail closed):

1. **Query guard** (`do_orm_execute`): any ORM SELECT/UPDATE/DELETE that touches a tenant-owned
   model (`TenantMixin`) must carry the `tenant_scoped=True` execution option, which only
   `TenantRepository` sets after adding `WHERE tenant_id = :current`. Otherwise
   `TenantScopeError` is raised. Relationship lazy-loads and expired-attribute refreshes are
   allowed because they start from an already-scoped row (`session.get()` is still blocked).
   Maintenance code that must cross tenants (migrations, seeds) has
   to opt out explicitly with `execution_options(skip_tenant_scope=True)`.
2. **Insert guard** (`before_flush`): new tenant-owned rows must have `tenant_id` set.
3. **Audit fields** (`before_flush`): `created_by` / `updated_by` come from the audit context.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Any

from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import ORMExecuteState, Session, sessionmaker

from app.core.config import Settings, get_settings
from app.core.errors import TenantScopeError
from app.core.middleware.audit_context import get_audit_context
from app.db.mixins import AuditMixin, TenantMixin

TENANT_SCOPED_OPTION = "tenant_scoped"
SKIP_TENANT_SCOPE_OPTION = "skip_tenant_scope"


def _touches_tenant_model(state: ORMExecuteState) -> bool:
    return any(
        isinstance(mapper.class_, type) and issubclass(mapper.class_, TenantMixin)
        for mapper in state.all_mappers
    )


def _guard_queries(state: ORMExecuteState) -> None:
    if not (state.is_select or state.is_update or state.is_delete):
        return
    # Lazy relationship loads and expired-attribute refreshes act on rows that were already
    # loaded through a scoped query, so they cannot reach another tenant's data.
    if state.is_relationship_load or state.is_column_load:
        return
    options = state.execution_options
    if options.get(TENANT_SCOPED_OPTION) or options.get(SKIP_TENANT_SCOPE_OPTION):
        return
    if _touches_tenant_model(state):
        names = sorted(m.class_.__name__ for m in state.all_mappers)
        raise TenantScopeError(
            f"Unscoped query on tenant-owned model(s) {names}; use TenantRepository."
        )


def _before_flush(session: Session, flush_context: Any, instances: Any) -> None:
    actor = get_audit_context().actor_user_id
    for obj in session.new:
        if isinstance(obj, TenantMixin) and getattr(obj, "tenant_id", None) is None:
            raise TenantScopeError(f"{type(obj).__name__} inserted without tenant_id")
        if isinstance(obj, AuditMixin) and actor is not None:
            if obj.created_by is None:
                obj.created_by = actor
            obj.updated_by = actor
    if actor is not None:
        for obj in session.dirty:
            if isinstance(obj, AuditMixin) and session.is_modified(obj):
                obj.updated_by = actor


def install_session_guards(factory: sessionmaker[Session]) -> None:
    event.listen(factory, "do_orm_execute", _guard_queries)
    event.listen(factory, "before_flush", _before_flush)


def build_engine(settings: Settings) -> Engine:
    return create_engine(
        settings.database_url,
        pool_pre_ping=True,
        pool_recycle=1800,
        pool_size=settings.db_pool_size,
        max_overflow=settings.db_max_overflow,
        echo=settings.db_echo,
        # Session time zone UTC; strict SQL mode surfaces truncation instead of silently
        # altering data.
        connect_args={
            "init_command": (
                "SET time_zone = '+00:00', "
                "sql_mode = 'STRICT_ALL_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,"
                "ERROR_FOR_DIVISION_BY_ZERO,ONLY_FULL_GROUP_BY'"
            )
        },
    )


def build_session_factory(engine: Engine) -> sessionmaker[Session]:
    factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    install_session_guards(factory)
    return factory


@lru_cache(maxsize=1)
def get_engine() -> Engine:
    return build_engine(get_settings())


@lru_cache(maxsize=1)
def get_session_factory() -> sessionmaker[Session]:
    return build_session_factory(get_engine())
