# Resolvia 2.0 — Full Project Audit (Errors + Suggestions)
**Date:** 17 Sep 2026 · **Scope:** complete file structure, frontend logic (~13.5k lines, 56 files), backend (FastAPI), AI engine, 5 Solidity contracts, E2E.

---

## ✅ FIX STATUS — 17 Sep pass (DONE & verified: tsc 0, 18/18 routes 200, SSR checks green)

| # | Finding | Status |
|---|---------|--------|
| P0-1 | Expired mock deadlines | ✅ **FIXED** — demo time engine (dates relative to load) + `rebaseline()` on saved-state load. SSR verified: case-084 deadline = tomorrow; invitation button = "Accept & Review Case" |
| P0-2 | Fake evidence hashing | ✅ **FIXED** — wizard now hashes real file bytes (`computeSha256Bytes`, WebCrypto) |
| P0-3 | Persona entry ≠ session | ✅ **FIXED** — `?persona=` now calls `login()`; top bar shows "Demo session · Claimant" chip; Sign-in button hidden in demo |
| P0-4 | Token wiped on transient error | ✅ **FIXED** — only 401/403 wipes the token; network hiccups keep the session |
| P0-5 | Broken deep links | ✅ **FIXED** — all notification links now `?section=voting/ai/verdict/appeal` |
| P0-6 | Availability not wired | ✅ **FIXED** — `inPool/state/maxConcurrent` gate invitations (card pause-notice + jury-page banner) |
| P0-7 | Fake "MATCH CONFIRMED" + no deadline guard | ✅ **FIXED** — real re-compute & compare before reveal (mismatch blocks), commit closes at deadline, reveal has +1d grace |
| P1-1 | Zero persistence | ✅ **FIXED** — debounced localStorage snapshot + "Reset demo data" in Settings |
| P1-2 | Step 2 never active | ✅ **FIXED** — step 2 activates on real review action |
| P1-3 | 3 stake numbers | ✅ **FIXED** — 500 everywhere (balance 600 start, −500 on file, audit text) |
| P1-4 | Appeal window = now | ✅ **FIXED** — defaults to +48h |
| P1-5 | No vote-state guards | ✅ **FIXED** — commit only from PENDING_COMMIT; reveal only from COMMITTED (mirrors contract) |
| P1-6 | Logo → public /home | ✅ **FIXED** — logo → /dashboard |
| P1-7 | Fake Ctrl K hint | ✅ **FIXED** — real Ctrl/Cmd+K focus handler |
| P1-8 | Dead Privacy/Terms | ✅ **FIXED** — real `/privacy` + `/terms` pages with product-accurate content |
| P1-9 | Misleading AI naming | ✅ **FIXED** — "Resolvia Advisory Engine v1 (deterministic rules — LLM advisory pending)" everywhere |
| P1-10 | Health always "READY" | ✅ **FIXED** — reflects pipeline availability |
| P1-11 | case-102 deliberation w/o jurors | ✅ **FIXED** — removed |
| P1-12 | "Juror Carol" identity | ✅ **FIXED** — juror-01 = "You (anonymous)", PENDING_COMMIT (full commit→reveal→verdict demo works) |
| P2-5/6/7/8/9/10 | counter / dangling history / "Today" label / displayRole / vote bias / blue ring | ✅ **FIXED** (all six) |

## 🚀 REAL BUILD STATUS — 17 Sep (demo → real, Request #10)

Direction given: *"demo gyaa khatam — proper bananaa hai."* Simulations replaced by real implementations wherever technically possible in-sandbox. Only genuinely-pending items remain labeled Prototype/Testnet.

