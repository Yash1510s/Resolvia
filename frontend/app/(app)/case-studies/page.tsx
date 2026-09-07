'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ArrowRight, Scale, Search } from 'lucide-react';
import { useApp } from '../../lib/app-context';
import { Card, Chip, categoryLabel, fmtDate, shortCaseId } from '../../components/ui';
import type { DisputeCase } from '../../types';

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

const DOT: Record<string, string> = { 'In Favor of Claimant': 'bg-emerald-500', 'In Favor of Respondent': 'bg-rose-500', 'Partial Resolution': 'bg-amber-500' };

export default function CaseStudiesPage() {
  const { cases } = useApp();
  const studies = useMemo(() => cases.filter((c) => (c.status === 'CLOSED' || c.status === 'FINALIZED') && c.caseStudy), [cases]);
  const [tab, setTab] = useState<CatTab>('ALL');
  const [q, setQ] = useState('');
  const [verdict, setVerdict] = useState('ALL');
  const [sort, setSort] = useState('NEWEST');

  const countFor = (t: CatTab) => (t === 'ALL' ? studies.length : studies.filter((c) => catGroup(c) === t).length);

  const verdictOf = (c: DisputeCase): string => {
    const w = c.verdictOutcome?.winner;
    if (w === 'Claimant') return 'In Favor of Claimant';
    if (w === 'Respondent') return 'In Favor of Respondent';
    return 'Partial Resolution';
  };

  const shown = useMemo(() => {
    let list = tab === 'ALL' ? studies : studies.filter((c) => catGroup(c) === tab);
    if (verdict !== 'ALL') list = list.filter((c) => verdictOf(c) === verdict);
    const query = q.toLowerCase().trim();
    if (query) list = list.filter((c) => (c.title + ' ' + c.claimSummary + ' ' + c.caseNumber).toLowerCase().includes(query));
    return [...list].sort((a, b) => {
      const ta = new Date(a.caseStudy?.closedAt || a.createdAt).getTime();
      const tb = new Date(b.caseStudy?.closedAt || b.createdAt).getTime();
      return sort === 'NEWEST' ? tb - ta : ta - tb;
    });
  }, [studies, tab, verdict, q, sort]);

  const tabs: { id: CatTab; label: string }[] = [
    { id: 'ALL', label: 'All Closed Cases' },
    { id: 'ACADEMIC', label: 'Academic' },
    { id: 'CAMPUS', label: 'Campus Life' },
    { id: 'FINANCE', label: 'Finance' },
    { id: 'ECOM', label: 'E-commerce' },
    { id: 'OTHER', label: 'Other' },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div className="max-w-xl">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Case Studies</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Explore real cases from the Resolvia community. Learn from disputes, decisions, and the reasoning behind them.
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-violet-50 border border-violet-100 max-w-xs">
          <p className="italic text-[12px] text-slate-600 leading-relaxed">"Every case is a lesson. Every lesson builds a fairer tomorrow."</p>
          <p className="text-[10px] text-slate-400 mt-1.5">— Resolvia</p>
        </div>
      </div>

      {/* Category tabs */}
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
              {t.label}
              <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black flex items-center justify-center ${active ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {countFor(t.id)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex-1 min-w-[220px] flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search closed cases…" className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-slate-400" />
        </div>
        <select value={verdict} onChange={(e) => setVerdict(e.target.value)} className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-[12px] font-semibold text-slate-600 outline-none">
          <option value="ALL">All Verdicts</option>
          <option>In Favor of Claimant</option>
          <option>In Favor of Respondent</option>
          <option>Partial Resolution</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-[12px] font-semibold text-slate-600 outline-none">
          <option value="NEWEST">Newest First</option>
          <option value="OLDEST">Oldest First</option>
        </select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="hidden md:grid grid-cols-[110px_1.4fr_120px_1.1fr_150px_110px_90px] gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50/60">
          {['Case ID', 'Title', 'Category', 'Parties', 'Verdict', 'Closed On', 'Actions'].map((h) => (
            <p key={h} className={`text-[10px] font-black uppercase tracking-wider text-slate-400 ${h === 'Actions' ? 'text-right' : ''}`}>{h}</p>
          ))}
        </div>
        {shown.length === 0 && (
          <div className="p-12 text-center">
            <BookOpen className="w-8 h-8 text-slate-200 mx-auto" />
            <p className="text-sm font-bold text-slate-500 mt-3">No case studies match</p>
            <p className="text-xs text-slate-400 mt-1">Cases become public case studies after closure, with consent and anonymisation.</p>
          </div>
        )}
        {shown.map((c) => {
          const v = verdictOf(c);
          const cat = categoryLabel(c.category);
          return (
            <Link
              key={c.id}
              href={`/case-studies/${c.id}`}
              className="grid grid-cols-1 md:grid-cols-[110px_1.4fr_120px_1.1fr_150px_110px_90px] gap-3 px-5 py-4 border-b border-slate-50 last:border-0 hover:bg-violet-50/30 transition-colors items-center"
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${DOT[v] || 'bg-slate-400'}`} />
                <span className="font-mono text-[12px] font-black text-slate-800">{shortCaseId(c.id)}</span>
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-slate-800 truncate">{c.title}</p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{c.claimSummary}</p>
              </div>
              <div><Chip tone={cat.tone}>{cat.label}</Chip></div>
              <p className="text-[11.5px] text-slate-500 truncate">
                {c.claimant.name.replace(/ \(Claimant\)/, '')} vs {c.respondent.name.replace(/ \(Respondent\)/, '')}
              </p>
              <Chip tone={v === 'In Favor of Claimant' ? 'green' : v === 'In Favor of Respondent' ? 'rose' : 'amber'} dot>{v}</Chip>
              <p className="text-[11.5px] text-slate-500">{fmtDate(c.caseStudy?.closedAt)}</p>
              <div className="md:text-right">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 text-[11px] font-bold">
                  View <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          );
        })}
      </Card>

      <div className="flex items-center justify-between mt-4 text-[12px] text-slate-400">
        <span>Showing 1–{shown.length} of {shown.length} case studies</span>
        <div className="flex items-center gap-1">
          <span className="px-3 py-1.5 rounded-lg bg-violet-600 text-white font-black text-[11px]">1</span>
        </div>
      </div>

      <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
        <Scale className="w-4.5 h-4.5 text-violet-500 shrink-0 mt-0.5" />
        <p className="text-[11.5px] text-slate-500 leading-relaxed">
          <strong className="text-slate-700">Three disclosure levels:</strong> every study is published at (1) a public Overview,
          (2) a Detailed Case Study with evidence + anonymised jury reasoning, and (3) a Legal-Forensic Record with the full
          verified audit package. PII is redacted; sensitive exhibits stay access-controlled. Admissibility in any court or
          forum depends on jurisdiction — we describe records, we don&apos;t promise outcomes.
        </p>
      </div>
    </div>
  );
}
