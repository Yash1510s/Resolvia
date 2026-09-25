'use client';

import React from 'react';
import Link from 'next/link';
import { Scale, ArrowLeft, ShieldCheck, Users, Eye, Accessibility as A11y, Target, Sparkles, BookOpen } from 'lucide-react';
import { PublicNav } from '../components/PublicNav';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav active="about" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-violet-600 hover:text-violet-700">
          <ArrowLeft className="w-3.5 h-3.5" /> Home
        </Link>

        <div className="grid md:grid-cols-[1fr_300px] gap-8 mt-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">About Resolvia</h1>
            <p className="text-[15px] font-bold text-slate-600 mt-2">Technology for a Fairer, More Trustworthy Society</p>
            <p className="text-[13.5px] text-slate-500 mt-4 leading-relaxed">
              Resolvia is an AI-assisted, blockchain-powered dispute arbitration platform designed to make conflict resolution
              fair, transparent, accessible, and verifiable for everyone. We believe a dispute should end on the strength of
              evidence and reason — not on who has more money, status, or noise.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
              {[
                { icon: <Eye className="w-5 h-5" />, t: 'Transparency', s: 'Open process' },
                { icon: <Users className="w-5 h-5" />, t: 'Impartiality', s: 'Diverse juries' },
                { icon: <ShieldCheck className="w-5 h-5" />, t: 'Integrity', s: 'On-chain records' },
                { icon: <A11y className="w-5 h-5" />, t: 'Accessibility', s: 'For everyone' },
              ].map((x) => (
                <div key={x.t} className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">{x.icon}</div>
                  <p className="text-[13px] font-black text-slate-800 mt-2.5">{x.t}</p>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">{x.s}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-5 mt-9">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <h3 className="text-[14px] font-black text-slate-900 flex items-center gap-2"><Target className="w-4 h-4 text-violet-600" /> Our Vision</h3>
                <p className="text-[12.5px] text-slate-500 mt-2.5 leading-relaxed italic">
                  "A world where every dispute can be resolved fairly, transparently, and without fear or bias."
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <h3 className="text-[14px] font-black text-slate-900">Our Mission</h3>
                <p className="text-[12.5px] text-slate-500 mt-2.5 leading-relaxed">
                  To build an accessible, technology-driven platform that empowers people to resolve disputes with evidence,
                  reason, and fairness.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-violet-50/60 border border-violet-100 mt-5">
              <h3 className="text-[14px] font-black text-slate-900 mb-3">Why Resolvia?</h3>
              <ul className="grid sm:grid-cols-2 gap-2.5">
                {['Accessible justice', 'Lower cost than court', 'Evidence-driven outcomes', 'Community-driven resolution', 'Verifiable records', 'Human-centric approach'].map((t) => (
                  <li key={t} className="flex items-center gap-2.5 text-[12.5px] font-semibold text-slate-600">
                    <span className="w-5 h-5 rounded-md bg-white border border-violet-200 text-violet-600 flex items-center justify-center shrink-0">
                      <Sparkles className="w-3 h-3" />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#101a33] via-[#1c2447] to-[#3b2f6b] p-6 text-white min-h-[180px] flex flex-col justify-end">
              <Scale className="w-24 h-24 text-white/10 absolute -right-5 -top-5" />
              <p className="italic text-[13px] leading-relaxed">"Justice is a conversation. Let&apos;s keep it fair."</p>
              <p className="text-[10px] text-slate-400 mt-2">— Resolvia</p>
            </div>
            {[
              { t: 'How It Works', s: 'The full dispute lifecycle, step by step', href: '/how-it-works' },
              { t: 'Case Studies', s: 'Real closed cases, three disclosure levels', href: '/case-studies' },
              { t: 'Resources', s: 'Guides, templates and references', href: '/resources' },
            ].map((x) => (
              <Link key={x.t} href={x.href} className="block p-5 rounded-2xl bg-white border border-slate-200 hover:border-violet-300 transition-colors group">
                <p className="text-[13px] font-black text-slate-800 group-hover:text-violet-700 transition-colors">{x.t}</p>
                <p className="text-[11px] text-slate-400 mt-1">{x.s}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <p className="text-center text-[11px] text-slate-400 pb-8">
        Resolvia Protocol v1.0. AI output provides advisory intelligence; only the decentralized human jury quorum holds binding authority.
      </p>
    </div>
  );
}
