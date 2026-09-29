"""
Resolvia App-State & Relational Dispute Persistence (SQLite)
===========================================================
Dual-layer data architecture:
1. Relational tables (disputes, evidence_records, juror_assignments) for cross-user
   visibility between Claimants, Respondents, and Jurors.
2. Per-user workspace state (user_state) for user preferences, notifications, and balance.

When a user saves state, their disputes are parsed and upserted into the shared relational
tables. When loading state, shared disputes where the user is Claimant, Respondent, or Juror
are merged so both parties interact with the same underlying case records.
"""
from __future__ import annotations

import json
import os
import sqlite3
import threading
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

_DB_PATH = os.path.join(os.path.dirname(__file__), "state.db")
_AUTH_DB_PATH = os.path.join(os.path.dirname(__file__), "resolvia_auth.db")
_lock = threading.Lock()


def _conn() -> sqlite3.Connection:
    c = sqlite3.connect(_DB_PATH)
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA journal_mode=WAL")
    c.execute("PRAGMA busy_timeout=5000")
    c.execute("PRAGMA foreign_keys=ON")
    return c


def _init_db() -> None:
    with _conn() as c:
        c.executescript(
            """
            CREATE TABLE IF NOT EXISTS user_state (
                sub TEXT PRIMARY KEY,
                payload TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS disputes (
                id TEXT PRIMARY KEY,
                case_number TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                status TEXT NOT NULL,
                claimant_id TEXT,
                claimant_name TEXT NOT NULL,
                claimant_wallet TEXT NOT NULL,
                respondent_id TEXT,
                respondent_name TEXT NOT NULL,
                respondent_wallet TEXT NOT NULL,
                dispute_amount TEXT,
                claim_summary TEXT,
                relief_sought TEXT,
                counter_claim_summary TEXT,
                created_at TEXT NOT NULL,
                response_deadline TEXT,
                voting_deadline TEXT,
                on_chain_case_id INTEGER,
                raw_json TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS evidence_records (
                id TEXT PRIMARY KEY,
                case_id TEXT NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                description TEXT,
                file_name TEXT NOT NULL,
                file_size TEXT,
                mime_type TEXT,
                sha256_hash TEXT NOT NULL,
                ipfs_cid TEXT NOT NULL,
                submitted_by TEXT NOT NULL,
                submitter_wallet TEXT NOT NULL,
                submitted_at TEXT NOT NULL,
                access_tier TEXT NOT NULL,
                on_chain_anchored INTEGER DEFAULT 0,
                on_chain_tx TEXT,
                on_chain_block INTEGER
            );

            CREATE TABLE IF NOT EXISTS juror_assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                case_id TEXT NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
                juror_id TEXT NOT NULL,
                wallet_address TEXT NOT NULL,
                pseudonym TEXT NOT NULL,
                status TEXT NOT NULL,
                commitment_hash TEXT,
                revealed_vote TEXT,
                salt TEXT,
                reasoning TEXT,
                commit_timestamp TEXT,
                reveal_timestamp TEXT,
                UNIQUE(case_id, juror_id)
            );

            CREATE INDEX IF NOT EXISTS idx_disputes_claimant ON disputes(claimant_wallet);
            CREATE INDEX IF NOT EXISTS idx_disputes_respondent ON disputes(respondent_wallet);
            CREATE INDEX IF NOT EXISTS idx_juror_wallet ON juror_assignments(wallet_address);
            """
        )


_init_db()


