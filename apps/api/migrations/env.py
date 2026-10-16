"""Alembic environment.

- The URL comes from application settings (never from alembic.ini).
- Every module's `models.py` is imported so autogenerate sees the full metadata.
- `BinaryUUID` is rendered as `sa.BINARY(length=16)` so migrations do not import app types.
"""

from __future__ import annotations

import importlib
import pkgutil
from logging.config import fileConfig
from typing import Any

from alembic import context
from alembic.autogenerate.api import AutogenContext
from sqlalchemy import create_engine, pool

import app.modules
from app.core.config import get_settings
from app.db.base import Base, BinaryUUID

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

for module in pkgutil.iter_modules(app.modules.__path__):
    importlib.import_module(f"app.modules.{module.name}.models")

target_metadata = Base.metadata


def render_item(type_: str, obj: Any, autogen_context: AutogenContext) -> str | bool:
    if type_ == "type" and isinstance(obj, BinaryUUID):
        return "sa.BINARY(length=16)"
    return False


def _configure(**kwargs: Any) -> None:
    context.configure(
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
        render_item=render_item,
        render_as_batch=False,
        **kwargs,
    )


def run_migrations_offline() -> None:
    _configure(
        url=get_settings().database_url.render_as_string(hide_password=True),
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    engine = create_engine(get_settings().database_url, poolclass=pool.NullPool)
    with engine.connect() as connection:
        _configure(connection=connection)
        with context.begin_transaction():
            context.run_migrations()
    engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
