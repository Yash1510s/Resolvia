import { describe, it, expect } from 'vitest';
import { createHash, webcrypto } from 'node:crypto';

// The helpers gate their real WebCrypto path on `window.crypto.subtle`.
// Provide Node's webcrypto as the window shim BEFORE importing the module,
// so we exercise the REAL SHA-256 code path (not the SSR length/djb2 fallback).
(globalThis as any).window = { crypto: webcrypto };

const { computeSha256, computeSha256Bytes } = await import('../app/lib/crypto');

function sha256Node(input: string | Uint8Array | ArrayBuffer): string {
  const h = createHash('sha256');
  if (typeof input === 'string') h.update(input);
  else if (input instanceof Uint8Array) h.update(input);
  else h.update(new Uint8Array(input));
  return h.digest('hex');
}

describe('computeSha256 (string, real WebCrypto path)', () => {
  it('matches Node crypto for the standard "abc" vector', async () => {
    // NIST test vector
    await expect(computeSha256('abc')).resolves.toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
  });

  it('matches Node crypto for unicode + long input', async () => {
    const s = 'Resolvia dispute evidence — 42 USD — ' + 'x'.repeat(5000);
    await expect(computeSha256(s)).resolves.toBe(sha256Node(s));
  });

  it('returns 64 lowercase hex chars', async () => {
    const h = await computeSha256('evidence-file-001');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('computeSha256Bytes (raw file bytes, real WebCrypto path)', () => {
  it('matches Node crypto on a known buffer', async () => {
    const bytes = new TextEncoder().encode('The quick brown fox jumps over the lazy dog');
    const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    await expect(computeSha256Bytes(buf)).resolves.toBe(
      sha256Node(bytes) // d1f859...
    );
  });

  it('a single-byte change fully changes the fingerprint (tamper story)', async () => {
    const a = new Uint8Array(1024).fill(7);
    const b = new Uint8Array(1024).fill(7);
    b[512] ^= 0x01; // flip one bit in the middle
    const bufA = a.buffer.slice(0) as ArrayBuffer;
    const bufB = b.buffer.slice(0) as ArrayBuffer;
    const ha = await computeSha256Bytes(bufA);
    const hb = await computeSha256Bytes(bufB);
    expect(ha).not.toBe(hb);
    // And both match independent Node hashes — proving the change is detected,
    // not that we're hashing something arbitrary.
    expect(ha).toBe(sha256Node(new Uint8Array(bufA)));
    expect(hb).toBe(sha256Node(new Uint8Array(bufB)));
  });

  it('handles an empty buffer', async () => {
    const empty = new ArrayBuffer(0);
    await expect(computeSha256Bytes(empty)).resolves.toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    );
  });
});
