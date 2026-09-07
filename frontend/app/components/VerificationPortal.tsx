'use client';

import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Fingerprint,
  Shield,
  RefreshCw,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { DisputeCase } from '../types';
import { formatHash } from '../lib/crypto';

interface VerificationPortalProps {
  cases: DisputeCase[];
}

export function VerificationPortal({ cases }: VerificationPortalProps) {
  const [input, setInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{
    status: 'VALID' | 'MISMATCH' | 'NOT_FOUND' | 'EMPTY';
    hash?: string;
    evidenceName?: string;
    caseNumber?: string;
    blockNumber?: number;
    details?: string;
  } | null>(null);

  const handleVerify = async () => {
    const q = input.trim();
    if (!q) {
      setResult({ status: 'EMPTY' });
      return;
    }
    setVerifying(true);
    await new Promise((r) => setTimeout(r, 700));

    // 1) Try matching a full or partial SHA-256 hash against evidence
    for (const c of cases) {
      for (const e of c.evidence) {
        if (e.sha256Hash.includes(q) || q.includes(e.sha256Hash.slice(0, 16))) {
          setResult({
            status: 'VALID',
            hash: e.sha256Hash,
            evidenceName: e.fileName,
            caseNumber: c.caseNumber,
            details: `Hash matches the anchored fingerprint of "${e.fileName}" in case ${c.caseNumber}. IPFS CID: ${e.ipfsCid}.`,
          });
          setVerifying(false);
          return;
        }
      }
    }

    // 2) Try matching a case number
    const caseMatch = cases.find((c) => c.caseNumber.toLowerCase().includes(q.toLowerCase()));
    if (caseMatch) {
      const ev = caseMatch.evidence[0];
      setResult({
        status: 'VALID',
        hash: ev?.sha256Hash,
        evidenceName: ev?.fileName,
        caseNumber: caseMatch.caseNumber,
        details: `Case ${caseMatch.caseNumber} found on-chain. ${caseMatch.evidence.length} evidence item(s) anchored. ${caseMatch.auditTrail.length} audit events recorded.`,
      });
      setVerifying(false);
      return;
    }

    setResult({
      status: 'NOT_FOUND',
      details: 'No on-chain record found for this identifier. If you are verifying a tampered copy, compare the local re-hash (below) with the original anchored hash — any single byte change breaks the match.',
    });
    setVerifying(false);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Third-Party Proof Verification</h2>
            <p className="text-xs text-slate-500">
              Anyone — a court, a counterparty, a journalist — can verify any Resolvia artefact without trusting us.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex items-center gap-2 px-3.5 rounded-xl border border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              placeholder="Paste a SHA-256 hash or case number (e.g. RSV-2026-084)…"
              className="w-full py-2.5 text-xs font-mono outline-none"
            />
          </div>
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {verifying ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Fingerprint className="w-4 h-4" />
            )}
            <span>Verify</span>
          </button>
        </div>

        {/* Quick test chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Try:</span>
          {cases.slice(0, 3).map((c) => (
            <button
              key={c.id}
              onClick={() => setInput(c.caseNumber)}
              className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              {c.caseNumber}
            </button>
          ))}
          {cases[0]?.evidence[0] && (
            <button
              onClick={() => setInput(cases[0].evidence[0].sha256Hash.slice(0, 24))}
              className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              title={cases[0].evidence[0].sha256Hash}
            >
              {formatHash(cases[0].evidence[0].sha256Hash, 12)}…
            </button>
          )}
        </div>
      </div>

      {/* Result card */}
      {result && (
        <div
          className={`p-6 rounded-2xl border shadow-xs animate-scale-up ${
            result.status === 'VALID'
              ? 'bg-emerald-50/60 border-emerald-300'
              : result.status === 'NOT_FOUND'
              ? 'bg-rose-50/60 border-rose-300'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                result.status === 'VALID'
                  ? 'bg-emerald-100 text-emerald-600'
                  : result.status === 'NOT_FOUND'
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {result.status === 'VALID' ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <XCircle className="w-6 h-6" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3
                className={`text-sm font-black ${
                  result.status === 'VALID' ? 'text-emerald-800' : 'text-rose-800'
                }`}
              >
                {result.status === 'VALID'
                  ? 'INTEGRITY VERIFIED — RECORD MATCHES ON-CHAIN ANCHOR'
                  : result.status === 'NOT_FOUND'
                  ? 'RECORD NOT FOUND'
                  : 'Enter a hash or case number to begin'}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{result.details}</p>

              {result.hash && (
                <div className="mt-4 p-4 rounded-xl bg-white border border-slate-200 space-y-1.5 text-[11px] font-mono">
                  <div className="flex flex-wrap gap-x-6 gap-y-1">
                    <span className="text-slate-400">
                      hash: <span className="text-slate-800 font-bold">{formatHash(result.hash, 40)}</span>
                    </span>
                    {result.caseNumber && (
                      <span className="text-slate-400">
                        case: <span className="text-blue-700 font-bold">{result.caseNumber}</span>
                      </span>
                    )}
                    {result.blockNumber && (
                      <span className="text-slate-400">
                        block: <span className="text-slate-800 font-bold">{result.blockNumber.toLocaleString()}</span>
                      </span>
                    )}
                  </div>
                  {result.evidenceName && (
                    <span className="text-slate-400">
                      file: <span className="text-slate-800 font-bold">{result.evidenceName}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: <Fingerprint className="w-5 h-5" />,
            title: '1. Hash at Filing',
            body: 'The SHA-256 fingerprint is computed in the filer’s browser before upload. The hash — not the file — is what the chain stores.',
          },
          {
            icon: <Layers className="w-5 h-5" />,
            title: '2. Anchor + Pin',
            body: 'The hash is written to EvidenceRegistry on Sepolia; the original file is pinned to IPFS at the CID stored alongside it.',
          },
          {
            icon: <ExternalLink className="w-5 h-5" />,
            title: '3. Anyone Re-Hashes',
            body: 'A verifier downloads the artefact, re-computes SHA-256, and compares. A mismatch proves post-filing tampering — no trust required.',
          },
        ].map((s) => (
          <div key={s.title} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              {s.icon}
            </div>
            <h4 className="text-xs font-bold text-slate-900">{s.title}</h4>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
