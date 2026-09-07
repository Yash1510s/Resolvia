'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  Lock,
  Unlock,
  RefreshCw,
  Database,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Upload,
  Link as LinkIcon,
  Trash2,
  Info,
} from 'lucide-react';
import { EvidenceItem } from '../types';
import { formatHash, formatDateSafe } from '../lib/crypto';

interface EvidenceLockerProps {
  evidence: EvidenceItem[];
  caseId: string;
  onAddEvidenceClick?: () => void;
}

export const EvidenceLocker: React.FC<EvidenceLockerProps> = ({
  evidence,
  caseId,
  onAddEvidenceClick,
}) => {
  const [tamperSimulatedId, setTamperSimulatedId] = useState<string | null>(null);
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);
  const [linkInput, setLinkInput] = useState<string>('');

  const handleTestTamper = (id: string) => {
    setTamperSimulatedId(tamperSimulatedId === id ? null : id);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHashId(id);
    setTimeout(() => setCopiedHashId(null), 1800);
  };

  return (
    <div className="space-y-6">
      {/* 2-Column Layout matching Reference Image Panel 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Evidence Upload & List */}
        <div className="lg:col-span-8 space-y-5">
          {/* Drag & Drop Upload Zone matching Reference */}
          <div
            onClick={onAddEvidenceClick}
            className="p-8 rounded-2xl border-2 border-dashed border-blue-200 bg-white hover:bg-blue-50/50 hover:border-blue-400 transition-all cursor-pointer text-center space-y-3 group shadow-xs"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center group-hover:scale-105 transition-transform">
              <Upload className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                Drag & drop files here or <span className="text-blue-600 underline">click to upload</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supported formats: PDF, Images, Videos, Docs, URLs (Max 100MB)
              </p>
            </div>
          </div>

          {/* Add Link Bar matching Reference */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="Add Link (e.g. Google Drive, Notion, IPFS CID, GitHub commit)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors shadow-xs"
              />
            </div>
            <button
              onClick={() => {
                if (linkInput) {
                  alert('External link recorded and prepared for off-chain cryptographic hashing.');
                  setLinkInput('');
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Add
            </button>
          </div>

          {/* Uploaded Evidence List matching Reference */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Uploaded Evidence ({evidence.length})</span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                Anchored to IPFS
              </span>
            </h4>

            <div className="space-y-2.5">
              {evidence.map((item, idx) => {
                const isTampered = tamperSimulatedId === item.id;
                const displayHash = isTampered
                  ? '0xbad0bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0dead'
                  : item.sha256Hash;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isTampered
                        ? 'bg-rose-50 border-rose-300'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                              E-{String(idx + 1).padStart(3, '0')}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {item.title}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {item.fileName} • {item.fileSize} • Submitted by {item.submittedBy}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          isTampered
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {isTampered ? 'Tamper Alert' : 'Uploaded'}
                        </span>

                        <button
                          onClick={() => handleTestTamper(item.id)}
                          className="text-[10px] text-slate-500 hover:text-amber-700 px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 cursor-pointer"
                          title="Simulate tamper to test cryptographic detection"
                        >
                          {isTampered ? 'Reset' : 'Test Tamper'}
                        </button>
                      </div>
                    </div>

                    {/* Hash & IPFS info */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
                      <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1 rounded-lg">
                        <span className="text-slate-400">SHA-256:</span>
                        <span className="text-slate-700 flex items-center gap-1 font-semibold">
                          {formatHash(displayHash, 6)}
                          <button
                            onClick={() => handleCopy(item.id, displayHash)}
                            className="cursor-pointer hover:text-blue-600"
                          >
                            {copiedHashId === item.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1 rounded-lg">
                        <span className="text-slate-400">IPFS CID:</span>
                        <span className="text-blue-700 truncate max-w-[140px] font-semibold">
                          {item.ipfsCid}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Privacy, Security & AI Notes matching Reference Image */}
        <div className="lg:col-span-4 space-y-4">
          {/* Privacy & Security Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Privacy & Security</span>
            </h4>

            <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                <span>All files are client-side encrypted before storage on IPFS.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                <span>Only authorized case parties and assigned jurors can decrypt evidence.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                <span>Evidence integrity is verifiable on blockchain with SHA-256 digests.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                <span>Do not upload sensitive information unnecessarily (e.g. passwords, pins).</span>
              </div>
            </div>
          </div>

          {/* AI Note Card matching Reference Image */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-amber-800 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>AI Note</span>
            </div>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              Evidence will be analyzed for relevant factual content. Malicious files are scanned and isolated before processing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
