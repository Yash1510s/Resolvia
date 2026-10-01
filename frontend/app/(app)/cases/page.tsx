'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FolderOpen,
  FileText,
  Gavel,
  Users,
  CheckCircle2,
  Plus,
  ChevronRight,
  Clock,
  Calendar,
  Search,
  MoreVertical,
  Scale,
  Filter,
} from 'lucide-react';
import { useApp } from '../../lib/app-context';
import type { DisputeCase } from '../../types';
import { isClosed } from '../../lib/caseLifecycle';
import { Card, Chip, PageHead, BtnPrimary, categoryLabel, statusTone, fmtDate, shortCaseId } from '../../components/ui';

type Tab = 'ALL' | 'CLAIMANT' | 'RESPONDENT' | 'JUROR' | 'CLOSED';

const STATUS_DISPLAY: Record<string, { label: string; tone: Parameters<typeof Chip>[0]['tone'] }> = {
  SUBMITTED: { label: 'Filed', tone: 'blue' },
  RESPONDENT_WINDOW: { label: 'Response Window', tone: 'blue' },
  EVIDENCE_LOCKED: { label: 'Evidence Phase', tone: 'blue' },
  AI_ANALYSIS: { label: 'AI Analysis', tone: 'amber' },
  JURY_COMMIT: { label: 'Under Jury Review', tone: 'violet' },
  JURY_REVEAL: { label: 'Jury Review', tone: 'violet' },
  APPEAL_WINDOW: { label: 'Appeal Window', tone: 'rose' },
  VERDICT: { label: 'Closed', tone: 'green' },
  FINALIZED: { label: 'Closed', tone: 'green' },
  CLOSED: { label: 'Closed', tone: 'green' },
};

function statusDisplay(c: DisputeCase) {
  return STATUS_DISPLAY[c.status] || { label: c.status.replace(/_/g, ' '), tone: 'slate' as const };
}

export default function MyCasesRoute() {
  return (
    <Suspense fallback={null}>
      <MyCases />
    </Suspense>
  );
}

