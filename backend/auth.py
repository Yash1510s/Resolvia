"""
Resolvia Auth & Custodial Wallet Module
=======================================
Web2 sign-in (email OTP / Google OAuth) → platform-assigned EVM wallet.

- New users get a keypair generated server-side; the private key is
  AES-256-GCM encrypted with a master key and never leaves the backend.
- The user's login (email/Google) IS the recovery mechanism — no seed phrases.
- Sensitive on-chain actions (juror commit/reveal) are signed by the backend
  on behalf of the logged-in user against the local Hardhat chain.

Production notes:
- Move the master key to a KMS / env secret (currently a gitignored file).
- Add OTP delivery via real email (dev mode prints the code + returns it).
- For production custody, replace with MPC or ERC-4337 smart accounts.
"""

import hashlib
import json
import os
import secrets
import sqlite3
import struct
import time
from typing import Optional

import jwt
import requests
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from eth_account import Account
from eth_utils import keccak
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
APP_ENV = os.environ.get("APP_ENV", "dev")
RPC_URL = os.environ.get("RESOLVIA_RPC", "http://127.0.0.1:8545")
CHAIN_ID = int(os.environ.get("RESOLVIA_CHAIN_ID", "31337"))
MANIFEST_PATH = os.path.join(BASE_DIR, "..", "blockchain", "deployments", "local.json")
DB_PATH = os.path.join(BASE_DIR, "resolvia_auth.db")
SECRET_DIR = os.path.join(BASE_DIR, "secret")

JWT_TTL_SECONDS = 7 * 24 * 3600
OTP_TTL_SECONDS = 300
OTP_MAX_ATTEMPTS = 3
OTP_REQUEST_COOLDOWN = 60  # seconds between requests for the same email


# ── Secrets (master key for wallet encryption + JWT signing) ────────────────

def _ensure_secrets() -> dict:
    env_master = os.environ.get("RESOLVIA_MASTER_KEY")
    env_jwt = os.environ.get("RESOLVIA_JWT_SECRET")
    if env_master and env_jwt:
        return {
            "master_key": env_master,
            "jwt_secret": env_jwt,
        }

    os.makedirs(SECRET_DIR, exist_ok=True)
    path = os.path.join(SECRET_DIR, "keys.json")
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    secrets_data = {
        "master_key": secrets.token_bytes(32).hex(),   # AES-256 key
        "jwt_secret": secrets.token_urlsafe(48),        # HS256 secret
    }
    with open(path, "w") as f:
        json.dump(secrets_data, f)
    try:
        os.chmod(path, 0o600)
    except Exception:
        pass
    return secrets_data


_SECRETS = _ensure_secrets()
MASTER_KEY = bytes.fromhex(_SECRETS["master_key"])
JWT_SECRET = _SECRETS["jwt_secret"]


# ── Crypto helpers ───────────────────────────────────────────────────────────

def _encrypt_key(private_key: bytes) -> bytes:
    """AES-256-GCM; returns nonce(16) || ciphertext."""
    nonce = secrets.token_bytes(16)
    ct = AESGCM(MASTER_KEY).encrypt(nonce, private_key, None)
    return nonce + ct


def _decrypt_key(blob: bytes) -> bytes:
    nonce, ct = blob[:16], blob[16:]
    return AESGCM(MASTER_KEY).decrypt(nonce, ct, None)


# ── Database ─────────────────────────────────────────────────────────────────

