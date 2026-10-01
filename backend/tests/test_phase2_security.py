"""
Unit and integration tests for Phase 2 Backend Security:
- Auth enforcement on sensitive endpoints
- File size, extension, and SHA-256 integrity validation
- Honest IPFS status without fake CIDs
- OTP 15-minute lockout on 3 consecutive failed attempts
- Access Token (1h) and Refresh Token (7d) rotation flow
"""

import os
import sys
import base64
import hashlib
import time

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient

# Ensure dev mode and unconfigured SMTP for deterministic local unit test
os.environ["APP_ENV"] = "dev"
os.environ.pop("SMTP_HOST", None)
os.environ.pop("PINATA_JWT", None)
os.environ.pop("PINATA_API_KEY", None)

import auth
auth.APP_ENV = "dev"
auth._smtp_configured = lambda: False

import server

client = TestClient(server.app)

def test_unauthenticated_ipfs_upload_rejected():
    payload = {
        "fileName": "contract.pdf",
        "contentBase64": base64.b64encode(b"test document").decode(),
        "sha256": hashlib.sha256(b"test document").hexdigest(),
    }
    res = client.post("/api/ipfs/upload", json=payload)
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"

def test_unauthenticated_ai_analyze_rejected():
    payload = {
        "caseId": "CASE-999",
        "claimantStatement": "Claimant statement text",
    }
    res = client.post("/api/ai/analyze", json=payload)
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"

def test_otp_flow_and_15min_lockout():
    test_email = f"audit_test_{int(time.time())}@resolvia.org"
    
    # 1. Request OTP
    req_res = client.post("/api/auth/otp/request", json={"email": test_email})
    assert req_res.status_code == 200
    data = req_res.json()
    assert "devCode" in data
    real_code = data["devCode"]

    # 2. Attempt 1 wrong code
    w1 = client.post("/api/auth/otp/verify", json={"email": test_email, "code": "000000"})
    assert w1.status_code == 400
    assert "2 attempt(s) remaining" in w1.json()["detail"]

    # 3. Attempt 2 wrong code
    w2 = client.post("/api/auth/otp/verify", json={"email": test_email, "code": "000001"})
    assert w2.status_code == 400
    assert "1 attempt(s) remaining" in w2.json()["detail"]

    # 4. Attempt 3 wrong code -> triggers 15-minute lockout
    w3 = client.post("/api/auth/otp/verify", json={"email": test_email, "code": "000002"})
    assert w3.status_code == 429
    assert "locked for 15 minutes" in w3.json()["detail"]

    # 5. Subsequent verify even with correct code is rejected due to lockout
    w4 = client.post("/api/auth/otp/verify", json={"email": test_email, "code": real_code})
    assert w4.status_code == 429
    assert "Account verification is locked" in w4.json()["detail"]

def test_auth_refresh_token_rotation():
    email = f"refresh_test_{int(time.time())}@resolvia.org"
    
    # Request & verify OTP
    req_res = client.post("/api/auth/otp/request", json={"email": email})
    code = req_res.json()["devCode"]
    
    verify_res = client.post("/api/auth/otp/verify", json={"email": email, "code": code})
    assert verify_res.status_code == 200
    auth_data = verify_res.json()
    
    assert "token" in auth_data
    assert "refreshToken" in auth_data
    assert auth_data["expiresIn"] == 3600
    
    old_refresh = auth_data["refreshToken"]
    
    # Refresh token call
    refresh_res = client.post("/api/auth/refresh", json={"refreshToken": old_refresh})
    assert refresh_res.status_code == 200
    refreshed_data = refresh_res.json()
    
    assert "token" in refreshed_data
    assert "refreshToken" in refreshed_data
    new_refresh = refreshed_data["refreshToken"]
    assert new_refresh != old_refresh

    # Old refresh token should now be revoked
    replay_res = client.post("/api/auth/refresh", json={"refreshToken": old_refresh})
    assert replay_res.status_code == 401

def test_authenticated_ipfs_upload_and_validation():
    # Login to get valid bearer token
    email = f"upload_test_{int(time.time())}@resolvia.org"
    req_res = client.post("/api/auth/otp/request", json={"email": email})
    code = req_res.json()["devCode"]
    auth_data = client.post("/api/auth/otp/verify", json={"email": email, "code": code}).json()
    token = auth_data["token"]
    headers = {"Authorization": f"Bearer {token}"}

    content = b"Legal exhibit contract text for dispute resolution"
    sha256_hash = hashlib.sha256(content).hexdigest()
    b64_content = base64.b64encode(content).decode()

    # 1. Reject invalid file extension (.exe)
    res_bad_ext = client.post(
        "/api/ipfs/upload",
        json={"fileName": "malware.exe", "contentBase64": b64_content, "sha256": sha256_hash},
        headers=headers,
    )
    assert res_bad_ext.status_code == 400
    assert "Unsupported file format" in res_bad_ext.json()["detail"]

    # 2. Reject hash mismatch (tampered file)
    tampered_hash = hashlib.sha256(b"tampered").hexdigest()
    res_mismatch = client.post(
        "/api/ipfs/upload",
        json={"fileName": "contract.pdf", "contentBase64": b64_content, "sha256": tampered_hash},
        headers=headers,
    )
    assert res_mismatch.status_code == 400
    assert "SHA-256 integrity check failed" in res_mismatch.json()["detail"]

    # 3. Valid upload without Pinata returns honest UNPINNED_VERIFIED (no fake bafybei CIDs)
    res_valid = client.post(
        "/api/ipfs/upload",
        json={"fileName": "contract.pdf", "contentBase64": b64_content, "sha256": sha256_hash},
        headers=headers,
    )
    assert res_valid.status_code == 200
    upload_res = res_valid.json()
    print("  -> IPFS response:", upload_res)
    # If Pinata has valid credentials, status is PINNED with a real CID;
    # if unconfigured, status is UNPINNED_VERIFIED with ipfsCid: None.
    # In both cases, fake bafybei CIDs MUST NEVER be returned!
    assert upload_res["status"] in ("PINNED", "UNPINNED_VERIFIED", "PIN_FAILED")
    if upload_res["status"] == "UNPINNED_VERIFIED":
        assert upload_res["ipfsCid"] is None
        assert upload_res["gatewayUrl"] is None
    elif upload_res["status"] == "PINNED":
        assert upload_res["ipfsCid"] is not None
        assert not upload_res["ipfsCid"].startswith("bafybei" + sha256_hash[:10])  # Must not be fake sha slice!
    assert upload_res["sha256"] == sha256_hash

if __name__ == "__main__":
    print("[1/5] Testing unauthenticated ipfs upload...")
    test_unauthenticated_ipfs_upload_rejected()
    print("  -> Passed!")

    print("[2/5] Testing unauthenticated ai analyze...")
    test_unauthenticated_ai_analyze_rejected()
    print("  -> Passed!")

    print("[3/5] Testing OTP 15-minute lockout on 3 failed attempts...")
    test_otp_flow_and_15min_lockout()
    print("  -> Passed!")

    print("[4/5] Testing auth refresh token rotation...")
    test_auth_refresh_token_rotation()
    print("  -> Passed!")

    print("[5/5] Testing authenticated IPFS upload and validation...")
    test_authenticated_ipfs_upload_and_validation()
    print("  -> Passed!")

    print("\nALL 5 BACKEND SECURITY TESTS PASSED SUCCESSFULLY!")
