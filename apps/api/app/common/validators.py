"""Input validators and normalisers shared by request schemas (FRD §4 common field rules)."""

from __future__ import annotations

import re
import unicodedata
from datetime import date, datetime
from typing import Annotated
from zoneinfo import ZoneInfo

import phonenumbers
from email_validator import EmailNotValidError, validate_email
from pydantic import AfterValidator

_NAME_PUNCTUATION = frozenset(".'-")
_BIDI_CONTROLS = frozenset(
    chr(cp) for cp in (*range(0x202A, 0x202F), *range(0x2066, 0x206A), 0x200E, 0x200F)
)
_ADMISSION_NO = re.compile(r"^[A-Za-z0-9/\-]{1,20}$")
_SCHOOL_TZ = ZoneInfo("Asia/Kolkata")  # tenant time zone support arrives with settings
_SLUG = re.compile(r"^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$")

# A short built-in list; the full breached-password list is loaded in the auth hardening phase.
_COMMON_PASSWORDS = frozenset(
    {
        "password", "password1", "password123", "password@123", "12345678", "123456789",
        "1234567890", "qwerty123", "iloveyou", "admin@123", "welcome@123", "india@123",
        "school@123", "letmein123", "abc12345", "changeme123",
    }
)  # fmt: skip


def normalize_email(value: str) -> str:
    """Syntax check (no DNS lookup) and lower-case normalisation."""
    try:
        result = validate_email(value.strip(), check_deliverability=False)
    except EmailNotValidError as exc:
        raise ValueError("Enter a valid email address.") from exc
    return result.normalized.lower()


def normalize_name(value: str) -> str:
    """NFC-normalise, collapse whitespace, reject control/bidi characters and symbols."""
    value = unicodedata.normalize("NFC", value)
    if any(ch in _BIDI_CONTROLS for ch in value):
        raise ValueError("Name contains unsupported characters.")
    if any(unicodedata.category(ch).startswith("C") for ch in value):
        raise ValueError("Name contains unsupported characters.")
    value = " ".join(value.split())
    if not 1 <= len(value) <= 100:
        raise ValueError("Name must be between 1 and 100 characters.")
    for ch in value:
        category = unicodedata.category(ch)
        # Letters (L*) and combining marks (M*, needed for Indic scripts), spaces, . ' -
        if not (category[0] in "LM" or ch == " " or ch in _NAME_PUNCTUATION):
            raise ValueError("Name may contain letters, spaces, and . ' - only.")
    return value


def normalize_indian_mobile(value: str) -> str:
    """Validate an Indian mobile number and return it in E.164 (+91XXXXXXXXXX)."""
    try:
        number = phonenumbers.parse(value, "IN")
    except phonenumbers.NumberParseException as exc:
        raise ValueError("Enter a 10-digit Indian mobile number.") from exc
    national = str(number.national_number)
    if (
        number.country_code != 91
        or len(national) != 10
        or national[0] not in "6789"
        or not phonenumbers.is_valid_number(number)
    ):
        raise ValueError("Enter a 10-digit Indian mobile number.")
    return phonenumbers.format_number(number, phonenumbers.PhoneNumberFormat.E164)


def validate_admission_no(value: str) -> str:
    value = value.strip()
    if not _ADMISSION_NO.fullmatch(value):
        raise ValueError("Admission number: 1-20 letters, digits, '/' or '-'.")
    return value


def validate_slug(value: str) -> str:
    if not _SLUG.fullmatch(value):
        raise ValueError("Slug: lowercase letters, digits and hyphens (max 50).")
    return value


def validate_past_date(value: date) -> date:
    if value > datetime.now(_SCHOOL_TZ).date():
        raise ValueError("Date cannot be in the future.")
    return value


def check_password_policy(
    password: str, *, min_length: int = 12, context: tuple[str, ...] = ()
) -> None:
    """Raise ValueError if the password violates policy (FRD FR-SEC-001)."""
    if len(password) < min_length:
        raise ValueError(f"Password must be at least {min_length} characters.")
    if len(password) > 128:
        raise ValueError("Password must be at most 128 characters.")
    lowered = password.lower()
    if lowered in _COMMON_PASSWORDS:
        raise ValueError("This password is too common.")
    for raw_word in context:
        word = raw_word.lower().strip()
        if len(word) >= 4 and word in lowered:
            raise ValueError("Password must not contain your name, email, or the school name.")


EmailStr = Annotated[str, AfterValidator(normalize_email)]
PersonName = Annotated[str, AfterValidator(normalize_name)]
IndianMobile = Annotated[str, AfterValidator(normalize_indian_mobile)]
AdmissionNo = Annotated[str, AfterValidator(validate_admission_no)]
Slug = Annotated[str, AfterValidator(validate_slug)]
PastDate = Annotated[date, AfterValidator(validate_past_date)]
