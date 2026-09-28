# Resolvia — Comprehensive Whole-Project Engineering & Product Review

**Date:** 28 September 2026  
**Scope:** Full-stack inspection across Frontend (Next.js 16 / React 19), Backend (FastAPI / SQLite), AI Engine (`analysis_pipeline.py`), Blockchain (5 Solidity Contracts / Hardhat), Infrastructure (Docker / CI), UX workflows, security controls, and cross-subsystem data consistency.

---

## 1. Executive Summary

Resolvia presents itself as an **AI-assisted decentralized dispute arbitration platform** built on the premise that *"AI assists evidence analysis; an independent human jury makes the binding decision"* with *"tamper-evident cryptographic ledger anchoring"*.

A forensic inspection of the codebase reveals that Resolvia currently exists in **two divergent architectural realities**:

1. **A polished, high-fidelity client-side prototype**: 
   The Next.js 16 frontend exhibits rich visual design, comprehensive routing (21 routes), deep component hierarchy, and complete state mutation flows. However, this entire application runs almost exclusively on **in-memory React state, `localStorage`, and client-side PRNG simulations**. When a user creates a dispute, registers evidence, triggers AI analysis, commits a blind vote, or settles a verdict, the UI generates synthetic transaction hashes (`rndTx()`), increments mock block numbers, and saves an unvalidated 2MB opaque JSON dump to a per-user SQLite row.
2. **An isolated, well-tested Solidity & Python backend**:
   The `blockchain/` folder contains 5 Solidity contracts (`ArbitrationHub`, `CaseRegistry`, `VotingManager`, `EvidenceRegistry`, `ResolviaToken`) with passing unit tests and an E2E script. The `backend/` folder contains a FastAPI service with AES-256-GCM encrypted custodial keypair provisioning and an off-chain AI analysis pipeline supporting Gemini, OpenAI, Ollama, and heuristic fallbacks.

**The core architectural breakdown**: The bridge between these two systems is largely non-functional or simulated in real user workflows:
* **The AI analysis API is completely broken**: The frontend request payload schema does not match the backend FastAPI Pydantic schema, causing `/api/backend/ai/analyze` to **always fail with HTTP 422**. The UI silently swallows this error and renders client-side mock text.
* **The core voting UI is cryptographically incompatible with the smart contracts**: The dispute and juror consoles compute vote commitments using `SHA-256("VOTE:salt")` via `frontend/app/lib/crypto.ts`, whereas `VotingManager.sol` enforces `keccak256(abi.encodePacked(uint8, bytes32, uint256, address))`. If the frontend ever sent its vote commitment to the contract, the reveal transaction would revert immediately.
* **Dispute creation never registers on-chain**: The 5-step intake wizard only calls `EvidenceRegistry.registerEvidence`. It **never calls** `ArbitrationHub.initiateDispute` or `CaseRegistry.createCase`.
* **State is siloed per account**: State persistence is implemented as a raw dump of the client-side state into a `user_state` table keyed by the user's ID. **There is no shared relational database for cases.** If User A files a claim against User B, User B cannot see the claim because User B's workspace loads an entirely separate mock dataset.
* **Critical security vulnerabilities**: The AES master encryption key and JWT signing secret are committed in plaintext inside `backend/secret/keys.json`, and the `/api/auth/wallet` endpoint allows **unauthenticated account takeover** of any wallet address without signature verification.

Resolvia has a viable core vision and commendable component-level work, but it cannot proceed to production or expansion until its foundational data architecture, smart contract wiring, API contracts, and security perimeter are unified into a single coherent system.

---

## 2. Architecture Understanding

