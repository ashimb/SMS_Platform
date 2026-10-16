"""Repository base classes.

`TenantRepository[ModelT]` is the only sanctioned way to query tenant-owned models:

- every SELECT/UPDATE/DELETE gets `WHERE <model>.tenant_id = :current_tenant` and is tagged with
  the `tenant_scoped` execution option that the session guard checks (see `app.db.session`);
- `add()` stamps `tenant_id` from the context and refuses objects carrying another tenant's id;
- soft-deleted rows are excluded unless `include_deleted=True`.

`GlobalRepository[ModelT]` is for platform-wide tables (tenants, permission catalogue) and refuses
tenant-owned models at class-definition time.

Repositories hold queries only: no business rules, no authorization, no HTTP.
"""

from __future__ import annotations

import builtins
from collections.abc import Iterable, Mapping, Sequence
from typing import Any, ClassVar, cast
from uuid import UUID

from sqlalchemy import ColumnElement, Delete, Select, Update, delete, func, select, update
from sqlalchemy.orm import InstrumentedAttribute, Session
from sqlalchemy.sql.elements import UnaryExpression

from app.common.pagination import PageParams, PageResult
from app.core.errors import TenantScopeError
from app.core.middleware.audit_context import get_audit_context
from app.core.tenancy import TenantContext
from app.db.base import utcnow
from app.db.mixins import SoftDeleteMixin, TenantMixin
from app.db.session import TENANT_SCOPED_OPTION

#: Attributes that `update()` never changes.
PROTECTED_FIELDS = frozenset(
    {"id", "tenant_id", "created_at", "created_by", "deleted_at", "deleted_by"}
)

#: ORDER BY terms accepted by list()/paginate().
OrderBy = UnaryExpression[Any] | ColumnElement[Any] | InstrumentedAttribute[Any]

#: Every concrete TenantRepository subclass (used by the tenant-isolation test suite).
TENANT_REPOSITORIES: list[type[TenantRepository[Any]]] = []


