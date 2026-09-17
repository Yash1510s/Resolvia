# Resolvia 2.0 — Project Report, Progress & Roadmap

**Date:** 8 September 2026 · **Status:** Working full-stack prototype (frontend + backend + local chain) · **Repo:** `github.com/vipu2004/Resolvia_2.0` (commit made, push pending)

---

## 1. What Resolvia Is

Resolvia is a **general-purpose, AI-assisted, blockchain-powered dispute resolution platform** for individuals, institutions and communities.

Core product principles (agreed and enforced in the build):

| Principle | How it's implemented |
|---|---|
| **AI is not a judge** | LLM advisory only, always labeled "non-binding". The human jury verdict is the only binding outcome. AI never has UI authority to finalize a case. |
| **Blockchain is not a judge** | It stores tamper-evident records (evidence hashes, commitments, verdicts, escrow flows). No consensus logic claims "truth". |
| **No MetaMask required** | Passwordless **email OTP + Google OAuth**. Non-wallet users get a **platform-assigned on-chain identity** (custodial v1; ERC-4337 account abstraction planned later). |
| **Blind, bribe-proof jury** | Commit-reveal voting: jurors lock a hash before the deadline, reveal after. Reveal is mathematically verifiable on-chain. |
| **No global chat during disputes** | Only formal channels. Per-case Community Discussion opens **after final closure** and can never change a verdict or act as an appeal. |
| **Juror privacy** | Juror identities hidden in the panel UI (pseudonyms like `Juror #A7F2`). Deliberation (anonymous, during arbitration) is strictly separated from Community Discussion (post-closure). |
| **Honest scope** | Unimplemented features are marked *Prototype / Testnet / Coming Soon* — no over-promising. No "guaranteed court admissibility" claims; post-verdict deliverable is a "Verified Case Record / Legal–Forensic Record / Evidence & Audit Package". |

---

## 2. What We Have Done So Far

### 2.1 Product & design
- **13 reference screens** ingested from the user; every page mapped to a target design.
- Design language locked: **violet/purple primary CTAs & active states**, blue only as a data/status accent, dark sidebar app shell, clean light dashboard content. Theme pass completed and verified (only 3 legitimate blues remain, all intentional status accents).
- Root URL `/` now redirects straight to **`/dashboard`** so the new app shell is the first thing seen; the public landing lives at **`/home`** (hero = sunset-mountain visual, mock case-card stack, 5-step pipeline, CTA band).

### 2.2 Frontend (Next.js 16, React 19, Tailwind v4, ethers v6)
**21 routes, all live and audited for real content depth:**

| Area | Routes |
|---|---|
| Public | `/home`, `/about`, `/how-it-works`, `/login`, `/signup` |
| App shell | `/dashboard`, `/cases`, `/cases/[caseId]`, `/create` (5-step wizard), `/jury`, `/jury/history`, `/jury/[caseId]`, `/case-studies`, `/case-studies/[caseId]`, `/reputation`, `/messages`, `/notifications`, `/profile`, `/settings`, `/resources`, `/proof-verifier`, `/protocol` |

Highlights (all verified implemented, not stubs):
- **Dashboard** — greeting, active cases with live deadline chips, upcoming actions, jury queue, notifications.
- **My Cases** — real tabs: *As Claimant / As Respondent / As Juror / Closed* (no "you are always the claimant" assumption).
- **Case wizard** — 5-step filing flow; every file is **SHA-256 hashed live in the browser** (`lib/crypto.ts`, real WebCrypto, not mock).
- **Jury flows** — invitation cards (case ID/category/effort/deadline only, full case after acceptance), decline-for-busy path that **does not hurt reputation**, blind commit → reveal with live countdown, pseudonym panel.
- **Reputation** — score breakdown, history, juror-availability settings wired to selection logic.
- **Proof Verifier** — paste a hash/CID, verify integrity (the tamper-evidence story made tangible).
- **Case Studies** — three disclosure levels with PII redaction.
- **Settings** — 10 functional branches incl. jury availability.
- **State layer** — `app-context` exposes 11 mutation functions; all verified to genuinely mutate state (not decorative).
- **Hydration-safety pass** — all time-dependent UI (greetings, countdowns, deadline labels, expiry buttons) is now mount-gated / `suppressHydrationWarning`-protected; no more server(UTC) vs browser(IST) mismatches.

