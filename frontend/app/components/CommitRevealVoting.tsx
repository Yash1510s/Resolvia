'use client';

import React, { useState, useEffect } from 'react';
import {
  Scale,
  Lock,
  Unlock,
  CheckCircle,
  Clock,
  Key,
  Hash,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Copy,
  Check,
  FileText,
  FileCheck,
  MessagesSquare,
} from 'lucide-react';
import { JurorAssignment, VoteChoice } from '../types';
import {
  computeVoteCommitment,
  generateRandomSalt,
  verifyVoteCommitment,
  formatAddress,
  formatHash,
  formatDateSafe,
} from '../lib/crypto';

interface CommitRevealVotingProps {
  jurors: JurorAssignment[];
  currentJurorId: string;
  onCommitVote: (jurorId: string, commitmentHash: string, vote: VoteChoice, salt: string) => void;
  onRevealVote: (jurorId: string, vote: VoteChoice, salt: string) => void;
  votingDeadline: string;
}

export const CommitRevealVoting: React.FC<CommitRevealVotingProps> = ({
  jurors,
  currentJurorId,
  onCommitVote,
  onRevealVote,
  votingDeadline,
}) => {
  // Commit Phase State
  const [selectedVote, setSelectedVote] = useState<VoteChoice>('CLAIMANT_UPHELD');
  const [secretSalt, setSecretSalt] = useState<string>('0x8f92a104c8821034');
  const [computedCommitment, setComputedCommitment] = useState<string>('');
  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  const [copiedSalt, setCopiedSalt] = useState<boolean>(false);
  const [reasoning, setReasoning] = useState<string>('');

  // Reveal Phase State
  const [revealVoteInput, setRevealVoteInput] = useState<VoteChoice>('CLAIMANT_UPHELD');
  const [revealSaltInput, setRevealSaltInput] = useState<string>('');
  const [revealStatus, setRevealStatus] = useState<'IDLE' | 'SUCCESS' | 'MISMATCH'>('IDLE');
  const [isRevealing, setIsRevealing] = useState<boolean>(false);

  // Safe client mounting
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    setSecretSalt(generateRandomSalt());
  }, []);

  const activeJuror = jurors.find(j => j.jurorId === currentJurorId) || jurors[0];

  useEffect(() => {
    let isMounted = true;
    computeVoteCommitment(selectedVote, secretSalt).then(hash => {
      if (isMounted) setComputedCommitment(hash);
    });
    return () => {
      isMounted = false;
    };
  }, [selectedVote, secretSalt]);

  const handleGenerateNewSalt = () => {
    const s = generateRandomSalt();
    setSecretSalt(s);
  };

  const handleCopySalt = () => {
    navigator.clipboard.writeText(secretSalt);
    setCopiedSalt(true);
    setTimeout(() => setCopiedSalt(false), 2000);
  };

  const handleCommitSubmit = () => {
    if (!activeJuror) return;
    setIsCommitting(true);
    setTimeout(() => {
      onCommitVote(activeJuror.jurorId, computedCommitment, selectedVote, secretSalt);
      setIsCommitting(false);
    }, 600);
  };

  const handleRevealSubmit = async () => {
    if (!activeJuror || !activeJuror.commitmentHash) return;
    setIsRevealing(true);
    const isValid = await verifyVoteCommitment(
      revealVoteInput,
      revealSaltInput,
      activeJuror.commitmentHash
    );
    setTimeout(() => {
      setIsRevealing(false);
      if (isValid) {
        setRevealStatus('SUCCESS');
        onRevealVote(activeJuror.jurorId, revealVoteInput, revealSaltInput);
      } else {
        setRevealStatus('MISMATCH');
      }
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* 2-Column Grid matching Reference Image Panel 9 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Case Materials */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-600" />
              <span>Case Materials</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Review verified evidence and advisory findings before submitting your blind cryptographic ballot.
            </p>

            <div className="space-y-2 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-800 font-medium hover:border-blue-300 transition-colors cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Case Summary</span>
                </div>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">Verified</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-800 font-medium hover:border-blue-300 transition-colors cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-4 h-4 text-purple-600" />
                  <span>All Evidence (4 Items)</span>
                </div>
                <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-mono font-bold">IPFS CIDv1</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-800 font-medium hover:border-blue-300 transition-colors cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>AI Analysis Report</span>
                </div>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">0 Threats</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-800 font-medium hover:border-blue-300 transition-colors cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <MessagesSquare className="w-4 h-4 text-slate-600" />
                  <span>Discussion Forum</span>
                </div>
                <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-bold">Confidential</span>
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs space-y-1.5 text-slate-700">
            <div className="flex items-center gap-2 text-blue-700 font-bold">
              <Lock className="w-4 h-4" />
              <span>Anti-Collusion Commit-Reveal Protocol</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Your ballot is blinded with an off-chain cryptographic salt. No juror or party can inspect your choice until the reveal window opens.
            </p>
          </div>
        </div>

        {/* Right Column: Submit Your Vote */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Submit Your Vote</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assigned Panelist: <span className="font-semibold text-slate-800">{activeJuror?.name}</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                <Clock className="w-3.5 h-3.5" />
                <span>Voting Phase</span>
              </div>
            </div>

            {/* Voting Radio Options matching Reference Image */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Select Verdict Decision
              </label>

              {[
                { id: 'CLAIMANT_UPHELD' as VoteChoice, label: 'In favour of Claimant', desc: 'Upheld claim in full with release of escrow funds.' },
                { id: 'RESPONDENT_UPHELD' as VoteChoice, label: 'In favour of Respondent', desc: 'Dismiss claim and release counter-stake to respondent.' },
                { id: 'SPLIT_SETTLEMENT' as VoteChoice, label: 'Abstain / Split Settlement (50 / 50)', desc: 'Partial fulfillment resolution.' },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setSelectedVote(opt.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    selectedVote === opt.id
                      ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-100 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center ${
                    selectedVote === opt.id ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                  }`}>
                    {selectedVote === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{opt.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reasoning input matching Reference Image */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Add Your Reasoning (Optional but recommended)
              </label>
              <textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                placeholder="Add your reasoning (optional but recommended)..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors resize-none"
              />
            </div>

            {/* Secret Salt & Commitment */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-blue-600" />
                  Secret Blinding Salt
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateNewSalt}
                    className="text-[10px] text-blue-600 hover:underline cursor-pointer font-semibold"
                  >
                    Regenerate
                  </button>
                  <button
                    onClick={handleCopySalt}
                    className="text-[10px] text-slate-700 font-semibold flex items-center gap-1 cursor-pointer hover:text-slate-900"
                  >
                    {copiedSalt ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSalt ? 'Copied' : 'Copy Salt'}</span>
                  </button>
                </div>
              </div>
              <div className="font-mono text-[11px] text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-slate-200 truncate select-all">
                {secretSalt}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Computed SHA-256 Commitment
                </span>
                <div className="font-mono text-[10px] text-blue-700 bg-white px-3 py-1 rounded-lg border border-slate-200 truncate">
                  {computedCommitment || 'Computing...'}
                </div>
              </div>
            </div>

            {/* Commit My Vote CTA matching Reference Image Panel 9 */}
            <div className="space-y-2">
              <button
                onClick={handleCommitSubmit}
                disabled={isCommitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold tracking-tight shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Lock className="w-4 h-4" />
                <span>{isCommitting ? 'Anchoring Ballot...' : 'Commit My Vote'}</span>
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Your vote will be committed first and revealed later.</span>
                <span className="font-semibold text-blue-600">Time Left in Voting Phase</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
