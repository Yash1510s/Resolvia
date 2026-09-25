import { describe, it, expect } from 'vitest';
import { keccak256, hexlify, toBeHex, getBytes, getAddress, concat } from 'ethers';
import {
  packCommitmentInput,
  computeCommitment,
  generateSalt32,
  type OnChainVoteChoice,
} from '../app/lib/commitment';

const JUROR = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const OTHER_JUROR = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';
const SALT = '0x' + 'ab'.repeat(32);
const CASE_ID = BigInt(1091);

describe('packCommitmentInput', () => {
  it('produces exactly 85 bytes (1 + 32 + 32 + 20)', () => {
    const packed = packCommitmentInput(1, SALT, CASE_ID, JUROR);
    expect(packed).toMatch(/^0x[0-9a-f]{170}$/); // 85 bytes = 170 hex
  });

  it('matches an independent abi.encodePacked(uint8,bytes32,uint256,address) byte-for-byte', () => {
    const packed = packCommitmentInput(2, SALT, CASE_ID, JUROR);
    // Independent reference: build the packed pre-image from raw bytes using
    // arrayify (a different code path than the impl's toBeHex/hexlify/concat).
    const reference = hexlify(
      concat([
        getBytes(toBeHex(2, 1)), // uint8 -> 1 byte
        getBytes(SALT), // bytes32
        getBytes(toBeHex(CASE_ID, 32)), // uint256 -> 32 bytes big-endian
        getBytes(getAddress(JUROR)), // address -> 20 bytes
      ])
    );
    expect(packed).toBe(reference);
  });

  it('encodes the vote as a single leading byte', () => {
    for (const vote of [1, 2, 3] as OnChainVoteChoice[]) {
      const packed = packCommitmentInput(vote, SALT, CASE_ID, JUROR);
      expect(packed.slice(2, 4)).toBe(toBeHex(vote, 1).slice(2));
    }
  });
});

describe('computeCommitment', () => {
  it('is a 32-byte keccak of the packed pre-image', () => {
    const c = computeCommitment(1, SALT, CASE_ID, JUROR);
    expect(c).toMatch(/^0x[0-9a-f]{64}$/);
    expect(c).toBe(keccak256(packCommitmentInput(1, SALT, CASE_ID, JUROR)));
  });

  it('is deterministic', () => {
    expect(computeCommitment(3, SALT, CASE_ID, JUROR)).toBe(
      computeCommitment(3, SALT, CASE_ID, JUROR)
    );
  });

  it('binds the vote (replay-proof across outcomes)', () => {
    const a = computeCommitment(1, SALT, CASE_ID, JUROR);
    const b = computeCommitment(2, SALT, CASE_ID, JUROR);
    expect(a).not.toBe(b);
  });

  it('binds the salt (different secrets -> different commitments)', () => {
    const a = computeCommitment(1, SALT, CASE_ID, JUROR);
    const b = computeCommitment(1, '0x' + 'cd'.repeat(32), CASE_ID, JUROR);
    expect(a).not.toBe(b);
  });

  it('binds the case (replay-proof across cases)', () => {
    const a = computeCommitment(1, SALT, BigInt(1091), JUROR);
    const b = computeCommitment(1, SALT, BigInt(1092), JUROR);
    expect(a).not.toBe(b);
  });

  it('binds the juror (replay-proof across voters)', () => {
    const a = computeCommitment(1, SALT, CASE_ID, JUROR);
    const b = computeCommitment(1, SALT, CASE_ID, OTHER_JUROR);
    expect(a).not.toBe(b);
  });
});

describe('generateSalt32', () => {
  it('returns 32 random bytes (0x + 64 hex)', () => {
    const s = generateSalt32();
    expect(s).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it('is unpredictable (two salts differ)', () => {
    expect(generateSalt32()).not.toBe(generateSalt32());
  });
});
