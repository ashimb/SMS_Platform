"""Unit tests: password hashing, JWT, refresh tokens, TOTP, secret encryption."""

from __future__ import annotations

import time
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt
import pyotp
import pytest
from argon2 import PasswordHasher
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from app.core import security
from app.core.config import get_settings

pytestmark = pytest.mark.unit


class TestPasswords:
    def test_hash_is_argon2id_and_verifies(self) -> None:
        hashed = security.hash_password("Correct-Horse-Battery-42")
        assert hashed.startswith("$argon2id$")
        assert security.verify_password("Correct-Horse-Battery-42", hashed)

    def test_wrong_password_fails(self) -> None:
        hashed = security.hash_password("Correct-Horse-Battery-42")
        assert not security.verify_password("wrong-password", hashed)

    def test_missing_or_garbage_hash_fails_without_raising(self) -> None:
        assert not security.verify_password("anything", None)
        assert not security.verify_password("anything", "not-a-hash")

    def test_hashes_are_salted(self) -> None:
        assert security.hash_password("same") != security.hash_password("same")

    def test_rehash_detected_for_weaker_parameters(self) -> None:
        weak = PasswordHasher(time_cost=1, memory_cost=8192, parallelism=1).hash("pw")
        assert security.password_needs_rehash(weak)
        assert not security.password_needs_rehash(security.hash_password("pw"))
        assert security.password_needs_rehash("garbage")


class TestJwt:
    def test_round_trip_carries_required_claims(self) -> None:
        user_id, tenant_id, session_id = uuid4(), uuid4(), uuid4()
        token, claims = security.create_token(
            subject=user_id, tenant_id=tenant_id, kind="access", session_id=session_id
        )
        decoded = security.decode_token(token, expected_type="access")
        assert decoded.sub == user_id
        assert decoded.tid == tenant_id
        assert decoded.sid == session_id
        assert decoded.jti == claims.jti
        assert decoded.type == "access"
        assert decoded.exp > datetime.now(UTC)

        header = jwt.get_unverified_header(token)
        assert header["alg"] == "EdDSA"

    def test_wrong_token_type_rejected(self) -> None:
        token, _ = security.create_token(subject=uuid4(), tenant_id=uuid4(), kind="mfa")
        with pytest.raises(security.TokenError):
            security.decode_token(token, expected_type="access")

    def test_expired_token_rejected(self) -> None:
        token, _ = security.create_token(
            subject=uuid4(), tenant_id=uuid4(), kind="access", ttl_seconds=-60
        )
        with pytest.raises(security.TokenError):
            security.decode_token(token, expected_type="access")

    def test_token_signed_with_another_key_rejected(self) -> None:
        other_key = Ed25519PrivateKey.generate()
        settings = get_settings()
        now = int(time.time())
        forged = jwt.encode(
            {
                "sub": str(uuid4()),
                "tid": str(uuid4()),
                "jti": "x",
                "type": "access",
                "iat": now,
                "exp": now + 300,
                "iss": settings.jwt_issuer,
                "aud": settings.jwt_audience,
            },
            other_key,
            algorithm="EdDSA",
        )
        with pytest.raises(security.TokenError):
            security.decode_token(forged, expected_type="access")

    def test_alg_none_rejected(self) -> None:
        unsigned = jwt.encode({"sub": str(uuid4())}, key=None, algorithm="none")
        with pytest.raises(security.TokenError):
            security.decode_token(unsigned, expected_type="access")

    def test_hs256_with_public_key_rejected(self) -> None:
        """Algorithm-confusion attack: HMAC signed with the public key bytes."""
        private = serialization.load_pem_private_key(
            get_settings().signing_key_pem(), password=None
        )
        public_pem = private.public_key().public_bytes(
            serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo
        )
        now = int(time.time())
        payload = {"sub": str(uuid4()), "tid": str(uuid4()), "exp": now + 60}
        try:
            confused = jwt.encode(payload, public_pem, algorithm="HS256")
        except jwt.InvalidKeyError:
            return  # PyJWT itself refuses to use a PEM key as an HMAC secret
        with pytest.raises(security.TokenError):
            security.decode_token(confused, expected_type="access")

    def test_tampered_payload_rejected(self) -> None:
        token, _ = security.create_token(subject=uuid4(), tenant_id=uuid4(), kind="access")
        header, payload, signature = token.split(".")
        tampered = ".".join(
            (header, payload[:-2] + ("AA" if payload[-2:] != "AA" else "BB"), signature)
        )
        with pytest.raises(security.TokenError):
            security.decode_token(tampered, expected_type="access")


class TestRefreshTokens:
    def test_tokens_are_random_and_long(self) -> None:
        tokens = {security.generate_refresh_token() for _ in range(50)}
        assert len(tokens) == 50
        assert all(len(t) >= 43 for t in tokens)

    def test_hash_is_sha256_hex_and_deterministic(self) -> None:
        token = security.generate_refresh_token()
        digest = security.hash_refresh_token(token)
        assert len(digest) == 64
        assert digest == security.hash_refresh_token(token)
        assert token not in digest


class TestTotp:
    def test_current_code_verifies_and_returns_step(self) -> None:
        secret = security.generate_totp_secret()
        now = time.time()
        code = pyotp.TOTP(secret).at(now)
        step = security.verify_totp(secret, code, at=now)
        assert step == int(now // 30)

    def test_adjacent_step_tolerated_but_not_further(self) -> None:
        secret = security.generate_totp_secret()
        now = time.time()
        assert security.verify_totp(secret, pyotp.TOTP(secret).at(now - 30), at=now) is not None
        assert security.verify_totp(secret, pyotp.TOTP(secret).at(now - 90), at=now) is None

    def test_replay_of_used_step_rejected(self) -> None:
        secret = security.generate_totp_secret()
        now = time.time()
        code = pyotp.TOTP(secret).at(now)
        step = security.verify_totp(secret, code, at=now)
        assert security.verify_totp(secret, code, last_used_step=step, at=now) is None

    @pytest.mark.parametrize("code", ["", "12345", "1234567", "abcdef", "12 345"])
    def test_malformed_codes_rejected(self, code: str) -> None:
        assert security.verify_totp(security.generate_totp_secret(), code) is None

    def test_provisioning_uri(self) -> None:
        uri = security.totp_provisioning_uri(
            "JBSWY3DPEHPK3PXP", account_name="a@b.com", issuer="SP"
        )
        assert uri.startswith("otpauth://totp/")
        assert "issuer=SP" in uri


class TestSecretEncryption:
    def test_round_trip(self) -> None:
        ciphertext = security.encrypt_secret("JBSWY3DPEHPK3PXP")
        assert "JBSWY3DPEHPK3PXP" not in ciphertext
        assert security.decrypt_secret(ciphertext) == "JBSWY3DPEHPK3PXP"

    def test_tampered_ciphertext_rejected(self) -> None:
        ciphertext = security.encrypt_secret("secret")
        with pytest.raises(security.TokenError):
            security.decrypt_secret(ciphertext[:-4] + "AAAA")


def test_constant_time_equals() -> None:
    assert security.constant_time_equals("abc", "abc")
    assert not security.constant_time_equals("abc", "abd")


def test_new_session_ids_are_unique_uuid7() -> None:
    ids = [security.new_session_id() for _ in range(10)]
    assert len(set(ids)) == 10
    assert all(i.version == 7 for i in ids)
    assert ids == sorted(ids)  # time-ordered
    assert datetime.now(UTC) - timedelta(seconds=5) < datetime.now(UTC)
