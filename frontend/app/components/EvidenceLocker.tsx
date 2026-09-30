'use client';

import React, { useState, useRef } from 'react';
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
  Upload,
  Eye,
  X,
  Download,
} from 'lucide-react';
import { EvidenceItem } from '../types';
import { computeSha256, computeSha256Bytes, formatHash } from '../lib/crypto';
import { verifyEvidenceOnChain, getEvidenceContent } from '../lib/chain';

interface EvidenceLockerProps {
  evidence: EvidenceItem[];
  caseId: string;
  onAddEvidenceClick: () => void;
  onUploadFile?: (file: File) => Promise<void>;
}

export function EvidenceLocker({ evidence, caseId, onAddEvidenceClick, onUploadFile }: EvidenceLockerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tamperedId, setTamperedId] = useState<string | null>(null);
  const [tamperedPreview, setTamperedPreview] = useState('');
  const [tamperedReal, setTamperedReal] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<Record<string, 'ANCHORED' | 'NOT_FOUND' | 'UNKNOWN' | 'ERROR'>>({});
  const [viewingItem, setViewingItem] = useState<EvidenceItem | null>(null);

  /** Real tamper: flip one bit of the ORIGINAL bytes (if cached this session) and re-hash. */
  const handleTamperSimulate = async (ev: EvidenceItem) => {
    if (tamperedId === ev.id) {
      setTamperedId(null);
      setTamperedPreview('');
      setTamperedReal(false);
      return;
    }
    setTamperedId(ev.id);
    const bytes = getEvidenceContent(ev.sha256Hash);
    if (bytes) {
      const copy = new Uint8Array(bytes);
      copy[0] = copy[0] ^ 0x01; // single-bit mutation
      const h = await computeSha256Bytes(copy.buffer.slice(0) as ArrayBuffer);
      setTamperedPreview(h);
      setTamperedReal(true);
    } else {
      // No original bytes in this browser (demo dataset) — label it as simulated.
      const h = await computeSha256(ev.sha256Hash + ':tampered');
      setTamperedPreview(h);
      setTamperedReal(false);
    }
  };

  /** Real on-chain verification against the local EvidenceRegistry. */
  const handleVerify = async (ev: EvidenceItem) => {
    setVerifying(ev.id);
    setVerifyResult((prev) => ({ ...prev, [ev.id]: 'UNKNOWN' }));
    const res = await verifyEvidenceOnChain(ev.sha256Hash);
    setVerifyResult((prev) => ({
      ...prev,
      [ev.id]: res.status === 'ANCHORED' ? 'ANCHORED' : res.status === 'NOT_FOUND' ? 'NOT_FOUND' : 'ERROR',
    }));
    setVerifying(null);
  };

  return (
    <div className="space-y-4">
      {/* Explanation banner */}
      <div className="p-5 rounded-2xl bg-violet-50/60 border border-violet-100 flex items-start gap-3">
        <Fingerprint className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-violet-900">Immutable Evidence Vault</h4>
          <p className="text-[11px] text-violet-700/80 mt-1 leading-relaxed">
            Every artefact is SHA-256 fingerprinted in the browser before upload.
            The hash + CID are anchored on-chain in <span className="font-mono">EvidenceRegistry</span> (local testnet).
            <strong>Verify on-chain</strong> queries the real registry; <strong>Simulate Tamper</strong> mutates the original bytes and re-hashes them in your browser.
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
                  className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border shrink-0 ${
                    isTampered
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {isTampered ? (
                    'INTEGRITY FAILED'
                  ) : (
                    <>
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                      {ev.onChainAnchored ? 'ON-CHAIN ANCHORED' : 'LEDGER ANCHORED'}
                    </>
                  )}
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
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-slate-400 w-8 shrink-0">IPFS</span>
                    <span className="text-slate-600 truncate">{ev.ipfsCid ? `CID ${formatHash(ev.ipfsCid, 20)}` : 'pending pin'}</span>
                  </div>
                  {ev.ipfsCid && (
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${ev.ipfsCid}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-violet-600 hover:text-violet-800 underline text-[9.5px] ml-2 shrink-0"
                    >
                      Gateway ↗
                    </a>
                  )}
                </div>
                {ev.onChainAnchored && ev.onChainTx && (
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="text-slate-400 w-8 shrink-0">CHAIN</span>
                    <span className="text-emerald-600 font-bold">
                      tx {formatHash(ev.onChainTx, 14)} · block #{ev.onChainBlock?.toLocaleString() ?? '—'}
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleVerify(ev)}
                  disabled={verifying === ev.id}
                  className="px-3 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {verifying === ev.id ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Shield className="w-3 h-3" />
                  )}
                  <span>
                    {verifying === ev.id
                      ? 'Querying chain…'
                      : verifyResult[ev.id] === 'ANCHORED'
                      ? '✓ Anchored on-chain'
                      : verifyResult[ev.id] === 'NOT_FOUND'
                      ? 'No on-chain record'
                      : verifyResult[ev.id] === 'ERROR'
                      ? 'Chain query failed'
                      : 'Verify on-chain'}
                  </span>
                </button>

                <button
                  onClick={() => setViewingItem(ev)}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Eye className="w-3 h-3" />
                  <span>View File</span>
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
                    {tamperedReal
                      ? 'Original bytes mutated (1 bit) and re-hashed in-browser:'
                      : 'Original bytes not present in this browser — simulated tamper:'}{' '}
                    <span className="font-mono font-bold">{formatHash(tamperedPreview, 24)}</span>
                    <br />
                    Mismatch with the anchored fingerprint — this item would be rejected by the Verifier Portal.
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Add evidence tile */}
        <div className="min-h-[180px] p-5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-violet-400 hover:bg-violet-50/20 transition-all flex flex-col items-center justify-center gap-3 text-slate-400">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (onUploadFile) {
                  await onUploadFile(file);
                } else {
                  await onAddEvidenceClick();
                }
              }
              e.target.value = '';
            }}
          />
          <div className="w-10 h-10 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center">
            <Upload className="w-5 h-5" />
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Evidence File
            </button>
            <p className="text-[10px] text-slate-400 mt-2">
              Files are fingerprinted (SHA-256) in-browser & anchored on-chain
            </p>
          </div>
          <button
            type="button"
            onClick={onAddEvidenceClick}
            className="text-[10px] text-slate-500 hover:text-violet-600 underline cursor-pointer"
          >
            or generate dispute affidavit template
          </button>
        </div>
      </div>

      {/* ── File Preview Modal ── */}
      {viewingItem && (
        <FilePreviewModal item={viewingItem} onClose={() => setViewingItem(null)} />
      )}
    </div>
  );
}

