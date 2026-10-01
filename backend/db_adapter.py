"""
Resolvia Hybrid Database Adapter (SQLite ↔ MongoDB Atlas)
=========================================================
Provides seamless fallback:
1. If MONGODB_URI is provided in environment variables, connects to MongoDB Atlas
   and syncs user profiles, multi-auth mappings, and theme preferences to cloud.
2. If MONGODB_URI is not set, runs cleanly on local WAL-mode SQLite database.
"""
import os
import time
from typing import Dict, Any, Optional

def _load_env():
    for env_path in [
        os.path.join(os.path.dirname(__file__), ".env"),
        os.path.join(os.path.dirname(__file__), "..", ".env"),
    ]:
        if os.path.exists(env_path):
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip('"').strip("'")
                            if k and k not in os.environ:
                                os.environ[k] = v
            except Exception:
                pass

_load_env()

MONGODB_URI = os.environ.get("MONGODB_URI")
DB_NAME = os.environ.get("MONGODB_DB_NAME", "resolvia")

_mongo_client = None
_mongo_db = None

if MONGODB_URI:
    try:
        from pymongo import MongoClient
        _mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=3000)
        # Test connection
        _mongo_client.admin.command('ping')
        _mongo_db = _mongo_client[DB_NAME]
        print(f"[Database] Successfully connected to MongoDB Atlas ({DB_NAME})")
    except Exception as e:
        print(f"[Database] MongoDB Atlas connection warning: {e}. Running with SQLite.")
        _mongo_client = None
        _mongo_db = None

def is_mongo_active() -> bool:
    return _mongo_db is not None

def get_mongo_db():
    return _mongo_db

def sync_user_to_mongo(user_dict: Dict[str, Any]):
    """Sync or upsert a user record to MongoDB Atlas."""
    if not is_mongo_active():
        return
    try:
        users_col = _mongo_db["users"]
        doc = {
            "userId": user_dict.get("id"),
            "name": user_dict.get("name"),
            "email": user_dict.get("email"),
            "phone": user_dict.get("phone"),
            "provider": user_dict.get("provider"),
            "assignedWallet": user_dict.get("wallet"),
            "avatarUrl": user_dict.get("avatarUrl"),
            "bgMediaUrl": user_dict.get("bgMediaUrl"),
            "bgType": user_dict.get("bgType", "video"),
            "bgTheme": user_dict.get("bgTheme", "cyber_violet"),
            "githubId": user_dict.get("githubId"),
            "metamaskAddress": user_dict.get("metamaskAddress"),
            "updatedAt": time.time(),
        }
        users_col.update_one({"userId": user_dict.get("id")}, {"$set": doc}, upsert=True)
    except Exception as e:
        print(f"[Database] MongoDB user sync warning: {e}")

def update_profile_in_mongo(user_id: int, updates: Dict[str, Any]):
    """Update profile fields in MongoDB Atlas."""
    if not is_mongo_active():
        return
    try:
        users_col = _mongo_db["users"]
        clean_updates = {k: v for k, v in updates.items() if v is not None}
        clean_updates["updatedAt"] = time.time()
        users_col.update_one({"userId": user_id}, {"$set": clean_updates})
    except Exception as e:
        print(f"[Database] MongoDB profile update warning: {e}")

def sync_dispute_to_mongo(dispute_dict: Dict[str, Any]):
    """Sync or upsert a dispute record to MongoDB Atlas."""
    if not is_mongo_active():
        return
    try:
        disputes_col = _mongo_db["disputes"]
        case_id = str(dispute_dict.get("id") or "")
        if not case_id:
            return
        doc = dict(dispute_dict)
        doc["updatedAt"] = time.time()
        disputes_col.update_one({"id": case_id}, {"$set": doc}, upsert=True)
    except Exception as e:
        print(f"[Database] MongoDB dispute sync warning: {e}")

def get_disputes_from_mongo(query: dict) -> list[Dict[str, Any]]:
    """Query disputes from MongoDB Atlas."""
    if not is_mongo_active():
        return []
    try:
        disputes_col = _mongo_db["disputes"]
        docs = list(disputes_col.find(query, {"_id": 0}))
        return docs
    except Exception as e:
        print(f"[Database] MongoDB query disputes error: {e}")
        return []