def _get_user_info_from_auth(sub: str) -> tuple[Optional[str], Optional[str]]:
    """Helper to query user's assigned wallet and name from auth database."""
    if not os.path.exists(_AUTH_DB_PATH):
        return None, None
    try:
        with sqlite3.connect(_AUTH_DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            row = conn.execute(
                """
                SELECT u.name, w.address 
                FROM users u 
                LEFT JOIN wallets w ON w.user_id = u.id 
                WHERE u.id = ? OR u.email = ?
                """,
                (sub, sub),
            ).fetchone()
            if row:
                return row["address"], row["name"]
    except Exception:
        pass
    return None, None


# ── Relational Case Extraction & Upsert ───────────────────────────────────────

def save_dispute_relational(c: Dict[str, Any], claimant_sub: Optional[str] = None) -> None:
    """Save a dispute object into the relational tables."""
    case_id = str(c.get("id", ""))
    case_number = str(c.get("caseNumber") or f"RSLV-{case_id}")
    if not case_id:
        return

    now = datetime.now(timezone.utc).isoformat()
    claimant = c.get("claimant") or {}
    respondent = c.get("respondent") or {}

    claimant_name = claimant.get("name") or "Claimant"
    claimant_wallet = (claimant.get("wallet") or "").lower()
    respondent_name = respondent.get("name") or "Respondent"
    respondent_wallet = (respondent.get("wallet") or "").lower()

    title = c.get("title") or "Untitled Dispute"
    category = c.get("category") or "GENERAL_EVIDENCE"
    status = c.get("status") or "SUBMITTED"
    amount = str(c.get("disputeAmount") or "0")
    summary = c.get("claimSummary") or ""
    relief = c.get("reliefSought") or ""
    counter_summary = c.get("counterClaimSummary") or ""
    created_at = c.get("createdAt") or now
    resp_deadline = c.get("responseDeadline")
    vote_deadline = c.get("votingDeadline")
    on_chain_case_id = c.get("onChainCaseId")

    raw_json = json.dumps(c)

    with _lock:
        conn = _conn()
        try:
            conn.execute(
                """
                INSERT INTO disputes (
                    id, case_number, title, category, status,
                    claimant_id, claimant_name, claimant_wallet,
                    respondent_id, respondent_name, respondent_wallet,
                    dispute_amount, claim_summary, relief_sought,
                    counter_claim_summary, created_at, response_deadline,
                    voting_deadline, on_chain_case_id, raw_json, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    case_number = excluded.case_number,
                    title = excluded.title,
                    category = excluded.category,
                    status = excluded.status,
                    claimant_name = excluded.claimant_name,
                    claimant_wallet = excluded.claimant_wallet,
                    respondent_name = excluded.respondent_name,
                    respondent_wallet = excluded.respondent_wallet,
                    dispute_amount = excluded.dispute_amount,
                    claim_summary = excluded.claim_summary,
                    relief_sought = excluded.relief_sought,
                    counter_claim_summary = excluded.counter_claim_summary,
                    response_deadline = excluded.response_deadline,
                    voting_deadline = excluded.voting_deadline,
                    on_chain_case_id = excluded.on_chain_case_id,
                    raw_json = excluded.raw_json,
                    updated_at = excluded.updated_at
                """,
                (
                    case_id, case_number, title, category, status,
                    claimant_sub, claimant_name, claimant_wallet,
                    None, respondent_name, respondent_wallet,
                    amount, summary, relief, counter_summary,
                    created_at, resp_deadline, vote_deadline,
                    on_chain_case_id, raw_json, now
                ),
            )

            # Evidence records
            for ev in c.get("evidence", []):
                ev_id = str(ev.get("id", ""))
                if not ev_id:
                    continue
                conn.execute(
                    """
                    INSERT INTO evidence_records (
                        id, case_id, title, description, file_name, file_size,
                        mime_type, sha256_hash, ipfs_cid, submitted_by,
                        submitter_wallet, submitted_at, access_tier,
                        on_chain_anchored, on_chain_tx, on_chain_block
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        title = excluded.title,
                        description = excluded.description,
                        on_chain_anchored = excluded.on_chain_anchored,
                        on_chain_tx = excluded.on_chain_tx,
                        on_chain_block = excluded.on_chain_block
                    """,
                    (
                        ev_id, case_id,
                        ev.get("title") or "Evidence",
                        ev.get("description") or "",
                        ev.get("fileName") or "evidence.pdf",
                        ev.get("fileSize") or "100 KB",
                        ev.get("mimeType") or "application/octet-stream",
                        ev.get("sha256Hash") or "",
                        ev.get("ipfsCid") or "",
                        ev.get("submittedBy") or "Claimant",
                        ev.get("submitterWallet") or claimant_wallet,
                        ev.get("submittedAt") or now,
                        ev.get("accessTier") or "PUBLIC",
                        1 if ev.get("onChainAnchored") else 0,
                        ev.get("onChainTx"),
                        ev.get("onChainBlock"),
                    ),
                )

            # Juror assignments
            for j in c.get("jurors", []):
                j_id = str(j.get("jurorId", ""))
                if not j_id:
                    continue
                conn.execute(
                    """
                    INSERT INTO juror_assignments (
                        case_id, juror_id, wallet_address, pseudonym, status,
                        commitment_hash, revealed_vote, salt, reasoning,
                        commit_timestamp, reveal_timestamp
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(case_id, juror_id) DO UPDATE SET
                        status = excluded.status,
                        commitment_hash = excluded.commitment_hash,
                        revealed_vote = excluded.revealed_vote,
                        salt = excluded.salt,
                        reasoning = excluded.reasoning,
                        commit_timestamp = excluded.commit_timestamp,
                        reveal_timestamp = excluded.reveal_timestamp
                    """,
                    (
                        case_id, j_id,
                        (j.get("walletAddress") or "").lower(),
                        j.get("pseudonym") or f"Juror {j_id}",
                        j.get("status") or "PENDING_COMMIT",
                        j.get("commitmentHash"),
                        j.get("revealedVote"),
                        j.get("salt"),
                        j.get("reasoning"),
                        j.get("commitTimestamp"),
                        j.get("revealTimestamp"),
                    ),
                )

            conn.commit()
        finally:
            conn.close()


def get_shared_disputes_for_user(
    user_sub: Optional[str] = None,
    user_wallet: Optional[str] = None,
    user_name: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Retrieve all shared disputes relevant to this user (as Claimant, Respondent, or Juror)."""
    norm_wallet = (user_wallet or "").strip().lower()
    norm_name = (user_name or "").strip().lower()

    with _lock:
        conn = _conn()
        try:
            # Query all disputes matching wallet, sub, name, or juror empanelling
            query = """
                SELECT DISTINCT d.* 
                FROM disputes d
                LEFT JOIN juror_assignments j ON j.case_id = d.id
                WHERE (d.claimant_id IS NOT NULL AND d.claimant_id = ?)
                   OR (? != '' AND LOWER(d.claimant_wallet) = ?)
                   OR (? != '' AND LOWER(d.respondent_wallet) = ?)
                   OR (? != '' AND LOWER(d.respondent_name) = ?)
                   OR (? != '' AND LOWER(j.wallet_address) = ?)
                ORDER BY d.created_at DESC
            """
            rows = conn.execute(
                query,
                (user_sub, norm_wallet, norm_wallet, norm_wallet, norm_wallet, norm_name, norm_name, norm_wallet, norm_wallet),
            ).fetchall()

            cases = []
            for r in rows:
                case_obj = json.loads(r["raw_json"])
                # Compute user's personal role for display in their console
                if norm_wallet and r["claimant_wallet"].lower() == norm_wallet or (user_sub and r["claimant_id"] == user_sub):
                    case_obj["myRole"] = "CLAIMANT"
                elif norm_wallet and r["respondent_wallet"].lower() == norm_wallet or (norm_name and r["respondent_name"].lower() == norm_name):
                    case_obj["myRole"] = "RESPONDENT"
                elif norm_wallet and conn.execute("SELECT 1 FROM juror_assignments WHERE case_id=? AND LOWER(wallet_address)=?", (r["id"], norm_wallet)).fetchone():
                    case_obj["myRole"] = "JUROR"
                cases.append(case_obj)
            return cases
        finally:
            conn.close()


# ── App-State Sync (Dual Layer) ───────────────────────────────────────────────

def save_state(
    sub: str,
    payload: dict,
    user_wallet: Optional[str] = None,
    user_name: Optional[str] = None,
) -> str:
    """Save full user state and extract cases into relational shared tables."""
    blob = json.dumps(payload)
    if len(blob) > 2_000_000:
        raise ValueError("state too large (max 2 MB)")

    # Auto-resolve wallet & name if not provided
    if not user_wallet or not user_name:
        auth_wallet, auth_name = _get_user_info_from_auth(sub)
        user_wallet = user_wallet or auth_wallet
        user_name = user_name or auth_name

    now = datetime.now(timezone.utc).isoformat()
    with _lock:
        c = _conn()
        try:
            c.execute(
                "INSERT INTO user_state (sub, payload, updated_at) VALUES (?, ?, ?) "
                "ON CONFLICT(sub) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at",
                (sub, blob, now),
            )
            c.commit()
        finally:
            c.close()

    # Extract cases into relational tables for cross-user discovery
    cases = payload.get("cases") or []
    for case_item in cases:
        try:
            save_dispute_relational(case_item, claimant_sub=sub)
        except Exception as e:
            print(f"[StateStore] Warning: error extracting case {case_item.get('id')}: {e}")

    return now


def load_state(
    sub: str,
    user_wallet: Optional[str] = None,
    user_name: Optional[str] = None,
) -> dict | None:
    """Load user state and merge shared disputes where this user is respondent or juror."""
    if not user_wallet or not user_name:
        auth_wallet, auth_name = _get_user_info_from_auth(sub)
        user_wallet = user_wallet or auth_wallet
        user_name = user_name or auth_name

    with _lock:
        c = _conn()
        try:
            row = c.execute("SELECT payload FROM user_state WHERE sub = ?", (sub,)).fetchone()
        finally:
            c.close()

    payload = json.loads(row[0]) if row else {}

    # Merge shared relational disputes
    shared_cases = get_shared_disputes_for_user(sub, user_wallet, user_name)
    if shared_cases:
        existing_cases = payload.get("cases", [])
        existing_map = {c["id"]: c for c in existing_cases if "id" in c}

        for sc in shared_cases:
            cid = sc["id"]
            if cid not in existing_map:
                existing_cases.insert(0, sc)
            else:
                # Retain whichever has latest updates
                existing_map[cid].update(sc)

        payload["cases"] = existing_cases

    return payload if payload else None


# ── Direct Relational Operations (REST Support) ──────────────────────────────

def get_dispute_by_id(case_id: str) -> Optional[Dict[str, Any]]:
    """Query a single dispute by ID."""
    with _lock:
        conn = _conn()
        try:
            row = conn.execute("SELECT raw_json FROM disputes WHERE id = ?", (case_id,)).fetchone()
            if not row:
                return None
            return json.loads(row["raw_json"])
        finally:
            conn.close()


def submit_counter_claim(
    case_id: str,
    counter_summary: str,
    respondent_wallet: str,
    respondent_name: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """Respondent files a counter-claim, transitioning state to EVIDENCE_LOCKED."""
    with _lock:
        conn = _conn()
        try:
            row = conn.execute("SELECT raw_json FROM disputes WHERE id = ?", (case_id,)).fetchone()
            if not row:
                return None
            case_obj = json.loads(row["raw_json"])

            case_obj["status"] = "EVIDENCE_LOCKED"
            case_obj["counterClaimSummary"] = counter_summary
            if "respondent" in case_obj:
                case_obj["respondent"]["responded"] = True
                case_obj["respondent"]["wallet"] = respondent_wallet
                if respondent_name:
                    case_obj["respondent"]["name"] = respondent_name

            # Add to audit trail
            now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
            audit = case_obj.get("auditTrail", [])
            audit.append({
                "eventId": f"evt-resp-{int(datetime.now(timezone.utc).timestamp()*1000)}",
                "eventNumber": f"EVENT {len(audit) + 1:03d}",
                "title": "Respondent Counter-Statement Filed",
                "actor": respondent_name or respondent_wallet[:10],
                "actorRole": "Respondent",
                "timestamp": now_str,
                "txHash": "0x" + "0" * 64,
                "blockNumber": 0,
                "metadataHash": "0x" + "0" * 64,
                "details": f"Respondent submitted counter-claim: {counter_summary[:100]}...",
            })
            case_obj["auditTrail"] = audit
        finally:
            conn.close()

    save_dispute_relational(case_obj)
    return case_obj