function FilePreviewModal({ item, onClose }: { item: EvidenceItem; onClose: () => void }) {
  const contentBytes = getEvidenceContent(item.sha256Hash);

  // Render content based on available bytes or file URL / IPFS gateway
  const textContent = React.useMemo(() => {
    if (contentBytes) {
      try {
        const dec = new TextDecoder('utf-8');
        return dec.decode(contentBytes);
      } catch {
        return null;
      }
    }
    return null;
  }, [contentBytes]);

  const objectUrl = React.useMemo(() => {
    if (item.fileUrl) return item.fileUrl;
    if (contentBytes) {
      const blob = new Blob([contentBytes.buffer as ArrayBuffer], { type: item.mimeType || 'application/octet-stream' });
      return URL.createObjectURL(blob);
    }
    if (item.ipfsCid) {
      return `https://gateway.pinata.cloud/ipfs/${item.ipfsCid}`;
    }
    return null;
  }, [item, contentBytes]);

  // Clean up ObjectURL
  React.useEffect(() => {
    return () => {
      if (objectUrl && objectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  const isImage = item.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(item.fileName);
  const isPdf = item.mimeType === 'application/pdf' || item.fileName.endsWith('.pdf');
  const isText = item.mimeType?.startsWith('text/') || /\.(txt|log|json|md|js|ts|sol)$/i.test(item.fileName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">{item.title || item.fileName}</h3>
              <p className="text-[11px] text-slate-500 truncate">
                {item.fileName} • {item.fileSize} • Submitted by {item.submittedBy}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {objectUrl && (
              <a
                href={objectUrl}
                download={item.fileName}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto bg-slate-50/30 flex flex-col items-center justify-center min-h-[300px]">
          {isImage && objectUrl ? (
            <div className="max-w-full max-h-[60vh] flex items-center justify-center">
              {/* eslint-disable-next-html-link */}
              <img src={objectUrl} alt={item.fileName} className="max-w-full max-h-[60vh] object-contain rounded-xl border border-slate-200 shadow-xs" />
            </div>
          ) : isPdf && objectUrl ? (
            <iframe src={objectUrl} title={item.fileName} className="w-full h-[60vh] rounded-xl border border-slate-200" />
          ) : isText && textContent ? (
            <div className="w-full max-h-[60vh] overflow-y-auto p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed border border-slate-800">
              <pre className="whitespace-pre-wrap break-all">{textContent}</pre>
            </div>
          ) : textContent ? (
            <div className="w-full max-h-[60vh] overflow-y-auto p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed border border-slate-800">
              <pre className="whitespace-pre-wrap break-all">{textContent}</pre>
            </div>
          ) : (
            <div className="text-center p-8 space-y-3 max-w-md">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Off-Chain Raw Document Streamed</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  The original raw document binary is protected and content-addressed via cryptographic IPFS CID hash.
                </p>
              </div>
              {item.ipfsCid && (
                <div className="pt-2">
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${item.ipfsCid}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold transition-all border border-violet-200"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View on Decentralized IPFS Gateway
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer / Forensic Hashes */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-2 truncate">
            <span className="text-slate-400">SHA256:</span>
            <span className="text-slate-700 font-bold truncate">{item.sha256Hash}</span>
          </div>
          {item.ipfsCid && (
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <span className="text-slate-400">IPFS CID:</span>
              <span className="text-slate-700 font-bold">{formatHash(item.ipfsCid, 16)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
