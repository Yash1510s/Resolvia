import { Contract, JsonRpcProvider, Wallet } from "ethers";

/**
 * Human-readable ABIs from a separate module can't be statically inferred by
 * ethers' Contract typing, so we expose a loose contract type that still
 * keeps `connect()` / `target` typed and allows dynamic method calls.
 */
export interface DemoContract {
  readonly target: string;
  readonly address: string;
  connect(runner: Wallet | JsonRpcProvider): DemoContract;
  getFunction(name: string): (...args: any[]) => Promise<any>;
  // Dynamic method calls (human-readable ABI, not statically typed):
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [method: string]: any;
}

/**
 * Local demo chain connectivity.
 *
 * The browser never talks to localhost directly (the preview proxy would block
 * it) — all JSON-RPC calls go through the relative endpoint `/api/rpc`, which
 * the Next.js server proxies to the local Hardhat node (127.0.0.1:8545).
 *
 * Demo signers use the well-known Hardhat default accounts. These keys are
 * public and this chain holds only test ETH / test RSLV — never mainnet.
 */

export interface DemoAccount {
  label: string;
  address: string;
  pk: string;
}

export interface Deployment {
  network: string;
  chainId: string;
  deployedAt: string;
  contracts: Record<string, string>;
  demoAccounts: {
    admin: string;
    claimant: string;
    respondent: string;
    jurors: string[];
    interactiveJuror: string;
  };
}

// ── Well-known Hardhat default accounts (test only) ──────────────────────────
const ACCOUNTS = {
  admin: {
    label: "Protocol Governance (Alice)",
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    pk: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  },
  claimant: {
    label: "Alice Vance (Claimant)",
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    pk: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  },
  respondent: {
    label: "DeCrypto Labs (Respondent)",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    pk: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  },
  juror1: {
    label: "Juror A — You",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    pk: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  },
  juror2: {
    label: "Juror B",
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    pk: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
  },
  juror3: {
    label: "Juror C",
    address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    pk: "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
  },
  juror4: {
    label: "Juror D",
    address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    pk: "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
  },
  juror5: {
    label: "Juror E",
    address: "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
    pk: "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e",
  },
} satisfies Record<string, DemoAccount>;

export const DEMO_ACCOUNTS = ACCOUNTS;

// ── Minimal ABIs (human-readable) ────────────────────────────────────────────
export const TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function transferFrom(address from, address to, uint256 value) returns (bool)",
];

export const HUB_ABI = [
  "function initiateDispute(string caseNumber, address respondent) returns (uint256)",
  "function counterStake(uint256 caseId)",
  "function rescueStake(uint256 caseId)",
  "function appointJurorPanel(uint256 caseId, address[] jurors)",
  "function settleCase(uint256 caseId)",
  "function REQUIRED_STAKE() view returns (uint256)",
  "function respondentStakes(uint256 caseId) view returns (uint256)",
  "event DisputeInitiated(uint256 indexed caseId, string caseNumber, address indexed claimant, address indexed respondent)",
  "event RespondentStaked(uint256 indexed caseId, address indexed respondent, uint256 stake)",
  "event StakeRescued(uint256 indexed caseId, address indexed claimant, uint256 amount)",
  "event StakeSettled(uint256 indexed caseId, address winner, uint256 payoutAmount)",
  "event JurorRewarded(uint256 indexed caseId, address indexed juror, uint256 reward)",
];

export const CASE_REGISTRY_ABI = [
  "function cases(uint256) view returns (uint256 caseId, string caseNumber, address claimant, address respondent, uint256 antiSpamStake, uint8 state, bytes32 evidenceMerkleRoot, bytes32 aiReportHash, uint256 createdAt, uint256 responseDeadline, uint256 votingDeadline, uint8 winningOutcome)",
  "function caseCount() view returns (uint256)",
  "event CaseCreated(uint256 indexed caseId, string caseNumber, address indexed claimant, address indexed respondent)",
  "event CaseStateChanged(uint256 indexed caseId, uint8 newState)",
  "event VerdictFinalized(uint256 indexed caseId, uint8 winningOutcome)",
];

export const VOTING_ABI = [
  "function commitVote(uint256 caseId, bytes32 commitmentHash)",
  "function revealVote(uint256 caseId, uint8 voteChoice, bytes32 salt)",
  "function jurorVotes(uint256 caseId, address juror) view returns (bytes32 commitmentHash, bool committed, bool revealed, uint8 revealedChoice, uint256 commitTimestamp, uint256 revealTimestamp)",
  "function isPanelJuror(uint256 caseId, address juror) view returns (bool)",
  "function getTally(uint256 caseId) view returns (uint256 claimant, uint256 respondent, uint256 split, uint256 total)",
  "event VoteCommitted(uint256 indexed caseId, address indexed juror, bytes32 commitmentHash)",
  "event VoteRevealed(uint256 indexed caseId, address indexed juror, uint8 choice)",
  "event PanelAssigned(uint256 indexed caseId, address[] jurors)",
];

// ── Provider / wallets ───────────────────────────────────────────────────────
let _provider: JsonRpcProvider | null = null;

/**
 * Per-address in-memory nonce manager.
 *
 * ethers v6 populates nonces from `eth_getTransactionCount("pending")`, but the
 * Hardhat node's pending state lags one cycle after a mined receipt — the next
 * send from the same account can hit "nonce has already been used". Since each
 * demo account sends strictly sequentially, we reserve nonces in memory after
 * the first read. A failed send just skips a nonce (harmless on a local chain).
 */
