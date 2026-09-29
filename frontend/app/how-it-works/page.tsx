'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, FilePlus, Sparkles, Users, Gavel, Landmark, ShieldCheck, Scale, Cpu } from 'lucide-react';
import { PublicNav } from '../components/PublicNav';
import { LiveExampleModal } from '../components/LiveExampleModal';
import { useAuth } from '../lib/auth-context';

const STEPS = [
  { icon: <FilePlus className="w-5 h-5" />, t: 'Create a Case', s: 'Submit your dispute with details and anchored evidence.' },
  { icon: <Sparkles className="w-5 h-5" />, t: 'AI Analysis', s: 'AI analyzes the evidence and provides an initial, non-binding assessment.' },
  { icon: <Users className="w-5 h-5" />, t: 'Jury Deliberation', s: 'A decentralized jury reviews the case and casts their votes.' },
  { icon: <Gavel className="w-5 h-5" />, t: 'Final Verdict', s: 'Get a transparent decision with detailed reasoning.' },
  { icon: <Landmark className="w-5 h-5" />, t: 'Case Record', s: 'The complete case record is stored on the blockchain.' },
];

export default function HowItWorksPage() {
  const [demoOpen, setDemoOpen] = useState(false);
  const { user: authUser } = useAuth();

  return (
    <div className="min-h-screen bg-[#f6f7fb] dark:bg-slate-950 transition-colors">
      <PublicNav active="how-it-works" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700">
          <ArrowLeft className="w-3.5 h-3.5" /> Home
        </Link>

        <div className="text-center mt-4">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">How Resolvia Works</h1>
          <p className="text-[13.5px] text-slate-500 dark:text-slate-400 mt-2">From dispute to resolution — a simple, transparent, and secure process.</p>
        </div>

        {/* 5 steps */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-9">
          {STEPS.map((s, i) => (
            <div key={s.t} className="relative">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 h-full text-center shadow-xs">
                <div className="relative inline-flex">
                  <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-200 dark:shadow-none">{s.icon}</div>
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[9px] font-black flex items-center justify-center">{i + 1}</span>
                </div>
                <p className="text-[12.5px] font-black text-slate-800 dark:text-slate-100 mt-3">{s.t}</p>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-400 mt-1.5 leading-snug">{s.s}</p>
              </div>
              {i < STEPS.length - 1 && <div className="hidden md:block absolute top-8 -right-2.5 w-2 h-0.5 bg-slate-300 dark:bg-slate-700" />}
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <button
            type="button"
            onClick={() => setDemoOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-violet-600/25 cursor-pointer active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" /> See a Live Example
          </button>
        </div>

        {/* Principles */}
        <div className="mt-12">
          <h2 className="text-xl font-black text-slate-900 dark:text-white text-center">Built on Powerful Principles</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { icon: <Cpu className="w-5 h-5" />, t: 'AI for Insights', s: 'Real people, diverse views. AI never decides — it only surfaces patterns in the record.' },
              { icon: <Users className="w-5 h-5" />, t: 'Humans for Judgment', s: 'A real human jury renders the only binding verdict, anonymously and blindly.' },
              { icon: <ShieldCheck className="w-5 h-5" />, t: 'Blockchain for Trust', s: 'Immutable, tamper-evident records anyone can verify at any time.' },
              { icon: <Scale className="w-5 h-5" />, t: 'For a Fairer Tomorrow', s: 'Justice for all — fair process regardless of scale or status.' },
            ].map((x) => (
              <div key={x.t} className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 text-center shadow-xs">
                <div className="w-11 h-11 mx-auto rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center">{x.icon}</div>
                <p className="text-[13px] font-black text-slate-800 dark:text-slate-100 mt-3">{x.t}</p>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-400 mt-1.5 leading-snug">{x.s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Constraints strip */}
        <div className="mt-10 p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 shadow-xs">
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { t: 'The AI is not a judge', s: 'Advisory, non-binding analysis with prompt-injection defense. Its output is always labeled and never finalizes anything.' },
              { t: 'The blockchain is not a judge', s: 'It preserves tamper-evident records and settles escrow by rule — it does not interpret facts or render verdicts.' },
              { t: 'No global chat, ever', s: 'Formal communication only via claims, responses and evidence. Community discussion opens only after final closure, attached to that case.' },
            ].map((x) => (
              <div key={x.t} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <p className="text-[12.5px] font-black text-slate-800 dark:text-slate-200">{x.t}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{x.s}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-10 pb-6">
          <Link
            href={authUser ? '/create' : '/signup?redirect=/create'}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-all shadow-sm"
          >
            Create Your First Case
          </Link>
        </div>
      </div>

      {/* Live Case Example Walkthrough Modal */}
      <LiveExampleModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
