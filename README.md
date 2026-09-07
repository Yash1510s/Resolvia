# Resolvia — AI-Assisted Decentralized Dispute Arbitration Platform

> **Auditable by design. Private by default. Decided by humans.**

Resolvia is a hybrid decentralized dispute arbitration platform and legal-tech SaaS suite. It unifies artificial intelligence, blockchain smart contracts, content-addressed storage (IPFS), and modern web architecture to provide transparent, tamper-evident digital dispute resolution.

The core guiding principle of Resolvia is: **AI assists evidence analysis; an independent human jury makes the binding decision.**

---

## 🏛️ System Architecture & Workflow

```
Claimant Initiates Case (Anti-Spam Stake)
             ↓
Respondent Response & Counter-Claim
             ↓
Cryptographic Evidence Locking (SHA-256 + IPFS CIDv1)
             ↓
Off-Chain AI Pre-Verdict Advisory Analysis (OWASP Prompt Defense + Contradictions)
             ↓
Random Weighted Human Jury Selection (Conflict of Interest Checks)
             ↓
Commit-Reveal Voting Protocol:
  1. Commit Phase: keccak256(vote + secret_salt)
  2. Reveal Phase: vote + salt verified on Sepolia ledger
             ↓
Supermajority Decision & Escrow Settlement
             ↓
Appeal Window (48h fresh 7-juror panel)
             ↓
AI Post-Verdict Documentation & Legal Dossier Generation (BSA 2023 / Section 63)
             ↓
Tamper-Evident Ledger Anchoring & Public Proof Verifier
```

---

## 🚀 Key Modules Built & Delivered

### 1. Modern SaaS Web Application (`frontend/`)
- **Stack**: Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS, Lucide Icons.
- **Color Aesthetics**: Sovereign dark legal-tech palette (Warm Obsidian `#0a0c10`, Champagne Gold `#f59e0b`, Jade Emerald `#10b981`, Amethyst Violet `#8b5cf6`, and Crimson Rose `#f43f5e`).
- **Interactive Multi-Role Switcher**:
  - 🏛️ **Claimant**: Alice Vance (Apex Web3 Studio)
  - 🛡️ **Respondent**: Marcus Zhao (DeCrypto Labs)
  - ⚖️ **Juror Carol**: Assigned Panelist #1 (Auditor)
  - ⚖️ **Juror Dave**: Assigned Panelist #2 (LegalTech Specialist)
  - 📜 **Forensic Auditor**: BSA 2023 / Electronic Record Notary
  - ⚙️ **Protocol Admin**: Smart Contract Guardian
- **Live Dispute Intake Wizard**: 4-step wizard calculating anti-spam stake, live client-side SHA-256 hashing, and IPFS CID generation.
- **Evidence Locker**: Real-time hash validator and tamper simulation detector.
- **Commit-Reveal Voting Console**: Secret salt generator, blind cryptographic commitment submission, and live tally engine.
- **Proof Verifier Portal**: Live lookup tool to verify case hashes and CIDs against on-chain block state.
- **Legal Compliance Suite**: Generates formal certificate complying with **Bharatiya Sakshya Adhiniyam, 2023 (Section 63/65B Certificate)** & **ISO/IEC 27037**.

### 2. Smart Contracts Layer (`blockchain/contracts/`)
- **`ResolviaToken.sol`**: ERC-20 staking token (`RSLV`) for dispute deposits and juror rewards.
- **`CaseRegistry.sol`**: Full state machine (`DRAFT` → `SUBMITTED` → `JURY_COMMIT` → `VERDICT` → `FINALIZED`).
- **`VotingManager.sol`**: Commit-reveal implementation with cryptographic salt verification.
- **`EvidenceRegistry.sol`**: Content-addressed SHA-256 and IPFS CID registry with access tiers.
- **`ArbitrationHub.sol`**: Master coordinator contract.

### 3. AI Advisory Engine (`ai-engine/`)
- **`analysis_pipeline.py`**:
  - OWASP Prompt Injection Defense (untrusted input segregation).
  - Claim-to-evidence cross-verification matrix.
  - Chronological fact timeline extraction.
  - Contradiction & discrepancy detection radar.
  - Non-binding probabilistic recommendation with uncertainty factors.

---

## 💻 Quick Start & Running Locally

### Prerequisites
- **Node.js**: v20+ or v22+
- **Python**: 3.10+

### 1. Launch the Frontend
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Run the AI Advisory Engine
```bash
cd ai-engine
python analysis_pipeline.py
```

### 3. Run the Backend API
```bash
cd backend
python -m uvicorn server:app --reload --port 8000
```
