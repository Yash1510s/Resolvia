# Resolvia 2.0 — Known Limitations & Viva Voce Defense Guide

**Purpose:** Comprehensive architectural disclosure, technical trade-offs, and rigorous academic defense for the B.E. Final-Year Project Examination.

---

## Part 1: Honest Architectural & Technical Limitations

In an engineering evaluation, acknowledging system boundaries and design trade-offs demonstrates depth of understanding and scientific maturity.

### 1. AI & Machine Learning Limitations
- **Synthetic Distribution vs Real-World Dispute Complexity:**
  - *Limitation:* The XGBoost model was trained on 2,000 synthetic dispute templates across 6 domains (Freelance, Workplace, Academic, Property, Community, Personal). While achieving 94% accuracy on its test partition, this reflects template pattern fitting rather than generalized human jurisprudence.
  - *Mitigation:* The AI output is explicitly defined as **non-binding advisory**. The smart contracts never permit AI predictions to finalize a case, execute fund transfers, or overrule human jury votes.
- **LLM Hallucinations & Non-Determinism:**
  - *Limitation:* Large Language Models (Gemini 2.0 Flash) are generative and probabilistic. They can misinterpret ambiguous legal jargon or cite non-existent clauses if given contradictory testimony.
  - *Mitigation:* LLM prompts include explicit system guardrails against prompt injection (OWASP LLM01) and generate structured JSON schemas with confidence scores and evidence citations.

### 2. Smart Contract & Blockchain Limitations
- **L1 Gas Economics for Small Claims:**
  - *Limitation:* On Ethereum Mainnet, running a 5-juror commit-reveal cycle (5 commits + 5 reveals + stake deposit + settlement) would cost $40–$150 in gas fees, making sub-$500 claims economically unviable.
  - *Roadmap:* Designed for EVM Layer-2 rollup deployment (e.g. Arbitrum, Optimism, Polygon zkEVM) or app-chains where total dispute gas overhead is <$0.05.
- **Juror Liveness & Voter Apathy:**
  - *Limitation:* If chosen jurors ignore their commitment obligations, dispute resolution could stall.
  - *Mitigation:* Added a permissionless timeout fallback: if fewer than the threshold reveal after the 1-day grace period, the smart contract allows any caller to trigger an automatic 50/50 refund, preventing indefinite capital lockup.

### 3. Identity & Custodial Architecture
- **Custodial Key Management (v1 Prototype):**
  - *Limitation:* To eliminate the Web3 barrier for non-crypto users (no MetaMask required), the v1 platform backend securely generates and signs on behalf of passwordless email users. This introduces a custodial trust vector at the backend level.
  - *Roadmap:* Migration to **ERC-4337 Account Abstraction** using WebAuthn / Passkeys, where users sign transactions using their device's Secure Enclave directly without server custody.

### 4. Evidence Storage & IPFS Persistence
- **Decentralized Pinning vs Long-Term Availability:**
  - *Limitation:* IPFS provides content-addressing (SHA-256 / CIDv1) but does not guarantee permanent persistence unless actively pinned by a gateway provider (Pinata) or paid storage network (Filecoin/Arweave).
  - *Mitigation:* The blockchain records the immutable NIST SHA-256 digest of every piece of evidence in `EvidenceRegistry.sol`. Even if a remote IPFS node goes offline, any local copy of the evidence can be verified against the on-chain hash.

---

## Part 2: Viva Voce Defense Guide (Top 15 Examiner Questions & Answers)

### Q1: "Why use Blockchain? Wouldn't a centralized PostgreSQL database with AWS S3 be faster and cheaper?"
> **Answer:** "A centralized database requires complete trust in the platform operator. In high-stakes disputes, a rogue database administrator or court clerk could silently alter evidence timestamps, modify juror ballots, or manipulate escrow funds. 
> 
> Resolvia uses Ethereum smart contracts specifically for **non-repudiation and trustless escrow**:
> 1. Anti-spam deposits (500 RSLV) are locked in an immutable escrow contract (`ArbitrationHub.sol`) that programmatically disburses funds solely based on mathematical tallying, without human or admin discretion.
> 2. Evidence digests are locked on `EvidenceRegistry.sol` before the deliberation begins, creating mathematically tamper-evident proof that evidence was not modified post-facto.
> Centralized databases cannot provide cryptographic mathematical guarantees against operator fraud."

