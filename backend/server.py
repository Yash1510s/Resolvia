"""
Resolvia Backend Server (FastAPI)
Bridges web application, AI analysis service, and smart contract events.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sys
import os

# Add ai-engine path to import analysis pipeline
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "ai-engine"))
try:
    from analysis_pipeline import EvidenceAnalyzer
except ImportError:
    EvidenceAnalyzer = None

app = FastAPI(
    title="Resolvia Arbitration API",
    description="Backend API for AI-Assisted Decentralized Dispute Arbitration",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    caseNumber: str
    claimantStatement: str
    respondentStatement: str
    evidenceList: List[Dict[str, Any]]

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
    return {
        "status": "HEALTHY",
        "contracts": {
            "CaseRegistry": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            "VotingManager": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
            "ResolviaToken": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
        },
        "aiService": "READY"
    }

@app.post("/api/ai/analyze")
def trigger_ai_analysis(req: AIAnalysisRequest):
    if not EvidenceAnalyzer:
        raise HTTPException(status_code=500, detail="AI analysis pipeline unavailable")
    
    report = EvidenceAnalyzer.analyze_dispute(
        case_id=req.caseId,
        case_number=req.caseNumber,
        claimant_statement=req.claimantStatement,
        respondent_statement=req.respondentStatement,
        evidence_list=req.evidenceList
    )
    return {"status": "SUCCESS", "report": report}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
