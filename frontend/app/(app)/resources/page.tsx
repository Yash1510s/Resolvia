'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  LayoutGrid,
  BookOpen,
  Scale,
  FileText,
  Workflow,
  GraduationCap,
  Users,
  Star,
  Bookmark,
  ArrowRight,
  ChevronRight,
  MessageSquare,
  HelpCircle,
  FileCheck,
  Landmark,
} from 'lucide-react';
import { Card, Chip, BtnPrimary } from '../../components/ui';

type Cat = 'ALL' | 'GUIDES' | 'LEGAL' | 'TEMPLATES' | 'PROCESS' | 'STUDENT' | 'COMMUNITY';

const CATS: { id: Cat; label: string; icon: React.ReactNode; count: string }[] = [
  { id: 'ALL', label: 'All Resources', icon: <LayoutGrid className="w-4 h-4" />, count: '120+ items' },
  { id: 'GUIDES', label: 'Guides & Tutorials', icon: <BookOpen className="w-4 h-4" />, count: '24 items' },
  { id: 'LEGAL', label: 'Legal References', icon: <Scale className="w-4 h-4" />, count: '18 items' },
  { id: 'TEMPLATES', label: 'Templates', icon: <FileText className="w-4 h-4" />, count: '16 items' },
  { id: 'PROCESS', label: 'Case Process', icon: <Workflow className="w-4 h-4" />, count: '12 items' },
  { id: 'STUDENT', label: 'Student Help', icon: <GraduationCap className="w-4 h-4" />, count: '20 items' },
  { id: 'COMMUNITY', label: 'Community', icon: <Users className="w-4 h-4" />, count: '10 items' },
];

interface Res {
  title: string;
  desc: string;
  type: 'Guide' | 'Template' | 'Reference' | 'Case Study';
  cat: Exclude<Cat, 'ALL'>;
  date: string;
}

const RESOURCES: Res[] = [
  { title: 'How to Create a Strong Case', desc: 'Tips on writing clear claims and submitting valid evidence.', type: 'Guide', cat: 'GUIDES', date: '12 Jun 2026' },
  { title: 'Understanding the Verdict Process', desc: 'Learn how jury decisions are made and finalized.', type: 'Guide', cat: 'PROCESS', date: '10 Jun 2026' },
  { title: 'Evidence Submission Checklist', desc: 'A checklist to ensure your evidence is valid and complete.', type: 'Template', cat: 'TEMPLATES', date: '08 Jun 2026' },
  { title: 'Key Legal Terms Explained', desc: 'Common legal and dispute-related terms in simple language.', type: 'Reference', cat: 'LEGAL', date: '05 Jun 2026' },
  { title: 'Case Study: Hostel Damage Claim', desc: 'A real case example with key learnings.', type: 'Case Study', cat: 'STUDENT', date: '02 Jun 2026' },
  { title: 'Section 63 Certificate Basics (BSA 2023)', desc: 'What a two-signatory electronic-evidence certificate requires. Educational only — not legal advice.', type: 'Reference', cat: 'LEGAL', date: '28 May 2026' },
  { title: 'Writing an Effective Counter-Response', desc: 'Structure your response, address evidence, stay factual.', type: 'Guide', cat: 'GUIDES', date: '24 May 2026' },
  { title: 'Respondent Response Template', desc: 'A fill-in template for filing a case response.', type: 'Template', cat: 'TEMPLATES', date: '20 May 2026' },
  { title: 'Jury Selection & Conflict Checks', desc: 'How panels are picked, why conflicts matter, and anonymity.', type: 'Guide', cat: 'PROCESS', date: '15 May 2026' },
  { title: 'Campus Dispute Policy Sample', desc: 'A sample policy for student communities (template).', type: 'Template', cat: 'STUDENT', date: '11 May 2026' },
  { title: 'Community Guidelines', desc: 'Rules for respectful and constructive participation.', type: 'Reference', cat: 'COMMUNITY', date: '06 May 2026' },
  { title: 'Commit–Reveal Voting Explained', desc: 'Why blind commitments make verdicts tamper-evident.', type: 'Guide', cat: 'PROCESS', date: '01 May 2026' },
];

