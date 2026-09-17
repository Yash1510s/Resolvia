'use client';

import React, { useState } from 'react';
import { X, Download, FileText, Shield, Award, CheckCircle2 } from 'lucide-react';
import { DisputeCase } from '../types';
import { formatAddress, formatHash } from '../lib/crypto';

interface LegalExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispute: DisputeCase;
}

export function LegalExportModal({ isOpen, onClose, dispute }: LegalExportModalProps) {
  const [generated, setGenerated] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    await new Promise((r) => setTimeout(r, 700));
    setGenerated(true);
  };

  const handleDownload = () => {
    const dossier = {
      caseNumber: dispute.caseNumber,
      title: dispute.title,
      generatedAt: new Date().toISOString(),
      parties: { claimant: dispute.claimant.name, respondent: dispute.respondent.name },
      chronology: dispute.auditTrail.map((e) => ({
        timestamp: e.timestamp,
        event: e.title,
        txHash: e.txHash,
        blockNumber: e.blockNumber,
      })),
      evidence: dispute.evidence.map((e) => ({
        fileName: e.fileName,
        title: e.title,
        sha256: e.sha256Hash,
        ipfsCid: e.ipfsCid,
        accessTier: e.accessTier,
        submittedAt: e.submittedAt,
      })),
      aiAdvisory: dispute.aiAnalysis
        ? {
            reportId: dispute.aiAnalysis.reportId,
            favoredParty: dispute.aiAnalysis.advisoryRecommendation.favoredParty,
            confidence: dispute.aiAnalysis.advisoryRecommendation.confidence,
            disclaimer: 'NON-BINDING ADVISORY. Under BSA 2023, electronic records tendered as evidence require a Section 63 certificate; this AI output must be treated as hearsay/secondary material unless independently verified.',
          }
        : null,
      section63CertificateTemplate: {
        note: 'Certificate under Section 63, Bharatiya Sakshya Adhiniyam 2023 (corresponds to former Section 65B IEA 1972)',
        fields: [
          '1. Name & designation of the person in operational control of the device',
          '2. Certificate of the expert who generated / authenticated the electronic record',
          '3. Hash value of the electronic record (SHA-256)',
          '4. Schedule Part A: details of the device & media from which the record was extracted',
          '5. Schedule Part B: chain of custody & process of extraction',
          '6. Statement that the record has not been altered since generation',
        ],
        signatories: ['Person in charge (device)', 'Expert (authentication)'],
      },
    };

    const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dispute.caseNumber}_BSA_Dossier.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#0b132b]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Court-Admissible Legal Dossier</h3>
              <p className="text-[10px] text-slate-400">
                Bharatiya Sakshya Adhiniyam 2023 • Section 63 Electronic Record Certificate
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-slate-300 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Case</p>
              <p className="text-xs font-black text-slate-900 font-mono mt-1">{dispute.caseNumber}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Evidence Items</p>
              <p className="text-xs font-black text-slate-900 mt-1">{dispute.evidence.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">On-Chain Events</p>
              <p className="text-xs font-black text-slate-900 mt-1">{dispute.auditTrail.length}</p>
            </div>
          </div>

          {/* Dossier sections */}
          <div className="space-y-3">
            <DossierSection
              icon={<FileText className="w-4 h-4" />}
              title="1. Chronology of Events (On-Chain Audit Trail)"
              subtitle="Every row maps to a verifiable transaction hash and block number on Ethereum Sepolia."
            />
            <DossierSection
              icon={<Shield className="w-4 h-4" />}
              title="2. Evidence Registry (SHA-256 + IPFS)"
              subtitle="Immutable fingerprints with IPFS CIDs. Third parties can re-download and re-hash to confirm integrity."
            />
            <DossierSection
              icon={<CheckCircle2 className="w-4 h-4" />}
              title="3. AI Advisory (Explicitly Marked Non-Binding)"
              subtitle="Included for context only. The certificate template states it is hearsay material pending independent verification."
            />
            <DossierSection
              icon={<Award className="w-4 h-4" />}
              title="4. Section 63 / 65B Certificate Template"
              subtitle="Two signatories (person in charge + expert), hash value, Schedule Part A & Part B fields — per BSA 2023 requirements."
            />
          </div>

          {!generated ? (
            <button
              onClick={handleGenerate}
              className="w-full p-4 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black transition-all cursor-pointer shadow-md"
            >
              Generate Dossier Package
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-xs font-black text-emerald-800">Dossier Package Ready</p>
                  <p className="text-[10px] text-emerald-700">
                    {dispute.caseNumber}_BSA_Dossier.json — contains chronology, hashes, CIDs, advisory disclaimer, §63 certificate template
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownload}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DossierSection({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-800">{title}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}
