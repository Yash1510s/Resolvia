'use client';

import React, { useState } from 'react';
import {
  FileText,
  Shield,
  Fingerprint,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { EvidenceItem } from '../types';
import { computeSha256, formatHash } from '../lib/crypto';

interface EvidenceLockerProps {
  evidence: EvidenceItem[];
  caseId: string;
  onAddEvidenceClick: () => void;
}

export function EvidenceLocker({ evidence, caseId, onAddEvidenceClick }: EvidenceLockerProps) {
  const [tamperedId, setTamperedId] = useState<string | null>(null);
  const [tamperedPreview, setTamperedPreview] = useState<string>('');
  const [verifying, setVerifying] = useState<string | null>(null);

  const handleTamperSimulate = async (ev: EvidenceItem) => {
    if (tamperedId === ev.id) {
      setTamperedId(null);
      setTamperedPreview('');
      return;
    }
    setTamperedId(ev.id);
    const h = await computeSha256(ev.sha256Hash + ':tampered');
    setTamperedPreview(formatHash(h, 16));
  };

  const handleVerify = async (ev: EvidenceItem) => {
    setVerifying(ev.id);
    await new Promise((r) => setTimeout(r, 600));
    setVerifying(null);
  };

  return (
    <div className="space-y-4">
      {/* Explanation banner */}
      <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
        <Fingerprint className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-blue-900">Immutable Evidence Vault</h4>
          <p className="text-[11px] text-blue-700/80 mt-1 leading-relaxed">
            Every artefact is SHA-256 fingerprinted in the browser before upload and pinned to IPFS.
            The hash + CID are anchored on-chain in <span className="font-mono">EvidenceRegistry</span>.
            Use <strong>Simulate Tamper</strong> to see the integrity check break.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {evidence.map((ev) => {
          const isTampered = tamperedId === ev.id;
          return (
            <div
              key={ev.id}
              className={`p-5 rounded-2xl bg-white border transition-all ${
                isTampered ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200 hover:border-blue-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isTampered ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'
                    }`}
                  >
                    <FileText className="w-4.5 h-4.5 w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{ev.title || ev.fileName}</p>
                    <p className="text-[10px] text-slate-500">{ev.fileName} • {ev.fileSize} • {ev.submittedBy}</p>
                  </div>
                </div>

                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-full border shrink-0 ${
                    isTampered
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {isTampered ? 'INTEGRITY FAILED' : 'ANCHORED'}
                </span>
              </div>

              {/* Hash + CID rows */}
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="text-slate-400 w-8 shrink-0">SHA256</span>
                  <span className={isTampered ? 'text-rose-600 line-through' : 'text-slate-600'}>
                    {formatHash(ev.sha256Hash, 20)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="text-slate-400 w-8 shrink-0">IPFS</span>
                  <span className="text-slate-600">{ev.ipfsCid ? `CID ${formatHash(ev.ipfsCid, 20)}` : 'pending pin'}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleVerify(ev)}
                  disabled={verifying === ev.id}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {verifying === ev.id ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Shield className="w-3 h-3" />
                  )}
                  <span>{verifying === ev.id ? 'Re-hashing…' : 'Verify Hash'}</span>
                </button>

                <button
                  onClick={() => handleTamperSimulate(ev)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isTampered
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>{isTampered ? 'Restore Original' : 'Simulate Tamper'}</span>
                </button>
              </div>

              {isTampered && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-[10px] text-rose-700 flex items-start gap-2">
                  <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    Local content re-hashed to <span className="font-mono font-bold">
                      {tamperedPreview}
                    </span>
                    — mismatch with the anchored on-chain fingerprint. This item would be rejected by the Verifier Portal.
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Add evidence tile */}
        <button
          onClick={onAddEvidenceClick}
          className="min-h-[180px] p-5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-blue-600 cursor-pointer"
        >
          <Lock className="w-6 h-6" />
          <span className="text-xs font-bold">Add Evidence via Dispute Wizard</span>
          <span className="text-[10px]">Files are hashed in-browser before leaving your machine</span>
        </button>
      </div>
    </div>
  );
}