def get_all_disputes_from_mongo() -> list[Dict[str, Any]]:
    """Query all disputes from MongoDB Atlas."""
    if not is_mongo_active():
        return []
    try:
        disputes_col = _mongo_db["disputes"]
        return list(disputes_col.find({}, {"_id": 0}))
    except Exception as e:
        print(f"[Database] MongoDB fetch all disputes error: {e}")
        return []

def get_user_by_id_from_mongo(user_id: int) -> Optional[Dict[str, Any]]:
    """Lookup a single user by integer userId from MongoDB Atlas."""
    if not is_mongo_active():
        return None
    try:
        users_col = _mongo_db["users"]
        return users_col.find_one({"userId": user_id}, {"_id": 0})
    except Exception as e:
        print(f"[Database] MongoDB user lookup by id error: {e}")
        return None

def find_registered_user(query_str: str) -> Optional[Dict[str, Any]]:
    """Find a registered user by email, name, wallet, or userId (exact or partial)."""
    if not is_mongo_active() or not query_str:
        return None
    q = str(query_str).strip()
    if not q:
        return None
    try:
        import re
        users_col = _mongo_db["users"]
        # Exact / case-insensitive search
        conds = [
            {"email": {"$regex": f"^{re.escape(q)}$", "$options": "i"}},
            {"assignedWallet": {"$regex": f"^{re.escape(q)}$", "$options": "i"}},
            {"name": {"$regex": f"^{re.escape(q)}$", "$options": "i"}},
        ]
        if q.isdigit():
            conds.append({"userId": int(q)})
        user = users_col.find_one({"$or": conds}, {"_id": 0})
        if user:
            return user

        # Substring search if query is at least 3 chars
        if len(q) >= 3:
            sub_conds = [
                {"email": {"$regex": re.escape(q), "$options": "i"}},
                {"name": {"$regex": re.escape(q), "$options": "i"}},
                {"assignedWallet": {"$regex": re.escape(q), "$options": "i"}},
            ]
            user = users_col.find_one({"$or": sub_conds}, {"_id": 0})
            if user:
                return user
    except Exception as e:
        print(f"[Database] MongoDB find_registered_user error: {e}")
    return None

def search_registered_users(query_str: str, limit: int = 10) -> list[Dict[str, Any]]:
    """Search registered users for autocomplete suggestion."""
    if not is_mongo_active():
        return []
    q = str(query_str or "").strip()
    try:
        import re
        users_col = _mongo_db["users"]
        if q:
            conds = [
                {"email": {"$regex": re.escape(q), "$options": "i"}},
                {"name": {"$regex": re.escape(q), "$options": "i"}},
                {"assignedWallet": {"$regex": re.escape(q), "$options": "i"}},
            ]
            if q.isdigit():
                conds.append({"userId": int(q)})
            cursor = users_col.find({"$or": conds}, {"_id": 0, "userId": 1, "name": 1, "email": 1, "assignedWallet": 1, "avatarUrl": 1, "provider": 1}).limit(limit)
        else:
            cursor = users_col.find({}, {"_id": 0, "userId": 1, "name": 1, "email": 1, "assignedWallet": 1, "avatarUrl": 1, "provider": 1}).limit(limit)
        return list(cursor)
    except Exception as e:
        print(f"[Database] MongoDB search_registered_users error: {e}")
        return []

def sync_user_state_to_mongo(sub: str, state_dict: dict):
    """Sync full user workspace state to MongoDB Atlas."""
    if not is_mongo_active() or not sub:
        return
    try:
        state_col = _mongo_db["user_state"]
        state_col.update_one(
            {"sub": str(sub)},
            {"$set": {"sub": str(sub), "state": state_dict, "updatedAt": time.time()}},
            upsert=True,
        )
    except Exception as e:
        print(f"[Database] MongoDB user_state sync error: {e}")

def load_user_state_from_mongo(sub: str) -> Optional[dict]:
    """Load user workspace state from MongoDB Atlas."""
    if not is_mongo_active() or not sub:
        return None
    try:
        state_col = _mongo_db["user_state"]
        doc = state_col.find_one({"sub": str(sub)}, {"_id": 0})
        if doc and "state" in doc:
            return doc["state"]
    except Exception as e:
        print(f"[Database] MongoDB load user_state error: {e}")
    return None