### Q2: "How does Commit-Reveal voting prevent juror bribery and cartel formation?"
> **Answer:** "In standard on-chain voting, transactions are public in the mempool. If Juror 1 votes 'Claimant', Juror 2 can see that vote before submitting their own, enabling peer pressure or bribers to verify votes before paying.
> 
> In Resolvia's `VotingManager.sol`, voting is split into two phases:
> 1. **Commit Phase:** Jurors hash their choice with a secret 32-byte random salt:
>    $$\text{commitment} = \text{keccak256}(\text{abi.encodePacked}(\text{voteChoice}, \text{salt}, \text{caseId}, \text{msg.sender}))$$
>    Only this hash is recorded on-chain. Nobody—not even the platform admin—can decode the vote.
> 2. **Reveal Phase:** After the commit deadline closes, jurors submit their plaintext choice and salt. The contract verifies that the hash matches.
> Binding the juror's `msg.sender` and `caseId` inside the hash also prevents front-running, vote copying, and replay attacks across different cases."

### Q3: "What if a juror reveals their vote early to signal to others?"
> **Answer:** "In our Phase 1 security audit, we identified this exact vulnerability and patched it in `VotingManager.sol`. The `revealVote()` function enforces a strict check:
> ```solidity
> require(block.timestamp > caseRegistry.getVotingDeadline(caseId), 'Commit window still open');
> ```
> Early reveals are reverted by the EVM opcode. No juror can reveal their vote while any other juror is still capable of committing."

### Q4: "Is the AI's decision legally binding? Can an AI act as an arbitrator under Indian law?"
> **Answer:** "No. Under the **Arbitration and Conciliation Act, 1996**, an arbitrator must be a natural person capable of entering into contracts and applying independent judgment. An AI model has no legal personhood.
> 
> In Resolvia:
> 1. The AI engine is strictly an **Advisory Diagnostic Engine**. Every API response and UI component is labeled with `bindingStatus: 'NON_BINDING_ADVISORY'`.
> 2. The smart contracts have zero dependency on the AI output to settle cases. The only binding outcome is the majority vote of the 5 human jurors.
> 3. For evidence compliance, evidence hashes are certified under **Section 63 of the Bharatiya Sakshya Adhiniyam, 2023 (BSA)** for electronic records admissibility."

### Q5: "How does the evidence export comply with Section 63 of Bharatiya Sakshya Adhiniyam, 2023 (BSA)?"
> **Answer:** "BSA 2023 §63 replaced Section 65B of the Indian Evidence Act for the admissibility of electronic records. Resolvia complies by generating a cryptographic certificate package that includes:
> 1. Identifying the electronic record and describing the manner in which it was produced.
> 2. Specifying computer system particulars and custody timeline.
> 3. Printing the SHA-256 cryptographic hash of the evidence file alongside the transaction hash from `EvidenceRegistry.sol`.
> 4. Requiring dual certification: Part A (custody by user/party) and Part B (technological verification by system administrator)."

### Q6: "Why did you use XGBoost alongside an LLM? Isn't an LLM enough?"
> **Answer:** "LLMs are generative and can suffer from non-deterministic reasoning and latency (2–5 seconds per inference). 
> 
> We implemented a **Dual-Engine Architecture**:
> 1. **Fast Structural Assessment (XGBoost):** Evaluates quantitative metadata (claim amount, evidence bundle completeness, party responsiveness, sentiment variance) in <20 milliseconds with complete explainability via SHAP/feature importance.
> 2. **Deep Semantic Analysis (Gemini 2.0 Flash):** Evaluates unstructured narrative text, checks contradictions, and identifies relevant legal provisions.
> This dual approach provides both instant numerical benchmarking and deep contextual analysis."

### Q7: "How do you defend against Prompt Injection attacks on your LLM?"
> **Answer:** "In `analysis_pipeline.py`, we implemented a defense-in-depth model aligned with **OWASP LLM01 (Prompt Injection)**:
> 1. **Adversarial Regex Scanning:** User statements are scanned against patterns such as `ignore previous instructions`, `system prompt override`, `jailbreak`, `DAN`, and roleplay hijacking.
> 2. **Token Sanitization:** Control characters and zero-width characters are stripped.
> 3. **Prompt Fencing:** User inputs are enclosed inside rigid XML tags (`<claimant_statement>...</claimant_statement>`) with explicit instructions to the LLM to treat the content inside tags solely as untrusted factual claims."

### Q8: "What prevents a Sybil attack where one user creates multiple accounts to dominate the jury?"
> **Answer:** "We employ multiple economic and identity defenses:
> 1. **Anti-Spam Staking:** Both claimant and respondent must deposit 500 RSLV to activate a dispute.
> 2. **Pseudo-Random Juror Selection:** Jurors are not self-assigned; they are appointed by the Hub from an active pool of staked jurors with verified reputation.
> 3. **Juror Anonymity:** Jurors do not know who else is on their panel until after all votes are revealed.
> 4. **Economic Penalties:** Jurors who fail to reveal or vote maliciously risk losing their reputation score and eligibility for future reward distributions."

