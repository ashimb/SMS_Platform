"""Test fixtures.

- Real MySQL 8.4 and Redis containers (testcontainers), started once per session and only when a
  test needs them (unit tests run without Docker).
- The schema is created by running the real Alembic migrations.
- Two tenants are seeded (A = the default tenant, B = a second tenant), each with an admin, a
  teacher, and a viewer (no data permissions).
- HTTP clients use https://school-a.test / https://school-b.test; the app's HostTenantResolver maps
  those hosts to the tenants, the same way subdomain resolution will work in production.
"""

from __future__ import annotations

import os

# Settings must be in place before any app module is imported.
os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("LOG_LEVEL", "warning")
os.environ.setdefault("RATE_LIMIT_DEFAULT", "1000")

from collections.abc import Callable, Iterator
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from uuid import uuid4

import pytest
import redis
from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from fastapi.testclient import TestClient

TEST_MYSQL_IMAGE = "mysql:8.4.11"
TEST_REDIS_IMAGE = "redis:8.10.2-alpine"
API_ROOT = Path(__file__).resolve().parents[1]

HOST_A = "school-a.test"
HOST_B = "school-b.test"
DEFAULT_PASSWORD = "Correct-Horse-Battery-42"


# ---- Containers and database ------------------------------------------------------------------


@pytest.fixture(scope="session")
def mysql_env() -> Iterator[dict[str, str]]:
    from testcontainers.mysql import MySqlContainer

    container = MySqlContainer(
        TEST_MYSQL_IMAGE,
        username="school_app",
        password="test_app_password",
        root_password="test_root_password",
        dbname="school_platform_test",
    ).with_command("--character-set-server=utf8mb4 --collation-server=utf8mb4_0900_ai_ci")
    with container:
        env = {
            "DB_HOST": container.get_container_host_ip(),
            "DB_PORT": str(container.get_exposed_port(3306)),
            "DB_NAME": "school_platform_test",
            "DB_USER": "school_app",
            "DB_PASSWORD": "test_app_password",
        }
        yield env


@pytest.fixture(scope="session")
def redis_env() -> Iterator[dict[str, str]]:
    from testcontainers.redis import RedisContainer

    with RedisContainer(TEST_REDIS_IMAGE) as container:
        yield {
            "REDIS_HOST": container.get_container_host_ip(),
            "REDIS_PORT": str(container.get_exposed_port(6379)),
        }


@pytest.fixture(scope="session")
def configured(mysql_env: dict[str, str], redis_env: dict[str, str]) -> Iterator[None]:
    """Point settings at the containers and migrate the schema."""
    os.environ.update(mysql_env)
    os.environ.update(redis_env)

    from app.core.config import get_settings
    from app.db.session import get_engine, get_session_factory

    get_settings.cache_clear()
    get_engine.cache_clear()
    get_session_factory.cache_clear()

    command.upgrade(Config(str(API_ROOT / "alembic.ini")), "head")
    yield
    get_engine().dispose()


# ---- Seeded tenants -----------------------------------------------------------------------------


@dataclass(frozen=True)
class SeededUser:
    user_id: Any
    email: str
    password: str
    role: str


@dataclass(frozen=True)
class SeededTenantData:
    key: str
    host: str
    tenant: Any  # TenantContext
    users: dict[str, SeededUser]


