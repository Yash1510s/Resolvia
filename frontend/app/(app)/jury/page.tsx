'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Clock,
  Gavel,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Settings,
  CheckCircle2,
  Inbox,
  Star,
  Award,
  TrendingUp,
  FileCheck,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../../lib/app-context';
import { JuryInvitationCard } from '../../components/JuryInvitationCard';
import { isClosed } from '../../lib/caseLifecycle';
import { Card, Chip, categoryLabel, fmtDate, shortCaseId, statusTone } from '../../components/ui';
import { LiveCountdownDisplay } from '../../components/LiveCountdown';

type Tab = 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' | 'IMPACT' | 'GUIDELINES';

export default function JuryDashboard() {
  const { availability, invitations, cases, jurorHistory, myJurorPseudonym } = useApp();
  const [tab, setTab] = useState<Tab>('AVAILABLE');

  const pendingInvites = invitations.filter((i) => i.status === 'PENDING');
  const activeAssignments = cases.filter((c) => c.myRole === 'JUROR' && !isClosed(c));
  const completedCases = cases.filter((c) => c.myRole === 'JUROR' && isClosed(c));
  const completed = jurorHistory.length + completedCases.length;
  const onTime = jurorHistory.filter((h) => h.onTime).length;

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'AVAILABLE', label: 'Available for Review', icon: <Users className="w-4 h-4" />, count: pendingInvites.length },
    { id: 'IN_PROGRESS', label: 'In Progress', icon: <Clock className="w-4 h-4" />, count: activeAssignments.length },
    { id: 'COMPLETED', label: 'Completed', icon: <CheckCircle2 className="w-4 h-4" />, count: completed },
    { id: 'IMPACT', label: 'My Impact', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'GUIDELINES', label: 'Guidelines', icon: <BookOpen className="w-4 h-4" /> },
  ];

  const nextDeadline = activeAssignments
    .map((c) => new Date(c.votingDeadline).getTime())
    .reduce<number | null>((acc, t) => (acc === null || t < acc ? t : acc), null);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Jury Panel</h1>
          <p className="text-[13px] text-slate-500 mt-1 max-w-xl">
            Review cases, analyze evidence, and contribute to fair resolutions — anonymously.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-violet-50 border border-violet-100 rounded-xl px-3.5 py-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="text-[12px] font-black text-slate-900">Your identity is always protected.</p>
              <p className="text-[10.5px] text-slate-500">You are a juror by contribution, not by identity.</p>
            </div>
          </div>
          <Link href="/settings" className="hidden md:flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-violet-300 text-slate-700 text-xs font-bold transition-all">
            <Settings className="w-4 h-4" /> Availability
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
        {/* ── Main ── */}
        <div className="min-w-0">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {tabs.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    active ? 'bg-violet-50 border-violet-300 text-violet-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span className={active ? 'text-violet-600' : 'text-slate-400'}>{t.icon}</span>
                  {t.label}
                  {typeof t.count === 'number' && (
                    <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black flex items-center justify-center ${active ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* AVAILABLE: invitations */}
          {tab === 'AVAILABLE' && (
            <div className="space-y-3">
              {!availability.inPool || availability.state !== 'AVAILABLE' ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11.5px] text-amber-800 leading-relaxed">
                    Jury invitations are <strong>paused</strong> — {
                      !availability.inPool
                        ? 'you are not in the jury pool.'
                        : 'you are marked temporarily unavailable.'
                    }{' '}
                    Update <Link href="/settings" className="font-bold underline underline-offset-2">Settings → Jury availability</Link>{' '}
                    to resume. Pending invitations below stay visible but cannot be accepted until you re-qualify.
                  </p>
                </div>
              ) : null}
              {pendingInvites.length === 0 && (
                <Card className="p-8 text-center">
                  <Inbox className="w-9 h-9 text-slate-200 mx-auto" />
                  <p className="text-sm font-bold text-slate-600 mt-3">No pending invitations</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    When a case needs a panel and you qualify (reputation, availability, conflict checks), you&apos;ll be
                    invited here. Only minimal case details are shown until you accept.
                  </p>
                </Card>
              )}
              {invitations.map((inv) => (
                <JuryInvitationCard key={inv.id} invitation={inv} />
              ))}
            </div>
          )}

          {/* IN PROGRESS */}
          {tab === 'IN_PROGRESS' && (
            <div className="space-y-3">
              {activeAssignments.length === 0 && (
                <Card className="p-8 text-center">
                  <Gavel className="w-9 h-9 text-slate-200 mx-auto" />
                  <p className="text-sm font-bold text-slate-600 mt-3">No active panels</p>
                  <p className="text-xs text-slate-400 mt-1">Accept an invitation to start reviewing a case.</p>
                </Card>
              )}
              {activeAssignments.map((c) => (
                <CaseRow key={c.id} caseId={c.id} title={c.title} category={c.category} status={c.status} deadline={c.votingDeadline} summary={c.claimSummary} cta="Open Review" />
              ))}
            </div>
          )}

          {/* COMPLETED */}
          {tab === 'COMPLETED' && (
            <div className="space-y-3">
              {completedCases.map((c) => (
                <CaseRow key={c.id} caseId={c.id} title={c.title} category={c.category} status={c.status} deadline={c.caseStudy?.closedAt} summary={c.claimSummary} cta="View Outcome" muted />
              ))}
              {jurorHistory.map((h) => (
                <Card key={h.caseId} className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-bold text-slate-700">{shortCaseId(h.caseId)}</span>
                      <Chip tone={categoryLabel(h.category).tone}>{categoryLabel(h.category).label}</Chip>
                      <Chip tone="green">Completed</Chip>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Voted {h.voteChoice.replace(/_/g, ' ')} · {fmtDate(h.completedAt)} · {h.onTime ? 'On time' : 'Late'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] font-bold text-emerald-600">+{h.reputationDelta} rep</p>
                    <Link href="/reputation" className="text-[10px] font-bold text-violet-600 hover:text-violet-700 inline-flex items-center gap-1">
                      Details <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* MY IMPACT */}
          {tab === 'IMPACT' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                {[
                  { icon: <FileCheck className="w-5 h-5" />, tone: 'bg-violet-100 text-violet-600', v: completed, l: 'Cases Reviewed' },
                  { icon: <Star className="w-5 h-5" />, tone: 'bg-amber-100 text-amber-600', v: 820, l: 'Reputation Points' },
                  { icon: <Award className="w-5 h-5" />, tone: 'bg-blue-100 text-blue-600', v: 'Top 20%', l: 'Active Jurors' },
                  { icon: <Clock className="w-5 h-5" />, tone: 'bg-emerald-100 text-emerald-600', v: `${Math.round((onTime / Math.max(1, jurorHistory.length)) * 100)}%`, l: 'On-Time Rate' },
                ].map((x) => (
                  <Card key={x.l} className="p-4 text-center">
                    <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center ${x.tone}`}>{x.icon}</div>
                    <p className="text-xl font-black text-slate-900 mt-2.5 leading-none">{x.v}</p>
                    <p className="text-[11px] font-semibold text-slate-400 mt-1">{x.l}</p>
                  </Card>
                ))}
              </div>
              <Card className="p-5">
                <h3 className="text-[14px] font-black text-slate-900 mb-1">How reputation works here</h3>
                <p className="text-[12px] text-slate-500 leading-relaxed">
                  Reputation rewards <strong className="text-slate-700">diligent process</strong>, not winning. It grows for on-time
                  review, careful deliberation, and consistent availability — and it is <strong className="text-slate-700">never reduced
                  for declining an invitation because you are busy</strong>. It is deliberately <em>not</em> "your vote usually matched the
                  majority": in honest juries, reasonable jurors often disagree.
                </p>
              </Card>
            </div>
          )}

          {/* GUIDELINES */}
          {tab === 'GUIDELINES' && (
            <div className="space-y-3">
              {[
                { t: 'Review evidence independently first', d: 'Read both parties\u2019 positions and the anchored evidence before anything else. Form your own view — the AI advisory is hidden from you until after your blind commit.' },
                { t: 'Keep deliberation private & respectful', d: 'Jury Deliberation is anonymous and happens during arbitration. No external pressure, no sharing the case, no contacting the parties.' },
                { t: 'Vote on the record, not on rhetoric', d: 'Weigh anchored evidence and stated claims. A split outcome is a legitimate verdict when the record supports it.' },
                { t: 'Commit on time', d: 'Your blind commitment locks your vote on-chain. Missing the deadline forfeits your stake and lowers on-time standing.' },
                { t: 'Declining is fine', d: 'Declining because you are busy does not affect your reputation. Declaring a conflict protects the integrity of the verdict.' },
              ].map((g, i) => (
                <Card key={g.t} className="p-5 flex items-start gap-3.5">
                  <span className="w-7 h-7 rounded-lg bg-violet-100 text-violet-700 text-[12px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                  <div>
                    <p className="text-[13px] font-bold text-slate-800">{g.t}</p>
                    <p className="text-[11.5px] text-slate-500 mt-1 leading-relaxed">{g.d}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* ── Right rail ── */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3.5">
              <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[13px] font-black text-slate-900">Your Role as a Juror</p>
                <p className="text-[10px] text-slate-400">You are reviewing this case as an anonymous juror.</p>
              </div>
            </div>
            <ul className="space-y-2">
              {['Stay unbiased and objective', 'Review all evidence carefully', 'Discuss respectfully', 'Cast your vote based on facts', 'Help build a fairer community'].map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <span className="w-4.5 h-4.5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                  </span>
                  <span className="text-[12px] font-semibold text-slate-600">{t}</span>
                </li>
              ))}
            </ul>
          </Card>

          {nextDeadline !== null && (
            <Card className="p-5 border-slate-200/80 shadow-sm bg-gradient-to-br from-white to-slate-50/50">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Voting Closes In</p>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Protocol Consensus Live
                </span>
              </div>
              <LiveCountdownDisplay target={nextDeadline} />
              <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
                After the consensus deadline, the cryptographic verdict will be finalized on-chain based on jury quorum.
              </p>
            </Card>
          )}

          <Card className="p-5">
            <p className="text-[13px] font-black text-slate-900 mb-3">Your Jury Stats</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: completed, l: 'Cases Reviewed' },
                { v: 820, l: 'Reputation Points' },
                { v: 'Top 20%', l: 'Active Jurors' },
              ].map((x) => (
                <div key={x.l} className="rounded-xl border border-slate-100 p-2.5 text-center">
                  <p className="text-[15px] font-black text-slate-900 leading-none">{x.v}</p>
                  <p className="text-[9px] font-semibold text-slate-400 mt-1.5 leading-tight">{x.l}</p>
                </div>
              ))}
            </div>
            <div className="mt-3.5 p-3.5 rounded-xl bg-violet-50 border border-violet-100 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
              <p className="text-[10.5px] text-violet-900 leading-relaxed">
                <strong>Your identity is protected.</strong> All jury activity is recorded anonymously using zero-knowledge proofs.
              </p>
            </div>
          </Card>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100">
            <p className="italic text-[12px] text-slate-600 leading-relaxed">"Justice grows stronger when voices are many, but identities stay hidden."</p>
            <p className="text-[10px] text-slate-400 mt-1.5">— Resolvia</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CaseRow({ caseId, title, category, status, deadline, summary, cta, muted = false }: { caseId: string; title: string; category: string; status: string; deadline?: string; summary: string; cta: string; muted?: boolean }) {
  const cat = categoryLabel(category);
  return (
    <Link href={muted ? `/case-studies/${caseId}` : `/jury/${caseId}`} className="block">
      <Card className="p-4 flex flex-wrap items-center gap-4 hover:border-violet-300 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
          <Gavel className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] font-bold text-violet-700">{shortCaseId(caseId)}</span>
            <Chip tone={cat.tone}>{cat.label}</Chip>
            <Chip tone={statusTone(status)} dot>{status.replace(/_/g, ' ')}</Chip>
          </div>
          <p className="text-[13px] font-bold text-slate-800 mt-1 truncate">{title}</p>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-lg">{summary}</p>
        </div>
        <div className="text-right shrink-0">
          {deadline && !muted ? (
            <div className="mb-1 flex justify-end">
              <LiveCountdownDisplay target={deadline} compact />
            </div>
          ) : (
            <p className="text-[11px] font-semibold text-slate-500">{muted ? 'Closed' : 'Vote by'} {fmtDate(deadline)}</p>
          )}
          <span className="text-[10px] font-black text-violet-600 inline-flex items-center gap-1 mt-1">
            {cta} <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </Card>
    </Link>
  );
}
