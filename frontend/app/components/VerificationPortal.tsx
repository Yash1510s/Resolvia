'use client';

import React, { useState } from 'react';
import {
  CheckCircle,
  Search,
  Hash,
  Database,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Shield,
  Copy,
  Check,
} from 'lucide-react';
import { DisputeCase } from '../types';
import { formatHash } from '../lib/crypto';

interface VerificationPortalProps {
  cases: DisputeCase[];
}

export const VerificationPortal: React.FC<VerificationPortalProps> = ({ cases }) => {
  const [query, setQuery] = useState<string>('RSLV-2026-084');
  const [result, setResult] = useState<{
    found: boolean;
    caseMatch?: DisputeCase;
    evidenceMatch?: { title: string; sha256: string; cid: string; submitter: string };
    type?: string;
  } | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const handleVerify = (searchQuery = query) => {
    setIsSearching(true);
    setTimeout(() => {
      const q = searchQuery.trim().toLowerCase();

      // Check case number
      const foundCase = cases.find(
        c => c.caseNumber.toLowerCase() === q || c.id.toLowerCase() === q
      );
      if (foundCase) {
        setResult({ found: true, caseMatch: foundCase, type: 'DISPUTE_CASE' });
        setIsSearching(false);
        return;
      }

      // Check evidence hashes or CIDs
      for (const c of cases) {
        const ev = c.evidence.find(
          e =>
            e.sha256Hash.toLowerCase().includes(q) ||
            e.ipfsCid.toLowerCase().includes(q) ||
            e.id.toLowerCase() === q
        );
        if (ev) {
          setResult({
            found: true,
            caseMatch: c,
            evidenceMatch: {
              title: ev.title,
              sha256: ev.sha256Hash,
              cid: ev.ipfsCid,
              submitter: ev.submittedBy,
            },
            type: 'EVIDENCE_RECORD',
          });
          setIsSearching(false);
          return;
        }
      }

      setResult({ found: false });
      setIsSearching(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            <span>Public Proof Verifier & Cryptographic Notary</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
            Verify any Resolvia dispute docket, off-chain evidence SHA-256 digest, or juror commitment hash against the immutable ledger.
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Case Number (e.g. RSLV-2026-084) or SHA-256 hash / IPFS CID..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>
          <button
            onClick={() => handleVerify()}
            disabled={isSearching}
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md active:scale-[0.98]"
          >
            {isSearching ? 'Verifying...' : 'Verify Record'}
          </button>
        </div>

        {/* Quick pills */}
        <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
          <span>Try quick sample:</span>
          {['RSLV-2026-084', 'RSLV-2026-092', 'RSLV-2026-059'].map((sample) => (
            <button
              key={sample}
              onClick={() => {
                setQuery(sample);
                handleVerify(sample);
              }}
              className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 font-mono text-xs border border-slate-200 cursor-pointer transition-colors"
            >
              {sample}
            </button>
          ))}
        </div>

        {/* Result Card */}
        {result && (
          <div className="pt-4 border-t border-slate-100">
            {result.found ? (
              <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Cryptographic Proof Validated</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full font-bold">
                    Anchored On-Chain
                  </span>
                </div>

                {result.caseMatch && (
                  <div className="space-y-1.5 text-xs text-slate-800">
                    <p className="font-bold text-sm text-slate-900">
                      {result.caseMatch.caseNumber}: {result.caseMatch.title}
                    </p>
                    <p className="text-slate-600">
                      Parties: {result.caseMatch.claimant.name} vs {result.caseMatch.respondent.name}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500">
                      Dispute Amount: {result.caseMatch.disputeAmount} • Status: {result.caseMatch.status}
                    </p>
                  </div>
                )}

                {result.evidenceMatch && (
                  <div className="p-3.5 rounded-xl bg-white border border-emerald-100 text-xs space-y-1 font-mono">
                    <span className="text-slate-900 font-bold">{result.evidenceMatch.title}</span>
                    <p className="text-[11px] text-slate-500 truncate">
                      SHA-256: {result.evidenceMatch.sha256}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      IPFS CID: {result.evidenceMatch.cid}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>No matching cryptographic record or case found on this query.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
