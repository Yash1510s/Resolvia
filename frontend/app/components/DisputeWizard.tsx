'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Upload,
  FileText,
  Shield,
  Coins,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Lock,
  Check,
  AlertCircle,
} from 'lucide-react';
import { DisputeCategory, DisputeCase, EvidenceItem } from '../types';
import { computeSha256, generateMockCid } from '../lib/crypto';

interface DisputeWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCaseCreated: (newCase: DisputeCase) => void;
}

const STEPS = [
  { step: 1, title: 'Case Details' },
  { step: 2, title: 'Parties' },
  { step: 3, title: 'Evidence' },
  { step: 4, title: 'Review' },
  { step: 5, title: 'Submit' },
];

export const DisputeWizard: React.FC<DisputeWizardProps> = ({
  isOpen,
  onClose,
  onCaseCreated,
}) => {
  const [step, setStep] = useState<number>(1);
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<DisputeCategory>('FREELANCE_DEV');
  const [claimantName, setClaimantName] = useState<string>('Yash Vijay Singh (Claimant)');
  const [respondentName, setRespondentName] = useState<string>('Rohit Sharma (Apex Dev)');
  const [respondentWallet, setRespondentWallet] = useState<string>('0x17c9...a42e');
  const [disputeAmount, setDisputeAmount] = useState<string>('3,200 USDC');
  const [claimSummary, setClaimSummary] = useState<string>('');
  const [desiredOutcome, setDesiredOutcome] = useState<string>('');
  const [disclosurePref, setDisclosurePref] = useState<'public' | 'private' | 'legal'>('public');

  // Evidence state
  const [evidenceTitle, setEvidenceTitle] = useState<string>('');
  const [evidenceFile, setEvidenceFile] = useState<string>('attendance_screenshot_log.png');
  const [uploadedEvidenceList, setUploadedEvidenceList] = useState<EvidenceItem[]>([]);
  const [isHashing, setIsHashing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleAddEvidence = async () => {
    if (!evidenceTitle) return;
    setIsHashing(true);
    const mockContent = `${evidenceTitle}-${Date.now()}-${evidenceFile}`;
    const hash = await computeSha256(mockContent);
    const cid = generateMockCid(hash);

    const newEvidence: EvidenceItem = {
      id: `ev-new-${Date.now()}`,
      title: evidenceTitle,
      description: 'Uploaded and cryptographically hashed during dispute intake.',
      fileName: evidenceFile,
      fileSize: '1.4 MB',
      mimeType: 'image/png',
      sha256Hash: hash,
      ipfsCid: cid,
      submittedBy: 'Claimant',
      submitterWallet: '0x8842...3f91',
      submittedAt: new Date().toISOString(),
      accessTier: 'PARTY_ONLY',
      encrypted: true,
    };

    setUploadedEvidenceList(prev => [...prev, newEvidence]);
    setEvidenceTitle('');
    setIsHashing(false);
  };

  const handleFinalSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const caseIdNumber = Math.floor(1000 + Math.random() * 9000);
      const newDispute: DisputeCase = {
        id: `case-${caseIdNumber}`,
        caseNumber: `RSLV-2026-${caseIdNumber}`,
        title: title || 'New Dispute Submission',
        category,
        status: 'SUBMITTED',
        disputeAmount: disputeAmount || '1,000 USDC',
        createdAt: new Date().toISOString(),
        responseDeadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        votingDeadline: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        claimant: {
          name: claimantName,
          wallet: '0x8842...3f91',
          stake: 500,
        },
        respondent: {
          name: respondentName,
          wallet: respondentWallet,
          stake: 500,
          responded: false,
        },
        claimSummary: claimSummary || 'Claimant filed petition regarding unfulfilled obligations.',
        reliefSought: desiredOutcome || 'Refund of payment and arbitration cost reimbursement.',
        evidence: uploadedEvidenceList.length > 0 ? uploadedEvidenceList : [
          {
            id: 'ev-init-1',
            title: 'Initial Claim Statement & Verification Proof',
            description: 'Signed filing declaration.',
            fileName: 'claim_docket_filing.pdf',
            fileSize: '820 KB',
            mimeType: 'application/pdf',
            sha256Hash: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
            ipfsCid: 'bafybeiclaiminit001928374659281726354819203948571625342q7z',
            submittedBy: 'Claimant',
            submitterWallet: '0x8842...3f91',
            submittedAt: new Date().toISOString(),
            accessTier: 'PUBLIC',
            encrypted: false,
          }
        ],
        jurors: [
          {
            jurorId: 'j-new-1',
            name: 'Juror Carol (Contract Specialist)',
            walletAddress: '0x32a1...9b28',
            reputationScore: 96,
            stakedAmount: 1500,
            status: 'PENDING_COMMIT',
          },
          {
            jurorId: 'j-new-2',
            name: 'Juror Dave (Auditor)',
            walletAddress: '0x49c2...11ad',
            reputationScore: 92,
            stakedAmount: 1200,
            status: 'PENDING_COMMIT',
          },
          {
            jurorId: 'j-new-3',
            name: 'Juror Elena (Tech Arbitrator)',
            walletAddress: '0x88f1...33ee',
            reputationScore: 95,
            stakedAmount: 1800,
            status: 'PENDING_COMMIT',
          }
        ],
        auditTrail: [
          {
            eventId: `evt-${Date.now()}`,
            eventNumber: 'EVENT 001',
            title: 'Dispute Petition Filed & Initial Escrow Locked',
            actor: '0x8842...3f91',
            actorRole: 'Claimant',
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
            txHash: '0x' + Math.random().toString(16).substring(2, 66),
            blockNumber: 6286400,
            metadataHash: '0x' + Math.random().toString(16).substring(2, 66),
            details: `Dispute Case #${caseIdNumber} registered. 500 DRA stake locked in escrow.`,
          },
        ],
      };

      onCaseCreated(newDispute);
      setIsSubmitting(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 shadow-2xl flex flex-col scrollbar-none">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Create a New Case</h2>
              <p className="text-xs text-slate-500">
                AI-assisted, blockchain-backed dispute resolution platform
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

        {/* Stepper matching Reference Image Panel 3 */}
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between gap-2 overflow-x-auto">
          {STEPS.map((s) => {
            const isDone = step > s.step;
            const isCurrent = step === s.step;
            return (
              <div key={s.step} className="flex items-center gap-2 shrink-0">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-400 border border-slate-300'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.step}
                </div>
                <span
                  className={`text-xs font-semibold ${
                    isCurrent ? 'text-blue-600 font-bold' : isDone ? 'text-slate-800' : 'text-slate-400'
                  }`}
                >
                  {s.title}
                </span>
                {s.step < 5 && (
                  <div className="w-8 h-[1px] bg-slate-200 mx-1"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Body 2-Column Layout matching Reference */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Form (col 8) */}
          <div className="lg:col-span-8 space-y-4">
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Let's start your case</h3>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Case Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Unfair Project Contribution / Smart Contract SLA Breach"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors shadow-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as DisputeCategory)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 transition-colors shadow-xs"
                  >
                    <option value="IP_ACADEMIC">Academic Dispute / Contribution</option>
                    <option value="FREELANCE_DEV">Freelance Dev / Milestone SLA</option>
                    <option value="MARKETPLACE">Marketplace / Escrow Delivery</option>
                    <option value="DAO_GOVERNANCE">DAO Governance & Grant Vesting</option>
                    <option value="SERVICE_SLA">Enterprise Cloud & API SLA</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Description *</label>
                  <textarea
                    value={claimSummary}
                    onChange={(e) => setClaimSummary(e.target.value)}
                    rows={4}
                    placeholder="Explain the issue in detail..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors resize-none shadow-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Desired Outcome *</label>
                  <input
                    type="text"
                    value={desiredOutcome}
                    onChange={(e) => setDesiredOutcome(e.target.value)}
                    placeholder="What resolution are you seeking?"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors shadow-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Disclosure Preference</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'public', label: 'Public (Show names & summary)' },
                      { id: 'private', label: 'Anonymous (Hide identities)' },
                      { id: 'legal', label: 'Legal Only (Court Restricted)' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setDisclosurePref(p.id as any)}
                        className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition-all ${
                          disclosurePref === p.id
                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Parties Involved</h3>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Claimant Name (You)</label>
                  <input
                    type="text"
                    value={claimantName}
                    onChange={(e) => setClaimantName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Respondent Name / Entity *</label>
                  <input
                    type="text"
                    value={respondentName}
                    onChange={(e) => setRespondentName(e.target.value)}
                    placeholder="e.g. Rohit Sharma / Apex Dev"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Respondent Wallet Address or Email</label>
                  <input
                    type="text"
                    value={respondentWallet}
                    onChange={(e) => setRespondentWallet(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Disputed Escrow Value</label>
                  <input
                    type="text"
                    value={disputeAmount}
                    onChange={(e) => setDisputeAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Upload Evidence</h3>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Evidence Title</label>
                    <input
                      type="text"
                      value={evidenceTitle}
                      onChange={(e) => setEvidenceTitle(e.target.value)}
                      placeholder="e.g. Chat Export / Git Commit Logs"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900"
                    />
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={evidenceFile}
                      onChange={(e) => setEvidenceFile(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 font-mono"
                    />
                    <button
                      onClick={handleAddEvidence}
                      disabled={isHashing || !evidenceTitle}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all"
                    >
                      {isHashing ? 'Hashing...' : 'Add Item'}
                    </button>
                  </div>
                </div>

                {uploadedEvidenceList.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">Staged Evidence ({uploadedEvidenceList.length}):</p>
                    {uploadedEvidenceList.map((ev, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs shadow-xs">
                        <div>
                          <span className="font-semibold text-slate-900">{ev.title}</span>
                          <span className="text-slate-400 ml-2">({ev.fileName})</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono font-bold">SHA-256 Hashed</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Review Dispute Docket</h3>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Title</span>
                    <span className="font-bold text-slate-900 text-sm">{title || 'Smart Contract SLA Breach'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                    <span className="font-semibold text-blue-600">{category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Parties</span>
                    <span className="text-slate-800 font-medium">{claimantName} vs {respondentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Disputed Amount</span>
                    <span className="font-mono text-emerald-600 font-bold">{disputeAmount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Relief Sought</span>
                    <span className="text-slate-800">{desiredOutcome || 'Full Escrow Release'}</span>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4 text-center py-6">
                <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Ready for On-Chain Filing</h3>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1">
                    Your 10 DRA arbitration stake will be escrowed. Assigned jurors and the respondent will be immediately notified.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Guidelines & Stake Sidebar matching Reference Image Panel 3 */}
          <div className="lg:col-span-4 space-y-4">
            {/* Case Creation Guidelines Card */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Case Creation Guidelines
              </h4>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                  <span>Be clear and factual</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                  <span>Provide relevant evidence</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                  <span>Avoid abusive or false claims</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                  <span>Respect privacy and community rules</span>
                </div>
              </div>
            </div>

            {/* Stake Requirement Card matching Reference Image */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-blue-50/70 to-slate-50 border border-blue-200 shadow-xs space-y-3 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Case Creation Requires Stake
              </span>
              <div className="w-12 h-12 rounded-full bg-amber-500 text-white font-mono font-black text-sm mx-auto flex items-center justify-center shadow-md">
                10 DRA
              </div>
              <p className="text-xs font-bold text-slate-900">10 DRA Protocol Stake</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Your stake will be refunded if the case is genuine. Frivolous cases may result in a partial or full slash.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-200 cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-xs font-semibold text-slate-500 border border-slate-200 cursor-pointer shadow-xs"
            >
              Cancel
            </button>
          )}

          {step < 5 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-md active:scale-[0.98]"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-2 active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Filing on Ledger...' : 'Submit Dispute'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