const TYPE_TONE = { Guide: 'blue', Template: 'amber', Reference: 'rose', 'Case Study': 'green' } as const;

const POPULAR = [
  { q: 'How to submit evidence?', views: '12.4k' },
  { q: 'What happens after I create a case?', views: '9.8k' },
  { q: 'Jury selection process', views: '8.1k' },
  { q: 'What evidence is accepted?', views: '7.6k' },
  { q: 'Can I appeal a verdict?', views: '6.9k' },
];

export default function ResourcesPage() {
  const [cat, setCat] = useState<Cat>('ALL');
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const shown = useMemo(() => (cat === 'ALL' ? RESOURCES : RESOURCES.filter((r) => r.cat === cat)), [cat]);

  const toggleSave = (t: string) => {
    setSaved((prev) => {
      const n = new Set(prev);
      if (n.has(t)) n.delete(t);
      else n.add(t);
      return n;
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div className="max-w-xl">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Resources</h1>
          <p className="text-[13px] text-slate-500 mt-1">Learn, understand, and participate better. Access guides, legal references, templates, and more.</p>
        </div>
        <div className="p-4 rounded-2xl bg-violet-50 border border-violet-100 max-w-xs">
          <p className="italic text-[12px] text-slate-600 leading-relaxed">"An informed community makes for a fairer tomorrow."</p>
          <p className="text-[10px] text-slate-400 mt-1.5">— Resolvia</p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2 mb-4">
        {CATS.map((c) => {
          const active = cat === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all ${active ? 'border-violet-500 bg-violet-50/60' : 'border-slate-200 bg-white hover:border-slate-300'}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-600'}`}>{c.icon}</div>
              <p className={`text-[12px] font-black mt-2 leading-tight ${active ? 'text-violet-800' : 'text-slate-700'}`}>{c.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{c.count}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        {/* Main */}
        <div className="min-w-0 space-y-5">
          {/* Featured */}
          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-[1fr_300px]">
              <div className="p-6">
                <Chip tone="violet">
                  <Star className="w-3 h-3" /> Featured Resource
                </Chip>
                <h2 className="text-[22px] font-black text-slate-900 mt-3 leading-tight">
                  How Resolvia Works:
                  <br />A Complete Guide
                </h2>
                <p className="text-[13px] text-slate-500 mt-2 leading-relaxed max-w-md">
                  Understand the end-to-end process of dispute resolution on Resolvia — from case creation to final verdict.
                </p>
                <div className="flex flex-wrap items-center gap-2.5 mt-5">
                  <BtnPrimary href="/how-it-works">
                    Read Guide <ArrowRight className="w-3.5 h-3.5" />
                  </BtnPrimary>
                  <button
                    onClick={() => toggleSave('featured')}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${saved.has('featured') ? 'border-violet-400 bg-violet-50 text-violet-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${saved.has('featured') ? 'fill-violet-600' : ''}`} /> {saved.has('featured') ? 'Saved' : 'Save for Later'}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 mt-6">
                  <span className="w-2 h-2 rounded-full bg-violet-600" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                </div>
              </div>
              <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-[#171f3d] via-[#2a2f5e] to-[#4a3a7c] p-8">
                <div className="space-y-2.5">
                  {['FAIRNESS', 'KNOWLEDGE', 'BETTER COMMUNITIES'].map((w, i) => (
                    <div key={w} className={`flex items-center justify-center rounded-lg bg-gradient-to-r from-slate-800 to-slate-700 border border-white/10 py-3 ${i === 1 ? 'mx-2' : ''}`}>
                      <span className="text-[13px] font-black tracking-[0.2em] text-amber-200/90">{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <div className="grid lg:grid-cols-2 gap-5">
            {/* Latest */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-[15px] font-black text-slate-900">Latest Resources</h3>
                <button className="flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:text-violet-700">View All <ArrowRight className="w-3 h-3" /></button>
              </div>
              <div className="space-y-3.5">
                {shown.slice(0, 6).map((r) => (
                  <div key={r.title} className="flex items-center gap-3 group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shrink-0">
                      {r.type === 'Case Study' ? <BookOpen className="w-5 h-5 text-slate-400" /> : r.type === 'Template' ? <FileText className="w-5 h-5 text-slate-400" /> : r.type === 'Reference' ? <Landmark className="w-5 h-5 text-slate-400" /> : <FileCheck className="w-5 h-5 text-slate-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-bold text-slate-800 group-hover:text-violet-700 transition-colors truncate">{r.title}</p>
                      <p className="text-[10.5px] text-slate-400 truncate mt-0.5">{r.desc}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Chip tone={TYPE_TONE[r.type]} className="!text-[9px] !px-2 !py-0.5">{r.type}</Chip>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{r.date}</span>
                  </div>
                ))}
                {shown.length === 0 && <p className="text-[12px] text-slate-400 py-6 text-center">No resources in this category yet.</p>}
              </div>
            </Card>

            {/* Popular topics */}
            <Card className="p-5 h-fit">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-[15px] font-black text-slate-900">Popular Topics</h3>
                <button className="flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:text-violet-700">View All <ArrowRight className="w-3 h-3" /></button>
              </div>
              <div className="space-y-1">
                {POPULAR.map((p, i) => (
                  <button key={p.q} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left">
                    <span className={`w-7 h-7 rounded-full text-[11px] font-black flex items-center justify-center shrink-0 ${i === 0 ? 'bg-violet-600 text-white' : i === 1 ? 'bg-blue-500 text-white' : i === 2 ? 'bg-emerald-500 text-white' : i === 3 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold text-slate-700 truncate">{p.q}</p>
                      <p className="text-[10px] text-slate-400">{p.views} views</p>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-[14px] font-black text-slate-900">Quick Links</h3>
              <button className="flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:text-violet-700">View All <ArrowRight className="w-3 h-3" /></button>
            </div>
            <div className="space-y-2">
              {[
                { icon: <BookOpen className="w-4 h-4" />, tone: 'bg-violet-100 text-violet-600', t: 'Getting Started on Resolvia', s: 'A step-by-step introduction', href: '/how-it-works' },
                { icon: <Users className="w-4 h-4" />, tone: 'bg-blue-100 text-blue-600', t: 'How the Jury Process Works', s: 'Understand jury selection and deliberation', href: '/jury' },
                { icon: <FileCheck className="w-4 h-4" />, tone: 'bg-emerald-100 text-emerald-600', t: 'Evidence Guidelines', s: 'What evidence is accepted and how to submit', href: '/create' },
                { icon: <MessageSquare className="w-4 h-4" />, tone: 'bg-emerald-100 text-emerald-600', t: 'Community Guidelines', s: 'Rules for respectful and constructive participation', href: '/messages' },
              ].map((x) => (
                <Link key={x.t} href={x.href} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${x.tone}`}>{x.icon}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold text-slate-800 group-hover:text-violet-700 transition-colors">{x.t}</p>
                    <p className="text-[10px] text-slate-400 truncate">{x.s}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </Link>
              ))}
            </div>
          </Card>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-100 border border-violet-100 p-5">
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-violet-200/50 blur-2xl" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-[15px] font-black text-slate-900">New to Resolvia?</h3>
            </div>
            <p className="text-[12px] text-slate-500 mt-3 leading-relaxed">Check out our beginner&apos;s guide to get started.</p>
            <Link href="/how-it-works" className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors">
              Start Learning <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-5">
            <MessageSquare className="absolute -right-3 -bottom-3 w-20 h-20 text-emerald-200/60" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="text-[15px] font-black text-slate-900">Need More Help?</h3>
            </div>
            <p className="text-[12px] text-slate-500 mt-3 leading-relaxed">Visit our Help Center or reach out to our support team.</p>
            <button className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-700 text-xs font-bold transition-colors">
              Go to Help Center <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