def _db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def _init_db() -> None:
    with _db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                google_id TEXT UNIQUE,
                created_at REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS wallets (
                user_id INTEGER PRIMARY KEY REFERENCES users(id),
                address TEXT UNIQUE NOT NULL,
                encrypted_key BLOB NOT NULL,
                created_at REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS otps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                code_hash TEXT NOT NULL,
                expires_at REAL NOT NULL,
                attempts INTEGER NOT NULL DEFAULT 0,
                created_at REAL NOT NULL
            );
            """
        )


_init_db()


# ── Users & wallets ──────────────────────────────────────────────────────────

# Platform operator funds new wallets so they can pay gas (local demo faucet).
# Production equivalent: ERC-4337 paymaster (gasless user transactions).
OPERATOR_KEY = os.environ.get(
    "RESOLVIA_OPERATOR_KEY",
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",  # hardhat #0
)
WALLET_GAS_FUNDING = 5 * 10**17  # 0.5 ETH, enough for hundreds of txs


def _fund_wallet(address: str) -> None:
    try:
        nonce = int(_rpc("eth_getTransactionCount", [Account.from_key(OPERATOR_KEY).address, "pending"]), 16)
        gas_price = int(_rpc("eth_gasPrice", []), 16)
        tx = {
            "to": address,
            "value": WALLET_GAS_FUNDING,
            "gas": 21_000,
            "gasPrice": gas_price,
            "nonce": nonce,
            "chainId": CHAIN_ID,
            "data": b"",
        }
        signed = Account.sign_transaction(tx, OPERATOR_KEY)
        _rpc("eth_sendRawTransaction", [signed.raw_transaction.hex()])
        print(f"[auth] funded {address} with 0.5 ETH (gas)")
    except Exception as e:
        print(f"[auth] wallet funding skipped: {e}")


def _provision_wallet(user_id: int) -> str:
    """Generate a fresh keypair for the user; return the address."""
    with _db() as conn:
        row = conn.execute("SELECT address FROM wallets WHERE user_id=?", (user_id,)).fetchone()
        if row:
            return row["address"]
    acct = Account.create()
    blob = _encrypt_key(acct.key)
    with _db() as conn:
        conn.execute(
            "INSERT INTO wallets (user_id, address, encrypted_key, created_at) VALUES (?,?,?,?)",
            (user_id, acct.address, blob, time.time()),
        )
    _fund_wallet(acct.address)
    return acct.address


def _get_user_record(user_id: int) -> dict:
    with _db() as conn:
        u = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
        w = conn.execute("SELECT address FROM wallets WHERE user_id=?", (user_id,)).fetchone()
    if not u or not w:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": u["id"],
        "name": u["name"],
        "email": u["email"],
        "provider": "google" if u["google_id"] else "email",
        "wallet": w["address"],
        "createdAt": u["created_at"],
    }


def _find_or_create_user(name: str, email: str, google_id: Optional[str] = None) -> int:
    email = email.lower().strip()
    with _db() as conn:
        if google_id:
            u = conn.execute("SELECT id FROM users WHERE google_id=?", (google_id,)).fetchone()
            if u:
                return u["id"]
        u = conn.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone()
        if u:
            if google_id:
                conn.execute("UPDATE users SET google_id=? WHERE id=?", (google_id, u["id"]))
            return u["id"]
        cur = conn.execute(
            "INSERT INTO users (name, email, google_id, created_at) VALUES (?,?,?,?)",
            (name, email, google_id, time.time()),
        )
        return cur.lastrowid


def _issue_token(user_id: int) -> str:
    user = _get_user_record(user_id)
    payload = {
        "sub": str(user["id"]),  # RFC 7519 / PyJWT ≥2.10: sub must be a string
        "email": user["email"],
        "wallet": user["wallet"],
        "exp": int(time.time()) + JWT_TTL_SECONDS,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


# ── Auth dependency ──────────────────────────────────────────────────────────

def get_current_user(request: Request) -> dict:
    auth = request.headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    try:
        payload = jwt.decode(auth[7:], JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired, please sign in again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid session token")
    return _get_user_record(int(payload["sub"]))


# ── Chain signing (local Hardhat chain via raw JSON-RPC) ────────────────────

_SELECTOR_COMMIT = keccak(text="commitVote(uint256,bytes32)")[:4]
_SELECTOR_REVEAL = keccak(text="revealVote(uint256,uint8,bytes32)")[:4]


def _rpc(method: str, params: list) -> any:
    try:
        r = requests.post(
            RPC_URL,
            json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params},
            timeout=15,
        )
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Local chain unreachable: {e}")
    if "error" in data:
        raise HTTPException(status_code=502, detail=f"RPC error: {data['error']}")
    return data.get("result")


def _load_voting_manager() -> str:
    try:
        with open(MANIFEST_PATH) as f:
            m = json.load(f)
        return m["contracts"]["VotingManager"]
    except Exception:
        raise HTTPException(status_code=503, detail="Deployment manifest not found — run blockchain deploy")


def _send_signed(voting_manager: str, private_key: bytes, data: bytes) -> dict:
    nonce = int(_rpc("eth_getTransactionCount", [format_address(private_key), "pending"]) or "0x0", 16)
    gas_price = int(_rpc("eth_gasPrice", []) or "0x0", 16)
    tx = {
        "to": voting_manager,
        "value": 0,
        "gas": 120_000,
        "gasPrice": gas_price,
        "nonce": nonce,
        "chainId": CHAIN_ID,
        "data": data,
    }
    signed = Account.sign_transaction(tx, private_key)
    tx_hash = _rpc("eth_sendRawTransaction", [signed.raw_transaction.hex()])
    if not tx_hash:
        raise HTTPException(status_code=502, detail="Transaction was not accepted")
    for _ in range(30):
        receipt = _rpc("eth_getTransactionReceipt", [tx_hash])
        if receipt:
            return {
                "status": "SUCCESS",
                "txHash": tx_hash,
                "blockNumber": int(receipt["blockNumber"], 16),
            }
        time.sleep(0.5)
    return {"status": "PENDING", "txHash": tx_hash, "blockNumber": None}


def format_address(private_key: bytes) -> str:
    return Account.from_key(private_key).address


def _pad32(n: int) -> bytes:
    return struct.pack(">Q", n).rjust(32, b"\0")


# ── Router ──────────────────────────────────────────────────────────────────

router = APIRouter()


class OtpRequestIn(BaseModel):
    email: str = Field(min_length=5, max_length=200)


class OtpVerifyIn(BaseModel):
    email: str
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class GoogleIn(BaseModel):
    credential: str  # Google ID token from Google Identity Services


class CommitIn(BaseModel):
    caseId: int
    commitment: str = Field(pattern=r"^0x[0-9a-fA-F]{64}$")


class RevealIn(BaseModel):
    caseId: int
    vote: int = Field(ge=1, le=3)
    salt: str = Field(pattern=r"^0x[0-9a-fA-F]{64}$")


def _valid_email(email: str) -> bool:
    return "@" in email and "." in email.split("@")[-1] and len(email) >= 5



# ── Email delivery (optional SMTP; falls back to devCode in dev) ────────────

def _smtp_configured() -> bool:
    return bool(os.environ.get("SMTP_HOST"))


def _send_otp_email(email: str, code: str) -> None:
    """Send the OTP over SMTP. Raises on failure (caller decides to abort)."""
    import smtplib
    from email.mime.text import MIMEText

    host = os.environ["SMTP_HOST"]
    port = int(os.environ.get("SMTP_PORT", "587"))
    user = os.environ.get("SMTP_USER", "")
    password = os.environ.get("SMTP_PASS", "")
    sender = os.environ.get("SMTP_FROM", user or "resolvia@localhost")
    verify_url = os.environ.get("OTP_VERIFY_URL", "https://resolvia.app/verify-otp")

    msg = MIMEText(
        f"Your Resolvia verification code is {code}.\n\n"
        f"It expires in {OTP_TTL_SECONDS // 60} minutes. "
        f"If you did not request this, you can ignore this email.\n\n"
        f"Resolvia"
    )
    msg["Subject"] = "Your Resolvia verification code"
    msg["From"] = sender
    msg["To"] = email

    with smtplib.SMTP(host, port, timeout=15) as server:
        server.ehlo()
        try:
            server.starttls()
            server.ehlo()
        except smtplib.SMTPNotSupportedError:
            pass  # some local relays have no TLS
        if user and password:
            server.login(user, password)
        server.sendmail(sender, [email], msg.as_string())


@router.post("/auth/otp/request")
def otp_request(body: OtpRequestIn):
    email = body.email.lower().strip()
    if not _valid_email(email):
        raise HTTPException(status_code=400, detail="Enter a valid email address")
    now = time.time()
    with _db() as conn:
        recent = conn.execute(
            "SELECT created_at FROM otps WHERE email=? AND created_at>? ORDER BY id DESC LIMIT 1",
            (email, now - OTP_REQUEST_COOLDOWN),
        ).fetchone()
        if recent:
            raise HTTPException(status_code=429, detail="Slow down — try again in a minute")

    code = f"{secrets.randbelow(1_000_000):06d}"
    code_hash = hashlib.sha256(code.encode()).hexdigest()

    out = {"status": "OTP_SENT", "email": email}
    if _smtp_configured():
        # Real delivery: persist the code ONLY after the email is sent,
        # so a user can never be stuck with a code they never received.
        try:
            _send_otp_email(email, code)
        except Exception as e:
            print(f"[auth] SMTP delivery failed for {email}: {e}")
            raise HTTPException(status_code=502, detail="Could not deliver the verification email — try again shortly.")
        with _db() as conn:
            conn.execute("DELETE FROM otps WHERE email=?", (email,))
            conn.execute(
                "INSERT INTO otps (email, code_hash, expires_at, attempts, created_at) VALUES (?,?,?,?,?)",
                (email, code_hash, now + OTP_TTL_SECONDS, 0, now),
            )
        print(f"[auth] OTP emailed to {email}")
    else:
        if APP_ENV != "dev":
            raise HTTPException(status_code=503, detail="Email delivery is not configured on this server (set SMTP_HOST etc.).")
        # Dev only: show the code so demos work without an email server.
        with _db() as conn:
            conn.execute("DELETE FROM otps WHERE email=?", (email,))
            conn.execute(
                "INSERT INTO otps (email, code_hash, expires_at, attempts, created_at) VALUES (?,?,?,?,?)",
                (email, code_hash, now + OTP_TTL_SECONDS, 0, now),
            )
        print(f"[auth] OTP for {email}: {code}")
        out["devCode"] = code
    return out


@router.post("/auth/otp/verify")
def otp_verify(body: OtpVerifyIn):
    email = body.email.lower().strip()
    code_hash = hashlib.sha256(body.code.encode()).hexdigest()
    now = time.time()
    with _db() as conn:
        row = conn.execute(
            "SELECT * FROM otps WHERE email=? AND expires_at>? ORDER BY id DESC LIMIT 1",
            (email, now),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=400, detail="Invalid or expired code")
        if row["attempts"] >= OTP_MAX_ATTEMPTS:
            raise HTTPException(status_code=429, detail="Too many attempts — request a new code")
        if row["code_hash"] != code_hash:
            new_attempts = row["attempts"] + 1
            conn.execute("UPDATE otps SET attempts=? WHERE id=?", (new_attempts, row["id"]))
            if new_attempts >= OTP_MAX_ATTEMPTS:
                raise HTTPException(status_code=429, detail="Maximum attempts reached. Please request a new code.")
            remaining = OTP_MAX_ATTEMPTS - new_attempts
            raise HTTPException(status_code=400, detail=f"Invalid code. {remaining} attempt(s) remaining.")
        conn.execute("DELETE FROM otps WHERE id=?", (row["id"],))
    name = email.split("@")[0].replace(".", " ").replace("_", " ").strip().title()
    user_id = _find_or_create_user(name, email)
    wallet = _provision_wallet(user_id)
    user = _get_user_record(user_id)
    return {"status": "SUCCESS", "token": _issue_token(user_id), "user": user}


@router.post("/auth/google")
def google_signin(body: GoogleIn):
    client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
    if not client_id:
        raise HTTPException(status_code=503, detail="Google sign-in not configured (GOOGLE_CLIENT_ID missing)")
    try:
        from google.auth.transport import requests as grequests
        from google.oauth2 import id_token as g_id_token

        info = g_id_token.verify_oauth2_token(body.credential, grequests.Request(), audience=client_id)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Google token verification failed: {e}")
    email = info.get("email")
    if not email or not info.get("email_verified"):
        raise HTTPException(status_code=400, detail="Google token has no verified email")
    name = info.get("name") or email.split("@")[0].title()
    user_id = _find_or_create_user(name, email, google_id=info.get("sub"))
    wallet = _provision_wallet(user_id)
    user = _get_user_record(user_id)
    return {"status": "SUCCESS", "token": _issue_token(user_id), "user": user}


class WalletIn(BaseModel):
    wallet: str
    name: Optional[str] = None


@router.post("/auth/wallet")
def wallet_signin(body: WalletIn):
    addr = body.wallet.strip().lower()
    name = body.name or "Yash Vijay Singh"
    email = f"{addr[:10]}@wallet.resolvia.eth"
    user_id = _find_or_create_user(name, email)
    wallet = _provision_wallet(user_id)
    user = _get_user_record(user_id)
    return {"status": "SUCCESS", "token": _issue_token(user_id), "user": user}



@router.get("/auth/me")
def me(user: dict = Depends(get_current_user)):
    return {"status": "SUCCESS", "user": user}


def _signed_vote(user: dict, data: bytes) -> dict:
    with _db() as conn:
        w = conn.execute("SELECT encrypted_key FROM wallets WHERE user_id=?", (user["id"],)).fetchone()
    if not w:
        raise HTTPException(status_code=500, detail="Wallet not provisioned")
    private_key = _decrypt_key(w["encrypted_key"])
    return _send_signed(_load_voting_manager(), private_key, data)


@router.post("/wallet/vote/commit")
def vote_commit(body: CommitIn, user: dict = Depends(get_current_user)):
    data = _SELECTOR_COMMIT + _pad32(body.caseId) + bytes.fromhex(body.commitment[2:])
    return _signed_vote(user, data)


def _get_key(user: dict) -> bytes:
    with _db() as conn:
        w = conn.execute("SELECT encrypted_key FROM wallets WHERE user_id=?", (user["id"],)).fetchone()
    return _decrypt_key(w["encrypted_key"])


@router.post("/wallet/vote/reveal")
def vote_reveal(body: RevealIn, user: dict = Depends(get_current_user)):
    data = _SELECTOR_REVEAL + _pad32(body.caseId) + _pad32(body.vote) + bytes.fromhex(body.salt[2:])
    return _signed_vote(user, data)


# ── Evidence anchoring (real on-chain write via the user's wallet) ───────────

class AnchorIn(BaseModel):
    caseId: int = Field(ge=0)
    sha256: str = Field(pattern=r"^[0-9a-fA-F]{64}$")
    ipfsCid: str = Field(min_length=1, max_length=128)
    tier: int = Field(ge=0, le=3, default=0)  # AccessTier enum


def _abi_encode_string(s: str) -> bytes:
    raw = s.encode("utf-8")
    length = len(raw)
    padded = raw + b"\x00" * ((32 - length % 32) % 32)
    return _pad32(length) + padded


def _load_evidence_registry() -> str:
    try:
        with open(MANIFEST_PATH) as f:
            m = json.load(f)
        return m["contracts"]["EvidenceRegistry"]
    except Exception:
        raise HTTPException(status_code=503, detail="Deployment manifest not found — run blockchain deploy")


def _signed_tx(user: dict, to_address: str, data: bytes, gas: int = 150_000) -> dict:
    with _db() as conn:
        w = conn.execute("SELECT encrypted_key FROM wallets WHERE user_id=?", (user["id"],)).fetchone()
    if not w:
        raise HTTPException(status_code=500, detail="Wallet not provisioned")
    private_key = _decrypt_key(w["encrypted_key"])
    nonce = int(_rpc("eth_getTransactionCount", [format_address(private_key), "pending"]) or "0x0", 16)
    gas_price = int(_rpc("eth_gasPrice", []) or "0x0", 16)
    tx = {
        "to": to_address,
        "value": 0,
        "gas": gas,
        "gasPrice": gas_price,
        "nonce": nonce,
        "chainId": CHAIN_ID,
        "data": data,
    }
    signed = Account.sign_transaction(tx, private_key)
    tx_hash = _rpc("eth_sendRawTransaction", [signed.raw_transaction.hex()])
    if not tx_hash:
        raise HTTPException(status_code=502, detail="Transaction was not accepted")
    for _ in range(30):
        receipt = _rpc("eth_getTransactionReceipt", [tx_hash])
        if receipt:
            if int(receipt["status"], 16) == 0:
                raise HTTPException(status_code=422, detail="On-chain transaction reverted")
            return {"status": "ANCHORED", "txHash": tx_hash, "blockNumber": int(receipt["blockNumber"], 16)}
    return {"status": "PENDING", "txHash": tx_hash, "blockNumber": None}


_SELECTOR_REGISTER_EVIDENCE = keccak(text="registerEvidence(uint256,bytes32,string,uint8)")[:4]


@router.post("/wallet/evidence/anchor")
def evidence_anchor(body: AnchorIn, user: dict = Depends(get_current_user)):
    """Register an evidence hash on-chain, signed by the user's assigned wallet."""
    data = (
        _SELECTOR_REGISTER_EVIDENCE
        + _pad32(body.caseId)
        + bytes.fromhex(body.sha256)  # exactly 32 bytes
        + _pad32(96)  # head: 3 fixed slots before the dynamic string
        + _pad32(body.tier)
        + _abi_encode_string(body.ipfsCid)
    )
    out = _signed_tx(user, _load_evidence_registry(), data, gas=300_000)
    out["caseId"] = body.caseId
    out["sha256"] = body.sha256.lower()
    out["submitter"] = user["wallet"]
    return out