### 2.3 Authentication
- **Passwordless email OTP**: `/auth/otp/request` → `/auth/verify` (dev code shown in prototype), 60s resend.
- **Google OAuth**: `/auth/google` (needs `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to light up in the UI).
- Signup = 4-step wizard with role selection (Claimant/Respondent/Juror/Institution/Professional) → account creation + **assigned wallet** in one flow.
- `/auth/me` + token persistence; real logout wired in app shell and home page.

### 2.4 Backend (FastAPI, port 8000)
- `/api/auth/*` — OTP request/verify, Google login, session, profile.
- `/api/wallet/vote/commit` + `/reveal` — **backend signs transactions for assigned-wallet users** (this is how a no-MetaMask user votes on-chain).
- `/api/ai/analyze` — advisory pipeline endpoint.
- Proxy layer from frontend → backend + local RPC (`/api/backend/[path]`, `/api/rpc`).

### 2.5 Blockchain (Hardhat, 5 contracts)
| Contract | Role |
|---|---|
| `ResolviaToken` (RSLV) | Reward/stake token; mint `onlyOwner`; juror rewards paid on settlement |
| `EvidenceRegistry` | SHA-256 hashes + IPFS CIDs per case — the tamper-evidence anchor |
| `CaseRegistry` | Case lifecycle states, party links |
| `VotingManager` | Commit-reveal juror voting, quorum ≥3 of panel 5 |
| `ArbitrationHub` | Escrow stake lock (500 RSLV), `appointJurorPanel` (admin), settlement (winner payout + juror rewards) |

**Verification:**
- **17/17 Hardhat tests pass** (commit-reveal + escrow settlement suites).
- **Live E2E #1** (`e2e-escrow.js`) — full case lifecycle on a running node, all checks passed.
- **Live E2E #2** (`e2e-assigned-wallet.py`) — a non-wallet user (assigned wallet) commits + reveals a vote **on-chain, signed by the backend**, receives reward; claimant payout verified.
- Both re-passed on a fresh chain after the last environment reset.

### 2.6 Quality & audits (the "deep check" round)
- **CSS audit** — automated class-level audit of served CSS: **825/825 class tokens present**, 0 missing; dynamic classNames all full literals.
- **Content-depth audit** — profile (6 tabs), settings (10 branches), jury (5 sub-views), messages, reputation read file-by-file: genuine implementations, no glance-level files.
- **Theme audit** — every blue/violet usage enumerated; normalized to the reference palette.
- **Type safety** — `tsc --noEmit` clean (0 errors).
- **Route audit** — 21/21 routes return 200 with expected content markers.
- **Hydration audit** — all `Date.now()`/timezone-dependent render sites found and fixed.

### 2.7 Infrastructure & environment
- Dev stack: Next dev server (0.0.0.0:3000, tracked process), FastAPI (8000), Hardhat local node (8545).
- `allowedDevOrigins` added so the sandbox preview host can load Next dev resources (HMR etc.) — this was silently breaking the preview before.
- Recovery recipe documented for the sandbox's dependency-wiping behaviour (npm/pip reinstalls + redeploy + E2E re-run).
- Git: single clean commit on `main` (94 files), remote set, `.gitignore` covering `.env`, secrets, `blockchain/deployments/`, auth DB.

---

## 3. Current State (snapshot, 8 Sep 2026)

| Layer | Status |
|---|---|
| Frontend :3000 | ✅ Running (dev, all routes 200, log clean) |
| Backend :8000 | ✅ Running (health OK, OTP/Google/vote endpoints live) |
| Local chain :8545 | ✅ Running (5 contracts deployed, E2E green) |
| Tests | ✅ 17/17 unit + 2 live E2E flows |
| Static analysis | ✅ tsc 0, CSS audit 825/825 |
| GitHub push | ⏸ Committed locally; **waiting on your PAT** |
| Google OAuth in UI | ⏸ Code ready; **waiting on client ID** |
| LLM Advisory | ⏸ Pipeline + endpoint ready; **provider decision + key pending** |

---

## 4. What's Left — Prioritised

### P0 — Unblock & ship the demo (this week)
1. **Push to GitHub** — you share a PAT (or run `git push` yourself from the repo), and the repo is live at `vipu2004/Resolvia_2.0`.
2. **Google OAuth client ID** — set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (frontend) + `GOOGLE_CLIENT_ID` (backend); the Google button auto-enables.
3. **LLM Advisory provider decision** — pick one:
   - *External API* (OpenAI/Groq/Gemini) — fastest, needs an API key; **or**
   - *Local Ollama* — private, no key, slower.
   Then wire `POST /api/ai/analyze` to it so the "AI Advisory" cards in the UI are generated, not canned.
4. **Pin the deployment manifest** — `blockchain/deployments/local.json` is gitignored (local addresses change per redeploy); add a `deployments/README` + a stable Sepolia manifest later.

### P1 — Make it a credible testnet product (2–4 weeks)
5. **Sepolia deployment + live addresses** — deploy the 5 contracts to Sepolia, fund the admin, and point frontend/backend at the real testnet RPC so "Sepolia • Block 6,284,190" on the landing is true.
6. **Real IPFS pinning** — replace CIDs in the wizard with actual `ipfs add` (Pinata or self-hosted) so the Proof Verifier verifies real content.
7. **BSA 2023 §63 certificate alignment** — LegalExportModal's certificate template must match the new §63 format (two signatories, mandatory hash, Schedule Part A/B, certificate per admission instance). The old §65B format is no longer valid for fresh tendering.
8. **Persistent database** — swap in-memory auth store for Postgres/SQLite (currently file-based) so accounts survive restarts.
9. **CI pipeline** — GitHub Actions: `tsc`, Hardhat tests, E2E smoke on a throwaway node, backend tests.

### P2 — Trust & scale (1–2 months)
10. **ERC-4337 account abstraction** — replace custodial assigned-wallet signing with user-owned smart accounts (keystores via passkey/Google), keeping the no-MetaMask promise without backend custody.
11. **Juror selection engine** — real scoring from reputation + availability settings (currently simplified), with the "no majority-vote = good juror" rule enforced in the algorithm.
12. **Security pass** — rate limiting on OTP, signed JWT refresh, on-chain role checks audit, prompt-injection scan hardening on all AI payloads.
13. **Mobile pass** — responsive polish on jury flows + wizard (currently desktop-first).

### P3 — Later (explicitly last, per your instruction)
14. **Fine-tuned legal model** — after the LLM advisory pipeline has real logged usage, fine-tune on the corpus of cases/advisories. This is deliberately the final milestone, not a v1 dependency.
15. **Production mainnet + compliance counsel review** — only after P2 is stable.

---

## 5. Roadmap (phases)

| Phase | Goal | Exit criteria |
|---|---|---|
| **Phase 1 — Working prototype (DONE)** | Full product loop on local chain | ✅ Filing → hashing → jury → verdict → escrow settlement → legal dossier, all working; 17 tests + 2 E2E green |
| **Phase 2 — Credible demo** | Real testnet + real AI | Sepolia deploy live; AI advisory generated by a real LLM; Google login working; repo public |
| **Phase 3 — Trustworthy** | Custody-free identity + real evidence | ERC-4337 wallets; real IPFS; §63-compliant export; CI green on every push |
| **Phase 4 — Production** | Mainnet + scale | Mainnet deploy, compliance review, load/pen-test, fine-tuned advisory model |

---

## 6. Real Build — what's REAL now vs still Prototype (17 Sep)

**REAL (implemented + verified, no simulation):**
- On-chain evidence anchoring: wizard signs a genuine `registerEvidence` tx (assigned wallet for logged-in users, demo account for guests) → real txHash + block in the case.
- On-chain verification: public chain read (`eth_getLogs`) confirms/ denies an anchor; content re-hash + genuine 1-bit tamper demo in the Proof Verifier & Evidence Locker.
- Per-user backend persistence: workspace state mirrors to SQLite per account (login hydrates, changes sync back).
- Email OTP: real SMTP delivery (persist-after-send); dev-only fallback.
- Sepolia deploy script + CI (tsc, 17 Vitest units, backend API-surface, contracts) + `env.example`.

**STILL PROTOTYPE — honestly labeled, unblocks in this order:**
1. **You:** GitHub PAT (or push) → CI goes live.
2. **You:** Google OAuth client ID (redirect `https://<domain>/login`).
3. **You:** LLM provider + key (or Ollama) → advisory engine becomes LLM-backed (currently deterministic rules, labeled).
4. **You:** funded Sepolia key → run `npx hardhat run scripts/deploy-sepolia.js --network sepolia`.
5. **You:** SMTP credentials → live OTP email.
6. **You:** IPFS/Pinata keys → real pinning (currently CID-only mode).

**Open (mine, on approval):** BSA §63 two-signatory certificate template rewrite in LegalExportModal.

---

## Appendix — Key files
- Frontend: `frontend/app/` (routes), `frontend/app/lib/` (context, crypto, mock data), `frontend/app/components/`
- Backend: `backend/server.py`, `backend/auth.py`
- Chain: `blockchain/contracts/` (5 Solidity contracts), `blockchain/tests/` (2 suites), `blockchain/scripts/` (deploy + 2 E2E)
- Audits: `/home/user/audit/css_audit.py`, `/home/user/audit/audit_pages.py`
- Reference designs: `/home/user/uploads/` (13 PNGs)