function MyCases() {
  const { cases } = useApp();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => {
    const t = searchParams.get('tab');
    if (t === 'closed') return 'CLOSED';
    if (t === 'claimant') return 'CLAIMANT';
    if (t === 'respondent') return 'RESPONDENT';
    if (t === 'juror') return 'JUROR';
    return 'ALL';
  });
  const [fRole, setFRole] = useState('ALL');
  const [fStatus, setFStatus] = useState('ALL');
  const [fCategory, setFCategory] = useState('ALL');
  const [fSearch, setFSearch] = useState('');
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const search = searchParams.get('search') || '';

  const groups = useMemo(() => {
    const g: Record<Tab, DisputeCase[]> = { ALL: [], CLAIMANT: [], RESPONDENT: [], JUROR: [], CLOSED: [] };
    for (const c of cases) {
      g.ALL.push(c);
      if (isClosed(c)) g.CLOSED.push(c);
      if (c.myRole === 'CLAIMANT') g.CLAIMANT.push(c);
      if (c.myRole === 'RESPONDENT') g.RESPONDENT.push(c);
      if (c.myRole === 'JUROR') g.JUROR.push(c);
    }
    return g;
  }, [cases]);

  const categories = useMemo(() => Array.from(new Set(cases.map((c) => c.category))), [cases]);

  const filtered = useMemo(() => {
    let list = groups[tab];
    if (fRole !== 'ALL') list = list.filter((c) => c.myRole === fRole);
    if (fStatus === 'ACTIVE') list = list.filter((c) => !isClosed(c));
    else if (fStatus === 'CLOSED') list = list.filter((c) => isClosed(c));
    else if (fStatus !== 'ALL') list = list.filter((c) => c.status === fStatus);
    if (fCategory !== 'ALL') list = list.filter((c) => c.category === fCategory);
    const q = (fSearch || search).toLowerCase().trim();
    if (q) list = list.filter((c) => (c.title + ' ' + c.caseNumber + ' ' + c.claimSummary + ' ' + c.category).toLowerCase().includes(q));
    return list;
  }, [groups, tab, fRole, fStatus, fCategory, fSearch, search]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'ALL', label: 'All Cases', icon: <FolderOpen className="w-4 h-4" />, count: groups.ALL.length },
    { id: 'CLAIMANT', label: 'As Claimant', icon: <FileText className="w-4 h-4" />, count: groups.CLAIMANT.length },
    { id: 'RESPONDENT', label: 'As Respondent', icon: <Gavel className="w-4 h-4" />, count: groups.RESPONDENT.length },
    { id: 'JUROR', label: 'As Juror', icon: <Users className="w-4 h-4" />, count: groups.JUROR.length },
    { id: 'CLOSED', label: 'Closed', icon: <CheckCircle2 className="w-4 h-4" />, count: groups.CLOSED.length },
  ];

  const actionFor = (c: DisputeCase): { label: string; href: string } => {
    if (isClosed(c)) return { label: 'View Outcome', href: `/cases/${c.id}` };
    if (c.myRole === 'JUROR') return { label: 'Review & Vote', href: `/jury/${c.id}` };
    if (c.myRole === 'RESPONDENT' && !c.respondent?.responded && (c.status === 'SUBMITTED' || c.status === 'RESPONDENT_WINDOW')) {
      return { label: 'Respond to Dispute', href: `/cases/${c.id}?section=response` };
    }
    if (c.status === 'EVIDENCE_LOCKED') return { label: 'Submit Evidence', href: `/cases/${c.id}?section=evidence` };
    if (c.status === 'AI_ANALYSIS') return { label: 'View Progress', href: `/cases/${c.id}?section=ai` };
    return { label: 'View Case', href: `/cases/${c.id}` };
  };

  const deadlineFor = (c: DisputeCase) => {
    if (isClosed(c)) return { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, top: 'Resolved on', sub: fmtDate(c.caseStudy?.closedAt || c.verdictOutcome?.finalizedAt || c.createdAt) };
    if (c.status === 'SUBMITTED' || c.status === 'RESPONDENT_WINDOW') {
      return { icon: <Clock className="w-4 h-4 text-amber-500" />, top: 'Response deadline', sub: fmtDate(c.responseDeadline), urgent: true };
    }
    const vd = now ? new Date(c.votingDeadline).getTime() - now : 0;
    if (c.status === 'EVIDENCE_LOCKED') return { icon: <Calendar className="w-4 h-4 text-slate-400" />, top: 'Submit evidence by', sub: fmtDate(c.responseDeadline) };
    if (c.status === 'AI_ANALYSIS') return { icon: <Clock className="w-4 h-4 text-amber-500" />, top: 'AI analysis in progress', sub: 'est. 1 day' };
    if (now && vd > 0 && vd < 172_800_000) return { icon: <Clock className="w-4 h-4 text-rose-500" />, top: 'Voting ends in', sub: `${Math.max(1, Math.floor(vd / 3_600_000))}h ${Math.floor((vd % 3_600_000) / 60_000)}m`, urgent: true };
    return { icon: <Clock className="w-4 h-4 text-slate-400" />, top: 'Voting deadline', sub: fmtDate(c.votingDeadline) };
  };

  return (
    <div>
      <PageHead
        title="My Cases"
        subtitle="Track, manage, and participate in all your cases — as a claimant, respondent, or juror."
        right={
          <BtnPrimary href="/create">
            <Plus className="w-4 h-4" /> Create New Case
          </BtnPrimary>
        }
      />

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
                  <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black flex items-center justify-center ${active ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Rows */}
          <div className="space-y-3">
            {filtered.length === 0 && (
              <Card className="p-10 text-center">
                <Scale className="w-10 h-10 text-slate-200 mx-auto" />
                <p className="text-sm font-bold text-slate-500 mt-3">No cases match this view</p>
                <p className="text-xs text-slate-400 mt-1">Try a different tab or clear the filters.</p>
              </Card>
            )}
            {filtered.map((c) => {
              const cat = categoryLabel(c.category);
              const st = statusDisplay(c);
              const act = actionFor(c);
              const dl = deadlineFor(c);
              const roleChip = c.myRole ? (
                <Chip tone={c.myRole === 'CLAIMANT' ? 'blue' : c.myRole === 'RESPONDENT' ? 'orange' : 'violet'}>
                  {c.myRole === 'CLAIMANT' ? 'As Claimant' : c.myRole === 'RESPONDENT' ? 'As Respondent' : 'As Juror'}
                </Chip>
              ) : (
                <span />
              );
              return (
                <Card key={c.id} className="p-4 flex flex-wrap items-center gap-x-4 gap-y-3 hover:border-violet-200 transition-colors">
                  <div className="w-24 shrink-0">
                    <Link href={`/cases/${c.id}`} className="text-[14px] font-black text-violet-700 hover:text-violet-800">
                      {shortCaseId(c.id)}
                    </Link>
                    <p className="text-[10px] text-slate-400 mt-0.5">{fmtDate(c.createdAt)}</p>
                  </div>
                  <div className="flex-1 min-w-[220px]">
                    <Link href={`/cases/${c.id}`} className="text-[14px] font-bold text-slate-900 hover:text-violet-700 transition-colors">
                      {c.title}
                    </Link>
                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                      {c.myRole === 'JUROR' ? 'You (Juror)' : `You (${c.myRole === 'CLAIMANT' ? 'Claimant' : 'Respondent'}) vs ${counterName(c)}`}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-md">{c.claimSummary}</p>
                  </div>
                  <Chip tone={cat.tone} className="shrink-0">{cat.label}</Chip>
                  <div className="shrink-0">{roleChip}</div>
                  <Chip tone={st.tone} dot className="shrink-0">{st.label}</Chip>
                  <div className="flex items-center gap-2.5 w-44 shrink-0">
                    {dl.icon}
                    <div className="leading-tight">
                      <p suppressHydrationWarning className="text-[11px] font-semibold text-slate-500">{dl.top}</p>
                      <p suppressHydrationWarning className={`text-[11px] font-bold ${(dl as { urgent?: boolean }).urgent ? 'text-rose-600' : 'text-slate-700'}`}>{dl.sub}</p>
                    </div>
                  </div>
                  <Link
                    href={act.href}
                    className="shrink-0 px-4 py-2 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold transition-colors"
                  >
                    {act.label}
                  </Link>
                  <button className="shrink-0 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400" title="More actions">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </Card>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-4 text-[12px] text-slate-400">
            <span>
              Showing 1–{filtered.length} of {filtered.length} cases
            </span>
            <div className="flex items-center gap-1">
              <button className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 font-semibold text-[11px]">← Previous</button>
              <span className="px-3 py-1.5 rounded-lg bg-violet-600 text-white font-black text-[11px]">1</span>
              <button className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 font-semibold text-[11px]">Next →</button>
            </div>
          </div>
        </div>

        {/* ── Right rail ── */}
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-[14px] font-black text-slate-900 mb-3">Case Overview</h2>
            <div className="space-y-2.5">
              {[
                { label: 'Total Cases', n: groups.ALL.length, tone: 'bg-violet-100 text-violet-600', icon: <FolderOpen className="w-4 h-4" />, tab: 'ALL' as Tab },
                { label: 'As Claimant', n: groups.CLAIMANT.length, tone: 'bg-blue-100 text-blue-600', icon: <FileText className="w-4 h-4" />, tab: 'CLAIMANT' as Tab },
                { label: 'As Respondent', n: groups.RESPONDENT.length, tone: 'bg-orange-100 text-orange-600', icon: <Gavel className="w-4 h-4" />, tab: 'RESPONDENT' as Tab },
                { label: 'As Juror', n: groups.JUROR.length, tone: 'bg-emerald-100 text-emerald-600', icon: <Users className="w-4 h-4" />, tab: 'JUROR' as Tab },
              ].map((r) => (
                <button key={r.label} onClick={() => setTab(r.tab)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${r.tone}`}>{r.icon}</span>
                  <span className="flex-1 text-left text-[12px] font-bold text-slate-700">{r.label}</span>
                  <span className="text-[14px] font-black text-slate-900">{r.n}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[14px] font-black text-slate-900">Filters</h2>
              {(fRole !== 'ALL' || fStatus !== 'ALL' || fCategory !== 'ALL' || fSearch) && (
                <button onClick={() => { setFRole('ALL'); setFStatus('ALL'); setFCategory('ALL'); setFSearch(''); }} className="text-[11px] font-bold text-violet-600 hover:text-violet-700">
                  Clear All
                </button>
              )}
            </div>
            <label className="text-[11px] font-bold text-slate-500">Search Cases</label>
            <div className="flex items-center gap-2 mt-1.5 mb-3.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input value={fSearch} onChange={(e) => setFSearch(e.target.value)} placeholder="Search by title, party, category…" className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-slate-400" />
            </div>
            <label className="text-[11px] font-bold text-slate-500">Filter by Role</label>
            <select value={fRole} onChange={(e) => setFRole(e.target.value)} className="w-full mt-1.5 mb-3.5 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[12px] font-semibold text-slate-600 outline-none focus:border-violet-300">
              <option value="ALL">All Roles</option>
              <option value="CLAIMANT">Claimant</option>
              <option value="RESPONDENT">Respondent</option>
              <option value="JUROR">Juror</option>
            </select>
            <label className="text-[11px] font-bold text-slate-500">Filter by Status</label>
            <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="w-full mt-1.5 mb-3.5 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[12px] font-semibold text-slate-600 outline-none focus:border-violet-300">
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="CLOSED">Closed</option>
              {Object.keys(STATUS_DISPLAY).map((s) => (
                <option key={s} value={s}>{STATUS_DISPLAY[s].label}</option>
              ))}
            </select>
            <label className="text-[11px] font-bold text-slate-500">Filter by Category</label>
            <select value={fCategory} onChange={(e) => setFCategory(e.target.value)} className="w-full mt-1.5 mb-4 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[12px] font-semibold text-slate-600 outline-none focus:border-violet-300">
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{categoryLabel(c).label}</option>
              ))}
            </select>
            <button
              onClick={() => {}}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors"
            >
              <Filter className="w-3.5 h-3.5" /> Apply Filters
            </button>
          </Card>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#171f3d] via-[#232a54] to-[#43307a] text-white p-5">
            <Scale className="absolute -right-4 -bottom-6 w-24 h-24 text-white/10" />
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-violet-500/40 flex items-center justify-center">
                <Scale className="w-4.5 h-4.5 text-violet-200" />
              </div>
              <h3 className="text-[14px] font-black">Create a New Case</h3>
            </div>
            <p className="text-[11.5px] text-slate-300 mt-2 leading-relaxed">Got a new dispute? Start a case and let's find a fair resolution together.</p>
            <Link href="/create" className="mt-3.5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors">
              <Plus className="w-3.5 h-3.5" /> Create Case
            </Link>
            <p className="mt-4 text-[10px] italic text-slate-400">"Be the change towards a fairer tomorrow." <span className="not-italic">— Resolvia</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

function counterName(c: DisputeCase): string {
  if (c.myRole === 'CLAIMANT') return c.respondent.name.replace(/ \(Respondent\)/, '');
  return c.claimant.name.replace(/ \(Claimant\)/, '');
}
