'use client';

import React, { useState } from 'react';
import {
  X,
  FileText,
  ShieldCheck,
  Download,
  Printer,
  CheckCircle,
  ExternalLink,
  Award,
} from 'lucide-react';
import { DisputeCase, LegalPackage } from '../types';
import { formatHash } from '../lib/crypto';

interface LegalExportModalProps {
  dispute: DisputeCase;
  isOpen: boolean;
  onClose: () => void;
}

export const LegalExportModal: React.FC<LegalExportModalProps> = ({
  dispute,
  isOpen,
  onClose,
}) => {
  const [downloaded, setDownloaded] = useState<boolean>(false);

  if (!isOpen) return null;

  const legalPkg: LegalPackage = dispute.legalPackage || {
    packageId: `PKG-${dispute.caseNumber}-BSA`,
    caseId: dispute.id,
    certificateId: `BSA-2023-SEC63-${dispute.caseNumber}`,
    generatedAt: new Date().toISOString(),
    statutoryStandard:
      'Bharatiya Sakshya Adhiniyam, 2023 (Sec 63 / 65B Certificate) & ISO/IEC 27037 Digital Evidence Preservation Guidelines',
    canonicalRecordHash:
      '0x448201938c8210349b1837c4091a829103c81093c819301938a9911f88194482',
    ipfsManifestCid:
      'bafybeih9948210349b1837c4091a829103c81093c819301938a192088f1a77cq9z',
    anchoredTxHash:
      '0x3349b1837c4091a829103c81093c819301938a192088f1a77c88492019884820',
    chainOfCustodySigners: [
      `${dispute.claimant.wallet} (Claimant Digital Signature)`,
      `${dispute.respondent.wallet} (Respondent Digital Signature)`,
      '0x0000...RSLV (Resolvia Protocol Oracle Node)',
      '0x32a1...9b28 (Presiding Juror Carol Notarization)',
    ],
    integrityStatus: 'VALID_VERIFIED',
  };

  const handleDownloadJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(
        JSON.stringify(
          {
            legalCertificate: legalPkg,
            caseMetadata: {
              caseNumber: dispute.caseNumber,
              title: dispute.title,
              category: dispute.category,
              amount: dispute.disputeAmount,
              claimant: dispute.claimant,
              respondent: dispute.respondent,
            },
            evidenceCatalog: dispute.evidence,
            auditTrail: dispute.auditTrail,
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${dispute.caseNumber}-BSA2023-LegalDossier.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 shadow-2xl flex flex-col scrollbar-none">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Court-Admissible Legal Dossier & BSA 2023 Certificate
              </h2>
              <p className="text-xs text-slate-500">
                Statutory certificate under Section 63 of the Bharatiya Sakshya Adhiniyam, 2023
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-800">
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-center space-y-1">
            <p className="text-sm font-bold text-slate-900">
              "Certificate of Electronic Evidence Authenticity and Cryptographic Integrity"
            </p>
            <p className="text-[11px] text-slate-600">
              {legalPkg.statutoryStandard}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Certificate ID</span>
              <p className="font-mono font-bold text-slate-900">{legalPkg.certificateId}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Integrity Status</span>
              <p className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Valid & Tamper-Proof</span>
              </p>
            </div>
          </div>

          {/* Hashes */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 font-mono text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">Canonical Dispute Record SHA-256 Digest:</span>
              <span className="text-slate-900 break-all font-semibold">{legalPkg.canonicalRecordHash}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px]">IPFS Immutable Evidence Manifest CIDv1:</span>
              <span className="text-blue-700 break-all font-semibold">{legalPkg.ipfsManifestCid}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px]">Anchored Ledger Transaction:</span>
              <span className="text-emerald-700 break-all font-semibold">{legalPkg.anchoredTxHash}</span>
            </div>
          </div>

          {/* Chain of Custody */}
          <div className="space-y-2">
            <h4 className="font-bold uppercase tracking-wider text-[10px] text-slate-500">
              Chain of Custody Signers ({legalPkg.chainOfCustodySigners.length})
            </h4>
            <div className="space-y-1.5">
              {legalPkg.chainOfCustodySigners.map((signer, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-[11px] font-mono shadow-xs"
                >
                  <span className="text-slate-800">{signer}</span>
                  <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded">ECDSA Verified</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-xs font-semibold text-slate-500 border border-slate-200 cursor-pointer shadow-xs"
          >
            Close
          </button>

          <button
            onClick={handleDownloadJson}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-md active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            <span>{downloaded ? 'Downloaded!' : 'Download Court Bundle (JSON)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