class TenantRepository[ModelT: TenantMixin]:
    model: ClassVar[type[Any]]

    def __init_subclass__(cls, **kwargs: Any) -> None:
        super().__init_subclass__(**kwargs)
        model = cls.__dict__.get("model")
        if model is None:
            return
        if not (isinstance(model, type) and issubclass(model, TenantMixin)):
            raise TypeError(f"{cls.__name__}.model must be a TenantMixin model")
        TENANT_REPOSITORIES.append(cls)

    def __init__(self, session: Session, tenant: TenantContext) -> None:
        self.session = session
        self.tenant = tenant

    # ---- Statement builders (always scoped) -----------------------------------------------------

    @property
    def _model(self) -> type[ModelT]:
        return cast(type[ModelT], type(self).model)

    @property
    def _soft_deletes(self) -> bool:
        return issubclass(type(self).model, SoftDeleteMixin)

    def _tenant_clause(self) -> ColumnElement[bool]:
        return self._model.tenant_id == self.tenant.tenant_id

    def _live_clause(self) -> ColumnElement[bool] | None:
        if self._soft_deletes:
            return cast(ColumnElement[bool], type(self).model.deleted_at.is_(None))
        return None

    def select(self, *, include_deleted: bool = False) -> Select[ModelT]:
        """Base SELECT for this model, scoped to the current tenant."""
        stmt = select(self._model).where(self._tenant_clause())
        live = self._live_clause()
        if live is not None and not include_deleted:
            stmt = stmt.where(live)
        return stmt.execution_options(**{TENANT_SCOPED_OPTION: True})

    def scope(self, stmt: Select[Any]) -> Select[Any]:
        """Scope a custom SELECT that targets this repository's model."""
        stmt = stmt.where(self._tenant_clause())
        live = self._live_clause()
        if live is not None:
            stmt = stmt.where(live)
        return stmt.execution_options(**{TENANT_SCOPED_OPTION: True})

    def _scoped_update(self) -> Update:
        return (
            update(self._model)
            .where(self._tenant_clause())
            .execution_options(**{TENANT_SCOPED_OPTION: True, "synchronize_session": False})
        )

    def _scoped_delete(self) -> Delete:
        return (
            delete(self._model)
            .where(self._tenant_clause())
            .execution_options(**{TENANT_SCOPED_OPTION: True, "synchronize_session": False})
        )

    # ---- Reads ----------------------------------------------------------------------------------

    def get(self, entity_id: UUID, *, include_deleted: bool = False) -> ModelT | None:
        stmt = self.select(include_deleted=include_deleted).where(self._model.id == entity_id)  # type: ignore[attr-defined]
        return self.session.execute(stmt).scalar_one_or_none()

    def list(
        self,
        *criteria: ColumnElement[bool],
        order_by: Sequence[OrderBy] = (),
        limit: int | None = None,
        offset: int | None = None,
        include_deleted: bool = False,
    ) -> builtins.list[ModelT]:
        stmt = self.select(include_deleted=include_deleted).where(*criteria)
        if order_by:
            stmt = stmt.order_by(*order_by)
        if limit is not None:
            stmt = stmt.limit(limit)
        if offset is not None:
            stmt = stmt.offset(offset)
        return list(self.session.execute(stmt).scalars().all())

    def count(self, *criteria: ColumnElement[bool], include_deleted: bool = False) -> int:
        inner = self.select(include_deleted=include_deleted).where(*criteria).subquery()
        stmt = (
            select(func.count())
            .select_from(inner)
            .execution_options(**{TENANT_SCOPED_OPTION: True})
        )
        return int(self.session.execute(stmt).scalar_one())

    def paginate(
        self,
        params: PageParams,
        *criteria: ColumnElement[bool],
        order_by: Sequence[OrderBy] = (),
        include_deleted: bool = False,
    ) -> PageResult[ModelT]:
        total = self.count(*criteria, include_deleted=include_deleted)
        items = self.list(
            *criteria,
            order_by=order_by,
            limit=params.page_size,
            offset=params.offset,
            include_deleted=include_deleted,
        )
        return PageResult(items=items, total=total, page=params.page, page_size=params.page_size)

    # ---- Writes ---------------------------------------------------------------------------------

    def add(self, entity: ModelT) -> ModelT:
        existing = getattr(entity, "tenant_id", None)
        if existing is not None and existing != self.tenant.tenant_id:
            raise TenantScopeError("Entity belongs to a different tenant")
        entity.tenant_id = self.tenant.tenant_id
        self.session.add(entity)
        self.session.flush()
        return entity

    def add_all(self, entities: Iterable[ModelT]) -> builtins.list[ModelT]:
        return [self.add(entity) for entity in entities]

    def update(self, entity: ModelT, values: Mapping[str, Any]) -> ModelT:
        """Apply `values` to an entity previously loaded through this repository."""
        self._assert_owned(entity)
        for key, value in values.items():
            if key in PROTECTED_FIELDS:
                raise ValueError(f"Field '{key}' cannot be updated")
            if not hasattr(entity, key):
                raise ValueError(f"Unknown field '{key}'")
            setattr(entity, key, value)
        self.session.flush()
        return entity

    def update_where(self, values: Mapping[str, Any], *criteria: ColumnElement[bool]) -> int:
        """Scoped bulk UPDATE. Returns the number of rows matched."""
        if PROTECTED_FIELDS & set(values):
            raise ValueError("Protected fields cannot be bulk-updated")
        result = self.session.execute(self._scoped_update().where(*criteria).values(**values))
        self._expire_loaded()
        return int(getattr(result, "rowcount", 0) or 0)

    def delete_where(self, *criteria: ColumnElement[bool]) -> int:
        """Scoped hard DELETE (only for non-record data such as tokens)."""
        if self._soft_deletes:
            raise TypeError(f"{type(self).model.__name__} uses soft delete; call soft_delete()")
        result = self.session.execute(self._scoped_delete().where(*criteria))
        self._expire_loaded()
        return int(getattr(result, "rowcount", 0) or 0)

    def soft_delete(self, entity: ModelT) -> ModelT:
        self._assert_owned(entity)
        if not self._soft_deletes:
            raise TypeError(f"{type(entity).__name__} does not support soft delete")
        record = cast(SoftDeleteMixin, entity)
        record.deleted_at = utcnow()
        record.deleted_by = get_audit_context().actor_user_id
        self.session.flush()
        return entity

    def _expire_loaded(self) -> None:
        """Bulk statements bypass the identity map (no unscoped sync SELECT); expire stale rows."""
        model = type(self).model
        for obj in list(self.session.identity_map.values()):
            if isinstance(obj, model):
                self.session.expire(obj)

    def _assert_owned(self, entity: ModelT) -> None:
        if entity.tenant_id != self.tenant.tenant_id:
            raise TenantScopeError("Entity belongs to a different tenant")


class GlobalRepository[ModelT]:
    """Repository for platform-wide (non-tenant) tables."""

    model: ClassVar[type[Any]]

    def __init_subclass__(cls, **kwargs: Any) -> None:
        super().__init_subclass__(**kwargs)
        model = cls.__dict__.get("model")
        if model is not None and isinstance(model, type) and issubclass(model, TenantMixin):
            raise TypeError(
                f"{cls.__name__}: {model.__name__} is tenant-owned; use TenantRepository"
            )

    def __init__(self, session: Session) -> None:
        self.session = session

    @property
    def _model(self) -> type[ModelT]:
        return cast(type[ModelT], type(self).model)

    def get(self, entity_id: UUID) -> ModelT | None:
        return self.session.get(self._model, entity_id)

    def add(self, entity: ModelT) -> ModelT:
        self.session.add(entity)
        self.session.flush()
        return entity
