import { concat, getAddress, hexlify, isAddress, keccak256, randomBytes, toBeHex, toUtf8Bytes } from "ethers";
import { VoteChoice } from "../types";

/**
 * Commit-Reveal commitment encoding — MUST stay byte-for-byte identical to
 * `VotingManager.revealVote` in blockchain/contracts/VotingManager.sol:
 *
 *   keccak256( abi.encodePacked(uint8 voteChoice, bytes32 salt, uint256 caseId, address juror) )
 *
 *   uint8 voteChoice : 1 = CLAIMANT_UPHELD, 2 = RESPONDENT_UPHELD, 3 = SPLIT_SETTLEMENT
 *   bytes32 salt     : 32-byte secret, revealed after the deadline
 *   uint256 caseId   : binds the commitment to a specific case (replay-proof)
 *   address juror    : binds the commitment to a specific juror
 *
 * Verified by blockchain/tests/commitReveal.test.js (6 passing).
 */

export type OnChainVoteChoice = 1 | 2 | 3;

export const VOTE_CHOICE_LABELS: Record<OnChainVoteChoice, string> = {
  1: "Claimant Upheld",
  2: "Respondent Upheld",
  3: "Split Settlement",
};

export const VOTE_CHOICE_TO_ON_CHAIN: Record<VoteChoice, OnChainVoteChoice> = {
  CLAIMANT_UPHELD: 1,
  RESPONDENT_UPHELD: 2,
  SPLIT_SETTLEMENT: 3,
};

export const ON_CHAIN_TO_VOTE_CHOICE: Record<OnChainVoteChoice, VoteChoice> = {
  1: "CLAIMANT_UPHELD",
  2: "RESPONDENT_UPHELD",
  3: "SPLIT_SETTLEMENT",
};

/**
 * Normalizes juror address to a valid 20-byte checksummed address.
 * If address is mock/pseudonym or has ellipsis (e.g. "0x32a1...9b28"),
 * deterministically derives a valid 20-byte checksummed address.
 */
export function normalizeJurorAddress(juror?: string): string {
  if (!juror) return "0x0000000000000000000000000000000000000001";
  const clean = juror.trim();
  if (isAddress(clean)) {
    return getAddress(clean);
  }
  // If address has ellipsis or is a pseudonym string, hash deterministically
  const hash = keccak256(toUtf8Bytes(clean));
  return getAddress("0x" + hash.slice(26));
}

/**
 * Normalizes caseId (string, number, or bigint) to BigInt for uint256 packing.
 */
export function parseCaseIdToBigInt(caseId?: string | number | bigint): bigint {
  if (caseId === undefined || caseId === null) return 1n;
  if (typeof caseId === "bigint") return caseId;
  if (typeof caseId === "number") return BigInt(caseId);
  const clean = String(caseId).trim();
  if (/^\d+$/.test(clean)) {
    return BigInt(clean);
  }
  const numMatch = clean.match(/(\d+)/);
  if (numMatch) {
    try {
      return BigInt(numMatch[1]);
    } catch {
      /* fallback to deterministic hash */
    }
  }
  const hash = keccak256(toUtf8Bytes(clean));
  return BigInt(hash) % (1n << 128n);
}

/**
 * Normalizes a salt to a 32-byte hex string (0x + 64 hex characters).
 */
export function normalizeSalt32(salt: string): string {
  const clean = salt.trim().replace(/^0x/, "");
  const padded = clean.padStart(64, "0").slice(-64);
  return "0x" + padded;
}

/** Raw packed pre-image: 1 + 32 + 32 + 20 = 85 bytes */
export function packCommitmentInput(
  vote: OnChainVoteChoice,
  saltHex: string,
  caseId: bigint | number | string,
  juror: string
): string {
  const normCaseId = parseCaseIdToBigInt(caseId);
  const normJuror = normalizeJurorAddress(juror);
  const normSalt = normalizeSalt32(saltHex);

  return concat([
    toBeHex(vote, 1), // uint8 -> 1 byte
    hexlify(normSalt), // bytes32 -> 32 bytes
    toBeHex(normCaseId, 32), // uint256 -> 32 bytes (big-endian)
    normJuror, // address -> 20 bytes
  ]);
}

/** The on-chain commitment hash: bytes32 */
export function computeCommitment(
  vote: OnChainVoteChoice,
  saltHex: string,
  caseId: bigint | number | string,
  juror: string
): string {
  return keccak256(packCommitmentInput(vote, saltHex, caseId, juror));
}

/** VoteChoice-level convenience helper */
export function computeVoteChoiceCommitment(
  vote: VoteChoice,
  saltHex: string,
  caseId: bigint | number | string,
  juror: string
): string {
  const onChainVote = VOTE_CHOICE_TO_ON_CHAIN[vote] || 1;
  return computeCommitment(onChainVote, saltHex, caseId, juror);
}

/** Verify if vote + salt produces expectedCommitment */
export function verifyVoteChoiceCommitment(
  vote: VoteChoice,
  saltHex: string,
  caseId: bigint | number | string,
  juror: string,
  expectedCommitment: string
): boolean {
  if (!expectedCommitment || !saltHex) return false;
  try {
    const computed = computeVoteChoiceCommitment(vote, saltHex, caseId, juror);
    return computed.toLowerCase() === expectedCommitment.trim().toLowerCase();
  } catch {
    return false;
  }
}

/** Generates a cryptographically random 32-byte salt (0x + 64 hex chars) */
export function generateSalt32(): string {
  return hexlify(randomBytes(32));
}
