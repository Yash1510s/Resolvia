'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ArrowRight, Scale, Search, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '../../lib/app-context';
import { Card, Chip, categoryLabel, statusTone, fmtDate, shortCaseId } from '../../components/ui';
import type { DisputeCase } from '../../types';
import { isClosed } from '../../lib/caseLifecycle';

type ScopeTab = 'ALL' | 'ACTIVE' | 'CLOSED';
type CatTab = 'ALL' | 'ACADEMIC' | 'CAMPUS' | 'FINANCE' | 'ECOM' | 'OTHER';

function catGroup(c: DisputeCase): CatTab {
  switch (c.category) {
    case 'ACADEMIC':
    case 'IP_ACADEMIC':
      return 'ACADEMIC';
    case 'CAMPUS_LIFE':
      return 'CAMPUS';
    case 'FINANCIAL_PAYMENT':
      return 'FINANCE';
    case 'ECOMMERCE_MARKETPLACE':
    case 'MARKETPLACE':
      return 'ECOM';
    default:
      return 'OTHER';
  }
}

const DOT: Record<string, string> = {
  'In Favor of Claimant': 'bg-emerald-500',
  'In Favor of Respondent': 'bg-rose-500',
  'Partial Resolution': 'bg-amber-500',
  ACTIVE: 'bg-blue-500',
  VOTING: 'bg-violet-500',
};

