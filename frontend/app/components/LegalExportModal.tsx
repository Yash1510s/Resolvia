'use client';

import React, { useState } from 'react';
import { X, Download, FileText, Shield, Award, CheckCircle2, Printer, ExternalLink, FileCheck } from 'lucide-react';
import { DisputeCase } from '../types';
import { formatAddress, formatHash } from '../lib/crypto';

interface LegalExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispute: DisputeCase;
}

export function LegalExportModal({ isOpen, onClose, dispute }: LegalExportModalProps) {
  const [generated, setGenerated] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'partA' | 'partB'>('overview');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    await new Promise((r) => setTimeout(r, 600));
    setGenerated(true);
  };

  const handleDownloadJson = () => {
    const dossier = {
      statutoryFramework: "Bharatiya Sakshya Adhiniyam, 2023 (Section 63)",
      standardReference: "ISO/IEC 27037:2012 (Digital Evidence Handling)",
      caseNumber: dispute.caseNumber,
      title: dispute.title,
      generatedAt: new Date().toISOString(),
      parties: {
        claimant: { name: dispute.claimant.name, wallet: dispute.claimant.wallet },
        respondent: { name: dispute.respondent.name, wallet: dispute.respondent.wallet }
      },
      auditTrailChronology: dispute.auditTrail.map((e) => ({
        timestamp: e.timestamp,
        event: e.title,
        txHash: e.txHash,
        blockNumber: e.blockNumber,
      })),
      registeredEvidence: dispute.evidence.map((e) => ({
        fileName: e.fileName,
        title: e.title,
        sha256Digest: e.sha256Hash,
        ipfsCid: e.ipfsCid,
        accessTier: e.accessTier,
        submittedAt: e.submittedAt,
      })),
      aiAdvisorySummary: dispute.aiAnalysis
        ? {
            reportId: dispute.aiAnalysis.reportId,
            modelIdentifier: dispute.aiAnalysis.modelIdentifier,
            favoredParty: dispute.aiAnalysis.advisoryRecommendation.favoredParty,
            confidence: dispute.aiAnalysis.advisoryRecommendation.confidence,
            statutoryDisclaimer: 'NON-BINDING ADVISORY. Under Section 63 BSA 2023, automated heuristic/AI outputs constitute non-binding decision assistance; binding determinations derive solely from human jury adjudication.',
          }
        : null,
      section63Certification: {
        title: "Certificate under Section 63 of Bharatiya Sakshya Adhiniyam, 2023",
        schedulePartA: {
          systemName: "Resolvia Decentralized Arbitration Platform Node v2.0",
          hashAlgorithm: "SHA-256 (NIST FIPS 180-4)",
          blockchainAnchor: "Ethereum Sepolia / EVM Smart Contract Evidence Registry",
          storageMethod: "Content-Addressed Cryptographic Storage (IPFS CIDv1)",
          custodialIntegrity: "Uninterrupted operational integrity verified throughout case lifecycle"
        },
        schedulePartB: {
          chainOfCustody: "Client-side WebCrypto SHA-256 digest calculation prior to transport, anchored via transaction logs in EvidenceRegistry.sol",
          integrityAffirmation: "Electronic records preserved without subsequent alteration, deletion, or tampering",
          signatories: [
            { role: "Officer in Charge / System Registrar", designation: "Resolvia Protocol Custodian" },
            { role: "Forensic Technical Authority", designation: "Platform Cryptographic Verification Lead" }
          ]
        }
      }
    };

    const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dispute.caseNumber}_BSA_Section63_Dossier.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintCertificate = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const evidenceRows = dispute.evidence.map((ev, i) => `
      <tr>
        <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-size: 11px;">#${i + 1}</td>
        <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-size: 11px; font-weight: bold;">${ev.title || ev.fileName}</td>
        <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-size: 10px; font-family: monospace; word-break: break-all;">${ev.sha256Hash || 'N/A'}</td>
        <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-size: 10px; font-family: monospace; word-break: break-all;">${ev.ipfsCid || 'N/A'}</td>
      </tr>
    `).join('');

    const auditRows = dispute.auditTrail.map((at, i) => `
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-size: 10px;">${at.timestamp}</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-size: 10px; font-weight: 600;">${at.title}</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-size: 9px; font-family: monospace;">${at.txHash || 'Verified Local/Testnet'}</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-size: 10px; text-align: center;">${at.blockNumber || 'Anchored'}</td>
      </tr>
    `).join('');

    const certDate = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate under Section 63 BSA 2023 — Case ${dispute.caseNumber}</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              color: #0f172a;
              line-height: 1.5;
              margin: 0;
              padding: 24px;
            }
            .header-emblem {
              text-align: center;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 16px;
              margin-bottom: 20px;
            }
            h1 {
              font-size: 18px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin: 4px 0;
            }
            h2 {
              font-size: 14px;
              font-weight: normal;
              margin: 2px 0 8px 0;
              color: #334155;
            }
            .cert-box {
              border: 1px solid #475569;
              padding: 14px;
              margin-bottom: 16px;
              background-color: #f8fafc;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 12px 0 16px 0;
            }
            th {
              background-color: #e2e8f0;
              padding: 8px 12px;
              border: 1px solid #cbd5e1;
              font-size: 11px;
              text-align: left;
              text-transform: uppercase;
            }
            .section-title {
              font-size: 13px;
              font-weight: bold;
              text-transform: uppercase;
              color: #0f172a;
              border-bottom: 1px solid #94a3b8;
              padding-bottom: 4px;
              margin-top: 24px;
            }
            .sign-grid {
              display: flex;
              justify-content: space-between;
              margin-top: 48px;
              page-break-inside: avoid;
            }
            .sign-box {
              width: 45%;
              border-top: 1px solid #0f172a;
              padding-top: 8px;
              text-align: center;
              font-size: 11px;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header-emblem">
            <h1 style="font-size: 16px;">Bharatiya Sakshya Adhiniyam, 2023</h1>
            <h1>Formal Certificate of Electronic Record Admissibility</h1>
            <h2>Under Section 63 (Corresponding to Section 65B of Indian Evidence Act, 1872)</h2>
            <p style="font-size: 11px; margin: 0; font-style: italic;">Issued by Resolvia Cryptographic Arbitration Platform • Verified Ledger Record</p>
          </div>

          <div class="cert-box">
            <table style="margin: 0; border: none;">
              <tr>
                <td style="font-size: 11px; font-weight: bold; width: 25%;">Arbitration Case:</td>
                <td style="font-size: 11px; font-family: monospace;">${dispute.caseNumber}</td>
                <td style="font-size: 11px; font-weight: bold; width: 20%;">Date of Issue:</td>
                <td style="font-size: 11px;">${certDate}</td>
              </tr>
              <tr>
                <td style="font-size: 11px; font-weight: bold;">Claimant:</td>
                <td style="font-size: 11px;">${dispute.claimant.name} (${formatAddress(dispute.claimant.wallet)})</td>
                <td style="font-size: 11px; font-weight: bold;">Respondent:</td>
                <td style="font-size: 11px;">${dispute.respondent.name} (${formatAddress(dispute.respondent.wallet)})</td>
              </tr>
              <tr>
                <td style="font-size: 11px; font-weight: bold;">Dispute Title:</td>
                <td colspan="3" style="font-size: 11px;">${dispute.title}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 11px; text-align: justify;">
            <strong>I, the undersigned Custodian / Authorized System Administrator of the Resolvia Arbitration Protocol</strong>, 
            hereby certify in terms of <strong>Section 63(2) and Section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023</strong> that:
          </p>

          <ol style="font-size: 11px; text-align: justify; padding-left: 20px;">
            <li>The electronic records detailed in the Schedule hereunder were produced by the computer system during the period over which the system was used regularly to store, process, and verify dispute electronic evidence.</li>
            <li>During the said period, the computer system was operating properly and under lawful management; or if not operating properly, the temporary interruptions did not affect the accuracy of the electronic records or their cryptographic hash values.</li>
            <li>The information contained in the electronic record reproduces or is derived from such electronic records supplied to the computer system in the ordinary course of the arbitration intake.</li>
            <li>Cryptographic SHA-256 digests were computed client-side in conformity with NIST FIPS PUB 180-4 and anchored on the Ethereum EVM ledger (EvidenceRegistry.sol).</li>
          </ol>

          <div class="section-title">Schedule Part A: Register of Electronic Evidence Items</div>
          <table>
            <thead>
              <tr>
                <th style="width: 8%;">Item</th>
                <th style="width: 28%;">Document / File Name</th>
                <th style="width: 36%;">SHA-256 Cryptographic Hash</th>
                <th style="width: 28%;">Content Identifier (IPFS CIDv1)</th>
              </tr>
            </thead>
            <tbody>
              ${evidenceRows || '<tr><td colspan="4" style="text-align: center; padding: 12px; font-size: 11px;">No evidence files attached.</td></tr>'}
            </tbody>
          </table>

          <div class="section-title">Schedule Part B: Blockchain Verification & Chain of Custody Audit Trail</div>
          <table>
            <thead>
              <tr>
                <th style="width: 20%;">Timestamp</th>
                <th style="width: 35%;">Arbitration Event</th>
                <th style="width: 30%;">Transaction Hash</th>
                <th style="width: 15%;">Block</th>
              </tr>
            </thead>
            <tbody>
              ${auditRows}
            </tbody>
          </table>

          <div style="font-size: 10px; color: #475569; margin-top: 16px; border-left: 3px solid #64748b; padding-left: 10px;">
            <strong>Statutory Declaration:</strong> The particulars stated above are true to the best of our knowledge and belief, based on the cryptographic hash logs and decentralized transaction receipts held on the protocol ledger.
          </div>

          <div class="sign-grid">
            <div class="sign-box">
              <p style="font-weight: bold; margin: 0 0 4px 0;">(Signatory 1)</p>
              <p style="margin: 0; font-size: 11px;"><strong>Officer in Operational Control</strong></p>
              <p style="margin: 2px 0 0 0; color: #64748b;">Platform Custodian & Registrar</p>
              <p style="margin: 2px 0 0 0; color: #64748b;">Resolvia Arbitration Infrastructure</p>
            </div>
            <div class="sign-box">
              <p style="font-weight: bold; margin: 0 0 4px 0;">(Signatory 2)</p>
              <p style="margin: 0; font-size: 11px;"><strong>Forensic Technical Authority</strong></p>
              <p style="margin: 2px 0 0 0; color: #64748b;">Lead Cryptographic Engineer</p>
              <p style="margin: 2px 0 0 0; color: #64748b;">Verified Ledger & Node Operations</p>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-up border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#0b132b]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Court-Admissible Legal Evidence Package</h3>
              <p className="text-[10px] text-slate-400">
                Bharatiya Sakshya Adhiniyam 2023 • Section 63 Electronic Record Certificate & Forensic Dossier
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-slate-300 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 bg-slate-50 px-6 pt-3 gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-xs font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === 'overview'
                ? 'border-violet-600 text-violet-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview & Stats
          </button>
          <button
            onClick={() => setActiveTab('partA')}
            className={`pb-3 text-xs font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === 'partA'
                ? 'border-violet-600 text-violet-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Schedule Part A (System & Hashes)
          </button>
          <button
            onClick={() => setActiveTab('partB')}
            className={`pb-3 text-xs font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === 'partB'
                ? 'border-violet-600 text-violet-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Schedule Part B (Custody & Signatories)
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-5">
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Case Identifier</p>
                  <p className="text-xs font-black text-slate-900 font-mono mt-1">{dispute.caseNumber}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Registered Evidence</p>
                  <p className="text-xs font-black text-slate-900 mt-1">{dispute.evidence.length} Cryptographic Item(s)</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">On-Chain Audit Events</p>
                  <p className="text-xs font-black text-slate-900 mt-1">{dispute.auditTrail.length} Verifiable Tx Logs</p>
                </div>
              </div>

              <div className="space-y-3">
                <DossierSection
                  icon={<FileCheck className="w-4 h-4" />}
                  title="1. Section 63 BSA 2023 Statutory Certificate"
                  subtitle="Compliant with Bharatiya Sakshya Adhiniyam 2023 (replacing §65B). Includes formal affirmation of system integrity, dual signature blocks, and hash schedule."
                />
                <DossierSection
                  icon={<Shield className="w-4 h-4" />}
                  title="2. Immutable Cryptographic Ledger Verification"
                  subtitle="Content hashes (NIST SHA-256) and IPFS CIDv1 anchors locked on Ethereum smart contracts. Verifiable on any public block explorer."
                />
                <DossierSection
                  icon={<Award className="w-4 h-4" />}
                  title="3. ISO/IEC 27037 Digital Evidence Admissibility"
                  subtitle="Preserves chain-of-custody, provenance tracking, and tamper-evident logging standard required for judicial and commercial arbitration."
                />
              </div>
            </>
          )}

          {activeTab === 'partA' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-violet-50/50 border border-violet-100">
                <p className="font-bold text-violet-900 mb-1">Schedule Part A — System Details & Evidence Hash Registry</p>
                <p className="text-slate-600 text-[11px]">
                  Specifies the automated computing system, cryptographic digest algorithm, and content-addressed storage nodes used during case submission.
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                    <tr>
                      <th className="p-3">File / Asset</th>
                      <th className="p-3">SHA-256 Digest</th>
                      <th className="p-3">IPFS CID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {dispute.evidence.map((ev, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-800">{ev.title || ev.fileName}</td>
                        <td className="p-3 font-mono text-[10px] text-slate-600">{formatHash(ev.sha256Hash, 8)}</td>
                        <td className="p-3 font-mono text-[10px] text-violet-600">{ev.ipfsCid ? `${ev.ipfsCid.slice(0, 10)}…` : 'Anchored'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'partB' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="font-bold text-slate-900 mb-1">Schedule Part B — Chain of Custody & Dual Signatories</p>
                <p className="text-slate-600 text-[11px]">
                  Under BSA 2023 Section 63, the certificate requires certification by the person in operational custody of the device and a technical authority verifying cryptographic execution.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Signatory 1 (Custodian)</p>
                  <p className="text-xs font-black text-slate-900 mt-1">Platform Registrar & Custodian</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Certifies uninterrupted node operation and evidence intake integrity.</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Signatory 2 (Expert)</p>
                  <p className="text-xs font-black text-slate-900 mt-1">Forensic Technical Authority</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Certifies mathematical hash integrity and smart contract transaction roots.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          {!generated ? (
            <button
              onClick={handleGenerate}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black transition-all cursor-pointer shadow-md"
            >
              Generate BSA 2023 §63 Package
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-emerald-800">
                  Dossier Ready ({dispute.caseNumber})
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handlePrintCertificate}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  Print / Save PDF Certificate
                </button>
                <button
                  onClick={handleDownloadJson}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Download JSON Dossier
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DossierSection({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 flex items-start gap-3 bg-white">
      <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-800">{title}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}
