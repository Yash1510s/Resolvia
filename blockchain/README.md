# blockchain/ — Resolvia On-Chain Protocol

Five Solidity contracts (0.8.28) implementing the arbitration protocol, now with a
working **Hardhat project**: compile, test, local node, and deploy.

## Layout

```
contracts/
  ResolviaToken.sol      Hand-rolled ERC-20 (RSLV) — 10M initial supply to deployer
  EvidenceRegistry.sol   SHA-256 + IPFS CID immutable evidence ledger
  CaseRegistry.sol       Case state machine (11 states) + verdict finalization
  VotingManager.sol      Commit-reveal jury voting (this fix's core)
  ArbitrationHub.sol     Coordinator: stake escrow, panel appointment, settlement
scripts/
  deploy.js              Deploys all 5 + wires hub, writes deployments/local.json
  e2e-escrow.js          Live end-to-end: stake → counter-stake → panel → 5 votes → settle (run: node scripts/e2e-escrow.js)
tests/
  commitReveal.test.js   6 tests proving the commitment math
  escrowSettlement.test.js  11 tests: payouts, split refund, rescue, deadlines, guards (17/17 passing)
deployments/
  local.json             Contract addresses + demo account mapping (gitignored content)
```

## Commitment math (PHASE A FIX — 2026-09-07)

Previously the frontend committed with `SHA-256("VOTE:salt")` while the contract
verified `keccak256(abi.encodePacked(uint8, bytes32))` — **they could never match**,
and the commitment wasn't bound to the case or juror (replayable).

Both sides now use the exact same encoding:

```
commitment = keccak256(
  abi.encodePacked(
    uint8   voteChoice,   // 1 = CLAIMANT_UPHELD, 2 = RESPONDENT_UPHELD, 3 = SPLIT_SETTLEMENT
    bytes32 salt,         // 32-byte secret (frontend: ethers.randomBytes(32))
    uint256 caseId,       // binds to the case → cross-case replay reverts
    address juror         // binds to the juror (msg.sender at reveal)
  )
)
```

- Contract: `blockchain/contracts/VotingManager.sol` → `revealVote`
- Frontend: `frontend/app/lib/commitment.ts` → `computeCommitment()`
- Proof: `tests/commitReveal.test.js` (valid reveal, wrong salt, wrong vote,
  cross-case replay, non-panel juror, double commit/reveal — 6/6 passing)
- Live E2E verified on the local node: full initiate → panel → 5× commit/reveal →
  settle lifecycle, plus a live wrong-salt revert
  ("Cryptographic commitment mismatch").

## Local chain workflow

```bash
# terminal 1 — local chain (ports 8545)
npm install
npm run node

# terminal 2 — deploy (run after node is up)
npm run deploy:local     # → deployments/local.json

# tests (independent of the node)
npm test
```

The Next.js frontend reads `deployments/local.json` via `GET /api/deployments` and
talks to the chain through the JSON-RPC proxy `POST /api/rpc` (the browser can't
reach localhost inside the sandbox). Demo signers are the well-known Hardhat
default accounts (public test keys, local chain only) — mapping lives in
`frontend/app/lib/chain.ts` and MUST stay in sync with `scripts/deploy.js`:

| account | role |
|---|---|
| 0 | Admin + Claimant (Alice) — holds the 10M RSLV mint |
| 1 | Juror A — the interactive "you" |
| 2 | Respondent (DeCrypto Labs) |
| 3–6 | Jurors B–E |

## Escrow settlement (Phase A fix 2 — 2026-09-07)

The 500 RSLV anti-spam stake is now a **real two-sided escrow** that moves on
settlement:

- `initiateDispute` — claimant locks 500 RSLV (state `SUBMITTED`, 2-day response
  window).
- `counterStake` — respondent locks 500 RSLV within the response window
  (state `EVIDENCE_LOCKED`). If they ignore the case, the claimant calls
  `rescueStake` after the window closes and gets their stake back (state
  `CLOSED`).
- `appointJurorPanel` — requires `EVIDENCE_LOCKED`; the hub reads the case's
  `votingDeadline` itself (no parameter from the admin).
- Deadline enforcement: `commitVote` reverts after `votingDeadline` (7 days);
  `revealVote` reverts after `votingDeadline + REVEAL_GRACE` (1 day).
- `settleCase` (quorum ≥ 3 revealed votes) — **CEI ordering + reentrancy lock**:
  `finalizeVerdict` and `isSettled` are set **before** any token transfer.
  - **Win** (claimant 1 / respondent 2): winner gets own 500 + (loser 500 − 20%
    reward pool) = **900 RSLV**; the 5 jurors split the pool (**20 RSLV each**).
  - **Split** (3): both parties get their own stake back, no rewards.
  - Events: `StakeSettled(caseId, winner, payout)`, `JurorRewarded(caseId, juror, reward)`,
    `RespondentStaked`, `StakeRescued`.

Verification: `tests/escrowSettlement.test.js` (11 tests: claimant win,
respondent win, split refund, quorum, double-settle, non-respondent, pre-stake
panel, rescue, commit-deadline, reveal-grace, finalizeVerdict guard) —
**17/17 passing** with `commitReveal.test.js`. Live E2E on the local node:
`node scripts/e2e-escrow.js` asserts exact balance deltas
(claimant +900, respondent +0, each juror +20) and the `StakeSettled` event.

## Remaining known gaps

- `EvidenceRegistry.registerEvidence` has no access control (anyone can anchor
  evidence for any case).
- Jury selection is manual (admin appoints a fixed demo panel); stake-weighted
  or reputation-based selection is future work.
- No appeal window after `FINALIZED` (the 11-state machine includes `APPEAL`
  but nothing can trigger it yet).
- Local chain only: test keys are the well-known Hardhat defaults — never reuse
  this deployment setup on a public network.
