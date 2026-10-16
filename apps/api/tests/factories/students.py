"""Student request payloads for API tests."""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any

import factory
from faker import Faker

_fake = Faker("en_IN")

FIRST_NAMES = ("Aarav", "Diya", "Ishaan", "Ananya", "Kabir", "Meera", "Rohan", "Saanvi", "Vihaan")
LAST_NAMES = ("Sharma", "Iyer", "Nair", "Reddy", "Khan", "Das", "Patel", "Singh", "Menon")


def _dob() -> str:
    return (date.today() - timedelta(days=365 * 11 + 40)).isoformat()


def _admission_date() -> str:
    return (date.today() - timedelta(days=30)).isoformat()


class StudentPayloadFactory(factory.DictFactory):  # type: ignore[misc]
    admission_no = factory.Sequence(lambda n: f"ADM/{_fake.unique.random_int(10000, 99999)}-{n}")
    first_name = factory.Iterator(FIRST_NAMES)
    last_name = factory.Iterator(LAST_NAMES)
    date_of_birth = factory.LazyFunction(_dob)
    gender = factory.Iterator(("female", "male"))
    admission_date = factory.LazyFunction(_admission_date)
    current_grade = "VI"
    section = "A"


def student_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = StudentPayloadFactory()
    payload.update(overrides)
    return payload
