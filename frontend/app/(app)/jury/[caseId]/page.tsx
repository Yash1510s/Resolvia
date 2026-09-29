'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Users,
  Calendar,
  MessageSquare,
  Send,
  FileImage,
  Play,
  ScrollText,
  ChevronDown,
  Scale,
  Hourglass,
  Gavel,
} from 'lucide-react';
import { useApp } from '../../../lib/app-context';
import { CommitRevealVoting } from '../../../components/CommitRevealVoting';
import { Card, Chip, categoryLabel, fmtDate, shortCaseId } from '../../../components/ui';
import { LiveCountdownDisplay } from '../../../components/LiveCountdown';
import type { EvidenceItem } from '../../../types';

function EvidenceThumb({ ev }: { ev: EvidenceItem }) {
  const isPdf = ev.mimeType === 'application/pdf' || ev.fileName.toLowerCase().endsWith('.pdf');
  const isVideo = ev.mimeType.startsWith('video/');
  const isImage = ev.mimeType.startsWith('image/');
  return (
    <div className="w-20 h-16 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
      {isPdf ? (
        <div className="flex flex-col items-center">
          <div className="w-8 h-9 rounded-md bg-rose-500 flex items-end justify-center pb-1">
            <span className="text-[7px] font-black text-white">PDF</span>
          </div>
        </div>
      ) : isVideo ? (
        <div className="relative w-full h-full bg-slate-800 flex items-center justify-center">
          <Play className="w-5 h-5 text-white/80" />
          <span className="absolute bottom-1 right-1.5 text-[7px] font-bold text-white/70">00:45</span>
        </div>
      ) : isImage ? (
        <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center">
          <FileImage className="w-6 h-6 text-white/70" />
        </div>
      ) : (
        <FileText className="w-6 h-6 text-slate-400" />
      )}
    </div>
  );
}

