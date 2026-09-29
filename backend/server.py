"""
Resolvia Backend Server (FastAPI)
Bridges web application, AI analysis service, and smart contract events.
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sys
import os
import base64
import json

# Load environment variables from .env
for _env_path in [
    os.path.join(os.path.dirname(__file__), ".env"),
    os.path.join(os.path.dirname(__file__), "..", ".env"),
]:
    if os.path.exists(_env_path):
        try:
            with open(_env_path, "r", encoding="utf-8") as _f:
                for _line in _f:
                    _line = _line.strip()
                    if _line and not _line.startswith("#") and "=" in _line:
                        _k, _v = _line.split("=", 1)
                        _k = _k.strip()
                        _v = _v.strip().strip('"').strip("'")
                        if _k and _k not in os.environ:
                            os.environ[_k] = _v
        except Exception:
            pass

# Add ai-engine path to import analysis pipeline
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "ai-engine"))
try:
    from analysis_pipeline import EvidenceAnalyzer
except ImportError:
    EvidenceAnalyzer = None

# IPFS Pinning service
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
try:
    import ipfs_service
except ImportError:
    ipfs_service = None

# Auth + custodial wallet module
from auth import router as auth_router  # noqa: E402

app = FastAPI(
    title="Resolvia Arbitration API",
    description="Backend API for AI-Assisted Decentralized Dispute Arbitration",
    version="1.1.0"
)

# Production-ready CORS origin configuration
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if "*" not in ALLOWED_ORIGINS else ["*"],
    allow_credentials=True if "*" not in ALLOWED_ORIGINS else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth (email OTP / Google) + custodial wallet + wallet-signed voting
app.include_router(auth_router, prefix="/api")

class DisputeRequest(BaseModel):
    caseNumber: str
    category: str
    claimantWallet: str
    respondentWallet: str
    claimSummary: str
    reliefSought: str
    disputeAmount: str

class AIAnalysisRequest(BaseModel):
    caseId: str
    caseNumber: Optional[str] = None
    claimantStatement: Optional[str] = None
    respondentStatement: Optional[str] = None
    evidenceList: Optional[List[Dict[str, Any]]] = None

    # Flexible legacy & alias fields so frontend requests never 422
    title: Optional[str] = None
    description: Optional[str] = None
    claimAmount: Optional[str] = None
    disputeAmount: Optional[str] = None
    category: Optional[str] = None
    evidence: Optional[List[Dict[str, Any]]] = None

class IPFSUploadRequest(BaseModel):
    fileName: str
    contentBase64: str
    sha256: str

@app.post("/api/ipfs/upload")
def upload_to_ipfs(req: IPFSUploadRequest):
    """Upload evidence file to IPFS via Pinata and return real CIDv1."""
    if not ipfs_service:
        raise HTTPException(status_code=500, detail="IPFS service module unavailable")
    try:
        raw_bytes = base64.b64decode(req.contentBase64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 payload: {e}")
    return ipfs_service.pin_file_to_ipfs(raw_bytes, req.fileName, req.sha256)

@app.get("/api/ipfs/status")
def get_ipfs_status():
    """Check IPFS pinning provider connectivity."""
    has_jwt = bool(os.environ.get("PINATA_JWT"))
    has_keys = bool(os.environ.get("PINATA_API_KEY") and os.environ.get("PINATA_SECRET_KEY"))
    return {
        "status": "CONFIGURED" if (has_jwt or has_keys) else "UNCONFIGURED",
        "provider": "Pinata Cloud IPFS" if (has_jwt or has_keys) else "Local Content-Address (Fallback)",
        "gateway": os.environ.get("PINATA_GATEWAY", "https://gateway.pinata.cloud/ipfs/"),
    }

@app.get("/")
def read_root():
    return {
        "platform": "Resolvia",
        "description": "AI-Assisted Decentralized Dispute Arbitration",
        "status": "OPERATIONAL",
        "network": "Ethereum Sepolia Testnet"
    }

@app.get("/api/health")
def health_check():
    import json, os
    contracts = {}
    try:
        with open(os.path.join(os.path.dirname(__file__), "..", "blockchain", "deployments", "local.json")) as f:
            contracts = json.load(f)["contracts"]
    except Exception:
        contracts = {"note": "manifest not found"}
    ai_status = EvidenceAnalyzer.get_status() if EvidenceAnalyzer else {"available": False, "status": "UNAVAILABLE"}
    return {
        "status": "HEALTHY",
        "contracts": contracts,
        "aiService": ai_status,
    }

@app.post("/api/ai/analyze")
def trigger_ai_analysis(req: AIAnalysisRequest):
    if not EvidenceAnalyzer:
        raise HTTPException(status_code=500, detail="AI analysis pipeline unavailable")
    
    case_number = req.caseNumber or req.caseId or "CASE-UNKNOWN"
    claimant_statement = (
        req.claimantStatement
        or req.description
        or req.title
        or "No claimant statement provided."
    )
    respondent_statement = (
        req.respondentStatement
        or "No formal counter-statement filed by respondent to date."
    )

    raw_evidence = req.evidenceList if req.evidenceList is not None else (req.evidence or [])
    evidence_list = []
    for item in raw_evidence:
        if isinstance(item, dict):
            evidence_list.append(item)
        else:
            evidence_list.append({"description": str(item)})

    # Extract numerical dispute amount
    amount_str = req.disputeAmount or req.claimAmount or "0"
    try:
        # Strip currency symbols if present
        clean_amt = "".join([c for c in str(amount_str) if c.isdigit() or c == "."])
        dispute_amount = float(clean_amt) if clean_amt else 0.0
    except (ValueError, TypeError):
        dispute_amount = 0.0

    category = req.category or "Personal"

    report = EvidenceAnalyzer.analyze_dispute(
        case_id=req.caseId,
        case_number=case_number,
        claimant_statement=claimant_statement,
        respondent_statement=respondent_statement,
        evidence_list=evidence_list,
        category=category,
        dispute_amount=dispute_amount,
    )
    return {"status": "SUCCESS", "report": report}

@app.post("/api/ai/analyze/stream")
def stream_ai_analysis(req: AIAnalysisRequest):
    if not EvidenceAnalyzer:
        raise HTTPException(status_code=500, detail="AI analysis pipeline unavailable")

    case_number = req.caseNumber or req.caseId or "CASE-UNKNOWN"
    claimant_statement = (
        req.claimantStatement
        or req.description
        or req.title
        or "No claimant statement provided."
    )
    respondent_statement = (
        req.respondentStatement
        or "No formal counter-statement filed by respondent to date."
    )

    raw_evidence = req.evidenceList if req.evidenceList is not None else (req.evidence or [])
    evidence_list = []
    for item in raw_evidence:
        if isinstance(item, dict):
            evidence_list.append(item)
        else:
            evidence_list.append({"description": str(item)})

    amount_str = req.disputeAmount or req.claimAmount or "0"
    try:
        clean_amt = "".join([c for c in str(amount_str) if c.isdigit() or c == "."])
        dispute_amount = float(clean_amt) if clean_amt else 0.0
    except (ValueError, TypeError):
        dispute_amount = 0.0

    category = req.category or "Personal"

    def event_generator():
        for event in EvidenceAnalyzer.analyze_dispute_stream(
            case_id=req.caseId,
            case_number=case_number,
            claimant_statement=claimant_statement,
            respondent_statement=respondent_statement,
            evidence_list=evidence_list,
            category=category,
            dispute_amount=dispute_amount,
        ):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
