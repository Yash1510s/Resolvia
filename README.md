# Resolvia — AI-Assisted Decentralized Dispute Arbitration Platform

> **Auditable by design. Private by default. Decided by humans.**

Resolvia is a hybrid decentralized dispute arbitration platform and legal-tech SaaS suite. It unifies artificial intelligence, blockchain smart contracts, content-addressed storage (IPFS), and modern web architecture to provide transparent, tamper-evident digital dispute resolution.

The core guiding principle of Resolvia is: **AI assists evidence analysis; an independent human jury makes the binding decision.**

---

## 🎯 Scope: General-Purpose Dispute Resolution

Resolvia is **not** limited to money or payment disputes. It is a general-purpose
platform: any dispute is eligible, provided the claim, counter-claim, and evidence
can be represented digitally.

Supported dispute types:

| Category | Examples |
|---|---|
| 💰 Financial / Payment | payment, refund, transaction, contract payment |
| 📦 E-commerce / Delivery | not delivered, wrong item, damaged goods |
| 📜 Contract / Agreement | terms, service delivery, obligations |
| 🤝 Business / Peer | partnership, freelance work, service disagreements |
| 🏠 Property / Service | documented property or service claims |
| 🧑‍💻 Digital / Platform | online transactions, platform/service conflicts |
| 📄 General (evidence-based) | any dispute where claim + evidence exist |

Two role clarifications that hold across every category:

- **The AI is not a judge.** It is a decision-support / advisory layer — claim mapping,
  timeline synthesis, contradiction radar — always labelled non-binding. The human
  jury's verdict is the only binding outcome.
- **The blockchain is not a judge either.** Its role is tamper-evident records:
  integrity, auditability, and transparency of evidence hashes, vote commitments,
  and the final verdict.

---

## 🔐 Web2 Sign-in & Platform-Assigned Wallets (no MetaMask required)

Real users won't have a MetaMask or a seed phrase. So Resolvia uses the standard
**custodial / embedded-wallet** pattern: the platform assigns each person an
on-chain wallet and they sign in with the identities they already use.

**How it works**

1. **Sign in** with **Google OAuth**, **GitHub**, or **email OTP** (the OTP flow
   needs no external setup and is the dev default; in dev the code is returned
   as `devCode` and printed to the console).
2. On first login the backend **generates an EVM keypair** for the user and
   assigns the resulting address as their Resolvia wallet.
3. The **private key is AES-256-GCM encrypted** with a server master key and
   stored in SQLite. It never leaves the backend — the user never sees it.
4. The user's **login is their recovery mechanism** (no seed phrase to lose).
5. For actions that hit the chain (e.g. a juror's commit/reveal vote), the
   **backend decrypts, signs, and broadcasts** the transaction on the user's
   behalf, using their session JWT. New wallets are auto-funded with a small
   ETH balance to pay gas (local faucet; production equivalent is an
   **ERC-4337 paymaster** for gasless UX).

**What this unlocks** — any test user can sign in with a Google or an email
address, get a wallet, and be appointed to a jury panel. No crypto wallet
onboarding. The frontend's "Sign in" (navbar / landing) and the on-chain jury
console are already wired to this: a signed-in user's assigned wallet joins the
panel as *Juror A* and their votes are backend-signed.

> **Trust model & production path.** In this design the platform custodies the
> keys (like an exchange). That's the pragmatic choice for an MVP. When moving
> to production with real funds, upgrade to **ERC-4337 smart accounts** with
> passkey session keys + a paymaster so funds stay user-controlled and txs are
> gasless. The on-chain contracts don't change for that upgrade — the chain only
> cares that a signature from the juror's address validates.

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
  1. Commit Phase: keccak256(vote ‖ salt ‖ caseId ‖ juror)
  2. Reveal Phase: vote + salt verified on-chain (case + juror bound)
             ↓
Supermajority Decision & Escrow Settlement
             ↓
Appeal Window (48h, fresh 7-juror panel)
             ↓
Finalization → Verified Case Record (BSA 2023 §63 / ISO 27037 formatting)
             ↓
Closed → Public Case Study (3 disclosure levels) + Community Discussion
             ↓
Tamper-Evident Ledger Anchoring & Public Proof Verifier
```

---

## 🚀 Key Modules Built & Delivered

### 1. Modern SaaS Web Application (`frontend/`)
- **Stack**: Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS, Lucide Icons.
- **Real routing** (audited & rebuilt — see `UX_AUDIT.md`): the old single-page
  tab layout is gone. Every screen is a real, deep-linkable route under a
  shared authenticated shell (top nav + role sidebar + breadcrumbs), with all
  shared state in a single `AppProvider` context.

  **Public** — `/` (landing), `/case-studies` + `/case-studies/[id]`
  (closed cases with **3 disclosure levels**: Overview → Verified Case Study →
  Legal-Forensic Record, plus post-closure **Community Discussion**).

  **Party** — `/dashboard` (action hub: "needs your attention" by role),
  `/cases` (My Cases → **As Claimant / As Respondent / As Juror / Closed**),
  `/cases/[id]` (**central Case Details**: overview, response, evidence, AI
  advisory, jury, voting, verdict, appeal, timeline & audit, verified case
  record, discussion — each section gated by case state + your role),
  `/proof-verifier`, `/notifications` (event-derived, each links to the action).

  **Jury (anonymous)** — `/jury` (dashboard: pool state, **invitations** with
  minimal pre-acceptance detail, active panels), `/jury/[id]` (independent
  review → anonymous deliberation → commit → reveal; the AI advisory is
  **locked until after your blind commit**), `/jury/history` (reputation is
  reliability/integrity-based, **not** majority-vote).

  **Account** — `/reputation`, `/profile` (tied to your signed-in identity +
  assigned wallet), `/settings` (**jury availability** — pool on/off,
  temporarily unavailable + return date, max concurrent — wired to selection),
  `/resources` (how-it-works, jury guidelines, terminology, scope/honesty).

  **Protocol** — `/protocol`: the live on-chain end-to-end demo (real
  Hardhat transactions: stake, escrow, panel, commit–reveal, settlement).

- **Role model**: you are never assumed to be the claimant. Each case carries
  your role in it (`myRole`); the demo persona switcher (Claimant / Respondent
  / Juror) is a labelled exploration aid. Unimplemented features are marked
  *Coming soon / Prototype* — never silently removed.
- **Juror anonymity**: panels show stable wallet-derived pseudonyms
  (`Juror #A7F2`), never names or wallets. Deliberation (private, anonymous,
  during arbitration) is strictly separate from the post-closure community
  discussion (public, per-case, cannot change the verdict).
