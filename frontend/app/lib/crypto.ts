// Cryptographic helpers for client-side provenance and Commit-Reveal protocol

export async function computeSha256(data: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    // Fallback for SSR or non-browser environments
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = (hash << 5) - hash + data.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateRandomSalt(): string {
  if (typeof window === 'undefined' || !window.crypto) {
    return '0x8f92a104c8821034';
  }
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return '0x' + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Keccak/SHA256 simulation for vote commitment: Hash(voteChoice + salt)
export async function computeVoteCommitment(vote: string, salt: string): Promise<string> {
  const rawString = `${vote.trim().toUpperCase()}:${salt.trim().toLowerCase()}`;
  const hash = await computeSha256(rawString);
  return '0x' + hash;
}

export async function verifyVoteCommitment(
  vote: string,
  salt: string,
  expectedCommitment: string
): Promise<boolean> {
  const computed = await computeVoteCommitment(vote, salt);
  return computed.toLowerCase() === expectedCommitment.toLowerCase();
}

export function generateMockCid(hash: string): string {
  const cleanHash = hash.replace('0x', '');
  return `bafybeih${cleanHash.substring(0, 32)}q7z`;
}

export function formatAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
}

export function formatHash(hash: string, chars = 8): string {
  if (!hash || hash.length <= chars * 2) return hash;
  return `${hash.substring(0, chars)}...${hash.substring(hash.length - chars)}`;
}

export function formatDateSafe(isoString: string): string {
  if (!isoString) return '2026-09-07';
  try {
    const parts = isoString.split('T')[0];
    return parts || '2026-09-07';
  } catch {
    return '2026-09-07';
  }
}
