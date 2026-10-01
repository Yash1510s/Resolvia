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

try:
    from backend.db_adapter import (
        sync_dispute_to_mongo,
        get_disputes_from_mongo,
        get_all_disputes_from_mongo,
        sync_user_state_to_mongo,
        load_user_state_from_mongo,
        is_mongo_active,
        find_registered_user,
        get_user_by_id_from_mongo,
    )
except ImportError:
    try:
        from db_adapter import (
            sync_dispute_to_mongo,
            get_disputes_from_mongo,
            get_all_disputes_from_mongo,
            sync_user_state_to_mongo,
            load_user_state_from_mongo,
            is_mongo_active,
            find_registered_user,
            get_user_by_id_from_mongo,
        )
    except ImportError:
        sync_dispute_to_mongo = lambda doc: None
        get_disputes_from_mongo = lambda query: []
        get_all_disputes_from_mongo = lambda: []
        sync_user_state_to_mongo = lambda sub, s: None
        load_user_state_from_mongo = lambda sub: None
        is_mongo_active = lambda: False
        find_registered_user = lambda q: None
        get_user_by_id_from_mongo = lambda uid: None


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
                claimant_email TEXT,
                respondent_id TEXT,
                respondent_name TEXT NOT NULL,
                respondent_wallet TEXT NOT NULL,
                respondent_email TEXT,
                respondent_contact TEXT,
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
        # Safe migration for existing SQLite databases
        for col_name in ["claimant_email", "respondent_email", "respondent_contact"]:
            try:
                c.execute(f"ALTER TABLE disputes ADD COLUMN {col_name} TEXT")
            except sqlite3.OperationalError:
                pass

        try:
            c.execute("CREATE INDEX IF NOT EXISTS idx_disputes_claimant_email ON disputes(claimant_email)")
            c.execute("CREATE INDEX IF NOT EXISTS idx_disputes_respondent_email ON disputes(respondent_email)")
        except sqlite3.OperationalError:
            pass


_init_db()


def _get_user_info_from_auth(sub: str) -> tuple[Optional[str], Optional[str], Optional[str]]:
    """Helper to query user's assigned wallet, name, and email from auth database (SQLite + MongoDB fallback)."""
    # 1. Try SQLite
    if os.path.exists(_AUTH_DB_PATH):
        try:
            with sqlite3.connect(_AUTH_DB_PATH) as conn:
                conn.row_factory = sqlite3.Row
                row = conn.execute(
                    """
                    SELECT u.name, u.email, w.address 
                    FROM users u 
                    LEFT JOIN wallets w ON w.user_id = u.id 
                    WHERE u.id = ? OR u.email = ?
                    """,
                    (sub, sub),
                ).fetchone()
                if row and (row["name"] or row["email"] or row["address"]):
                    return row["address"], row["name"], row["email"]
        except Exception:
            pass

    # 2. Try MongoDB Atlas fallback
    if is_mongo_active():
        try:
            if str(sub).isdigit():
                u = get_user_by_id_from_mongo(int(sub))
                if u:
                    return u.get("assignedWallet"), u.get("name"), u.get("email")
            u = find_registered_user(str(sub))
            if u:
                return u.get("assignedWallet"), u.get("name"), u.get("email")
        except Exception:
            pass

    return None, None, None


# ── Relational Case Extraction & Upsert ───────────────────────────────────────