@pytest.fixture(scope="session")
def tenants(configured: None) -> dict[str, SeededTenantData]:
    from app.core.config import get_settings
    from app.db.session import get_session_factory
    from app.db.uow import UnitOfWork
    from app.modules.rbac import ROLE_TEACHER, ROLE_VIEWER, RbacService
    from app.modules.users import UserService
    from scripts._seeding import seed_tenant

    settings = get_settings()
    specs = {
        "a": (HOST_A, "default", "School A", settings.default_tenant_id),
        "b": (HOST_B, "school-b", "School B", None),
    }
    result: dict[str, SeededTenantData] = {}
    for key, (host, slug, name, tenant_id) in specs.items():
        with UnitOfWork(get_session_factory()) as uow:
            seeded = seed_tenant(
                uow,
                slug=slug,
                name=name,
                tenant_id=tenant_id,
                admin_email=f"admin@{key}.example.com",
                admin_name=f"Admin {key.upper()}",
                admin_password=DEFAULT_PASSWORD,
            )
        users = {
            "admin": SeededUser(seeded.admin_user_id, seeded.admin_email, DEFAULT_PASSWORD, "admin")
        }
        for role in (ROLE_TEACHER, ROLE_VIEWER):
            with UnitOfWork(get_session_factory()) as uow:
                service = UserService(uow, seeded.tenant)
                user = service.create_user(
                    email=f"{role}@{key}.example.com",
                    full_name=f"{role.title()} {key.upper()}",
                    password=DEFAULT_PASSWORD,
                )
                RbacService(uow, seeded.tenant).assign_role(user.id, role)
                uow.commit()
                users[role] = SeededUser(user.id, user.email, DEFAULT_PASSWORD, role)
        result[key] = SeededTenantData(key=key, host=host, tenant=seeded.tenant, users=users)
    return result


# ---- Application and clients --------------------------------------------------------------------


@pytest.fixture(scope="session")
def app(tenants: dict[str, SeededTenantData]) -> FastAPI:
    from app.core.config import get_settings
    from app.core.tenancy import HostTenantResolver
    from app.main import create_app

    application = create_app(get_settings())
    application.state.tenant_resolver = HostTenantResolver(
        {data.host: data.tenant for data in tenants.values()}
    )
    return application


@pytest.fixture(scope="session")
def redis_client(configured: None) -> redis.Redis:
    from app.core.config import get_settings

    return redis.Redis.from_url(get_settings().redis_url)


@pytest.fixture
def client_factory(app: FastAPI, redis_client: redis.Redis) -> Iterator[Callable[..., TestClient]]:
    """Fresh clients per test; Redis is flushed so rate limits and revocations start clean."""
    redis_client.flushdb()
    opened: list[TestClient] = []

    def make(tenant_key: str = "a", **kwargs: Any) -> TestClient:
        host = HOST_A if tenant_key == "a" else HOST_B
        client = TestClient(app, base_url=f"https://{host}", **kwargs)
        client.__enter__()
        opened.append(client)
        return client

    yield make
    for client in opened:
        client.__exit__(None, None, None)


@pytest.fixture
def client(client_factory: Callable[..., TestClient]) -> TestClient:
    return client_factory("a")


def login(client: TestClient, email: str, password: str = DEFAULT_PASSWORD) -> str:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["status"] == "ok"
    return str(body["access_token"])


def bearer(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers(
    client_factory: Callable[..., TestClient], tenants: dict[str, SeededTenantData]
) -> Callable[[str, str], dict[str, str]]:
    """auth_headers("a", "admin") -> Authorization header for that tenant/role."""
    cache: dict[tuple[str, str], dict[str, str]] = {}

    def get(tenant_key: str, role: str) -> dict[str, str]:
        if (tenant_key, role) not in cache:
            user = tenants[tenant_key].users[role]
            cache[(tenant_key, role)] = bearer(login(client_factory(tenant_key), user.email))
        return cache[(tenant_key, role)]

    return get


@pytest.fixture
def make_user(tenants: dict[str, SeededTenantData]) -> Callable[..., SeededUser]:
    """Create a throwaway user (e.g. for lockout tests) in a tenant with a role."""
    from app.db.session import get_session_factory
    from app.db.uow import UnitOfWork
    from app.modules.rbac import RbacService
    from app.modules.users import UserService

    def make(tenant_key: str = "a", role: str = "admin") -> SeededUser:
        tenant = tenants[tenant_key].tenant
        email = f"user-{uuid4().hex[:10]}@{tenant_key}.example.com"
        with UnitOfWork(get_session_factory()) as uow:
            user = UserService(uow, tenant).create_user(
                email=email, full_name="Temporary User", password=DEFAULT_PASSWORD
            )
            RbacService(uow, tenant).assign_role(user.id, role)
            uow.commit()
            return SeededUser(user.id, email, DEFAULT_PASSWORD, role)

    return make