| # | Item | Status | Proof |
|---|------|--------|-------|
| R1 | **Real on-chain evidence anchoring** | ✅ **DONE** | Wizard submit signs a real `registerEvidence` tx (user's assigned wallet via backend, or demo account for guests). E2E: `POST /api/wallet/evidence/anchor` → `ANCHORED` txHash + block; hash + block visible in case audit trail & success screen |
| R2 | **Real Proof Verifier** | ✅ **DONE** | Public `GET /api/evidence/verify` reads the chain (`eth_getLogs` on EvidenceRegistry): real hash → `ANCHORED` + tx/block; unknown hash → `NOT_FOUND`. Content re-hash from original bytes (session cache) + genuine 1-bit tamper demo (hash visibly breaks) |
| R3 | **Real per-user persistence** | ✅ **DONE** | `GET/PUT /api/state` (per-user SQLite). Logged-in accounts hydrate from backend on login, mirror every change back (debounced). Round-trip verified: 404→PUT→GET→401 |
| R4 | **Real deploy path** | ✅ **DONE** | `blockchain/scripts/deploy-sepolia.js` — env-key Sepolia deploy, chainId guard, wiring readback sanity, `sepolia.json` manifest + Etherscan links. (Runs once user provides a funded Sepolia key) |
| R5 | **CI + unit tests** | ✅ **DONE** | `.github/workflows/ci.yml` (frontend tsc+vitest+build, backend API-surface, contracts hardhat test). **17/17 Vitest units passing**: real WebCrypto SHA-256 vs Node crypto (NIST vector, 1-bit tamper), commit-reveal packing byte-identity + replay-proof binding |
| R6 | **Real email OTP** | ✅ **DONE** | SMTP delivery (any relay), persist-after-send, `devCode` only in dev, 503 in prod without SMTP. `env.example` documents the full config surface |

**Honesty labels now accurate:** demo-dataset evidence is shown as "DEMO (NOT ANCHORED)"; locally-filed cases are "ON-CHAIN ANCHORED" with real tx/block; on-chain copy says "local testnet (Sepolia in production)".

**Still genuinely pending (need user inputs — see PROJECT_REPORT §Next):**
- LLM provider + API key → advisory engine currently deterministic rules (labeled as such)
- Google OAuth client IDs (backend endpoint ready)
- Sepolia private key + gas → run `deploy-sepolia.js`
- SMTP credentials → real OTP email
- IPFS/Pinata keys → real pinning (currently CID-only mode)
- GitHub PAT → push repo + enable CI

**Infra note:** sandbox preview host changed to `3000-ig56cyynhn77r9e0lehhb.e2b.app` — added to `allowedDevOrigins` (both hosts now allowed). If the sandbox resets again, the new host must be re-added (same one-liner).

---

## 0. Verdict in one line

Architecture aur core infra (contracts, E2E, auth backend, proxies, theming) **solid** hai — lekin **7 functional bugs** hain jo user ko daily feel ho rahe hain (dead buttons, "logged-out" feel, fake integrity hashing, expired demo data), aur **12 consistency/logic gaps** jo ek senior reviewer flag karega.

---

## 1. P0 — Functional bugs (user-facing breakage)

### P0-1 · All mock deadlines are in the past → "expired world" demo
**Files:** `app/lib/mockData.ts`, `app/components/JuryInvitationCard.tsx`
- Aaj **17 Sep 2026** hai. Mock dates sab hardcoded past me:
  - `case-084` (flagship demo) `votingDeadline` = **7 Sep** (10 din pehle)
  - Jury invitation `inv-102` `expiresAt` = **8 Sep** → card me **"Accept & Review Case" button DISABLED ("Expired")** hai
  - `case-071` appeal window 9 Sep closed; `case-092/102/0987` response deadlines passed
- **Impact:** pehli baar kholne par poora product "frozen/expired" dikhta hai; juror invitation demo complete hi nahi ho sakta (button dead). Yahi shayad tumhe "button nahi chal raha" dikh raha hai.
- **Fix direction:** mock dates **relative to load-time** generate karo (`now + 2d` etc.), ek jagah se; ya "Reset Demo Data" button.

### P0-2 · Evidence "SHA-256 hashing" is fake (core promise broken)
**Files:** `app/(app)/create/page.tsx:172`, `app/lib/app-context.tsx` (addEvidence)
- Wizard real file upload pe bhi hash karta hai: `SHA-256(fileName + ":" + sizeKb)` — **file ke bytes nahi**. Do alag files same name+size → same "fingerprint".
- IPFS CID bhi fake hash se derive (`bafybei<44 hex>`) — valid CID format nahi hai.
- Landing/wizard copy kehta hai "SHA-256 hashed live in your browser… tamper-proof" — abhi yeh claim galat hai.
- **Fix:** `file.arrayBuffer()` → real byte hash (WebCrypto already in `lib/crypto.ts`).

### P0-3 · "Enter as Claimant/Juror" never creates a session → header still says "Not signed in"
**Files:** `app/home/page.tsx` (enterAs), `app/(app)/dashboard/page.tsx:52-54`, `app/lib/app-context.tsx`
- Persona entry sirf `setActiveRole()` call karta hai. App-context ka `login()`/`isLoggedIn` **kabhi call hi nahi hota (dead code)**.
- **Impact:** "Enter as Claimant" click → dashboard par top bar me phir bhi **"Guest User / Not signed in / Sign in button"**. User confused: "maine toh enter kiya".
- **Fix:** persona entry par `login(role)` + top bar me "Demo · Claimant" identity dikhana (single source of truth: `authUser ? real : demo persona`).

### P0-4 · Token wiped on ANY transient failure → random logouts
**File:** `app/lib/auth-context.tsx:56-61`
- `auth/me` fetch ka `.catch(() => localStorage.removeItem(TOKEN_KEY))` — backend restart / network hiccup / sandbox reset par **ek hi transient error user ka session permanently maan leta hai**.
- Yahi "home button dabaya → logged out" experience hai (hard reload pe re-check hota hai).
- **Fix:** transient network errors par token retain karo (sirf 401 par wipe), + retry.

### P0-5 · Notification deep links broken
**Files:** `app/lib/app-context.tsx` (notification `link` values), `app/(app)/cases/[caseId]/page.tsx:87`
- Links: `/cases/case-084?voting`, `?ai`, `?verdict`, `?appeal` — lekin page sirf **`?section=`** read karta hai. `?voting` silently ignore → default section khulta hai, intended nahi.
- **Fix:** central `caseLink(id, section)` helper; saare links `?section=voting` format.

### P0-6 · Jury availability NOT wired to selection (binding requirement)
**Files:** `app/(app)/settings/page.tsx` (sets), `app/lib/app-context.tsx` (never read in logic)
- Tumhari own requirement thi: *Settings me jury availability honi chahiye, wired to selection logic*. Abhi `inPool / state / maxConcurrent` store hota hai (persist bhi nahi hota) par **invitation/selection logic ise ignore karti hai** — "Join Jury Pool" off karne par kuch nahi hota.
- **Fix:** invitation generation par gate: `inPool && state==='AVAILABLE' && activeJuryCases < maxConcurrent`; UI me "why you weren't invited" hint.

### P0-7 · Voting UI: no deadline guard + "MATCH CONFIRMED" is faked
**Files:** `app/components/CommitRevealVoting.tsx`
- Reveal panel me **"MATCH CONFIRMED"** unconditional render hota hai — actual re-computation/comparison **nahi** hoti (crypto lib available hai, use nahi hoti).
- Deadline ke **baad bhi** commit/reveal possible (case-084 me countdown "Deadline passed" dikha ke bhi voting chalne deti hai).
- Contrast: **contract me yeh rules asli hain** (`require(block.timestamp <= deadline)`, `require(computedHash == commitment)`) — demo UI protocol se alag behave karta hai.
- **Fix:** reveal par real verify (recompute + compare), deadline ke baad disable + "window closed" state.

---

## 2. P1 — Logic / consistency bugs

| # | Bug | Where | Detail |
|---|-----|-------|--------|
| P1-1 | **Zero state persistence** | `app-context.tsx` | Cases, votes, balance, invitations sab in-memory. `/home` par jaake wapas aana ya reload = **sab kuch reset** (AppProvider unmount). Mid-vote user ka kaam udd jaata hai. |
| P1-2 | **Jury step indicator never shows step 2** | `jury/[caseId]/page.tsx` | `step = … ? 1 : … ? 3 : 3` — "Analyze & Deliberate" kabhi active nahi hota. |
| P1-3 | **Three different stake numbers** | create wizard / app-context / contracts | Balance se **10 RSLV** cut, audit trail me **250**, mock cases + contract me **500**. Ek hi story chahiye. |
| P1-4 | **`fileAppeal` sets window close = now** | `app-context.tsx` | Pehle window unset thi to filing ke baad window turant "closed" dikhti hai. |
| P1-5 | **No state guards in vote mutations** | `app-context.tsx` | `revealVote` commit check nahi karti; `commitVote` re-commit overwrite deta hai (contract guards karta hai, app nahi). |
| P1-6 | **Sidebar logo → public `/home`** | `AppShell.tsx` | App ke andar "home" = marketing page; logged-in user ke liye `/dashboard` hona chahiye (P1-1 ke saath = work loss). |
| P1-7 | **Fake "Ctrl K" hint** | `AppShell.tsx` search | Kbd hint hai, Ctrl+K handler nahi — sirf Enter chalta hai. |
| P1-8 | **Dead footer links** | `AppShell.tsx` footer | "Privacy" / "Terms" `cursor-default` spans — link dikhate hain, kuch nahi karte. |
| P1-9 | **AI engine is keyword-heuristic, labeled "Transformer & Hybrid Verifier"** | `ai-engine/analysis_pipeline.py` | Timeline static strings; contradiction = `"reentrancy" in text && "patch" in text`; recommendation = f(evidence count). `modelIdentifier` aspirational hai. (LLM provider decision pending se known hai, but naming misleading.) |
| P1-10 | **`/api/health` reports `aiService: READY` always** | `backend/server.py:90` | Pipeline import fail ho ya na ho — status same. |
| P1-11 | **case-102: deliberation posts exist, zero jurors** | `mockData.ts` | Jury deliberation panel selection se pehle — protocol-logic contradiction. |
| P1-12 | **Identity inconsistency in case-084** | jury workspace | User juror-01 se map hota hai jo **"Juror Carol (Smart Contract Auditor)"** (named) hai — saath hi anonymous pseudonym bhi dikhaya jaata hai. |

---

## 3. P2 — Polish, security, scale

| # | Item | Where |
|---|------|-------|
| P2-1 | Hardhat test private keys **frontend bundle me embedded** (local-safe, mainnet me criminal) | `lib/chain.ts` |
| P2-2 | CORS `allow_origins=["*"]` + `allow_credentials=True` (invalid combo; prod me origin list) | `backend/server.py` |
| P2-3 | OTP attempts off-by-one (4 failures allowed, 3 ka claim) + lockout message galat code error deta hai | `backend/auth.py:otp_verify` |
| P2-4 | JWT 7d, no refresh/revocation; auth DB no backup story | `backend/auth.py` |
| P2-5 | New case numbers random 1000–9999 (collision ~1/9000) | `create/page.tsx` |
| P2-6 | `jurorHistory` references `case-220/188` jo case list me nahi hain (data dangling) | `mockData.ts` |
| P2-7 | Dashboard "Jury invitation expires" expired invite ke liye bhi **"Today"** label | `dashboard/page.tsx` |
| P2-8 | `displayRole` mapping — logged-in user bina profile prefs ke hamesha "Student" dikhta hai | `AppShell.tsx` |
| P2-9 | `simulateOtherJurors` vote distribution claimant-biased (55/30/15) — demo realism | `app-context.tsx` |
| P2-10 | Theme straggler: salt input ka `focus:border-blue-500` blue ring | `CommitRevealVoting.tsx` |
| P2-11 | Icon-only buttons bina aria-label (faucet "+"), RSLV balance mobile pe hidden | `AppShell.tsx` |
| P2-12 | **Zero frontend tests** (0 component/E2E) — sirf chain tests hain | — |
| P2-13 | Date/currency formatting scattered (`en-IN`, `en-GB` mixed) — no single formatter util | across pages |

---

## 4. What is genuinely solid (no change needed)

- **Contracts:** deadline require, commitment-hash verify, quorum, settlement — E2E se proved (17/17 tests + 2 live E2E green on fresh chain).
- **Backend auth crypto:** OTP codes stored as SHA-256 hashes, 60s cooldown, AES-256-GCM wallet encryption, Google `email_verified` check — dev-grade se better.
- **Proxy architecture:** `/api/backend/*`, `/api/rpc`, `/api/deployments` — clean, browser-localhost-safe design.
- **Hydration safety, theme normalization (violet), CSS completeness (825/825)** — last audit me verified.
- **Product framing:** advisory-only AI, hidden juror identities, decline-for-busy reputation rule — consistently followed in UI copy.

---

## 5. Senior-level suggestions (room for improvement)

**Architecture**
1. **Demo Time Engine** — ek `demoNow()` + relative dates: ek hi fix se poora "expired world" class (P0-1, P1-7, P2-7) theek.
2. **Persistence layer** — app state ko localStorage me snapshot karo (identity-keyed), + "Reset demo data" button (P1-1). Backend sync Phase-3 me.
3. **Single identity model** — `authUser ? RealUser : DemoPersona`, top bar hamesha sahi identity dikhe (P0-3, P2-8).
4. **Real on-chain anchoring from the wizard** — infra already hai (`/api/rpc` + EvidenceRegistry). Wizard ka "anchor" step actually `EvidenceRegistry.addEvidence()` bhej de → "tamper-evident" claim **real** ho jayega. (Biggest credibility win available.)
5. **Real verification in Proof Verifier** — mock evidence ke saath content string store karo; verify = re-hash content & compare; "Simulate Tamper" = string mutate karke mismatch dikhana. Abhi yeh sirf string-lookup demo hai.

**Product**
6. **Shareable case link** (read-only) + PDF export of Legal Dossier (abhi modal-only).
7. **Onboarding tour** (3-step: file → anchor → jury) — reference designs se consistent.
8. **Hindi/English toggle** — India-first platform ke liye strong differentiator; formatters centralized karo (P2-13).
9. **Case number hygiene** — sequential counter (P2-5) + 059/0591 jaise duplicate-looking numbers avoid karo.

**Quality**
10. **Playwright E2E** (file case → vote → verdict → dossier) + **Vitest** for `lib/crypto` + `lib/commitment`.
11. **CI (GitHub Actions)** — tsc + hardhat test + E2E on every push (PAT milte hi).
12. **Security pass** — OTP rate-limit, JWT refresh, origin allowlist (P2-2/3/4), keys out of bundle (P2-1).

---

## 6. Suggested fix batches (for approval)

| Batch | Contents | Effort |
|-------|----------|--------|
| **B1 — Demo life** | P0-1 (relative dates + demo reset), P0-7 (deadline guard + real verify), P1-2, P1-5, P2-9 | small |
| **B2 — Identity & session** | P0-3, P0-4, P1-6, P1-7, P1-8, P2-8 | small |
| **B3 — Integrity real** | P0-2 (real byte hash), suggestion #4 (on-chain anchor), suggestion #5 (real verifier) | medium |
| **B4 — Logic & data** | P0-5 (deep links), P0-6 (availability wiring), P1-1 (persistence), P1-3/4, P1-9/10 (AI naming), P2-5/6/7/13 | medium |
| **B5 — Hardening** | P2-1…P2-4, CI, Playwright/Vitest | medium |

**Mera recommendation:** B1 + B2 ek saath (user ko sabse zyada yehi feel ho raha hai), phir B3 (product ka core promise), phir B4/B5.

---

*Audit method: har file structure-level mapping + har interactive handler ka source-read + live route checks (18/18 200) + backend endpoint tests + contract source review. Kuch bhi guess pe nahi likha — har finding file:line level par verify hai.*
