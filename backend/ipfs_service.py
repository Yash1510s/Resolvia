"""
Resolvia IPFS Integration Service (Pinata)
==========================================
Provides content-addressed evidence file pinning to decentralized IPFS.
Falls back gracefully to simulated CID format if Pinata credentials are not present.
"""
import os
import requests
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

PINATA_PIN_FILE_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS"
PINATA_PIN_JSON_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS"
DEFAULT_GATEWAY = os.environ.get("PINATA_GATEWAY", "https://gateway.pinata.cloud/ipfs/")

def pin_file_to_ipfs(file_bytes: bytes, file_name: str, sha256_hash: str) -> Dict[str, Any]:
    """
    Pin raw file bytes to IPFS via Pinata.
    Returns real IPFS CIDv1 and public gateway link.
    """
    jwt_token = os.environ.get("PINATA_JWT")
    api_key = os.environ.get("PINATA_API_KEY")
    secret_key = os.environ.get("PINATA_SECRET_KEY")

    if not jwt_token and not (api_key and secret_key):
        # Honest status: Hash is cryptographically verified, but IPFS pinning is unconfigured
        return {
            "status": "UNPINNED_VERIFIED",
            "ipfsCid": None,
            "gatewayUrl": None,
            "sha256": sha256_hash,
            "provider": "Local SHA-256 (Pinata unconfigured)",
            "message": "File integrity cryptographically verified via SHA-256. IPFS pinning requires PINATA_JWT or API keys.",
        }

    headers = {}
    if jwt_token:
        headers["Authorization"] = f"Bearer {jwt_token}"
    else:
        headers["pinata_api_key"] = api_key
        headers["pinata_secret_api_key"] = secret_key

    try:
        import json
        files = {
            "file": (file_name, file_bytes)
        }
        data = {
            "pinataOptions": json.dumps({"cidVersion": 1}),
            "pinataMetadata": json.dumps({
                "name": file_name,
                "keyvalues": {
                    "sha256": sha256_hash,
                    "platform": "Resolvia"
                }
            })
        }
        res = requests.post(PINATA_PIN_FILE_URL, files=files, data=data, headers=headers, timeout=30)
        res.raise_for_status()
        data_res = res.json()
        cid = data_res.get("IpfsHash")
        return {
            "status": "PINNED",
            "ipfsCid": cid,
            "gatewayUrl": f"{DEFAULT_GATEWAY}{cid}",
            "pinSize": data_res.get("PinSize", len(file_bytes)),
            "timestamp": data_res.get("Timestamp"),
            "sha256": sha256_hash,
            "provider": "Pinata IPFS",
        }
    except Exception as e:
        print(f"[IPFS] Pinata upload error: {e}")
        return {
            "status": "PIN_FAILED",
            "ipfsCid": None,
            "gatewayUrl": None,
            "sha256": sha256_hash,
            "provider": "Pinata IPFS",
            "error": str(e),
            "message": "File integrity verified via SHA-256, but IPFS pinning encountered an error.",
        }

def pin_json_to_ipfs(payload: Dict[str, Any], name: str = "dossier") -> Dict[str, Any]:
    """Pin structured JSON dossier (e.g. BSA Section 63 record) to IPFS."""
    jwt_token = os.environ.get("PINATA_JWT")
    api_key = os.environ.get("PINATA_API_KEY")
    secret_key = os.environ.get("PINATA_SECRET_KEY")

    if not jwt_token and not (api_key and secret_key):
        return {"status": "SKIPPED", "reason": "No Pinata credentials"}

    headers = {"Content-Type": "application/json"}
    if jwt_token:
        headers["Authorization"] = f"Bearer {jwt_token}"
    else:
        headers["pinata_api_key"] = api_key
        headers["pinata_secret_api_key"] = secret_key

    body = {
        "pinataOptions": {"cidVersion": 1},
        "pinataMetadata": {"name": name},
        "pinataContent": payload,
    }
    try:
        res = requests.post(PINATA_PIN_JSON_URL, json=body, headers=headers, timeout=30)
        res.raise_for_status()
        data = res.json()
        cid = data.get("IpfsHash")
        return {
            "status": "PINNED",
            "ipfsCid": cid,
            "gatewayUrl": f"{DEFAULT_GATEWAY}{cid}",
            "provider": "Pinata IPFS",
        }
    except Exception as e:
        return {"status": "ERROR", "error": str(e)}
