import { JurorAssignment } from '../types';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no ambiguous 0/O/1/I

/**
 * Derive a stable anonymous juror pseudonym from a wallet/seed, e.g. "#A7F2".
 * The same wallet always maps to the same pseudonym, but the mapping is not
 * human-reversible and never reveals the real identity.
 */
export function jurorPseudonym(seed: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  let out = '';
  let x = h || 1;
  for (let i = 0; i < 4; i++) {
    x = Math.imul(x ^ (x >>> 15), 2246822507) >>> 0;
    x = Math.imul(x ^ (x >>> 13), 3266489909) >>> 0;
    out += ALPHABET[(x >>> (i * 6)) % ALPHABET.length];
  }
  return '#' + out;
}

/** Anonymous label for a juror, e.g. "Juror #A7F2". */
export function jurorLabel(j: JurorAssignment): string {
  return 'Juror ' + jurorPseudonym(j.walletAddress || j.jurorId);
}

export const ANONYMITY_NOTE =
  'Juror identities are protected to preserve independent decision-making. You see pseudonyms only.';