### Q9: "What happens if a case encounters a 2-2-1 tie or all jurors abstain?"
> **Answer:** "In `ArbitrationHub.sol`:
> 1. If 2 jurors vote Claimant, 2 vote Respondent, and 1 votes Split, the contract identifies that no side achieved a clear majority.
> 2. It automatically sets the outcome to `SPLIT_SETTLEMENT`, triggering a 50/50 refund of the 1,000 RSLV escrow back to both parties (500 to Claimant, 500 to Respondent).
> 3. If zero jurors reveal after the voting deadline plus 1-day grace period, a permissionless timeout function allows either party to reclaim their initial stake. Capital cannot be permanently frozen."

### Q10: "How do you prevent Smart Contract Reentrancy in fund distribution?"
> **Answer:** "All financial settlement functions in `ArbitrationHub.sol` adhere to the **Checks-Effects-Interactions** pattern and are protected by OpenZeppelin's `ReentrancyGuard` (`nonReentrant` modifier).
> In `settleCase()`:
> 1. Case state is first updated to `Settled` on `CaseRegistry`.
> 2. The winning outcome is recorded.
> 3. Token transfers via `resolviaToken.transfer()` are executed as the final step. Even if a recipient were a smart contract attempting to re-enter, the state check prevents re-execution."

### Q11: "Why use OpenZeppelin contracts instead of custom token logic?"
> **Answer:** "OpenZeppelin's ERC20 implementation has been audited by dozens of world-class security firms and battle-tested on mainnet across billions of dollars in TVL. 
> Custom ERC20 implementations frequently introduce subtle flaws—such as unconstrained integer overflows, improper approval front-running bugs, or missing event emissions. We extended standard `ERC20` and `Ownable`, adding a hard cap of 100,000,000 RSLV to prevent inflation attacks."

### Q12: "How does the backend authenticate users securely without passwords?"
> **Answer:** "Resolvia uses **Passwordless Email OTP and Google OAuth**:
> 1. When an email is entered, a cryptographically secure 6-digit OTP is generated (`secrets.randbelow`) and hashed with SHA-256 before storage in SQLite with a 10-minute expiry.
> 2. To prevent brute force, 3 consecutive failed OTP attempts immediately locks the account for 15 minutes.
> 3. Upon successful verification, the server issues a short-lived HMAC-SHA256 JWT access token (1 hour) and a high-entropy refresh token (7 days).
> 4. Refresh tokens are rotated on every refresh request to prevent replay attacks."

### Q13: "What prevents Denial of Service (DoS) attacks on your FastAPI backend?"
> **Answer:** "We integrated `SlowAPI` (based on `limits`) using the in-memory token bucket algorithm:
> 1. Sensitive endpoints (`/api/ai/analyze`, `/api/ipfs/upload`) are rate-limited to 10 requests per minute per IP.
> 2. File uploads are capped at 25MB with strict file extension and MIME type whitelisting.
> 3. Unauthenticated requests are rejected before expensive LLM inference or IPFS pinning can occur."

### Q14: "Why Next.js 16 with Turbopack instead of a simple React SPA?"
> **Answer:** "Next.js 16 provides:
> 1. **Server-Side API Proxies:** The frontend proxies JSON-RPC calls (`/api/rpc`) and backend requests (`/api/backend`), avoiding browser CORS restrictions and preventing private backend IPs from exposure.
> 2. **Zero-FOUC & Fast Client Hydration:** Pre-renders static legal templates and UI skeletons for instantaneous initial load.
> 3. **Type-Safe Full-Stack Interfaces:** Shared TypeScript interfaces across frontend components, commitment math, and deployment manifests ensure compile-time type safety."

### Q15: "What are the major directions for future work?"
> **Answer:** "Future development focuses on three areas:
> 1. **ERC-4337 Account Abstraction:** Replacing custodial backend signing with client-side WebAuthn passkeys (fingerprint/FaceID) to achieve zero platform custody without MetaMask.
> 2. **ZK-Proofs for Private Evidence:** Utilizing zero-knowledge proofs (zk-SNARKs) so jurors can verify that financial or identity requirements are met without revealing the underlying sensitive documents on IPFS.
> 3. **Layer-2 Rollup Deployment:** Migrating contract deployment to Arbitrum One or Base for sub-cent transaction fees and 1-second finality."
