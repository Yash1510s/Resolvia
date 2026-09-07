import { concat, getAddress, hexlify, keccak256, randomBytes, toBeHex } from "ethers";

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

/** Raw packed pre-image: 1 + 32 + 32 + 20 = 85 bytes */
export function packCommitmentInput(
  vote: OnChainVoteChoice,
  saltHex: string,
  caseId: bigint,
  juror: string
): string {
  return concat([
    toBeHex(vote, 1), // uint8 -> 1 byte
    hexlify(saltHex), // bytes32 -> 32 bytes
    toBeHex(BigInt(caseId), 32), // uint256 -> 32 bytes (big-endian)
    getAddress(juror), // address -> 20 bytes
  ]);
}

/** The on-chain commitment hash: bytes32 */
export function computeCommitment(
  vote: OnChainVoteChoice,
  saltHex: string,
  caseId: bigint,
  juror: string
): string {
  return keccak256(packCommitmentInput(vote, saltHex, caseId, juror));
}

/** Generates a cryptographically random 32-byte salt (0x + 64 hex chars) */
export function generateSalt32(): string {
  return hexlify(randomBytes(32));
}
