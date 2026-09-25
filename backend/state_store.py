"""Per-user app-state persistence (SQLite).

The frontend stores its workspace state (cases, invitations, notifications,
balance, availability) in localStorage. Once a user logs in, that state is
mirrored to the backend so it follows the *account*, not the browser —
refresh-proof, and recoverable from any device.

The payload is stored opaquely (JSON blob) — the backend is storage, not
application logic, so schema changes in the UI don't require a backend
migration.
"""
from __future__ import annotations

import json
import os
import sqlite3
import threading
from datetime import datetime, timezone

_DB_PATH = os.path.join(os.path.dirname(__file__), "state.db")
_lock = threading.Lock()


def _init_db() -> None:
    with sqlite3.connect(_DB_PATH) as c:
        c.execute("PRAGMA journal_mode=WAL")
        c.execute("PRAGMA busy_timeout=5000")
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS user_state (
                sub TEXT PRIMARY KEY,
                payload TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )

_init_db()

def _conn() -> sqlite3.Connection:
    c = sqlite3.connect(_DB_PATH)
    c.execute("PRAGMA busy_timeout=5000")
    return c


def save_state(sub: str, payload: dict) -> str:
    blob = json.dumps(payload)
    if len(blob) > 2_000_000:
        raise ValueError("state too large (max 2 MB)")
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
    return now


def load_state(sub: str) -> dict | None:
    with _lock:
        c = _conn()
        try:
            row = c.execute("SELECT payload FROM user_state WHERE sub = ?", (sub,)).fetchone()
        finally:
            c.close()
    if not row:
        return None
    return json.loads(row[0])
