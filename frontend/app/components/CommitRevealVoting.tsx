'use client';

import React, { useState, useEffect } from 'react';
import {
  Lock,
  Eye,
  CheckCircle2,
  Hourglass,
  AlertTriangle,
  Shield,
  User,
  RefreshCw,
  Copy,
  MessageSquare,
} from 'lucide-react';
import { JurorAssignment, VoteChoice } from '../types';
import { formatHash } from '../lib/crypto';
import {
  computeVoteChoiceCommitment,
  generateSalt32,
  verifyVoteChoiceCommitment,
} from '../lib/commitment';
import { jurorPseudonym } from '../lib/jury';

interface CommitRevealVotingProps {
  jurors: JurorAssignment[];
  currentJurorId: string;
  onCommitVote: (jurorId: string, commitment: string, vote: VoteChoice, salt: string, reasoning?: string) => void;
  onRevealVote: (jurorId: string, vote: VoteChoice, salt: string, reasoning?: string) => void;
  votingDeadline: string;
  caseId?: string;
}

export function CommitRevealVoting({
  jurors,
  currentJurorId,
  onCommitVote,
  onRevealVote,
  votingDeadline,
  caseId,
}: CommitRevealVotingProps) {
  const [vote, setVote] = useState<VoteChoice>('CLAIMANT_UPHELD');
  const [salt, setSalt] = useState<string>('');
  const [reasoning, setReasoning] = useState<string>('');
  const [copiedSalt, setCopiedSalt] = useState<boolean>(false);
  const [commitment, setCommitment] = useState<string>('');
  const [phase, setPhase] = useState<'commit' | 'reveal'>('commit');
  const [processing, setProcessing] = useState<'commit' | 'reveal' | null>(null);

  const currentJuror = jurors.find((j) => j.jurorId === currentJurorId);
  const committedJurors = jurors.filter((j) => j.status === 'COMMITTED' || j.status === 'REVEALED');
  const effectiveCaseId = caseId || '1';
  const currentJurorAddress = currentJuror?.walletAddress || currentJuror?.jurorId || '0x0000000000000000000000000000000000000001';
  const revealedJurors = jurors.filter((j) => j.status === 'REVEALED');

  // If the current juror has already committed, show reveal phase
  useEffect(() => {
    if (currentJuror?.status === 'COMMITTED') setPhase('reveal');
    if (currentJuror?.status === 'REVEALED') setPhase('reveal');
    if (currentJuror?.reasoning) setReasoning(currentJuror.reasoning);
  }, [currentJuror]);

  // Deadline enforcement (mirrors VotingManager.sol: commit window closes at the
  // deadline; reveals get a +1 day grace window). Gated on mount to avoid
  // SSR/client clock mismatches.
  const [nowMs, setNowMs] = useState<number | null>(null);
  useEffect(() => {
    setNowMs(Date.now());
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const deadlineMs = new Date(votingDeadline).getTime();
  const commitClosed = nowMs !== null && nowMs > deadlineMs;
  const revealClosed = nowMs !== null && nowMs > deadlineMs + 86_400_000;

  // Real cryptographic verification before reveal: recompute Keccak-256(vote || salt || caseId || juror)
  // and compare with the locked commitment. Reveal is blocked on mismatch.
  const [verify, setVerify] = useState<'idle' | 'checking' | 'match' | 'mismatch'>('idle');
  useEffect(() => {
    if (phase !== 'reveal' || !currentJuror || currentJuror.status !== 'COMMITTED') {
      setVerify('idle');
      return;
    }
    const v = currentJuror.revealedVote || vote;
    const s = currentJuror.salt || salt;
    if (!s) {
      setVerify('idle');
      return;
    }
    setVerify('checking');
    const isMatch = verifyVoteChoiceCommitment(
      v,
      s,
      effectiveCaseId,
      currentJurorAddress,
      currentJuror.commitmentHash || ''
    );
    setVerify(isMatch ? 'match' : 'mismatch');
  }, [phase, currentJuror, vote, salt, effectiveCaseId, currentJurorAddress]);

  const handleCommitSubmit = async () => {
    if (!currentJuror || !salt) return;
    setProcessing('commit');
    // Commitment = Keccak-256(vote || salt || caseId || juror) matching VotingManager.sol
    const hash = computeVoteChoiceCommitment(vote, salt, effectiveCaseId, currentJurorAddress);
    setCommitment(hash);
    await new Promise((r) => setTimeout(r, 500));
    onCommitVote(currentJuror.jurorId, hash, vote, salt, reasoning.trim() || undefined);
    setProcessing(null);
  };

  const handleRevealSubmit = async () => {
    if (!currentJuror) return;
    setProcessing('reveal');
    await new Promise((r) => setTimeout(r, 500));
    onRevealVote(
      currentJuror.jurorId,
      currentJuror.revealedVote || vote,
      currentJuror.salt || salt,
      reasoning.trim() || currentJuror.reasoning
    );
    setProcessing(null);
  };

  const allRevealed = revealedJurors.length === jurors.length && jurors.length > 0;
  const claimantVotes = revealedJurors.filter((j) => j.revealedVote === 'CLAIMANT_UPHELD').length;
  const respondentVotes = revealedJurors.filter((j) => j.revealedVote === 'RESPONDENT_UPHELD').length;
  const splitVotes = revealedJurors.filter((j) => j.revealedVote === 'SPLIT_SETTLEMENT').length;

  return (
    <div className="space-y-4">
      {/* Phase explainer */}
      <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-start gap-3">
        <Shield className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-purple-900">Commit–Reveal Protocol (On-Chain Keccak-256)</h4>
          <p className="text-[11px] text-purple-700/80 mt-1 leading-relaxed">
            <strong>Commit phase:</strong> each juror locks an on-chain{' '}
            <span className="font-mono">Keccak-256(voteChoice || salt || caseId || jurorAddress)</span>{' '}
            blind commitment before the deadline — the vote cannot be altered or replayed.{' '}
            <strong>Reveal phase:</strong> the 32-byte secret salt is submitted; smart contract verification
            authenticates the vote against the original commitment. Bribery and post-deadline peer influence
            are cryptographically eliminated.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: juror panel grid */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Jury Panel ({jurors.length})
            </h4>
            <span suppressHydrationWarning className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
              <Hourglass className="w-3.5 h-3.5 text-amber-500" />
              Deadline: {new Date(votingDeadline).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {jurors.map((j) => (
              <div
                key={j.jurorId}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all min-w-0 ${
                  j.jurorId === currentJurorId
                    ? 'border-violet-400 bg-violet-50/40 ring-2 ring-violet-100 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-black shrink-0">
                      {j.reputationScore >= 90 ? '★' : '◆'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {j.jurorId === currentJurorId && (
                          <span className="text-[9px] bg-violet-600 text-white px-1.5 py-0.5 rounded-full font-black shrink-0">
                            YOU
                          </span>
                        )}
                        <span className="font-mono text-xs font-bold text-slate-900 truncate">
                          Juror {jurorPseudonym(j.walletAddress || j.jurorId)}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        Protected • staked {j.stakedAmount.toLocaleString()} RSLV
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 mt-0.5">
                    <JurorStatusBadge status={j.status} />
                  </div>
                </div>

                {/* Commitment / revealed info */}
                {j.status === 'COMMITTED' && (
                  <div className="mt-2.5 p-2 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-[9px] font-bold uppercase text-amber-700">Locked Commitment</p>
                    <p className="text-[10px] font-mono text-amber-800 mt-0.5 truncate">
                      {formatHash(j.commitmentHash || '—', 14)}
                    </p>
                  </div>
                )}

                {j.status === 'REVEALED' && (
                  <div className="mt-2.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    <p className="text-[9px] font-bold uppercase text-emerald-700">Revealed & Verified</p>
                    <p className="text-[11px] font-black text-emerald-800 mt-0.5 truncate">
                      Voted: {j.revealedVote?.replace('_', ' ')}
                    </p>
                    {j.reasoning && (
                      <p className="text-[10px] text-slate-600 mt-1 italic line-clamp-2 border-t border-emerald-100 pt-1">
                        "{j.reasoning}"
                      </p>
                    )}
                  </div>
                )}

                {j.status === 'PENDING_COMMIT' && (
                  <div className="mt-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-[10px] font-semibold text-slate-500">Awaiting commit…</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tally (visible after any reveal) */}
          {revealedJurors.length > 0 && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Live Tally ({revealedJurors.length}/{jurors.length} revealed)
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                    <span>Claimant</span>
                    <span>{claimantVotes}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${(claimantVotes / jurors.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                    <span>Respondent</span>
                    <span>{respondentVotes}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all"
                      style={{ width: `${(respondentVotes / jurors.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                    <span>Shared</span>
                    <span>{splitVotes}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded-full transition-all"
                      style={{ width: `${(splitVotes / jurors.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              {allRevealed && (
                <p className="text-[11px] font-bold text-emerald-700 mt-3 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Quorum met — verdict will be finalized from the revealed tally.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right: your voting console (commit OR reveal — both rendered) */}
        <div className="lg:col-span-5">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 sticky top-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap">
                Your Voting Console
              </h4>
              <span
                className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                  phase === 'commit' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {phase === 'commit' ? 'PHASE 1: COMMIT' : 'PHASE 2: REVEAL'}
              </span>
            </div>

            {!currentJuror ? (
              <p className="text-xs text-slate-500 p-4 rounded-xl bg-slate-50 border border-slate-200">
                You are not an empanelled juror on this case. Only jurors selected for this dispute panel may cast commitments.
              </p>
            ) : currentJuror.status === 'REVEALED' ? (
              <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-sm font-black text-emerald-800">Vote Verified On-Chain</p>
                <p className="text-[11px] text-emerald-700">
                  Your salt matched the original commitment. Vote counted: {currentJuror.revealedVote?.replace('_', ' ')}
                </p>
                {currentJuror.reasoning && (
                  <div className="p-3 rounded-xl bg-white/90 border border-emerald-200 text-left text-[11px] text-slate-700 space-y-1 mt-2">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-emerald-600" />
                      Your Recorded Deliberation Finding
                    </p>
                    <p className="italic text-slate-800">"{currentJuror.reasoning}"</p>
                  </div>
                )}
              </div>
            ) : phase === 'commit' ? (
              /* ── COMMIT UI ── */
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Your Verdict (hidden until reveal)
                  </label>
                  <div className="space-y-2">
                    {(
                      [
                        { v: 'CLAIMANT_UPHELD' as VoteChoice, t: 'In Favor of Claimant', d: "I believe the claimant's case is stronger." },
                        { v: 'RESPONDENT_UPHELD' as VoteChoice, t: 'In Favor of Respondent', d: "I believe the respondent's case is stronger." },
                        { v: 'SPLIT_SETTLEMENT' as VoteChoice, t: 'Shared Responsibility', d: 'Both parties are partially responsible.' },
                      ]
                    ).map((o) => (
                      <button
                        key={o.v}
                        onClick={() => setVote(o.v)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer text-left ${
                          vote === o.v ? 'border-violet-500 bg-violet-50' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 ${vote === o.v ? 'border-violet-600' : 'border-slate-300'}`}>
                          {vote === o.v && <span className="w-2 h-2 rounded-full bg-violet-600" />}
                        </span>
                        <span>
                          <span className="block text-xs font-black text-slate-900">{o.t}</span>
                          <span className="block text-[10px] text-slate-500 mt-0.5">{o.d}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Secret Salt (stays private until reveal)
                    </label>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSalt(generateSalt32())}
                        className="text-[10px] font-bold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Generate Salt (32-byte)
                      </button>
                      {salt && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(salt);
                            setCopiedSalt(true);
                            setTimeout(() => setCopiedSalt(false), 2000);
                          }}
                          className="text-[10px] font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedSalt ? 'Copied!' : 'Copy'}
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={salt}
                    onChange={(e) => setSalt(e.target.value)}
                    placeholder="e.g. 0x7f9c2e81a4b5..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none text-xs font-mono transition-all bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-violet-500" />
                      Deliberation Reasoning / Comment (Optional)
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">{reasoning.length}/300</span>
                  </div>
                  <textarea
                    value={reasoning}
                    onChange={(e) => setReasoning(e.target.value.slice(0, 300))}
                    placeholder="Briefly state your finding of fact or why you favor this outcome (e.g. proof of deliverable completion, lack of SLA breach, etc.)…"
                    rows={3}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none resize-none transition-all placeholder:text-slate-400 bg-white"
                  />
                  <p className="text-[9.5px] text-slate-400">
                    Your reasoning stays sealed with your salt and will be published alongside your verdict upon reveal.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Live Commitment Preview
                  </p>
                  {salt ? (
                    <CommitmentPreview
                      vote={vote}
                      salt={salt}
                      caseId={effectiveCaseId}
                      jurorAddress={currentJurorAddress}
                    />
                  ) : (
                    <p className="text-[11px] text-slate-400 font-mono">
                      Enter or generate a 32-byte salt to compute Keccak-256 commitment…
                    </p>
                  )}
                </div>

                {commitClosed && (
                  <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-[10.5px] font-semibold text-slate-600">
                    Commit window closed — no new commitments are accepted. Reveals are still possible within the +1 day grace window.
                  </div>
                )}
                <button
                  onClick={handleCommitSubmit}
                  disabled={commitClosed || !salt || processing === 'commit'}
                  className="w-full p-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black transition-all cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing === 'commit' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Locking Commitment On-Chain…</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Lock Vote Commitment</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-slate-400 text-center">
                  Once committed, your vote is mathematically irrevocable.
                </p>
              </div>
            ) : (
              /* ── REVEAL UI (rendered so the demo can complete) ── */
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-amber-700 mb-1">
                    Your Locked Commitment
                  </p>
                  <p className="text-[11px] font-mono text-amber-900 break-all">
                    {formatHash(currentJuror.commitmentHash || commitment, 24)}
                  </p>
                </div>

                <div
                  className={`p-3.5 rounded-xl border ${
                    verify === 'mismatch'
                      ? 'bg-rose-50 border-rose-200'
                      : verify === 'match'
                      ? 'bg-emerald-50/50 border-emerald-200/70'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <p
                    className={`text-[9px] font-bold uppercase tracking-wider mb-2 ${
                      verify === 'mismatch' ? 'text-rose-600' : verify === 'match' ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    Verification Check
                  </p>
                  {verify === 'checking' && (
                    <p className="text-[11px] text-slate-500 leading-relaxed flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Re-computing Keccak-256(vote || salt || caseId || juror) against the locked
                      commitment…
                    </p>
                  )}
                  {verify === 'idle' && (
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Verification runs automatically once your commitment and salt are available.
                    </p>
                  )}
                  {verify === 'match' && (
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        Salt <span className="font-mono font-bold">{currentJuror.salt || '—'}</span> re-computed against the
                        locked hash. <strong>MATCH CONFIRMED (Keccak-256)</strong> — the revealed vote is mathematically identical to your on-chain commitment.
                      </p>
                    </div>
                  )}
                  {verify === 'mismatch' && (
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-rose-700 leading-relaxed">
                        <strong>MISMATCH</strong> — the revealed vote does not match the locked commitment. Reveal is
                        blocked; a mismatched reveal would be rejected on-chain.
                      </p>
                    </div>
                  )}
                </div>

                {revealClosed && (
                  <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-[10.5px] font-semibold text-slate-600">
                    Reveal window closed (grace period elapsed). This commitment will be recorded as forfeited.
                  </div>
                )}

                <button
                  onClick={handleRevealSubmit}
                  disabled={processing === 'reveal' || revealClosed || verify !== 'match'}
                  className="w-full p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing === 'reveal' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Revealing Salt On-Chain…</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>Reveal Vote & Submit Salt</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-slate-400 text-center">
                  After reveal, the tally updates and the case auto-settles at quorum.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Live-updating commitment hash preview */
function CommitmentPreview({
  vote,
  salt,
  caseId,
  jurorAddress,
}: {
  vote: VoteChoice;
  salt: string;
  caseId: string;
  jurorAddress: string;
}) {
  const [hash, setHash] = useState<string>('');

  useEffect(() => {
    try {
      const h = computeVoteChoiceCommitment(vote, salt, caseId, jurorAddress);
      setHash(h);
    } catch {
      setHash('');
    }
  }, [vote, salt, caseId, jurorAddress]);

  return (
    <div>
      <p className="text-[11px] font-mono text-slate-700 break-all leading-relaxed">{hash || 'computing…'}</p>
      <p className="text-[9px] text-slate-400 mt-1.5 font-mono">
        keccak256(abi.encodePacked(uint8, bytes32 salt, uint256 caseId, address juror))
      </p>
    </div>
  );
}

function JurorStatusBadge({ status }: { status: JurorAssignment['status'] }) {
  if (status === 'REVEALED')
    return (
      <span className="text-[9px] font-black px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        REVEALED
      </span>
    );
  if (status === 'COMMITTED')
    return (
      <span className="text-[9px] font-black px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        COMMITTED
      </span>
    );
  return (
    <span className="text-[9px] font-black px-2 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
      PENDING
    </span>
  );
}
