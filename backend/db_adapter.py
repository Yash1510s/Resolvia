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