export default function CaseStudiesPage() {
  const { cases } = useApp();
  const [scope, setScope] = useState<ScopeTab>('ALL');
  const [tab, setTab] = useState<CatTab>('ALL');
  const [q, setQ] = useState('');
  const [verdict, setVerdict] = useState('ALL');
  const [sort, setSort] = useState('NEWEST');

  const activeCases = useMemo(() => cases.filter((c) => !isClosed(c)), [cases]);
  const closedCases = useMemo(() => cases.filter((c) => isClosed(c)), [cases]);

  const targetPool = useMemo(() => {
    if (scope === 'ACTIVE') return activeCases;
    if (scope === 'CLOSED') return closedCases;
    return cases;
  }, [cases, activeCases, closedCases, scope]);

  const countForCat = (t: CatTab) => (t === 'ALL' ? targetPool.length : targetPool.filter((c) => catGroup(c) === t).length);

  const verdictOf = (c: DisputeCase): string => {
    if (!isClosed(c)) {
      if (c.status === 'RESPONDENT_WINDOW') return 'Response Window';
      if (c.status === 'EVIDENCE_LOCKED') return 'Evidence Phase';
      if (c.status === 'JURY_COMMIT' || c.status === 'JURY_REVEAL') return 'Under Jury Review';
      if (c.status === 'AI_ANALYSIS') return 'AI Analysis';
      return 'Active Proceeding';
    }
    const w = c.verdictOutcome?.winner;
    if (w === 'Claimant') return 'In Favor of Claimant';
    if (w === 'Respondent') return 'In Favor of Respondent';
    return 'Partial Resolution';
  };

  const shown = useMemo(() => {
    let list = tab === 'ALL' ? targetPool : targetPool.filter((c) => catGroup(c) === tab);
    if (verdict !== 'ALL') {
      list = list.filter((c) => verdictOf(c) === verdict);
    }
    const query = q.toLowerCase().trim();
    if (query) {
      list = list.filter((c) =>
        (
          c.title + ' ' +
          c.claimSummary + ' ' +
          c.caseNumber + ' ' +
          (c.claimant?.name || '') + ' ' +
          (c.respondent?.name || '') + ' ' +
          (c.respondent?.contact || '')
        )
          .toLowerCase()
          .includes(query)
      );
    }
    return [...list].sort((a, b) => {
      const ta = new Date(a.caseStudy?.closedAt || a.createdAt).getTime();
      const tb = new Date(b.caseStudy?.closedAt || b.createdAt).getTime();
      return sort === 'NEWEST' ? tb - ta : ta - tb;
    });
  }, [targetPool, tab, verdict, q, sort]);

  const catTabs: { id: CatTab; label: string }[] = [
    { id: 'ALL', label: 'All Categories' },
    { id: 'ACADEMIC', label: 'Academic' },
    { id: 'CAMPUS', label: 'Campus Life' },
    { id: 'FINANCE', label: 'Finance' },
    { id: 'ECOM', label: 'E-commerce' },
    { id: 'OTHER', label: 'Other' },
  ];

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Case Studies & Protocol Disputes</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Explore live proceedings and closed precedents from the Resolvia community. Publicly transparent, cryptographically audited, and jury reviewed.
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-violet-50 border border-violet-100 max-w-xs shadow-sm">
          <p className="italic text-[12px] text-slate-600 leading-relaxed">&ldquo;Every dispute is transparent. Every resolution builds an immutable precedent.&rdquo;</p>
          <p className="text-[10px] text-slate-400 mt-1.5">— Resolvia Protocol</p>
        </div>
      </div>

      {/* Scope Switcher: All vs Active Proceedings vs Resolved Precedents */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        <button
          onClick={() => { setScope('ALL'); setTab('ALL'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            scope === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Disputes
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${scope === 'ALL' ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-600'}`}>
            {cases.length}
          </span>
        </button>
        <button
          onClick={() => { setScope('ACTIVE'); setTab('ALL'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            scope === 'ACTIVE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Ongoing Proceedings
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${scope === 'ACTIVE' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
            {activeCases.length}
          </span>
        </button>
        <button
          onClick={() => { setScope('CLOSED'); setTab('ALL'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            scope === 'CLOSED' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Resolved Precedents
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${scope === 'CLOSED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
            {closedCases.length}
          </span>
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {catTabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                active ? 'bg-violet-50 border-violet-300 text-violet-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {t.label}
              <span className={`min-w-[18px] h-4 px-1 rounded-full text-[10px] font-black flex items-center justify-center ${active ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {countForCat(t.id)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[240px] flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by case number, title, claimant or respondent name/email…"
            className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-slate-400"
          />
        </div>
        <select
          value={verdict}
          onChange={(e) => setVerdict(e.target.value)}
          className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-[12px] font-semibold text-slate-600 outline-none shadow-sm"
        >
          <option value="ALL">All Outcomes & Phases</option>
          <option value="Response Window">Response Window</option>
          <option value="Evidence Phase">Evidence Phase</option>
          <option value="Under Jury Review">Under Jury Review</option>
          <option value="In Favor of Claimant">In Favor of Claimant</option>
          <option value="In Favor of Respondent">In Favor of Respondent</option>
          <option value="Partial Resolution">Partial Resolution</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-[12px] font-semibold text-slate-600 outline-none shadow-sm"
        >
          <option value="NEWEST">Newest First</option>
          <option value="OLDEST">Oldest First</option>
        </select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden shadow-sm">
        <div className="hidden md:grid grid-cols-[105px_1.5fr_110px_1.2fr_135px_130px_90px] gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50/80">
          {['Case ID', 'Dispute Title', 'Category', 'Mapped Parties', 'Status / Ruling', 'Timeline', 'Actions'].map((h) => (
            <p key={h} className={`text-[10px] font-black uppercase tracking-wider text-slate-400 ${h === 'Actions' ? 'text-right' : ''}`}>{h}</p>
          ))}
        </div>
        {shown.length === 0 && (
          <div className="p-12 text-center">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-600 mt-3">No cases found matching your filters</p>
            <p className="text-xs text-slate-400 mt-1">Try switching to &ldquo;All Disputes&rdquo; or clearing search filters.</p>
          </div>
        )}
        {shown.map((c) => {
          const closed = isClosed(c);
          const v = verdictOf(c);
          const cat = categoryLabel(c.category);
          const href = closed && c.caseStudy ? `/case-studies/${c.id}` : `/cases/${c.id}`;

          const dotColor = closed
            ? (DOT[v] || 'bg-slate-400')
            : c.status === 'JURY_COMMIT' || c.status === 'JURY_REVEAL'
            ? 'bg-violet-500 animate-pulse'
            : 'bg-blue-500 animate-pulse';

          const claimantClean = (c.claimant?.name || 'Claimant').replace(/ \(Claimant\)/, '');
          const respClean = (c.respondent?.name || c.respondent?.contact || 'Respondent').replace(/ \(Respondent\)/, '');

          return (
            <Link
              key={c.id}
              href={href}
              className="grid grid-cols-1 md:grid-cols-[105px_1.5fr_110px_1.2fr_135px_130px_90px] gap-3 px-5 py-4 border-b border-slate-50 last:border-0 hover:bg-violet-50/40 transition-colors items-center group"
            >
              {/* ID & Dot */}
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                <span className="font-mono text-[12px] font-black text-slate-800 group-hover:text-violet-700 transition-colors">
                  {shortCaseId(c.id)}
                </span>
              </div>

              {/* Title & Summary */}
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-slate-800 truncate group-hover:text-violet-700 transition-colors">
                  {c.title}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{c.claimSummary}</p>
              </div>

              {/* Category */}
              <div>
                <Chip tone={cat.tone}>{cat.label}</Chip>
              </div>

              {/* Parties Mapped */}
              <div className="min-w-0">
                <p className="text-[11.5px] font-semibold text-slate-700 truncate">
                  <span className="text-violet-700">{claimantClean}</span> vs <span className="text-slate-900">{respClean}</span>
                </p>
                <p className="text-[10px] text-slate-400">
                  {c.respondent?.id ? 'Registered Respondent' : 'Notified via Contact'}
                </p>
              </div>

              {/* Status or Verdict */}
              <div>
                {closed ? (
                  <Chip tone={v === 'In Favor of Claimant' ? 'green' : v === 'In Favor of Respondent' ? 'rose' : 'amber'} dot>
                    {v}
                  </Chip>
                ) : (
                  <Chip tone={statusTone(c.status)} dot>
                    {c.status === 'RESPONDENT_WINDOW' ? 'Response Window' : c.status === 'JURY_COMMIT' ? 'Jury Review' : c.status.replace(/_/g, ' ')}
                  </Chip>
                )}
              </div>

              {/* Timeline */}
              <div className="text-[11px] text-slate-500">
                {closed ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    {fmtDate(c.caseStudy?.closedAt || c.createdAt).split(',')[0]}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-600">
                    <Clock className="w-3 h-3 text-blue-500 shrink-0" />
                    {fmtDate(c.responseDeadline || c.votingDeadline).split(',')[0]}
                  </span>
                )}
              </div>

              {/* Action Button */}
              <div className="md:text-right">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 text-[11px] font-bold group-hover:bg-violet-600 group-hover:text-white transition-colors">
                  {closed ? 'Study' : 'View'} <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          );
        })}
      </Card>

      <div className="flex items-center justify-between mt-2 text-[12px] text-slate-400">
        <span>Showing {shown.length} of {cases.length} platform disputes</span>
        <div className="flex items-center gap-1">
          <span className="px-3 py-1 rounded-lg bg-violet-600 text-white font-black text-[11px]">1</span>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
        <Scale className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
        <p className="text-[11.5px] text-slate-500 leading-relaxed">
          <strong className="text-slate-700">Public Protocol Transparency:</strong> Every dispute created on Resolvia generates a transparent public record with mapped claimant and respondent details. Closed cases produce anonymised precedents and forensic audit records.
        </p>
      </div>
    </div>
  );
}