const _nonceState: Record<string, number | undefined> = {};

export async function getManagedNonce(address: string): Promise<number> {
  const key = address.toLowerCase();
  if (_nonceState[key] == null) {
    _nonceState[key] = await getProvider().getTransactionCount(address, "pending");
  }
  const next = _nonceState[key] as number;
  _nonceState[key] = next + 1;
  return next;
}

export function getProvider(): JsonRpcProvider {
  if (!_provider) {
    _provider = new JsonRpcProvider("/api/rpc");
  }
  return _provider;
}

export function getWallet(account: DemoAccount): Wallet {
  return new Wallet(account.pk, getProvider());
}

export async function fetchDeployment(): Promise<Deployment | null> {
  try {
    const res = await fetch("/api/deployments", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as Deployment;
  } catch {
    return null;
  }
}

export function getContracts(dep: Deployment) {
  const p = getProvider();
  return {
    token: new Contract(dep.contracts.ResolviaToken, TOKEN_ABI, p) as unknown as DemoContract,
    hub: new Contract(dep.contracts.ArbitrationHub, HUB_ABI, p) as unknown as DemoContract,
    caseRegistry: new Contract(dep.contracts.CaseRegistry, CASE_REGISTRY_ABI, p) as unknown as DemoContract,
    votingManager: new Contract(dep.contracts.VotingManager, VOTING_ABI, p) as unknown as DemoContract,
  };
}

export function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function shortHash(h: string, chars = 10): string {
  if (!h || h.length <= chars * 2) return h;
  return `${h.slice(0, chars)}…${h.slice(-chars)}`;
}

// ── EvidenceRegistry: real on-chain anchoring ────────────────────────────────
export const EVIDENCE_ABI = [
  "function registerEvidence(uint256 caseId, bytes32 contentSha256, string ipfsCid, uint8 tier) returns (uint256)",
  "function evidenceCount() view returns (uint256)",
  "function getCaseEvidence(uint256 caseId) view returns (uint256[])",
  "event EvidenceRegistered(uint256 indexed evidenceId, uint256 indexed caseId, address indexed submitter, bytes32 contentSha256, string ipfsCid, uint8 tier)",
];

export interface AnchorResult {
  status: 'ANCHORED' | 'PENDING' | 'FAILED';
  txHash?: string;
  blockNumber?: number | null;
  error?: string;
}

/**
 * Anchor an evidence hash on-chain.
 * - Logged-in user: the backend signs with the user's assigned (custodial)
 *   wallet — a real transaction, no MetaMask.
 * - Guest/demo: signed with the demo claimant account (local testnet only).
 */
export async function anchorEvidenceOnChain(
  args: { caseId: number; sha256: string; ipfsCid: string; tier?: number },
  authToken?: string | null
): Promise<AnchorResult> {
  if (authToken) {
    try {
      const res = await fetch('/api/backend/wallet/evidence/anchor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ caseId: args.caseId, sha256: args.sha256, ipfsCid: args.ipfsCid, tier: args.tier ?? 0 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { status: 'FAILED', error: data.detail || `Anchor failed (${res.status})` };
      return { status: data.status === 'ANCHORED' ? 'ANCHORED' : 'PENDING', txHash: data.txHash, blockNumber: data.blockNumber };
    } catch (e: any) {
      return { status: 'FAILED', error: e?.message || 'Backend unreachable' };
    }
  }
  // Guest path: demo claimant signs via /api/rpc (local testnet, well-known key).
  try {
    const dep = await fetchDeployment();
    if (!dep) return { status: 'FAILED', error: 'No local deployment manifest — run blockchain deploy' };
    const ev = new Contract(dep.contracts.EvidenceRegistry, EVIDENCE_ABI, getWallet(ACCOUNTS.claimant));
    const tx = await ev.registerEvidence(args.caseId, '0x' + args.sha256, args.ipfsCid, args.tier ?? 0, { gasLimit: 300000 });
    const rc = await tx.wait();
    return { status: 'ANCHORED', txHash: tx.hash, blockNumber: rc?.blockNumber };
  } catch (e: any) {
    return { status: 'FAILED', error: e?.message || 'On-chain anchor failed' };
  }
}

/** Public on-chain check: is this hash in the EvidenceRegistry? */
export async function verifyEvidenceOnChain(
  sha256: string
): Promise<{ status: 'ANCHORED' | 'NOT_FOUND' | 'ERROR'; matches?: { txHash?: string; blockNumber?: number }[]; error?: string }> {
  try {
    const res = await fetch(`/api/backend/evidence/verify?sha256=${encodeURIComponent(sha256)}`, { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { status: 'ERROR', error: data.detail || 'Chain read failed' };
    return { status: data.status, matches: data.matches };
  } catch (e: any) {
    return { status: 'ERROR', error: e?.message || 'Backend unreachable' };
  }
}

// ── Session content cache (for real content re-hash + tamper demo) ───────────
const _contentCache = new Map<string, Uint8Array>();

export function storeEvidenceContent(sha256: string, bytes: ArrayBuffer) {
  try {
    _contentCache.set(sha256.toLowerCase(), new Uint8Array(bytes));
  } catch {
    /* ignore */
  }
}

export function getEvidenceContent(sha256: string): Uint8Array | null {
  return _contentCache.get(sha256.toLowerCase()) || null;
}