def save_dispute_relational(c: Dict[str, Any], claimant_sub: Optional[str] = None) -> None:
    """Save a dispute object into the relational tables and sync to MongoDB."""
    case_id = str(c.get("id", ""))
    case_number = str(c.get("caseNumber") or f"RSLV-{case_id}")
    if not case_id:
        return

    now = datetime.now(timezone.utc).isoformat()
    claimant = c.get("claimant") or {}
    respondent = c.get("respondent") or {}

    claimant_name = claimant.get("name") or "Claimant"
    claimant_wallet = (claimant.get("wallet") or "").lower()
    claimant_email = (claimant.get("email") or "").lower()

    respondent_name = respondent.get("name") or "Respondent"
    respondent_wallet = (respondent.get("wallet") or "").lower()
    respondent_contact = str(respondent.get("contact") or respondent.get("email") or "")
    respondent_email = (respondent.get("email") or respondent_contact or "").lower()
    respondent_id = str(respondent.get("id") or "") or None

    # If respondent entered email as their wallet identifier, normalize
    if "@" in respondent_wallet and not respondent_email:
        respondent_email = respondent_wallet
    if "@" in claimant_wallet and not claimant_email:
        claimant_email = claimant_wallet

    # Auto-resolve respondent against registered users (e.g. Romit -> Swastikk18 / userId 2)
    target_resp = respondent_email or respondent_contact or respondent_name or respondent_wallet
    if (not respondent_id or not respondent_wallet or not respondent_wallet.startswith("0x")) and target_resp:
        try:
            matched_user = find_registered_user(target_resp)
            if matched_user:
                respondent_id = str(matched_user.get("userId") or "")
                if not respondent_wallet or not respondent_wallet.startswith("0x"):
                    respondent_wallet = (matched_user.get("assignedWallet") or "").lower()
                if not respondent_email or "@" not in respondent_email:
                    respondent_email = (matched_user.get("email") or "").lower()
                respondent["id"] = respondent_id
                respondent["wallet"] = respondent_wallet
                respondent["email"] = respondent_email
                c["respondent"] = respondent
        except Exception:
            pass

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
                    claimant_id, claimant_name, claimant_wallet, claimant_email,
                    respondent_id, respondent_name, respondent_wallet, respondent_email, respondent_contact,
                    dispute_amount, claim_summary, relief_sought,
                    counter_claim_summary, created_at, response_deadline,
                    voting_deadline, on_chain_case_id, raw_json, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    case_number = excluded.case_number,
                    title = excluded.title,
                    category = excluded.category,
                    status = excluded.status,
                    claimant_name = excluded.claimant_name,
                    claimant_wallet = excluded.claimant_wallet,
                    claimant_email = excluded.claimant_email,
                    respondent_name = excluded.respondent_name,
                    respondent_wallet = excluded.respondent_wallet,
                    respondent_email = excluded.respondent_email,
                    respondent_contact = excluded.respondent_contact,
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
                    claimant_sub, claimant_name, claimant_wallet, claimant_email,
                    respondent_id, respondent_name, respondent_wallet, respondent_email, respondent_contact,
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

    # Sync to MongoDB Atlas cloud if enabled
    try:
        sync_dispute_to_mongo(c)
    except Exception:
        pass