### Discovered System Architecture

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         FRONTEND (Next.js 16)                                     │
│  - App Router: /dashboard, /cases/[id], /jury/[id], /create, /case-studies, /reputation, /protocol │
│  - State: AppContext (localStorage + in-memory cases array)                                      │
│  - Hashing: WebCrypto SHA-256 for file byte fingerprints                                         │
│  - Internal Incompatibility: lib/crypto.ts (SHA256) vs lib/commitment.ts (Keccak256)              │
└─────────────┬──────────────────────────┬─────────────────────────────────┬────────────────────────┘
              │ (1) /api/backend/*       │ (2) /api/rpc                    │ (3) /api/deployments
              ▼                          ▼                                 ▼
┌───────────────────────────────┐ ┌───────────────────────────────┐ ┌───────────────────────────────┐
│     FASTAPI BACKEND (:8000)   │ │      JSON-RPC PROXY (:8545)   │ │      LOCAL MANIFEST ROUTE     │
│ - server.py / auth.py         │ │ - Proxies raw JSON-RPC to     │ │ - Reads local.json from       │
│ - Custodial Wallets (AES-GCM) │ │   Hardhat local node          │ │   blockchain/deployments/     │
│ - JWT Session Management      │ └──────────────┬────────────────┘ └───────────────────────────────┘
│ - Off-Chain Evidence Anchor   │                │
│ - State Sync (/api/state)     │                │
└──────┬─────────────────┬──────┘                │
       │                 │                       │
       ▼                 ▼                       ▼
┌───────────────┐ ┌─────────────┐ ┌─────────────────────────────────────────────────────────────────┐
│ AI ENGINE     │ │ SQLITE DBs  │ │                    SMART CONTRACTS (Hardhat / EVM)              │
│ - Gemini      │ │ - auth.db   │ │  - ResolviaToken.sol (ERC-20 RSLV stake & reward token)          │
│ - OpenAI      │ │ - state.db  │ │  - ArbitrationHub.sol (Escrow stake lock & settlement coordinator│
│ - Ollama      │ └─────────────┘ │  - CaseRegistry.sol (Dispute state machine)                     │
│ - Heuristics  │                 │  - VotingManager.sol (Commit-reveal voting logic)               │
└───────────────┘                 │  - EvidenceRegistry.sol (Standalone SHA-256 evidence log)       │
                                  └─────────────────────────────────────────────────────────────────┘
```

### Critical Flow Traces

#### Flow 1: Dispute Creation & Evidence Upload
1. Claimant completes the 5-step wizard in `frontend/app/(app)/create/page.tsx`.
2. Evidence files are hashed in-browser via WebCrypto `SHA-256`.
3. The wizard triggers a cosmetic sequence of `setTimeout` steps displaying "Locking 500 RSLV escrow stake…" and "Registering case on CaseRegistry…".
4. The wizard invokes `anchorEvidenceOnChain`, which calls `EvidenceRegistry.registerEvidence` either via backend signed transaction or client-side signer.
5. **Breakage**: `ArbitrationHub.initiateDispute()` is **never invoked**. No stake is transferred, and no case is registered on `CaseRegistry.sol`. The case exists purely as a JavaScript object in the claimant's browser memory.

#### Flow 2: AI Advisory Analysis
1. User clicks "Run AI Analysis" on `frontend/app/(app)/cases/[caseId]/page.tsx`.
2. Frontend sends `POST /api/backend/ai/analyze` with payload: `{ caseId, title, description, claimAmount, evidence }`.
3. Backend expects Pydantic model `AIAnalysisRequest`: `{ caseId, caseNumber, claimantStatement, respondentStatement, evidenceList }`.
4. **Breakage**: FastAPI validation fails immediately with **HTTP 422**.
5. Frontend catch block triggers, falling back silently to a static mock object: `"Resolvia Advisory Engine v1 (deterministic rules — LLM advisory pending)"`.

#### Flow 3: Jury Selection & Deliberation
1. When AI analysis "completes", `app-context.tsx` executes `makePanel()` on the client, generating 5 mock juror objects with fake wallet addresses.
2. An invitation is staged in the user's local state.
3. Deliberation messages entered in `frontend/app/(app)/jury/[caseId]/page.tsx` are appended to the case's in-memory `deliberation` array.
4. **Breakage**: No external peer jurors can see these messages. `ArbitrationHub.appointJurorPanel()` is never called.

#### Flow 4: Commit-Reveal Voting & Settlement
1. Juror selects a verdict and salt in `frontend/app/components/CommitRevealVoting.tsx`.
2. Component computes commitment via `frontend/app/lib/crypto.ts` as `SHA-256("VOTE:salt")`.
3. `app-context.tsx` updates juror status to `COMMITTED`, generates a fake transaction hash `rndTx()`, and updates the UI audit trail.
4. Juror reveals vote; client tallies votes and declares `status: "VERDICT"`.
5. **Breakage**: Completely decoupled from `VotingManager.sol`. The only place real smart contract voting occurs is inside the standalone `/protocol` developer sandbox (`frontend/app/components/OnChainProtocol.tsx`).

#### Flow 5: Data Persistence
1. Client state in `app-context.tsx` changes.
2. A debounced hook serializes the entire workspace into a JSON string and writes to `localStorage`.
3. If logged in, it sends `PUT /api/backend/state` with `{ state: <full_json_blob> }`.
4. Backend `backend/state_store.py` writes this blob into `user_state` table in SQLite keyed by `user.id`.
5. **Breakage**: There is zero cross-user visibility. Every user lives in a completely isolated database sandbox.

---

## 3. Implemented vs Partial vs Planned

| Area / Feature | Status | Evidence in Code | Reality / Actual State |
|---|---|---|---|
| **Web2 Authentication (Email OTP)** | **Actually Implemented** | `backend/auth.py:388-463` | Working OTP lifecycle. Codes hashed with SHA-256, 3-attempt lock, cooldown, dev fallback `devCode`, SMTP delivery if configured. |
| **Custodial Key Generation & AES Encryption** | **Actually Implemented** | `backend/auth.py:85-96, 170-184` | Generates EVM keypair via `eth-account`, encrypts private key with AES-256-GCM, stores ciphertext in SQLite `wallets` table. |
| **Google OAuth Backend Verification** | **Partially Implemented** | `backend/auth.py:465-485` | Backend verifies Google JWT with `google-auth` library, but disabled in UI unless client ID is configured. |
| **Wallet Sign-In (`POST /auth/wallet`)** | **Broken / Suspicious** | `backend/auth.py:492-501` | Accepts arbitrary string, performs no cryptographic signature check (no SiWE), provisions new custodial wallet or logs in existing. Critical auth bypass. |
| **On-Chain Evidence Anchoring** | **Actually Implemented** | `backend/auth.py:594-610`, `frontend/app/lib/chain.ts:227` | Real transaction signed by user's assigned wallet or demo account, submitted to `EvidenceRegistry.registerEvidence`. |
| **Proof Verifier (On-Chain Log Check)** | **Partially Implemented** | `backend/auth.py:612-656`, `frontend/app/components/VerificationPortal.tsx` | Queries chain via `eth_getLogs` for hash match. Falls back to in-memory check and displays fabricated "merkle root verified" claims if unanchored. |
| **Client File Hashing (WebCrypto SHA-256)** | **Actually Implemented** | `frontend/app/lib/crypto.ts:25-33` | Real byte-level WebCrypto hashing. Verified by Vitest unit tests against NIST test vectors. |
| **AI Advisory Pipeline (Multi-Provider)** | **Partially Implemented** | `ai-engine/analysis_pipeline.py` | Working standalone script supporting Gemini, OpenAI, Ollama, and heuristics. Prompt injection regex scanner included. |
| **AI Advisory Frontend Integration** | **Broken / Suspicious** | `app-context.tsx:627-650` vs `backend/server.py:60-66` | Field names mismatched (`caseNumber`, `claimantStatement`, `evidenceList`). API throws 422 Unprocessable Entity every time. Always falls back to static text. |
| **Dispute Intake Wizard (UI/UX)** | **Actually Implemented** | `frontend/app/(app)/create/page.tsx` | Polished 5-step wizard with category selection, draft autosave to localStorage, and byte hashing. |
| **On-Chain Dispute Creation & Escrow Stake** | **Planned / Documented** | `blockchain/contracts/ArbitrationHub.sol:114` | Contract method `initiateDispute` exists, but wizard **never calls it**. The UI only creates an in-memory case object and anchors evidence. |
| **Smart Contracts Core Suite** | **Actually Implemented** | `blockchain/contracts/` | 5 Solidity contracts compiled with viaIR, 17/17 passing Hardhat unit tests covering commit-reveal math and escrow settlement. |
| **Jury Commit-Reveal Protocol (Contracts)** | **Actually Implemented** | `blockchain/contracts/VotingManager.sol` | Replay-proof Keccak-256 packing of `(uint8, bytes32, uint256, address)` enforced with deadline and grace period. |
| **Jury Voting in Case & Jury Workspace (UI)** | **Broken / Suspicious** | `CommitRevealVoting.tsx`, `app-context.tsx:488-550` | Uses incompatible `SHA-256("VOTE:salt")`, emits fake `rndTx()` hashes, writes only to React state. Bypasses smart contracts entirely. |
| **End-to-End On-Chain Demo (/protocol)** | **Actually Implemented** | `frontend/app/components/OnChainProtocol.tsx` | Working end-to-end demo page that connects to local chain, executes real contract calls (`initiateDispute`, `counterStake`, `appointJurorPanel`, `commitVote`, `revealVote`, `settleCase`). |
| **Shared Relational Case Database** | **Planned / Documented** | `database/README.md` | PostgreSQL schema documented in README but 0 migration/ORM files exist. Only per-user opaque JSON SQLite store exists. Multi-user disputes impossible. |
| **On-Chain Appeal Window & Panel Reselection** | **Planned / Documented** | `README.md:96` | UI shows "48h appeal window", but `ArbitrationHub.sol` immediately pays out funds upon `settleCase`. Zero on-chain appeal mechanism exists. |
| **Jury Availability Settings Integration** | **Partially Implemented** | `frontend/app/(app)/settings/page.tsx`, `frontend/app/lib/app-context.tsx` | Settings UI stores availability state in localStorage, but selection logic in contracts is purely manual `onlyAdmin`. |
| **BSA 2023 §63 Legal Dossier Export** | **Partially Implemented** | `frontend/app/components/LegalExportModal.tsx` | Client-side HTML certificate generator with Schedule Part A/B and JSON export. Unsigned by any verifiable authority; uses hardcoded mock signatories. |
| **IPFS Real Pinning** | **Planned / Documented** | `frontend/app/(app)/create/page.tsx:230` | Synthesizes fake CID `bafybei<sha256[:44]>`. No Pinata or IPFS node daemon integration. |
| **Docker Compose Local Stack** | **Broken / Suspicious** | `docker-compose.yml` | Backend targets `RESOLVIA_RPC=http://blockchain:8545`, but there is **no blockchain service** in `docker-compose.yml`. Fails on startup. |

---

## 4. Critical Issues & Errors

| ID | Area | Issue | Evidence | Impact | Severity | Recommendation |
|---|---|---|---|---|---|---|
| **ERR-01** | Backend / AI | **API contract mismatch on `/api/ai/analyze` breaks all AI advisory requests.** | `app-context.tsx:630-643` vs `backend/server.py:60-66` | Frontend sends `{ caseId, title, description, claimAmount, evidence }`; FastAPI expects `{ caseId, caseNumber, claimantStatement, respondentStatement, evidenceList }`. FastAPI raises HTTP 422; frontend catches and silently falls back to static mock text. AI engine is never called from UI. | **CRITICAL** | Harmonize Pydantic schema in `server.py` with frontend TypeScript interface in `types/index.ts`. Add integration test in CI. |
| **ERR-02** | Frontend / Blockchain | **Cryptographic hash algorithm mismatch between voting UI and smart contracts.** | `CommitRevealVoting.tsx:95`, `crypto.ts:45` vs `VotingManager.sol:107-110` | UI computes `SHA-256("VOTE:salt")`. Contract enforces `keccak256(abi.encodePacked(uint8, bytes32, uint256, address))`. If UI ever submitted this hash on-chain, `revealVote()` would revert with "Cryptographic commitment mismatch". | **CRITICAL** | Replace `computeVoteCommitment` in `CommitRevealVoting.tsx` with `computeCommitment` from `commitment.ts`. Deprecate string SHA-256 vote hashing. |
| **ERR-03** | Frontend / Blockchain | **Case filing wizard never registers disputes on `ArbitrationHub` or `CaseRegistry`.** | `create/page.tsx:273-306` | `runSubmit()` only calls `anchorEvidenceOnChain` (`EvidenceRegistry.registerEvidence`). It never calls `ArbitrationHub.initiateDispute()`. On-chain, the dispute does not exist; no RSLV is staked or locked in escrow. | **CRITICAL** | Update `runSubmit()` to execute `token.approve()` and `hub.initiateDispute()` using the user's assigned wallet, linking on-chain `caseId` to evidence records. |
| **ERR-04** | Architecture / Database | **Zero multi-user case persistence (state siloed per user in SQLite).** | `backend/state_store.py:46-62`, `app-context.tsx:310-384` | Backend stores arbitrary JSON blob keyed by `user_id`. Each user operates in a siloed state container. A dispute filed by User A against User B is invisible to User B. Platform cannot function as a two-sided dispute resolution system. | **CRITICAL** | Build a real relational schema (PostgreSQL or SQLite tables for `cases`, `parties`, `evidence`, `votes`, `audit_events`) shared across all authenticated accounts. |
| **ERR-05** | UI / Simulation | **Fake transaction hashes and block numbers injected into user audit trail.** | `app-context.tsx:121, 511, 549, 602` | `rndTx()` generates random 64-char hex strings and adds 6,286,200 to block numbers, claiming "anchored on ledger". Misleads users into believing non-existent transactions were mined. | **HIGH** | Replace synthetic `rndTx()` with actual transaction receipts or explicitly label events as "OFF-CHAIN STATE MUTATION (LOCAL)". |
| **ERR-06** | Blockchain / Verification | **Unbounded, unindexed `eth_getLogs` scan from block 0 on `/evidence/verify`.** | `backend/auth.py:627-637` | Queries `eth_getLogs` with `fromBlock: "0x0"` to `latest` on every verification request, then does a substring search on raw unparsed ABI hex. On any real testnet or public node (Infura/Alchemy), RPC rejects block ranges >2000 blocks with HTTP 400. | **HIGH** | Index `contentSha256` as `bytes32 indexed` in `EvidenceRegistered` event; query logs with topic filters, or store verified tx hashes in the backend database. |
| **ERR-07** | Smart Contracts | **Unreachable dead code in `CaseRegistry.sol`.** | `CaseRegistry.sol:93-101` | `anchorEvidence()` and `anchorAIReport()` have `onlyHub` modifiers. However, `ArbitrationHub.sol` has no methods that invoke them. These functions can never be executed by any account or contract. | **HIGH** | Add corresponding coordinator methods in `ArbitrationHub.sol` to anchor Merkle roots and AI report hashes, or remove the dead functions. |
| **ERR-08** | Smart Contracts / Protocol | **Immediate escrow payout leaves zero on-chain appeal window.** | `ArbitrationHub.sol:176-194, 212-242` | `settleCase()` immediately transfers all staked funds to the winner and jurors. The "48h appeal window" advertised in the UI and README is completely absent from the smart contract logic. Once settled, funds cannot be reclaimed for an appeal. | **HIGH** | Introduce a two-stage settlement pattern: `declareVerdict()` transitions to `APPEAL_WINDOW` and starts a timer; `settleCase()` can only be called after the appeal window expires without a valid appeal stake. |
| **ERR-09** | Frontend / Math | **Trust score calculation bug produces values over 9000.** | `frontend/app/(app)/reputation/page.tsx:44` | `x.score * parseFloat(x.weight)` computes `96 * 35 = 3360` instead of `96 * 0.35 = 33.6`. Total trust score sums to 9,565 on a 0–100 scale, resulting in CSS width `9565%`. | **MEDIUM** | Divide `parseFloat(x.weight)` by 100 or store numeric weights (`0.35`). |
| **ERR-10** | Infrastructure / Docker | **`docker-compose.yml` fails on launch due to missing blockchain container.** | `docker-compose.yml:14` | Backend environment configures `RESOLVIA_RPC=http://blockchain:8545`, but no service named `blockchain` is declared in `docker-compose.yml`. DNS resolution fails and backend crashes or errors out. | **MEDIUM** | Add a Hardhat node service to `docker-compose.yml` or update default environment to external RPC / localhost. |
| **ERR-11** | Backend / Python | **Missing dependencies in `backend/requirements.txt`.** | `backend/Dockerfile:14` vs `backend/requirements.txt` | Dockerfile explicitly installs `google-genai` and `httpx`, but neither is present in `requirements.txt`. Native Python installations fail when importing `analysis_pipeline.py`. | **MEDIUM** | Add `google-genai>=0.1.1` and `httpx>=0.27.0` to `backend/requirements.txt`. |

---

## 5. Security Findings

| ID | Area | Finding | Status | Risk | Recommendation |
|---|---|---|---|---|---|
| **SEC-01** | Secrets & Cryptography | **Plaintext AES Master Key & JWT Secret committed to repository.** | **Confirmed issue** | **CRITICAL** | `backend/secret/keys.json` contains a live 256-bit AES master key and HS256 JWT secret. Anyone with repository access can decrypt every custodial private key stored in `resolvia_auth.db` and forge valid authentication tokens for any user. Immediately rotate keys, remove from repository, and load strictly via environment variables (`RESOLVIA_MASTER_KEY`, `RESOLVIA_JWT_SECRET`) or cloud KMS. |
| **SEC-02** | Authentication | **Authentication bypass via unauthenticated `POST /auth/wallet`.** | **Confirmed issue** | **CRITICAL** | `POST /auth/wallet` accepts an arbitrary `{ "wallet": "0x..." }` string and issues a signed JWT without requiring a cryptographic signature challenge (e.g., EIP-4361 Sign-In with Ethereum). An attacker can impersonate any wallet address or hijack account sessions. Implement standard EIP-4361 nonce-challenge signing before issuing session tokens. |
| **SEC-03** | Secrets & Frontend | **Hardhat test private keys embedded in frontend bundle.** | **Confirmed issue** | **HIGH** | `frontend/app/lib/chain.ts` embeds 7 Hardhat default private keys directly in client-side code. While safe on ephemeral local nodes, if deployed to public environments or testnets with funded accounts, automated bot drainers will immediately steal all funds. Strip all private keys from client code; sign transactions exclusively via backend custodial endpoints or injected Web3 providers (MetaMask/WalletConnect). |
| **SEC-04** | Key Custody | **Centralized custodial key risk with single master key.** | **Likely issue** | **HIGH** | Server stores encrypted raw private keys in SQLite. If the backend server host is compromised (RCE, backup leakage, unauthorized access), the entire user wallet population is compromised. Transition towards non-custodial or semi-custodial architectures: WebAuthn/Passkey session keys via ERC-4337 Smart Accounts or Turnkey/Privy MPC infrastructure. |
| **SEC-05** | API & Abuse | **Denial of Service via unvalidated `PUT /api/state` payloads.** | **Confirmed issue** | **HIGH** | `PUT /api/state` accepts arbitrary JSON payloads up to 2MB per user with zero schema validation and writes directly to SQLite. A malicious user can spam database storage, inject malformed JSON, or exhaust server disk space. Enforce strict Pydantic model validation on state structure and implement rate limiting. |
| **SEC-06** | Smart Contracts | **Unrestricted evidence injection in `EvidenceRegistry.sol`.** | **Confirmed issue** | **MEDIUM** | `registerEvidence()` has no access control, case existence verification, or caller authentication. Any address can register arbitrary SHA-256 hashes against non-existent cases or front-run real evidence hashes. Require callers to be registered parties on `CaseRegistry` or route calls through `ArbitrationHub`. |
| **SEC-07** | Smart Contracts | **DoS on settlement if juror token transfer reverts.** | **Confirmed issue** | **MEDIUM** | In `ArbitrationHub.distributeEscrow()`, juror rewards are distributed in an iterative `token.transfer()` loop. If any juror address is a smart contract that rejects ERC-20 transfers (or is blacklisted by a future token standard), the entire `settleCase()` transaction reverts, permanently locking all winner and juror funds in escrow. Adopt a pull-payment (claimable withdrawal) pattern for juror rewards instead of push transfers. |
| **SEC-08** | Smart Contracts / Governance | **Centralized single-admin point of failure.** | **Confirmed issue** | **MEDIUM** | `ArbitrationHub.appointJurorPanel()` and `settleCase()` are gated by `onlyAdmin`. If the admin private key is lost or the operator server goes down, cases can never be empanelled or settled, permanently locking escrow funds. Decentralize panel appointment via verifiable randomness (Chainlink VRF) and allow permissionless settlement once quorum and deadline conditions are met. |
| **SEC-09** | AI & Trust Boundary | **Prompt injection defense relies on naive regex blacklisting.** | **Needs verification** | **MEDIUM** | `PromptInjectionDefense.inspect_text()` checks for a static list of 11 regex patterns (e.g. `system prompt`, `ignore prior instructions`). Attackers can easily bypass this using character substitutions, leetspeak, language translation, or XML tag manipulation. Enhance defense using structural data isolation, instruction-data role separation in LLM APIs, and dual-pass validation. |
| **SEC-10** | Database & State | **Lack of concurrency control on state sync.** | **Confirmed issue** | **LOW** | `PUT /api/state` performs a blind overwrite of the entire user workspace state (`ON CONFLICT DO UPDATE SET payload = ...`). Concurrent browser tabs or delayed background requests can overwrite newer user actions with stale client snapshots. Implement optimistic locking via state versioning (`version` / `ETag`). |

---

## 6. "Vibe-Code" / Engineering Quality Findings

| ID | Component | Observation | Classification | Reason |
|---|---|---|---|---|
| **VIBE-01** | `frontend/app/lib/app-context.tsx` | Generates random fake transaction hashes (`rndTx()`) and fake block numbers (6,286,200) for UI audit trails. | **REMOVE** | Misleading and fake. Gives the false impression that client-side state mutations are anchored on Ethereum. Real events should display actual transaction hashes; local-only state should be labeled as off-chain. |
| **VIBE-02** | `frontend/app/(app)/create/page.tsx` | Simulated submit phase timers (`setTimeout` running every 750ms displaying fake steps like "Locking 500 RSLV escrow stake…"). | **SIMPLIFY** | Artificial progress bar that does not reflect actual async operations. Replace with real async operation status tracking (e.g., waiting for wallet signature, waiting for block confirmation). |
| **VIBE-03** | `frontend/app/components/VerificationPortal.tsx` | Fallback message claiming: `"Genesis record verified against platform merkle root; dispute assets anchored to protocol registry"`. | **REMOVE** | Fabricated assurance. No Merkle root exists in the backend or smart contracts. If a record is not found on-chain, the system should honestly state that it is unanchored or local-only. |
| **VIBE-04** | `frontend/app/lib/crypto.ts` | Dual conflicting commitment implementations: `computeVoteCommitment` (SHA-256 string) vs `lib/commitment.ts` (Keccak-256 packed ABI). | **REMOVE** | Dangerous architectural duplication. The `lib/crypto.ts` version gives the illusion of cryptographic voting while being incompatible with the smart contracts. Standardize strictly on `lib/commitment.ts`. |
| **VIBE-05** | `frontend/app/(app)/create/page.tsx` | Synthetic IPFS CID generation: `"bafybei" + sha256.slice(0, 44)`. | **SIMPLIFY** | Not a valid CIDv1 multihash. If IPFS pinning is not active, store the SHA-256 digest directly and mark storage as "Local Blob / CID Pending" rather than fabricating CIDs. |
| **VIBE-06** | `backend/server.py` | Dead `DisputeRequest` Pydantic model declared on line 51 with no matching route. | **REMOVE** | Leftover artifact from early development. Clean up unused API declarations. |
| **VIBE-07** | `blockchain/contracts/ArbitrationHub.sol` | Declares `EvidenceRegistry public evidenceRegistry;` in constructor, but never uses it anywhere in contract logic. | **SIMPLIFY** | Dead state variable. Either integrate evidence anchoring checks into dispute initiation or remove the unused contract reference. |
| **VIBE-08** | `frontend/app/components/LegalExportModal.tsx` | Hardcoded fictional signatories: `"Resolvia Protocol Custodian"` and `"Platform Cryptographic Verification Lead"`. | **SIMPLIFY** | Cosmetic veneer. Replace with verifiable cryptographic signatures (e.g., digital signature of the case record digest by the platform operator key or juror signers). |
| **VIBE-09** | `frontend/app/(app)/jury/[caseId]/page.tsx` | "Fast-Sync Jury Quorum & Tally" button calling `simulateOtherJurors()`. | **KEEP (Gated)** | Useful for demonstration and offline review, but must be explicitly segregated into a clearly marked "Developer / Demo Controls" drawer so it is never confused with production arbitration. |
| **VIBE-10** | `frontend/app/lib/chain.ts` | Hardcoded well-known Hardhat accounts and private keys in the frontend bundle. | **REMOVE** | Antipattern. Frontend code should never contain private keys. Extract to server-side mock signer in dev mode or use browser wallet extensions. |

---

## 7. UX / Product Issues

| ID | Workflow | Problem | User Impact | Recommendation |
|---|---|---|---|---|
| **UX-01** | Create Dispute | **Stake requirements mismatch across wizard and documentation.** | In the wizard review step, the stake is described as 500 RSLV. In the case summary card it shows 250 RSLV. In `app-context.tsx`, balance deduction is 500 RSLV. Users are confused about the actual anti-spam financial commitment. | Unify stake requirement across all UI badges, contracts, and context to a single constant (`500 RSLV`). |
| **UX-02** | Dispute Intake | **Respondent contact information is collected but discarded.** | Wizard Step 3 collects "Respondent Contact (Email / Wallet / Telegram)", but the resulting `DisputeCase` object does not persist this data. The platform cannot actually notify the respondent. | Add `contact` field to `DisputeCase['respondent']` interface and trigger actual email notifications if SMTP is configured. |
| **UX-03** | AI Advisory | **Silent failure on AI analysis gives false sense of security.** | Clicking "Run AI Analysis" displays a spinner for 1.5 seconds, fails silently due to the schema bug, and renders deterministic rule fallback text without informing the user that the LLM pipeline failed. | Display honest error and status banners: `"LLM analysis failed; showing heuristic preview"`. |
| **UX-04** | Jury Review | **AI advisory report visibility leak before blind voting.** | In `cases/[caseId]`, parties and jurors can see the AI Advisory tab before casting their vote. While the jury workspace hides it, navigating to the main case details page reveals the recommendation, destroying the blind review principle. | Restrict AI advisory section visibility strictly until the user's role has cast and revealed their vote, or gate the tab based on case phase. |
| **UX-05** | Case Details | **Section rail navigation state desynchronizes on URL refresh.** | `searchParams.get('section')` is read on initial load, but section switching uses `router.replace` without updating internal React state consistently, causing back-button navigation to desynchronize the active view. | Standardize navigation on Next.js URL query params as single source of truth rather than duplicated local `useState`. |
| **UX-06** | Voting Console | **Secret salt handling risks permanent vote loss.** | During the commit phase, the salt is generated and displayed. If the user clears browser cache, loses session, or fails to copy the salt, their vote can never be revealed during the reveal phase, resulting in forfeiture of juror stake. | Offer secure local session encrypted backup of the salt, or implement automatic client-side salt vaulting tied to the user's account. |
| **UX-07** | Appeal Workflow | **Filing an appeal creates an immediate dead end.** | Respondent can click "File Appeal" in `cases/[caseId]`, which sets `appeal.filed = true` and shows "Appeal Registered". However, no new panel is convened, no new voting phase is triggered, and the case remains stuck in appeal limbo. | Implement appeal state transition: convening a secondary 7-juror panel and resetting the commit-reveal cycle. |
| **UX-08** | Mobile Viewports | **Jury review workspace and voting console break on smaller screens.** | The 3-column layout in `jury/[caseId]/page.tsx` causes heavy horizontal clipping on tablet and mobile viewports (<1024px), making evidence comparison impossible. | Refactor layout into responsive tabs or collapsible accordions for viewports under 1024px. |

---

## 8. Architecture / Reliability Risks

### 1. The "Dual Universe" Divergence (Simulation vs Reality)
* **Risk**: The codebase maintains two completely separate implementations for every core protocol feature:
  * **Universe A (The Web Application)**: `app-context.tsx`, `mockData.ts`, `lib/crypto.ts`, `CommitRevealVoting.tsx`. Uses in-memory arrays, SHA-256 strings, random transaction hashes, and simulated quorums.
  * **Universe B (The Protocol Demo)**: `ArbitrationHub.sol`, `VotingManager.sol`, `lib/commitment.ts`, `OnChainProtocol.tsx`. Uses Keccak-256 packing, real ethers.js contract calls, Hardhat node mining, and on-chain escrow movements.
* **Failure Scenario**: A developer fixes a bug in `VotingManager.sol` or `OnChainProtocol.tsx` and assumes the dispute resolution product is working. Meanwhile, 100% of real users using `/cases` and `/jury` are running on Universe A, which is completely unaffected by contract updates and completely decoupled from blockchain reality.

### 2. Lack of a Centralized Case & Dispute Database
* **Risk**: Resolvia has no shared database for dispute state. It uses per-user state dumps in `state.db`.
* **Failure Scenario**:
  1. Alice logs in via Google OAuth and files a dispute against Bob (`bob@example.com`).
  2. The case is saved to Alice's localStorage and pushed to Alice's row in `backend/state.db`.
  3. Bob logs in with `bob@example.com`. His browser loads `mockData.ts` and hydrates his own row from `backend/state.db`.
  4. Bob has **zero awareness** of Alice's dispute. The case does not appear in his dashboard or "As Respondent" tab.
  5. The platform cannot execute a two-party dispute resolution workflow.

### 3. Contract Custodial Risk & Operator Dependency
* **Risk**: `ArbitrationHub.sol` requires the `admin` key to execute both `appointJurorPanel()` and `settleCase()`.
* **Failure Scenario**:
  1. A claimant stakes 500 RSLV; respondent counter-stakes 500 RSLV (1,000 RSLV locked in contract escrow).
  2. The off-chain operator crashes, or the admin private key is lost.
  3. No juror panel can ever be appointed.
  4. Because the case state transitioned to `EVIDENCE_LOCKED`, the claimant cannot call `rescueStake()` (which requires state `SUBMITTED`).
  5. The 1,000 RSLV remains permanently frozen in the contract with no recovery mechanism.

### 4. Fragile IPFS and Evidence Integrity Chain
* **Risk**: Evidence files uploaded in the browser are fingerprinted, but the raw bytes are never stored on IPFS or the backend server. They are cached in a temporary JavaScript in-memory `Map` (`_contentCache`).
* **Failure Scenario**:
  1. User uploads `contract.pdf` (SHA-256 `0xabc...`).
  2. User refreshes their browser. The in-memory `_contentCache` is wiped clean.
  3. Juror opens the case to review `contract.pdf`. The file content is gone because it was never uploaded to an IPFS node or backend object store.
  4. The juror cannot read the evidence and must vote blindly or abstain.

---

## 9. Testing Gaps

Resolvia currently has **zero backend tests, zero UI component tests, zero E2E tests for the web application, and zero negative test cases for the AI engine**. The only existing tests are 2 Hardhat contract test files and 2 isolated client-side utility tests.

### Current Test Inventory vs Required Test Matrix

| Layer | Existing Tests | Critical Missing Tests |
|---|---|---|
| **Frontend Utilities** | `tests/crypto.test.ts` (SHA-256 byte hashing), `tests/commitment.test.ts` (Keccak packing) | - Integration between `CommitRevealVoting` and `commitment.ts`<br>- Salt validation and recovery logic<br>- State re-baselining and deadline calculation |
| **Frontend Workflows** | **None** | - Dispute creation wizard end-to-end flow<br>- Juror acceptance, commit, and reveal flow<br>- Proof verifier query and error states<br>- Authentication state transitions (OTP login / logout) |
| **Backend API** | **None** (`ci.yml` only runs `compileall` and checks route names in OpenAPI) | - `POST /api/ai/analyze` contract and schema validation<br>- `POST /api/auth/otp/request` rate limiting and cooldown<br>- `POST /api/auth/otp/verify` attempt lockout and signature issuance<br>- `POST /api/wallet/evidence/anchor` transaction failure handling<br>- `GET /api/evidence/verify` RPC error handling and log bounds |
| **AI Engine** | **None** | - Adversarial prompt injection attacks (jailbreak evasion vectors)<br>- Empty, corrupted, or giant evidence payloads<br>- LLM timeout and provider failover heuristics<br>- Contradiction radar accuracy on unstructured legal text |
| **Smart Contracts** | `commitReveal.test.js`, `escrowSettlement.test.js` (Passing in isolation) | - Revert handling when juror address rejects ERC-20 transfer<br>- Edge case: 0 jurors reveal before grace deadline<br>- Edge case: exact 3-way tie in voting outcomes<br>- Stake rescue edge cases (block timestamp manipulation) |
| **Cross-System E2E** | `e2e-escrow.js`, `e2e-assigned-wallet.py` (Scripted terminal runs) | - Real browser -> Backend -> Blockchain integration test (Playwright)<br>- Multi-user synchronization test (Claimant creates -> Respondent responds -> Juror votes) |

---

## 10. Documentation Mismatches

| Document / Claim | Code Reality | Discrepancy / Correction Required |
|---|---|---|
| **README.md:126**<br>*"Cases: central Case Details: overview, response, evidence, AI advisory, jury, voting, verdict, appeal... each section gated by case state"* | `frontend/app/(app)/cases/[caseId]/page.tsx` | Sections are visually gated, but AI advisory is visible to jurors prior to blind voting if they view the case page. Voting section does not execute smart contract calls. |
| **README.md:88**<br>*"Random Weighted Human Jury Selection (Conflict of Interest Checks)"* | `blockchain/contracts/ArbitrationHub.sol:160` | On-chain jury selection has no PRNG, no weighting, and no conflict checks; it is an arbitrary list passed to an `onlyAdmin` function. Client selection is basic `Math.random()`. |
| **README.md:96**<br>*"Appeal Window (48h, fresh 7-juror panel)"* | `blockchain/contracts/ArbitrationHub.sol:176` | No on-chain appeal window exists. Escrow is liquidated immediately upon settlement. No smart contract logic exists for convening a 7-juror panel. |
| **PROJECT_REPORT.md:37**<br>*"R1: Real on-chain evidence anchoring: Wizard submit signs a real registerEvidence tx"* | `frontend/app/(app)/create/page.tsx:273` | Evidence is anchored, but the case itself is never created on-chain in `CaseRegistry` or `ArbitrationHub`. Only the standalone `EvidenceRegistry` is hit. |
| **PROJECT_REPORT.md:38**<br>*"R2: Real Proof Verifier: Public GET /api/evidence/verify reads the chain... Content re-hash from original bytes"* | `frontend/app/components/VerificationPortal.tsx:80` | If the evidence is not on-chain, the verifier falls back to the in-memory array and falsely claims "Genesis record verified against platform merkle root". |
| **PROJECT_REPORT.md:39**<br>*"R3: Real per-user persistence: GET/PUT /api/state (per-user SQLite)"* | `backend/state_store.py:46` | Stores opaque 2MB JSON blobs per user. Does not provide shared state between claimants, respondents, and jurors. |
| **AUDIT_REPORT_2026-09-17.md:19**<br>*"P1-3: 3 stake numbers FIXED — 500 everywhere"* | `create/page.tsx:248`, `cases/[caseId]/page.tsx:373` | Not fixed: `create/page.tsx` still sets `claimant.stake: 250`, `cases/[caseId]/page.tsx` line 373 states "Submitting locks a 250 RSLV counter-stake", while contracts and other UI labels require 500 RSLV. |
| **database/README.md:1-15**<br>*"PostgreSQL schema for off-chain case metadata... cases, evidence, audit_events, jurors"* | `database/` | No PostgreSQL schema, migrations, or models exist in the repository. |

---

## 11. Enhancement Backlog

### P0 — Critical (Foundational Integrity & Security)
1. **Fix Critical Secrets Leakage**: Remove `backend/secret/keys.json` and `backend/resolvia_auth.db` from repository history; require environment variables for `RESOLVIA_MASTER_KEY` and `RESOLVIA_JWT_SECRET`.
2. **Patch Auth Bypass on Wallet Login**: Remove unauthenticated wallet impersonation in `POST /auth/wallet`; implement EIP-4361 (Sign-In with Ethereum) challenge-response signature verification.
3. **Harmonize AI API Contract**: Reconcile Pydantic schema in `backend/server.py` with frontend TypeScript interface in `types/index.ts` so `/api/backend/ai/analyze` succeeds with live LLM / heuristic analysis.
4. **Unify Voting Cryptography**: Replace the disconnected `SHA-256("VOTE:salt")` implementation in `CommitRevealVoting.tsx` with the contract-compatible `keccak256(abi.encodePacked(uint8, bytes32, uint256, address))` in `commitment.ts`.
5. **Implement Shared Relational Database**: Replace the isolated per-user JSON blob store in `state_store.py` with a normalized SQLite/PostgreSQL database for disputes, evidence, parties, and votes so multi-user workflows function.
6. **Wire Wizard to Contract Initiation**: Connect `create/page.tsx` to `ArbitrationHub.initiateDispute()` so disputes lock real anti-spam escrow and register on `CaseRegistry.sol`.

### P1 — High-Value (Protocol Correctness & Core Usability)
7. **Two-Stage Escrow Settlement & Appeal Mechanism**: Update `ArbitrationHub.sol` to hold funds in escrow during a 48-hour appeal window before final distribution, enabling real on-chain appeals.
8. **Real Storage Upload for Evidence**: Replace client-side memory caching with persistent server-side file storage (or IPFS/Pinata pinning) so evidence files can be downloaded and inspected across sessions.
9. **Eliminate Synthetic `rndTx()` Hashes**: Remove fake transaction hashes and block numbers from `app-context.tsx`; display actual blockchain receipt data or mark events as off-chain.
10. **Index and Bound Proof Verifier Logs**: Update `EvidenceRegistry.sol` to index evidence hashes; bound `eth_getLogs` block query ranges to prevent RPC timeouts on public networks.
11. **Repair Docker Compose Environment**: Add an automated local Hardhat node service to `docker-compose.yml` and synchronize container network ports.
12. **Fix Reputation Math Bug**: Correct the weight calculation in `reputation/page.tsx` so the trust score renders accurately on a 0–100 scale.

### P2 — Enhancement (Robustness & Experience)
13. **Automated Integration & E2E Test Suite**: Implement Playwright E2E tests for the dispute filing, jury voting, and verification flows; add pytest test suite for FastAPI backend endpoints.
14. **Jury Availability Selection Algorithm**: Wire the jury availability settings in `settings/page.tsx` to the backend panel empanelment logic.
15. **Pull-Payment Pattern for Juror Rewards**: Refactor `ArbitrationHub.sol` juror payouts to claimable withdrawals, preventing DOS vulnerabilities from reverting recipient transfers.
16. **Responsive Layout Refactoring**: Redesign `jury/[caseId]/page.tsx` and `create/page.tsx` for tablet and mobile viewports.
17. **Optimistic State Locking**: Add versioning and conflict detection to state synchronization APIs to prevent concurrent tab overwrites.

### P3 — Nice-to-Have (Polish & Long-Term)
18. **Digital Signature on BSA §63 Dossier**: Sign exported legal dossiers with the platform operator's KMS key for cryptographic admissibility verification.
19. **Bilingual Support (Hindi / English)**: Add i18n localization support for Indian legal jurisdictions.
20. **CSV / PDF Case History Export**: Allow users to export personal dispute histories and tax/reputation statements.

---

## 12. Recommended Next Phase: Stability & Coherence Roadmap

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PHASE 1: SECURITY & REPAIR                      │
│ - Rotate and externalize secrets (SEC-01)                              │
│ - Implement SiWE on /auth/wallet (SEC-02)                              │
│ - Fix AI request/response schema mismatch (ERR-01)                     │
│ - Fix reputation score math bug (ERR-09)                               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    PHASE 2: PROTOCOL UNIFICATION                       │
│ - Standardize on Keccak-256 voting commitment (ERR-02)                 │
│ - Connect dispute wizard to ArbitrationHub.initiateDispute (ERR-03)    │
│ - Eliminate fake rndTx() hashes from audit logs (VIBE-01)              │
│ - Unify stake amounts to 500 RSLV (UX-01)                              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   PHASE 3: SHARED DATA ARCHITECTURE                    │
│ - Build normalized relational case database (ERR-04)                   │
│ - Add persistent file storage for evidence uploads                     │
│ - Multi-user role routing (Claimant ↔ Respondent ↔ Juror)              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    PHASE 4: TESTING & RELIABILITY                      │
│ - FastAPI backend pytest suite                                         │
│ - Playwright browser E2E test suite                                    │
│ - Fix Docker Compose stack and RPC log bounds (ERR-06, ERR-10)         │
└────────────────────────────────────────────────────────────────────────┘
```

### Phase 1: Security & API Repair (Days 1–3)
* **Objective**: Eliminate critical vulnerabilities and repair broken backend endpoints.
* **Why**: The application currently has leaked plaintext master secrets and an unauthenticated account takeover vulnerability, and the AI advisory endpoint fails on every invocation.
* **Dependencies**: None.
* **Scope**:
  * Remove `backend/secret/` from repository tracking; configure environment variables.
  * Implement EIP-4361 signature verification in `backend/auth.py:wallet_signin`.
  * Update `backend/server.py` `AIAnalysisRequest` to accept the frontend payload schema.
  * Fix math calculation in `frontend/app/(app)/reputation/page.tsx`.
* **Expected Outcome**: Secure authentication perimeter; AI advisory analysis executes successfully from the web interface.
* **Validation Criteria**:
  * Unit test proving invalid signatures are rejected by `/auth/wallet`.
  * Integration test showing `POST /api/backend/ai/analyze` returning HTTP 200 with structured analysis JSON.

### Phase 2: Protocol Unification (Days 4–7)
* **Objective**: Harmonize the web application with the smart contracts.
* **Why**: The UI currently runs on simulated SHA-256 hashes and never initiates real disputes or escrow locks on-chain.
* **Dependencies**: Phase 1.
* **Scope**:
  * Update `CommitRevealVoting.tsx` to use `computeCommitment()` from `lib/commitment.ts`.
  * Update `create/page.tsx` to call `ArbitrationHub.initiateDispute()` via the backend custodial wallet.
  * Remove `rndTx()` generation; wire real transaction hashes and block numbers to case audit trails.
* **Expected Outcome**: Disputes filed in the web wizard exist on `ArbitrationHub.sol` and `CaseRegistry.sol`; juror votes cast in the UI match contract verification rules.
* **Validation Criteria**:
  * Successful dispute creation through the web UI verifiable via `npx hardhat console` or block explorer.
  * Reveal transaction successfully accepted by `VotingManager.sol` using parameters generated in the UI.

### Phase 3: Shared Relational Data Layer (Days 8–12)
* **Objective**: Enable true multi-party dispute resolution.
* **Why**: Currently each user has an isolated SQLite state blob; respondents cannot see disputes filed against them.
* **Dependencies**: Phase 2.
* **Scope**:
  * Implement normalized SQLite/PostgreSQL schema for disputes, parties, evidence, and votes.
  * Replace `state_store.py` with standard REST endpoints (`GET /api/cases`, `GET /api/cases/{id}`, `POST /api/cases/{id}/response`).
  * Add persistent file storage (local disk or S3/IPFS) for evidence files.
* **Expected Outcome**: Real multi-user interaction: Alice files a case; Bob logs in and sees the case in his "As Respondent" tab; invited Juror logs in and deliberates.
* **Validation Criteria**:
  * Multi-user automated test script simulating two separate authenticated users interacting on the same dispute.

### Phase 4: Automated Testing & Packaging (Days 13–16)
* **Objective**: Guarantee long-term reliability and deployment readiness.
* **Why**: The project currently lacks automated integration tests and has a broken Docker configuration.
* **Dependencies**: Phase 3.
* **Scope**:
  * Add backend unit and integration test suite using `pytest`.
  * Add Playwright E2E browser tests covering intake -> AI analysis -> voting -> settlement.
  * Fix `docker-compose.yml` to include a local Hardhat blockchain node.
* **Expected Outcome**: Green CI pipeline testing the entire integrated stack; one-command local startup via `docker compose up`.
* **Validation Criteria**:
  * `docker compose up` starts all services cleanly without connection errors.
  * `pytest` and Playwright suites pass with 100% success rate.

---

## 13. Things We Should NOT Add

To maintain focus, avoid unnecessary complexity, and ensure professional engineering standards, the following features should **explicitly NOT be added**:

1. **Autonomous "AI Judge" Verdicts**:
   * *Why not*: Violates Resolvia's core principle (*"AI assists evidence analysis; an independent human jury makes the binding decision"*). Autonomous AI verdicts introduce severe legal liability, hallucination risks, and eliminate human accountability.
2. **Complex Multi-Token Governance / DAO Infrastructure**:
   * *Why not*: Unnecessary tokenomic complexity. Resolvia only needs a simple utility staking token (`RSLV`) for anti-spam escrow and juror compensation. A full DAO governance token adds regulatory risk and distraction.
3. **Custom Layer-3 Rollup or AppChain**:
   * *Why not*: Enormous infrastructure overhead with zero user benefit at this stage. Standard EVM testnets (Sepolia) or Layer-2s (Arbitrum/Base) provide all necessary throughput and security without maintaining custom validators or sequencers.
4. **Live Audio/Video Arbitration Hearing Rooms**:
   * *Why not*: Resolvia is designed for asynchronous, evidence-based dispute resolution. Real-time video calls introduce bias, destroy juror anonymity, require expensive WebRTC infrastructure, and complicate scheduling.
5. **Decentralized Prediction Markets on Case Outcomes**:
   * *Why not*: Introduces perverse incentives for jury bribery and insider trading, directly undermining the impartiality of the arbitration process.
6. **Mobile Native Apps (iOS / Android)**:
   * *Why not*: Premature optimization. The responsive web application must first achieve stability and product-market fit before maintaining separate mobile codebases.

---

## 14. Final "Professional Project" Checklist

### Correctness
- [ ] AI request and response schemas in `server.py` match frontend TypeScript interfaces exactly.
- [ ] Commit-reveal voting in `CommitRevealVoting.tsx` uses Keccak-256 byte packing matching `VotingManager.sol`.
- [ ] Reputation trust score math in `reputation/page.tsx` correctly divides weights to scale 0–100.
- [ ] Required stake is unified to 500 RSLV across all contracts, pages, and components.

### Security
- [ ] All plaintext master keys and JWT secrets removed from git and loaded via environment variables.
- [ ] `POST /auth/wallet` requires EIP-4361 cryptographic signature verification.
- [ ] Hardhat test private keys removed from the client-side JavaScript bundle.
- [ ] Unbounded `eth_getLogs` scans replaced with indexed topic filters.
- [ ] `ArbitrationHub.sol` juror token transfers refactored to pull-payment claims.

### Reliability & Architecture
- [ ] Normalized relational database implemented for cases, parties, evidence, and votes.
- [ ] In-memory synthetic `rndTx()` hashes removed from client audit trails.
- [ ] Evidence uploads persisted to real storage (disk / IPFS) rather than ephemeral client memory.
- [ ] `ArbitrationHub.initiateDispute()` called on-chain during dispute creation wizard.
- [ ] Two-stage escrow settlement implemented in smart contracts to support a real appeal window.

### Testing & Verification
- [ ] Backend test suite implemented with `pytest` covering auth, AI endpoints, and state sync.
- [ ] Playwright E2E test suite covering multi-user dispute filing, voting, and settlement.
- [ ] Vitest component tests added for `CommitRevealVoting` and `EvidenceLocker`.
- [ ] GitHub Actions CI running backend tests, contract tests, and frontend build on every push.

### Deployment & Usability
- [ ] `docker-compose.yml` updated with working blockchain node and health-checked service dependencies.
- [ ] Dependencies in `backend/requirements.txt` updated to include `google-genai` and `httpx`.
- [ ] Responsive styling verified across mobile (375px), tablet (768px), and desktop (1280px).
- [ ] Documentation and README updated to reflect actual implemented features and architecture.
