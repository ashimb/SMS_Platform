"""Integration: students CRUD through the full router -> service -> repository stack."""

from __future__ import annotations

from collections.abc import Callable
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from tests.factories.students import student_payload

pytestmark = pytest.mark.integration

Headers = Callable[[str, str], dict[str, str]]


def test_create_get_update_student(client: TestClient, auth_headers: Headers) -> None:
    headers = auth_headers("a", "admin")
    payload = student_payload(first_name="Aarav", last_name="Sharma")

    created = client.post("/api/v1/students", json=payload, headers=headers)
    assert created.status_code == 201, created.text
    student = created.json()
    assert student["admission_no"] == payload["admission_no"]
    assert student["status"] == "enrolled"
    assert "tenant_id" not in student

    fetched = client.get(f"/api/v1/students/{student['id']}", headers=headers)
    assert fetched.status_code == 200
    assert fetched.json()["first_name"] == "Aarav"

    updated = client.patch(
        f"/api/v1/students/{student['id']}", json={"section": "B"}, headers=headers
    )
    assert updated.status_code == 200
    assert updated.json()["section"] == "B"


def test_list_paginates_and_searches(client: TestClient, auth_headers: Headers) -> None:
    headers = auth_headers("a", "admin")
    marker = "Zubairkhan"
    for _ in range(3):
        response = client.post(
            "/api/v1/students", json=student_payload(last_name=marker), headers=headers
        )
        assert response.status_code == 201

    page = client.get(
        "/api/v1/students", params={"q": marker, "page_size": 2, "page": 1}, headers=headers
    )
    assert page.status_code == 200
    body = page.json()
    assert body["total"] == 3
    assert body["pages"] == 2
    assert len(body["items"]) == 2
    assert all(item["last_name"] == marker for item in body["items"])

    second = client.get(
        "/api/v1/students", params={"q": marker, "page_size": 2, "page": 2}, headers=headers
    ).json()
    assert len(second["items"]) == 1


def test_search_treats_wildcards_literally(client: TestClient, auth_headers: Headers) -> None:
    response = client.get(
        "/api/v1/students", params={"q": "%%"}, headers=auth_headers("a", "admin")
    )
    assert response.status_code == 200
    assert response.json()["total"] == 0


def test_duplicate_admission_number_conflicts(client: TestClient, auth_headers: Headers) -> None:
    headers = auth_headers("a", "admin")
    payload = student_payload()
    assert client.post("/api/v1/students", json=payload, headers=headers).status_code == 201
    duplicate = client.post("/api/v1/students", json=payload, headers=headers)
    assert duplicate.status_code == 409
    assert duplicate.json()["error"]["code"] == "DUPLICATE_ADMISSION_NO"


@pytest.mark.parametrize(
    "overrides",
    [
        {"date_of_birth": (date.today() + timedelta(days=1)).isoformat()},
        {"date_of_birth": (date.today() - timedelta(days=365)).isoformat()},  # age 1 at admission
        {"gender": "unknown"},
        {"first_name": "R2D2"},
        {"admission_no": "has space"},
    ],
)
def test_validation_errors(
    client: TestClient, auth_headers: Headers, overrides: dict[str, str]
) -> None:
    response = client.post(
        "/api/v1/students", json=student_payload(**overrides), headers=auth_headers("a", "admin")
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_FAILED"


def test_creation_and_update_are_audited(client: TestClient, auth_headers: Headers) -> None:
    headers = auth_headers("a", "admin")
    student = client.post("/api/v1/students", json=student_payload(), headers=headers).json()
    client.patch(
        f"/api/v1/students/{student['id']}", json={"current_grade": "VII"}, headers=headers
    )

    logs = client.get("/api/v1/audit-logs", params={"page_size": 200}, headers=headers).json()
    actions = {(i["action"], i["entity_id"]) for i in logs["items"]}
    assert ("students.student.created", student["id"]) in actions
    assert ("students.student.updated", student["id"]) in actions


def test_soft_delete_hides_student_from_repository(
    client: TestClient, auth_headers: Headers, tenants: dict[str, object]
) -> None:
    """Soft-deleted rows are excluded by default (repository behaviour)."""
    from uuid import UUID

    from app.db.session import get_session_factory
    from app.db.uow import UnitOfWork
    from app.modules.students.repository import StudentRepository

    headers = auth_headers("a", "admin")
    student = client.post("/api/v1/students", json=student_payload(), headers=headers).json()
    tenant = tenants["a"].tenant  # type: ignore[attr-defined]
    with UnitOfWork(get_session_factory()) as uow:
        repo = StudentRepository(uow.session, tenant)
        entity = repo.get(UUID(student["id"]))
        assert entity is not None
        repo.soft_delete(entity)
        uow.commit()

    assert client.get(f"/api/v1/students/{student['id']}", headers=headers).status_code == 404
    with UnitOfWork(get_session_factory()) as uow:
        repo = StudentRepository(uow.session, tenant)
        assert repo.get(UUID(student["id"])) is None
        deleted = repo.get(UUID(student["id"]), include_deleted=True)
        assert deleted is not None
        assert deleted.deleted_at is not None
