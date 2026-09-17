'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileText,
  CheckCircle2,
  Users,
  Shield,
  Scale,
  Sparkles,
  Plus,
  Gavel,
  BookOpen,
  ArrowRight,
  Megaphone,
  Clock,
  Calendar,
  Vote,
  Award,
  ChevronRight,
  Star,
} from 'lucide-react';
import { useApp } from '../../lib/app-context';
import { useAuth } from '../../lib/auth-context';
import { isClosed } from '../../lib/caseLifecycle';
import type { MyCaseRole } from '../../types';
import { Card, Chip, categoryLabel, statusTone, fmtDate, shortCaseId, Ring } from '../../components/ui';

const REP = 820;

export default function DashboardRoute() {
  return (
    <Suspense fallback={null}>
      <Dashboard />
    </Suspense>
  );
}

function Dashboard() {
  const { cases, identity, invitations, login, myJurorPseudonym } = useApp();
  const { user: authUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Hydration-safe: server (UTC) and browser (local TZ) can disagree on the time of day.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const p = searchParams.get('persona');
    // Persona entry establishes a real (demo) session — the shell must reflect it.
    if (p === 'CLAIMANT' || p === 'RESPONDENT' || p === 'JUROR') login(p as MyCaseRole);
    if (searchParams.get('new') === '1') router.replace('/create', { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeCases = cases.filter((c) => !isClosed(c));
  const closedCases = cases.filter((c) => isClosed(c));
  const asJuror = cases.filter((c) => c.myRole === 'JUROR');
  const myActive = activeCases.filter((c) => c.myRole).slice(0, 4);
  const studies = closedCases.filter((c) => c.caseStudy).slice(0, 3);

  const hour = new Date().getHours();
  const greet = mounted
    ? hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'
    : 'Hello';
  const firstName = identity.name.split(' ')[0];

  const upcoming = useMemo(() => {
    const list: { when: string; time: string; icon: React.ReactNode; tone: string; title: string; sub: string; href: string }[] = [];
    for (const c of activeCases.filter((c) => c.myRole)) {
      const tl = new Date(c.votingDeadline).getTime() - Date.now();
      // "when" is relative to now → SSR/CSR can disagree; use a static date until mounted.
      const when = !mounted
        ? fmtDate(c.votingDeadline).split(',')[0]
        : tl > 0 ? (tl < 86_400_000 ? 'Today' : tl < 172_800_000 ? 'Tomorrow' : fmtDate(c.votingDeadline).split(',')[0])
        : fmtDate(c.votingDeadline).split(',')[0];
      list.push({
        when,
        time: new Date(c.votingDeadline).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' }),
        icon: <Clock className="w-3.5 h-3.5" />,
        tone: 'bg-amber-100 text-amber-600',
        title:
          c.status === 'EVIDENCE_LOCKED' ? 'Evidence submission deadline' : c.status === 'AI_ANALYSIS' ? 'Awaiting AI advisory report' : 'Voting deadline',
        sub: `${shortCaseId(c.id)} · ${c.title}`,
        href: `/cases/${c.id}`,
      });
    }
    for (const i of invitations.filter((x) => x.status === 'PENDING')) {
      const invTl = new Date(i.expiresAt).getTime() - Date.now();
      list.push({
        when: !mounted
          ? fmtDate(i.expiresAt).split(',')[0]
          : invTl > 0
          ? invTl < 86_400_000
            ? 'Today'
            : 'Tomorrow'
          : fmtDate(i.expiresAt).split(',')[0],
        time: new Date(i.expiresAt).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' }),
        icon: <Gavel className="w-3.5 h-3.5" />,
        tone: 'bg-violet-100 text-violet-600',
        title: 'Jury invitation expires',
        sub: `${i.caseNumber} · ${i.category}`,
        href: `/jury/${i.caseId}`,
      });
    }
    return list.sort((a, b) => a.when.localeCompare(b.when)).slice(0, 4);
  }, [activeCases, invitations, mounted]);

  const announcements = useMemo(() => {
    const icons: Record<string, React.ReactNode> = {
      PlatformUpdate: <Megaphone className="w-4 h-4" />,
      Guidelines: <BookOpen className="w-4 h-4" />,
      Jurors: <Users className="w-4 h-4" />,
    };
    return [
      { icon: icons.PlatformUpdate, tone: 'bg-violet-100 text-violet-600', title: 'Platform Update', body: 'New evidence verification features are live!', date: fmtDate('2026-08-30') },
      { icon: icons.Guidelines, tone: 'bg-blue-100 text-blue-600', title: 'Community Guidelines', body: 'Please review the updated community guidelines.', date: fmtDate('2026-08-21') },
      { icon: icons.Jurors, tone: 'bg-emerald-100 text-emerald-600', title: 'Call for Community Jurors', body: 'Help us build a fairer community — join the jury panel.', date: fmtDate('2026-08-09') },
    ];
  }, []);

  const stat = (icon: React.ReactNode, tone: string, value: React.ReactNode, label: string, href: string) => (
    <Card className="p-4 flex items-center gap-3.5" onClick={() => router.push(href)}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tone}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xl font-black text-slate-900 leading-none">{value}</p>
        <p className="text-[12px] font-semibold text-slate-500 mt-1">{label}</p>
        <Link href={href} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:text-violet-700 mt-1">
          View <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
      {/* ═══ Main column ═══ */}
      <div className="space-y-5 min-w-0">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-[#101a33] text-white shadow-lg">
          {/* Sunset mountain scene (reference hero) */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-[#101a33] via-[#1c2452] to-[#3b2f6b]" />
            <div className="absolute right-[16%] bottom-[34%] w-28 h-28 rounded-full bg-amber-400/40 blur-2xl" />
            <div className="absolute right-[12%] bottom-[26%] w-16 h-16 rounded-full bg-orange-300/50 blur-xl" />
            <svg className="absolute inset-x-0 bottom-0 w-full h-[70%]" viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden>
              <path d="M0,200 L0,118 L150,58 L310,128 L480,36 L650,138 L830,66 L1010,148 L1200,74 L1200,200 Z" fill="#131c40" opacity="0.92" />
              <path d="M0,200 L0,152 L210,92 L390,162 L570,102 L770,172 L950,112 L1200,158 L1200,200 Z" fill="#0a1128" />
            </svg>
            <div className="absolute -right-16 -top-24 w-72 h-72 rounded-full bg-violet-500/20 blur-3xl" />
            {/* Left scrim for text contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#101a33]/95 via-[#101a33]/55 to-transparent" />
          </div>
          <div className="relative px-6 py-6 sm:px-8 sm:py-7 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                {greet}, {firstName}! <span aria-hidden>👋</span>
              </h1>
              <p className="text-[13px] text-slate-300 mt-1.5">Justice is a conversation. Let's keep it fair.</p>
              {authUser && (
                <p className="text-[11px] text-slate-400 mt-2 font-mono">
                  {authUser.wallet.slice(0, 8)}…{authUser.wallet.slice(-4)} · Jury identity {myJurorPseudonym}
                </p>
              )}
            </div>
            <div className="text-right max-w-[220px]">
              <p className="italic text-slate-300 text-[13px] leading-relaxed">"Disputes today. A fairer tomorrow."</p>
              <p className="text-[11px] text-slate-500 mt-1">— Resolvia</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stat(<FileText className="w-5 h-5 text-violet-600" />, 'bg-violet-100', activeCases.length, 'Active Cases', '/cases')}
          {stat(<CheckCircle2 className="w-5 h-5 text-emerald-600" />, 'bg-emerald-100', closedCases.length, 'Closed Cases', '/cases?tab=closed')}
          {stat(<Users className="w-5 h-5 text-blue-600" />, 'bg-blue-100', asJuror.length, 'As Juror', '/jury')}
          {stat(<Shield className="w-5 h-5 text-amber-600" />, 'bg-amber-100', REP, 'Reputation Points', '/reputation')}
        </div>

        {/* AI + People + Blockchain */}
        <Card className="p-5 bg-gradient-to-br from-violet-50 via-white to-indigo-50 border-violet-100">
          <div className="grid md:grid-cols-[1fr_auto_220px] gap-5 items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-violet-600 flex items-center justify-center shadow-md shadow-violet-300">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-black text-slate-900">AI + People + Blockchain</h3>
              </div>
              <p className="text-[12px] text-slate-500 mt-2.5 leading-relaxed max-w-md">
                AI analyzes evidence. People make the decision. Blockchain preserves the record. <span className="font-semibold text-slate-600">The AI is advisory only — the human jury's verdict is the only binding outcome.</span>
              </p>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { icon: <Sparkles className="w-4 h-4" />, t: 'Objective Insights', s: 'from AI' },
                  { icon: <Users className="w-4 h-4" />, t: 'Human Deliberation', s: 'by Real People' },
                  { icon: <Scale className="w-4 h-4" />, t: 'Immutable Records', s: 'on Blockchain' },
                ].map((x) => (
                  <div key={x.t} className="bg-white/80 border border-violet-100 rounded-xl p-3 text-center">
                    <div className="w-8 h-8 mx-auto rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">{x.icon}</div>
                    <p className="text-[10px] font-black text-slate-700 mt-2 leading-tight">{x.t}</p>
                    <p className="text-[10px] text-slate-400">{x.s}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden md:flex flex-col items-center px-4">
              <div className="relative w-40 h-28">
                <Scale className="w-32 h-32 text-violet-400/60 absolute inset-0" />
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full blur-[2px] opacity-40" />
              </div>
              <p className="text-[10px] font-black tracking-[0.2em] text-slate-500 mt-1">FAIRNESS IN ACTION</p>
            </div>
            <ul className="space-y-2.5">
              {['Transparent Process', 'Community Driven', 'Tamper-Proof Records', 'Accessible to Everyone'].map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                  </span>
                  <span className="text-[12px] font-semibold text-slate-600">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* Quick actions */}
        <div>
          <h2 className="text-[15px] font-black text-slate-900 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[
              { icon: <Plus className="w-5 h-5" />, tone: 'bg-violet-600', card: 'bg-violet-50/60 border-violet-100', t: 'Create New Case', s: 'Start a dispute resolution', href: '/create' },
              { icon: <Gavel className="w-5 h-5" />, tone: 'bg-blue-600', card: 'bg-blue-50/60 border-blue-100', t: 'Review Jury Cases', s: 'Help deliver fair verdicts', href: '/jury' },
              { icon: <BookOpen className="w-5 h-5" />, tone: 'bg-emerald-600', card: 'bg-emerald-50/60 border-emerald-100', t: 'Explore Case Studies', s: 'Learn from real cases', href: '/case-studies' },
              { icon: <Users className="w-5 h-5" />, tone: 'bg-orange-500', card: 'bg-orange-50/60 border-orange-100', t: 'View My Cases', s: 'Track your progress', href: '/cases' },
            ].map((x) => (
              <Link key={x.t} href={x.href} className={`${x.card} border rounded-2xl p-4 text-center hover:-translate-y-0.5 transition-transform`}>
                <div className={`w-11 h-11 mx-auto rounded-xl ${x.tone} text-white flex items-center justify-center shadow-sm`}>{x.icon}</div>
                <p className="text-[13px] font-black text-slate-800 mt-3">{x.t}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{x.s}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* My active cases */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-black text-slate-900">My Active Cases</h2>
            <Link href="/cases" className="flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:text-violet-700">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {myActive.length === 0 ? (
            <p className="text-[13px] text-slate-400 py-6 text-center">No active cases right now. Start one or serve as a juror.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {myActive.map((c) => {
                const cat = categoryLabel(c.category);
                const role = c.myRole === 'CLAIMANT' ? 'As Claimant' : c.myRole === 'RESPONDENT' ? 'As Respondent' : 'As Juror';
                const voting = c.status === 'JURY_COMMIT' || c.status === 'JURY_REVEAL';
                return (
                  <Link key={c.id} href={`/cases/${c.id}`} className="flex items-center gap-3 py-3 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-slate-800 group-hover:text-violet-700 transition-colors">
                        {shortCaseId(c.id)} <span className="font-semibold text-slate-600">· {c.title}</span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">{c.claimSummary}</p>
                    </div>
                    <Chip tone={cat.tone} className="hidden sm:inline-flex">{cat.label}</Chip>
                    <span className="hidden md:inline text-[11px] font-semibold text-slate-500 w-24 text-right">{role}</span>
                    <Chip tone={statusTone(c.status)} dot>{voting ? 'Under Jury Review' : c.status.replace(/_/g, ' ')}</Chip>
                    <div className="hidden lg:block text-right w-36">
                      <p className="text-[11px] font-semibold text-slate-500">{voting ? 'Voting ends' : 'Updated'} in {fmtDate(c.votingDeadline).split(',')[0]}</p>
                      <p className="text-[10px] text-slate-400">{fmtDate(c.votingDeadline)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500" />
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Recommended case studies */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-black text-slate-900">Recommended Case Studies</h2>
              <Link href="/case-studies" className="flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:text-violet-700">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {studies.map((c) => {
                const cat = categoryLabel(c.category);
                return (
                  <Link key={c.id} href={`/case-studies/${c.id}`} className="flex items-center gap-3 group">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shrink-0">
                      <Scale className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-slate-800 group-hover:text-violet-700 transition-colors truncate">{c.title}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Chip tone={cat.tone}>{cat.label}</Chip>
                        <Chip tone="green">Resolved</Chip>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 shrink-0" />
                  </Link>
                );
              })}
            </div>
          </Card>

          {/* Recent announcements */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-black text-slate-900">Recent Announcements</h2>
              <Link href="/resources" className="flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:text-violet-700">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3.5">
              {announcements.map((a) => (
                <div key={a.title} className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${a.tone}`}>{a.icon}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-slate-800">{a.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{a.body}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{a.date}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ═══ Right rail ═══ */}
      <div className="space-y-5">
        {/* Your journey */}
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-200">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400">Your Journey</p>
              <p className="text-[14px] font-black text-slate-900">Level 2 — Contributor</p>
            </div>
          </div>
          <div className="mt-3.5">
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" style={{ width: `${(REP / 1000) * 100}%` }} />
            </div>
            <p className="text-right text-[10px] font-bold text-slate-400 mt-1">{REP} / 1,000 XP</p>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[
              { v: cases.filter((c) => c.myRole === 'CLAIMANT').length, l: 'Cases Submitted', icon: <FileText className="w-3.5 h-3.5" />, t: 'text-violet-600 bg-violet-50' },
              { v: asJuror.length, l: 'Jury Participations', icon: <Users className="w-3.5 h-3.5" />, t: 'text-blue-600 bg-blue-50' },
              { v: 3, l: 'Helpful Votes', icon: <CheckCircle2 className="w-3.5 h-3.5" />, t: 'text-emerald-600 bg-emerald-50' },
              { v: 2, l: 'Badges Earned', icon: <Star className="w-3.5 h-3.5" />, t: 'text-amber-600 bg-amber-50' },
            ].map((x) => (
              <div key={x.l} className="rounded-xl border border-slate-100 p-2 text-center">
                <div className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center ${x.t}`}>{x.icon}</div>
                <p className="text-[15px] font-black text-slate-900 mt-1.5 leading-none">{x.v}</p>
                <p className="text-[8.5px] font-semibold text-slate-400 mt-1 leading-tight">{x.l}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] italic text-slate-400 leading-relaxed text-center">
            "Justice is not just about winning a case, but about being heard fairly." <span className="not-italic text-slate-300">— Resolvia</span>
          </p>
        </Card>

        {/* Upcoming actions */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-black text-slate-900">Upcoming Actions</h2>
            <Link href="/cases" className="flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:text-violet-700">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-[12px] text-slate-400 text-center py-4">Nothing due right now. Enjoy the calm.</p>
          ) : (
            <ol className="relative border-l-2 border-slate-100 ml-2.5 space-y-5">
              {upcoming.map((u, i) => (
                <li key={i} className="relative pl-5">
                  <span className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-violet-500 flex items-center justify-center`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  </span>
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{u.when}</p>
                  <Link href={u.href} className="flex items-start gap-2.5 mt-1.5 group">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${u.tone}`}>{u.icon}</span>
                    <span className="min-w-0">
                      <span className="block text-[12px] font-bold text-slate-700 group-hover:text-violet-700 transition-colors">{u.title}</span>
                      <span className="block text-[11px] text-slate-400 truncate">{u.sub}</span>
                    </span>
                    <span suppressHydrationWarning className="ml-auto text-[10px] font-bold text-slate-400 shrink-0">{u.time}</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Card>

        {/* Reputation overview */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-black text-slate-900">Reputation Overview</h2>
            <Link href="/reputation" className="flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:text-violet-700">
              View Details <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <Ring value={REP} max={1000} label="Level 2" />
            <div className="min-w-0">
              <p className="text-[13px] font-black text-slate-900">Contributor</p>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">Consistent participation builds a fairer community.</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[
              { v: cases.filter((c) => c.myRole === 'CLAIMANT').length, l: 'Submitted', t: 'text-violet-600 bg-violet-50' },
              { v: asJuror.length, l: 'Jury', t: 'text-blue-600 bg-blue-50' },
              { v: 3, l: 'Helpful Votes', t: 'text-rose-500 bg-rose-50' },
              { v: 2, l: 'Badges', t: 'text-amber-600 bg-amber-50' },
            ].map((x) => (
              <div key={x.l} className="rounded-xl border border-slate-100 p-2 text-center">
                <p className={`text-[15px] font-black ${x.t.split(' ')[0]}`}>{x.v}</p>
                <p className="text-[8.5px] font-semibold text-slate-400 mt-0.5">{x.l}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Fairer tomorrow */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#171f3d] via-[#232a54] to-[#43307a] text-white p-5 shadow-lg">
          <Scale className="absolute -right-4 -bottom-6 w-28 h-28 text-white/10" />
          <h3 className="text-[16px] font-black leading-snug">
            Be a Part of
            <br />
            <span className="text-violet-300">A Fairer Tomorrow</span>
          </h3>
          <p className="text-[12px] text-slate-300 mt-2 leading-relaxed">Join as a juror, contribute to real cases, and help build a more just society.</p>
          <Link href="/jury" className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors shadow-md">
            Join the Jury Panel <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
