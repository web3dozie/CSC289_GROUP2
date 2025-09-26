import hashlib
from backend.models import verify_and_migrate_pin
from passlib.hash import pbkdf2_sha256


def test_legacy_sha256_pin_migrates():
    pin = '1234'
    legacy_hash = hashlib.sha256(pin.encode()).hexdigest()

    is_valid, new_hash = verify_and_migrate_pin(pin, legacy_hash)

    assert is_valid is True
    assert new_hash is not None
    # new_hash should be a pbkdf2_sha256 hash that verifies
    assert pbkdf2_sha256.verify(pin, new_hash)