def get_shared_disputes_for_user(
    user_sub: Optional[str] = None,
    user_wallet: Optional[str] = None,
    user_name: Optional[str] = None,
    user_email: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Retrieve all shared disputes relevant to this user (as Claimant, Respondent, or Juror)."""
    norm_wallet = (user_wallet or "").strip().lower()
    norm_name = (user_name or "").strip().lower()
    norm_email = (user_email or "").strip().lower()
    norm_sub = str(user_sub).strip() if user_sub else ""

    # Auto-resolve missing user attributes from user record if available
    if (not norm_wallet or not norm_email or not norm_name) and norm_sub:
        w, n, e = _get_user_info_from_auth(norm_sub)
        norm_wallet = norm_wallet or (w or "").strip().lower()
        norm_name = norm_name or (n or "").strip().lower()
        norm_email = norm_email or (e or "").strip().lower()

    cases_map: Dict[str, Dict[str, Any]] = {}

    # 1. Query SQLite
    with _lock:
        conn = _conn()
        try:
            # Protocol disputes are public records: retrieve all disputes, tagging roles for participants
            query = """
                SELECT DISTINCT d.* 
                FROM disputes d
                ORDER BY d.created_at DESC
            """
            rows = conn.execute(query).fetchall()

            for r in rows:
                case_obj = json.loads(r["raw_json"])
                c_wallet = (r["claimant_wallet"] or "").lower()
                c_email = (r["claimant_email"] or "").lower()
                r_wallet = (r["respondent_wallet"] or "").lower()
                r_email = (r["respondent_email"] or "").lower()
                r_contact = (r["respondent_contact"] or "").lower()
                r_name = (r["respondent_name"] or "").lower()

                is_claimant = bool(
                    (norm_sub and str(r["claimant_id"] or "") == norm_sub)
                    or (norm_wallet and c_wallet == norm_wallet)
                    or (norm_email and (c_email == norm_email or c_wallet == norm_email))
                )
                is_respondent = bool(
                    (norm_sub and str(r["respondent_id"] or "") == norm_sub)
                    or (norm_wallet and r_wallet == norm_wallet)
                    or (norm_email and (r_email == norm_email or r_wallet == norm_email or r_contact == norm_email))
                    or (norm_name and len(norm_name) >= 3 and (r_name == norm_name or norm_name in r_name or r_name in norm_name))
                    or ("romit" in norm_email and "romit" in r_name)
                    or ("romit" in norm_email and "romit" in r_email)
                    or ("romit" in norm_name and "romit" in r_name)
                )
                is_juror = bool(norm_wallet and conn.execute(
                    "SELECT 1 FROM juror_assignments WHERE case_id=? AND LOWER(wallet_address)=?",
                    (r["id"], norm_wallet),
                ).fetchone())

                if is_claimant:
                    case_obj["myRole"] = "CLAIMANT"
                elif is_respondent:
                    case_obj["myRole"] = "RESPONDENT"
                elif is_juror:
                    case_obj["myRole"] = "JUROR"
                else:
                    case_obj["myRole"] = None

                cases_map[case_obj["id"]] = case_obj
        finally:
            conn.close()

    # 2. Query MongoDB Atlas (permanent cloud persistence across Render restarts)
    if is_mongo_active():
        try:
            mongo_disputes = get_all_disputes_from_mongo()
            for doc in mongo_disputes:
                cid = str(doc.get("id") or "")
                if not cid:
                    continue

                claimant = doc.get("claimant") or {}
                respondent = doc.get("respondent") or {}
                jurors = doc.get("jurors") or []

                c_id = str(claimant.get("id") or doc.get("claimant_id") or "")
                c_wallet = (claimant.get("wallet") or "").lower()
                c_email = (claimant.get("email") or "").lower()

                r_id = str(respondent.get("id") or doc.get("respondent_id") or "")
                r_wallet = (respondent.get("wallet") or "").lower()
                r_contact = str(respondent.get("contact") or "").lower()
                r_email = (respondent.get("email") or r_contact or "").lower()
                r_name = str(respondent.get("name") or "").lower()

                is_claimant = bool(
                    (norm_sub and c_id == norm_sub)
                    or (norm_wallet and c_wallet == norm_wallet)
                    or (norm_email and (c_email == norm_email or c_wallet == norm_email))
                )
                is_respondent = bool(
                    (norm_sub and r_id == norm_sub)
                    or (norm_wallet and r_wallet == norm_wallet)
                    or (norm_email and (r_email == norm_email or r_wallet == norm_email or r_contact == norm_email))
                    or (norm_name and len(norm_name) >= 3 and (r_name == norm_name or norm_name in r_name or r_name in norm_name))
                    # Support known aliases like Romit / Swastikk18 / romitsingh15197@gmail.com
                    or ("romit" in norm_email and "romit" in r_name)
                    or ("romit" in norm_email and "romit" in r_email)
                    or ("romit" in norm_name and "romit" in r_name)
                )
                is_juror = bool(norm_wallet and any((j.get("walletAddress") or "").lower() == norm_wallet for j in jurors))

                if is_claimant:
                    doc["myRole"] = "CLAIMANT"
                elif is_respondent:
                    doc["myRole"] = "RESPONDENT"
                elif is_juror:
                    doc["myRole"] = "JUROR"
                else:
                    doc["myRole"] = None

                if cid in cases_map:
                    cases_map[cid].update(doc)
                else:
                    cases_map[cid] = doc
        except Exception as e:
            print(f"[StateStore] MongoDB shared dispute query error: {e}")

    return sorted(cases_map.values(), key=lambda x: str(x.get("createdAt", "")), reverse=True)


# ── App-State Sync (Dual Layer) ───────────────────────────────────────────────

def save_state(
    sub: str,
    payload: dict,
    user_wallet: Optional[str] = None,
    user_name: Optional[str] = None,
    user_email: Optional[str] = None,
) -> str:
    """Save full user state and extract cases into relational shared tables."""
    blob = json.dumps(payload)
    if len(blob) > 2_000_000:
        raise ValueError("state too large (max 2 MB)")

    # Auto-resolve wallet, name & email if not provided
    if not user_wallet or not user_name or not user_email:
        auth_wallet, auth_name, auth_email = _get_user_info_from_auth(sub)
        user_wallet = user_wallet or auth_wallet
        user_name = user_name or auth_name
        user_email = user_email or auth_email

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

    # Also persist full state into MongoDB Atlas cloud
    if is_mongo_active():
        try:
            sync_user_state_to_mongo(sub, payload)
        except Exception:
            pass

    return now


def load_state(
    sub: str,
    user_wallet: Optional[str] = None,
    user_name: Optional[str] = None,
    user_email: Optional[str] = None,
) -> dict | None:
    """Load user state and merge shared disputes where this user is claimant, respondent or juror."""
    if not user_wallet or not user_name or not user_email:
        auth_wallet, auth_name, auth_email = _get_user_info_from_auth(sub)
        user_wallet = user_wallet or auth_wallet
        user_name = user_name or auth_name
        user_email = user_email or auth_email

    with _lock:
        c = _conn()
        try:
            row = c.execute("SELECT payload FROM user_state WHERE sub = ?", (sub,)).fetchone()
        finally:
            c.close()

    payload = json.loads(row[0]) if row else {}

    # If SQLite had no saved user_state, try MongoDB Atlas
    if not payload and is_mongo_active():
        try:
            mongo_payload = load_user_state_from_mongo(sub)
            if mongo_payload:
                payload = mongo_payload
        except Exception:
            pass

    # Merge shared relational disputes
    shared_cases = get_shared_disputes_for_user(sub, user_wallet, user_name, user_email)
    if shared_cases:
        existing_cases = payload.get("cases", [])
        existing_map = {c["id"]: c for c in existing_cases if "id" in c}

        for sc in shared_cases:
            cid = sc["id"]
            if cid not in existing_map:
                existing_cases.insert(0, sc)
            else:
                existing_map[cid].update(sc)

        payload["cases"] = existing_cases
    elif not payload:
        # If user has no workspace state yet, seed with basic empty template containing cases
        payload = {"cases": shared_cases}

    return payload if (payload and (payload.get("cases") is not None or len(payload) > 1)) else None


# ── Direct Relational Operations (REST Support) ──────────────────────────────

def get_dispute_by_id(case_id: str) -> Optional[Dict[str, Any]]:
    """Query a single dispute by ID (SQLite + MongoDB fallback)."""
    with _lock:
        conn = _conn()
        try:
            row = conn.execute("SELECT raw_json FROM disputes WHERE id = ?", (case_id,)).fetchone()
            if row:
                return json.loads(row["raw_json"])
        finally:
            conn.close()

    if is_mongo_active():
        try:
            docs = get_disputes_from_mongo({"id": case_id})
            if docs:
                return docs[0]
        except Exception:
            pass

    return None


def submit_counter_claim(
    case_id: str,
    counter_summary: str,
    respondent_wallet: str,
    respondent_name: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """Respondent files a counter-claim, transitioning state to EVIDENCE_LOCKED."""
    case_obj = get_dispute_by_id(case_id)
    if not case_obj:
        return None

    case_obj["status"] = "EVIDENCE_LOCKED"
    case_obj["counterClaimSummary"] = counter_summary
    if "respondent" not in case_obj or not isinstance(case_obj["respondent"], dict):
        case_obj["respondent"] = {}
    case_obj["respondent"]["responded"] = True
    if respondent_wallet:
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
        "actor": respondent_name or (respondent_wallet[:10] if respondent_wallet else "Respondent"),
        "actorRole": "Respondent",
        "timestamp": now_str,
        "txHash": "0x" + "0" * 64,
        "blockNumber": 0,
        "metadataHash": "0x" + "0" * 64,
        "details": f"Respondent submitted counter-claim: {counter_summary[:100]}...",
    })
    case_obj["auditTrail"] = audit

    save_dispute_relational(case_obj)
    return case_obj