@router.get("/evidence/verify")
def evidence_verify(sha256: str, caseId: Optional[int] = None):
    """Public read-only check: is this hash anchored in the EvidenceRegistry?"""
    import re as _re

    h = sha256.strip().lower()
    if _re.fullmatch(r"0x[0-9a-f]{64}", h):
        h = h[2:]
    if not _re.fullmatch(r"[0-9a-f]{64}", h):
        raise HTTPException(status_code=400, detail="sha256 must be 64 hex chars")
    target = "0x" + h
    try:
        # Scan from the start of the chain (local/testnet chains are small; on
        # mainnet this would use an indexer). contentSha256 is a non-indexed
        # event param, so we scan the log data.
        latest = int(_rpc("eth_blockNumber", []) or "0x0", 16)
        logs = _rpc(
            "eth_getLogs",
            [
                {
                    "fromBlock": "0x0",
                    "toBlock": hex(latest),
                    "address": _load_evidence_registry(),
                }
            ],
        ) or []
        found = []
        for lg in logs:
            data_hex = lg.get("data", "0x")
            # contentSha256 appears in the data (4th param, non-indexed) as bytes32.
            if h in data_hex.lower():
                found.append(
                    {
                        "txHash": lg.get("transactionHash"),
                        "blockNumber": int(lg.get("blockNumber", "0x0"), 16),
                        "logIndex": int(lg.get("logIndex", "0x0"), 16),
                    }
                )
        if found:
            return {"status": "ANCHORED", "sha256": h, "matches": found, "count": len(found)}
        return {"status": "NOT_FOUND", "sha256": h, "matches": []}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Chain read failed: {e}")

# ── App-state sync (per-user persistence) ─────────────────────────────────────
import state_store


class StateIn(BaseModel):
    state: dict


@router.get("/state")
def get_saved_state(user: dict = Depends(get_current_user)):
    """Return the workspace state saved for this account (404 if none yet)."""
    data = state_store.load_state(str(user["id"]))
    if data is None:
        raise HTTPException(status_code=404, detail="No saved state for this account")
    return {"state": data}


@router.put("/state")
def put_saved_state(body: StateIn, user: dict = Depends(get_current_user)):
    """Mirror the frontend workspace state to the backend (opaque JSON)."""
    try:
        state_store.save_state(str(user["id"]), body.state)
    except ValueError as e:
        raise HTTPException(status_code=413, detail=str(e))
    return {"ok": True}