export default function JurorWorkspace({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = React.use(params);
  const { getCase, identity, myJurorPseudonym, commitVote, revealVote, simulateOtherJurors, addDeliberationPost } = useApp();
  const dispute = getCase(caseId);
  const [expanded, setExpanded] = useState(false);
  const [evFilter, setEvFilter] = useState<'ALL' | 'Claimant' | 'Respondent'>('ALL');
  const [delText, setDelText] = useState('');
  const [analyzed, setAnalyzed] = useState(false);

  const tags = useMemo(() => {
    if (!dispute) return [];
    const words = dispute.title.split(/\s+/).filter((w) => w.length > 4);
    return [categoryLabel(dispute.category).label, ...words.slice(0, 3)];
  }, [dispute]);

  if (!dispute) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm font-bold text-slate-900">Case not found</p>
        <Link href="/jury" className="inline-flex items-center gap-1.5 px-4 py-2 mt-3 rounded-xl bg-violet-600 text-white text-xs font-bold">
          <ArrowLeft className="w-3.5 h-3.5" /> Jury Panel
        </Link>
      </Card>
    );
  }

  const isMyCase = dispute.myRole === 'JUROR';
  const myJuror = isMyCase ? dispute.jurors.find((j) => j.walletAddress === identity.wallet) || dispute.jurors[0] : undefined;
  const voted = myJuror?.status === 'REVEALED';
  const step = voted || myJuror?.status === 'COMMITTED' ? 3 : analyzed ? 2 : 1;
  const cat = categoryLabel(dispute.category);
  const evAll = dispute.evidence;
  const evFiltered = evFilter === 'ALL' ? evAll : evAll.filter((e) => e.submittedBy === evFilter);
  const claimantEv = evAll.filter((e) => e.submittedBy === 'Claimant').length;
  const respondentEv = evAll.filter((e) => e.submittedBy === 'Respondent').length;

  const postDeliberation = () => {
    if (!delText.trim()) return;
    addDeliberationPost(dispute.id, delText.trim());
    setDelText('');
    setAnalyzed(true);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <Link href="/jury" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-violet-600 hover:text-violet-700">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Jury Panel
          </Link>
          <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1.5">Juror Review Workspace</h1>
        </div>
        <div className="flex items-center gap-2">
          <Chip tone="violet">
            <ShieldCheck className="w-3.5 h-3.5" /> Juror {myJurorPseudonym}
          </Chip>
        </div>
      </div>

      {!isMyCase ? (
        <Card className="p-10 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
          <p className="text-sm font-bold text-slate-700 mt-3">You are not on this panel</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Only assigned jurors can open the workspace. You can follow the case from My Cases.
          </p>
          <Link href={`/cases/${dispute.id}`} className="inline-flex px-4 py-2 mt-4 rounded-xl bg-violet-600 text-white text-xs font-bold">
            View Case Details
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] 2xl:grid-cols-[280px_1fr_320px] gap-5 items-start">
          {/* ═══ Column 1: Case Details & Metadata ═══ */}
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[13px] font-black text-slate-900">{shortCaseId(dispute.id)}</span>
                <Chip tone={cat.tone}>{cat.label}</Chip>
              </div>
              <p className="text-[10.5px] text-slate-400 mt-1">Submitted on {fmtDate(dispute.createdAt)}</p>
              <h2 className="text-[16px] font-black text-slate-900 mt-2.5 leading-snug">{dispute.title}</h2>
              <p className={`text-[12px] text-slate-500 mt-2 leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>{dispute.claimSummary}</p>
              <button
                onClick={() => {
                  setExpanded(!expanded);
                  if (!expanded) setAnalyzed(true);
                }}
                className="flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:text-violet-700 mt-1.5 cursor-pointer"
              >
                {expanded ? 'Show less' : 'Read More'} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </button>

              <div className="grid grid-cols-2 gap-2.5 mt-4">
                {[
                  { icon: <Users className="w-4 h-4" />, v: '2', l: 'Parties' },
                  { icon: <FileText className="w-4 h-4" />, v: String(evAll.length), l: 'Evidences' },
                  { icon: <Scale className="w-4 h-4" />, v: cat.label.split(' ')[0], l: 'Category' },
                  { icon: <Calendar className="w-4 h-4" />, v: fmtDate(dispute.createdAt).split(',')[0], l: 'Submitted' },
                ].map((m) => (
                  <div key={m.l} className="rounded-xl border border-slate-100 p-2.5 text-center">
                    <div className="w-7 h-7 mx-auto rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">{m.icon}</div>
                    <p className="text-[11px] font-black text-slate-800 mt-1.5 leading-none">{m.v}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{m.l}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <p className="text-[11px] font-black text-slate-900 mb-1.5">Case Summary</p>
                <p className="text-[11.5px] text-slate-500 leading-relaxed">{dispute.claimSummary}</p>
                {dispute.counterClaimSummary && (
                  <>
                    <p className="text-[11px] font-black text-slate-900 mt-3 mb-1">Respondent&apos;s Position</p>
                    <p className="text-[11.5px] text-slate-500 leading-relaxed">{dispute.counterClaimSummary}</p>
                  </>
                )}
              </div>

              <div className="mt-4">
                <p className="text-[11px] font-black text-slate-900 mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span key={t} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold">{t}</span>
                  ))}
                </div>
              </div>
            </Card>

            {/* AI locked advisory */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Lock className="w-4.5 h-4.5 text-amber-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-black">AI-Assisted Analysis — Locked</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                    {dispute.aiAnalysis
                      ? 'A non-binding advisory exists, but it is withheld from jurors until after your blind commit. It can never determine the verdict.'
                      : 'No advisory report yet. It is withheld from jurors regardless, until after your blind commit.'}
                  </p>
                </div>
              </div>
            </div>

            {/* ZK Identity Guarantee */}
            <div className="p-4 rounded-2xl bg-violet-50 border border-violet-100 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
              <p className="text-[10.5px] text-violet-900 leading-relaxed">
                <strong>Zero-Knowledge Identity Protection:</strong> Parties and peers only see <span className="font-mono font-bold">{myJurorPseudonym}</span>.
                Your real wallet address, email, and identity are never exposed.
              </p>
            </div>
          </div>

          {/* ═══ Column 2: Main Review, Deliberation & Voting Workspace ═══ */}
          <div className="min-w-0 space-y-5">
            {/* Step navigation indicator */}
            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-1 sm:gap-2">
                {[
                  { n: 1, l: 'Review Evidence', id: 'evidence-section' },
                  { n: 2, l: 'Analyze & Deliberate', id: 'deliberation-section' },
                  { n: 3, l: 'Cast Your Vote', id: 'voting-section' },
                ].map((s, i) => (
                  <React.Fragment key={s.n}>
                    <button
                      type="button"
                      onClick={() => scrollToSection(s.id)}
                      className="flex flex-col items-center gap-1.5 flex-1 cursor-pointer group transition-all text-center focus:outline-none"
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-black transition-all ${
                        s.n < step || voted
                          ? 'bg-emerald-500 text-white shadow-xs group-hover:bg-emerald-600'
                          : s.n === step
                          ? 'bg-violet-600 text-white ring-4 ring-violet-100 group-hover:bg-violet-700 shadow-sm'
                          : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                      }`}>
                        {s.n < step || voted ? <CheckCircle2 className="w-4.5 h-4.5" /> : s.n}
                      </div>
                      <span className={`text-[10px] sm:text-[11px] font-bold text-center transition-colors ${
                        s.n === step && !voted ? 'text-violet-700' : 'text-slate-500 group-hover:text-slate-800'
                      }`}>{s.l}</span>
                    </button>
                    {i < 2 && <div className={`flex-1 max-w-16 h-0.5 rounded mb-5 ${s.n < step || voted ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
                  </React.Fragment>
                ))}
              </div>
            </Card>

            {/* Step 1: Evidence & Statements */}
            <div id="evidence-section" className="scroll-mt-20">
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-violet-100 text-violet-700 text-xs font-black flex items-center justify-center">1</span>
                    <h3 className="text-[14px] font-black text-slate-900">Evidence &amp; Statements</h3>
                  </div>
                  <span className="text-[11px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100">
                    {evAll.length} items submitted
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(
                    [
                      { id: 'ALL', l: `All Evidence (${evAll.length})` },
                      { id: 'Claimant', l: `Claimant (${claimantEv})` },
                      { id: 'Respondent', l: `Respondent (${respondentEv})` },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setEvFilter(t.id)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        evFilter === t.id ? 'bg-violet-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {t.l}
                    </button>
                  ))}
                </div>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {evFiltered.map((ev) => (
                    <div key={ev.id} className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-white">
                      <EvidenceThumb ev={ev} />
                      <div className="flex items-center gap-1.5 mt-2.5">
                        {ev.mimeType.startsWith('video/') ? (
                          <Play className="w-3 h-3 text-violet-600 shrink-0" />
                        ) : ev.mimeType === 'application/pdf' ? (
                          <FileText className="w-3 h-3 text-rose-500 shrink-0" />
                        ) : (
                          <FileImage className="w-3 h-3 text-blue-500 shrink-0" />
                        )}
                        <span className="text-[11px] font-bold text-slate-800 truncate">{ev.fileName}</span>
                      </div>
                      <p className="text-[9.5px] text-slate-400 mt-1">
                        Submitted by {ev.submittedBy} · {fmtDate(ev.submittedAt).split(',')[0]}
                      </p>
                      <p className="text-[8.5px] font-mono text-slate-400 truncate mt-1">SHA-256 {ev.sha256Hash.slice(0, 18)}…</p>
                    </div>
                  ))}
                  {evFiltered.length === 0 && <p className="text-[12px] text-slate-400 col-span-3 py-6 text-center">No evidence from this party yet.</p>}
                </div>

                {/* Statements */}
                <div className="grid md:grid-cols-2 gap-3.5 mt-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <p className="text-[12px] font-black text-slate-900 flex items-center gap-2">
                      <ScrollText className="w-4 h-4 text-blue-500" /> Claimant&apos;s Statement
                    </p>
                    <p className="text-[11.5px] text-slate-600 mt-2 leading-relaxed">{dispute.claimSummary}</p>
                    <p className="text-[11px] text-slate-400 mt-2.5 border-t border-slate-200/60 pt-2">
                      <strong className="text-slate-600">Relief sought:</strong> {dispute.reliefSought}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <p className="text-[12px] font-black text-slate-900 flex items-center gap-2">
                      <ScrollText className="w-4 h-4 text-rose-500" /> Respondent&apos;s Statement
                    </p>
                    <p className="text-[11.5px] text-slate-600 mt-2 leading-relaxed">
                      {dispute.counterClaimSummary || <span className="italic text-slate-400">No response recorded yet.</span>}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Step 2: Deliberation Forum */}
            {dispute.status !== 'CLOSED' && dispute.status !== 'VERDICT' && (
              <div id="deliberation-section" className="scroll-mt-20">
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-violet-100 text-violet-700 text-xs font-black flex items-center justify-center">2</span>
                      <h3 className="text-[14px] font-black text-slate-900 flex items-center gap-2">
                        <MessageSquare className="w-4.5 h-4.5 text-violet-600" /> Discussion &amp; Deliberation (Anonymous)
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {(dispute.deliberation || []).length} posts
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3.5">
                    Discuss findings with fellow empanelled jurors. All communications are pseudonymized.
                  </p>
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {(dispute.deliberation || []).length === 0 && (
                      <p className="text-[11.5px] text-slate-400 text-center py-4">No deliberation posts yet. Share your findings or questions once you have inspected the evidence.</p>
                    )}
                    {(dispute.deliberation || []).map((p) => (
                      <div key={p.id} className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-black shrink-0">
                          {(p.author || '?').replace('#', '').charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11.5px] font-bold text-slate-800">
                            {p.authorBadge || p.author} <span className="text-slate-400 font-medium">· Juror (anonymous)</span>
                            <span className="float-right text-[9.5px] text-slate-400 font-medium">{fmtDate(p.createdAt).split(',')[0]}</span>
                          </p>
                          <p className="text-[11.5px] text-slate-600 mt-0.5 leading-relaxed">{p.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white text-[11px] font-black shrink-0">
                      {(myJurorPseudonym || 'J').charAt(0)}
                    </div>
                    <input
                      value={delText}
                      onChange={(e) => setDelText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && postDeliberation()}
                      placeholder="Share your finding or question (anonymously)…"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:border-violet-400 focus:bg-white outline-none text-[12px] transition-colors"
                    />
                    <button onClick={postDeliberation} disabled={!delText.trim()} className="w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 flex items-center justify-center text-white transition-colors shrink-0 cursor-pointer">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              </div>
            )}

            {/* Step 3: Cast Your Vote (Commit–Reveal Cryptographic Console) */}
            <div id="voting-section" className="scroll-mt-20 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-violet-600 text-white text-xs font-black flex items-center justify-center">3</span>
                  <div>
                    <h3 className="text-[15px] font-black text-slate-900">Step 3: Cast Your Vote</h3>
                    <p className="text-[11px] text-slate-400">
                      Cryptographic Commit–Reveal protocol guarantees un-coerced, tamper-proof voting consensus.
                    </p>
                  </div>
                </div>
                {voted && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verdict Counted &amp; Finalized
                  </span>
                )}
              </div>

              {/* Full-width Voting Console Component */}
              <CommitRevealVoting
                caseId={dispute.id}
                jurors={dispute.jurors}
                currentJurorId={myJuror!.jurorId}
                votingDeadline={dispute.votingDeadline}
                onCommitVote={(jurorId, commitment, vote, salt, reasoning) => commitVote(dispute.id, jurorId, commitment, vote, salt, reasoning)}
                onRevealVote={(jurorId, vote, salt, reasoning) => revealVote(dispute.id, jurorId, vote, salt, reasoning)}
              />
            </div>
          </div>

          {/* ═══ Column 3: Live Protocol Timers & Juror Status ═══ */}
          <div className="space-y-4">
            {dispute.votingDeadline && (
              <Card className="p-5 border-slate-200/80 shadow-sm bg-gradient-to-br from-white to-slate-50/50">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Voting Closes In</p>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Protocol Live
                  </span>
                </div>
                <LiveCountdownDisplay target={dispute.votingDeadline} />
                <p className="text-[10.5px] text-slate-400 mt-2.5 leading-relaxed">
                  After the deadline expires, the cryptographic consensus verdict is automatically tallied and finalized on-chain.
                </p>
              </Card>
            )}

            {/* Juror Node Status */}
            <Card className="p-4 border-slate-200">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Your Juror Node</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                  voted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  myJuror?.status === 'COMMITTED' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {voted ? 'REVEALED & VERIFIED' : myJuror?.status === 'COMMITTED' ? 'LOCKED COMMITMENT' : 'AWAITING VOTE'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Node ID:</span>
                  <span className="font-mono font-bold text-slate-800">{myJurorPseudonym}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Staked:</span>
                  <span className="font-bold text-slate-800">{myJuror?.stakedAmount?.toLocaleString() || '2,500'} RSLV</span>
                </div>
                {myJuror?.commitmentHash && (
                  <div className="pt-1 border-t border-slate-200/60 flex justify-between items-center">
                    <span className="text-slate-500">Hash:</span>
                    <span className="font-mono text-[10px] text-violet-700 font-bold truncate max-w-[140px]" title={myJuror.commitmentHash}>
                      {myJuror.commitmentHash.slice(0, 10)}...{myJuror.commitmentHash.slice(-6)}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => scrollToSection('voting-section')}
                className="w-full mt-3 py-2 px-3 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 text-[11px] font-bold transition-all text-center cursor-pointer border border-violet-200/70"
              >
                {voted ? 'View Final Consensus' : 'Go To Voting Console ↓'}
              </button>
            </Card>

            {/* Quorum Simulator Tool */}
            <Card className="p-4 border-slate-200/80 bg-gradient-to-br from-white to-slate-50">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-4 h-4 text-violet-600" />
                <p className="text-[12px] font-black text-slate-900">Jury Quorum Fast-Sync</p>
              </div>
              <p className="text-[10.5px] text-slate-500 leading-relaxed mb-3">
                Simulate peer commitments and reveals across other empanelled nodes to reach instant on-chain consensus.
              </p>
              <button
                onClick={() => simulateOtherJurors(dispute.id)}
                className="w-full py-2.5 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Scale className="w-3.5 h-3.5" />
                Fast-Sync Jury Quorum &amp; Tally
              </button>
            </Card>

            {/* Juror Guidelines */}
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3.5">
                <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-black text-slate-900">Your Role as a Juror</p>
                  <p className="text-[10px] text-slate-400">Reviewing {shortCaseId(dispute.id)} as an anonymous juror.</p>
                </div>
              </div>
              <ul className="space-y-2">
                {['Stay unbiased and objective', 'Review all evidence carefully', 'Discuss respectfully', 'Cast your vote based on facts', 'Help build a fairer community'].map((t) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <span className="w-4.5 h-4.5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                    </span>
                    <span className="text-[11.5px] font-semibold text-slate-600">{t}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