- **Live Dispute Intake Wizard**: 5 steps (parties → claim → **desired
  outcome** → evidence → review/stake) with **draft auto-save** and a
  post-submission confirmation screen; evidence is SHA-256 hashed in-browser.
- **Evidence Locker**: real-time hash validator and tamper simulation detector.
- **Commit-Reveal Voting Console**: secret salt generator, blind cryptographic
  commitment submission, live tally engine — all displayed anonymously.
- **Proof Verifier Portal**: verify case hashes and CIDs against the record.
- **Legal Compliance Suite**: generates a **Verified Case Record** export
  formatted per **Bharatiya Sakshya Adhiniyam, 2023 (Section 63)** &
  **ISO/IEC 27037** — admissibility in any forum depends on jurisdiction.

### 2. Smart Contracts Layer (`blockchain/contracts/`)
- **`ResolviaToken.sol`**: ERC-20 staking token (`RSLV`) for dispute deposits and juror rewards.
- **`CaseRegistry.sol`**: Full state machine (`DRAFT` → `SUBMITTED` → `JURY_COMMIT` → `VERDICT` → `FINALIZED`).
- **`VotingManager.sol`**: Commit-reveal implementation with cryptographic salt verification.
- **`EvidenceRegistry.sol`**: Content-addressed SHA-256 and IPFS CID registry with access tiers.
- **`ArbitrationHub.sol`**: Master coordinator contract.

### 3. Auth & Custodial Wallet Backend (`backend/`)
- **FastAPI** service bridging the AI pipeline **and** providing Web2 sign-in.
- **Sign-in**: email OTP (dev default, no external setup) and Google OAuth.
- **Platform-assigned wallets**: on first login an EVM keypair is generated;
  the private key is **AES-256-GCM encrypted** at rest (SQLite) and never
  exposed. Login = recovery (no seed phrases).
- **Wallet-signed actions**: juror commit/reveal votes are decrypted, signed,
  and broadcast server-side against the local Hardhat chain.
- **Auto gas funding** for new wallets (local faucet; ERC-4337 paymaster in
  production). New users join the jury panel as *Juror A* in the frontend.

### 4. AI Advisory Engine (`ai-engine/`)
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
pip install -r requirements.txt
APP_ENV=dev python3 -m uvicorn server:app --host 0.0.0.0 --port 8000
```
Serves the AI analysis bridge **and** the auth + assigned-wallet service
(see `backend/README.md`). In `dev` mode email OTPs are returned as `devCode`
so you can sign in without an email server. Try the full flow from a browser:
**Landing → Get Started → enter email → use the shown dev code → your wallet
is assigned**, then open the on-chain jury console to vote with it.
