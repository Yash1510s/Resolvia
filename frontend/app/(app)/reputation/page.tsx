'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, TrendingUp, Clock, Gavel, FileText, Info, Star } from 'lucide-react';
import { useApp } from '../../lib/app-context';
import { formatDateSafe } from '../../lib/crypto';

export default function ReputationPage() {
  const { jurorHistory, identity, myJurorPseudonym } = useApp();
  const onTime = jurorHistory.filter((h) => h.onTime).length;
  const onTimePct = jurorHistory.length ? Math.round((onTime / jurorHistory.length) * 100) : 100;

  const signals = [
    {
      icon: <Clock className="w-4 h-4" />,
      label: 'Reliability',
      score: 96,
      weight: '35%',
      desc: 'Commits and reveals on time, stakes kept active.',
    },
    {
      icon: <FileText className="w-4 h-4" />,
      label: 'Diligence',
      score: 91,
      weight: '30%',
      desc: 'Consistent review behaviour and reasoned votes.',
    },
    {
      icon: <ShieldCheck className="w-4 h-4" />,
      label: 'Integrity',
      score: 99,
      weight: '25%',
      desc: 'Conflict declarations, no collusion signals, clean record.',
    },
    {
      icon: <Gavel className="w-4 h-4" />,
      label: 'Availability health',
      score: onTimePct,
      weight: '10%',
      desc: 'Accepts/declines invitations in a timely way.',
    },
  ];
  const total = Math.round(signals.reduce((s, x) => s + x.score * parseFloat(x.weight), 0));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reputation</h1>
          <p className="text-[13px] text-slate-500 mt-1 max-w-xl">
            A trust score for serving as a juror — built from behaviour, never from whether you voted with the majority.
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-violet-50 border border-violet-100 max-w-xs">
          <p className="italic text-[12px] text-slate-600 leading-relaxed">"Reputation is earned, not given."</p>
          <p className="text-[10px] text-slate-400 mt-1.5">— Resolvia</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Score card */}
        <div className="lg:col-span-5">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#101a33] via-[#1c2447] to-[#3b2f6b] text-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-slate-950 font-black text-lg flex items-center justify-center">
                  {identity.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-black">{identity.name}</p>
                  <p className="text-[10px] text-slate-400">
                    Juror <span className="font-mono text-emerald-300">{myJurorPseudonym}</span> · identity protected
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <Star className="w-3 h-3" /> SILVER TIER
              </span>
            </div>

            <div>
              <div className="flex items-end justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Trust score</span>
                <span className="text-3xl font-black text-emerald-400">{total}</span>
              </div>
              <div className="h-3 rounded-full bg-white/10 overflow-hidden mt-2">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" style={{ width: `${total}%` }}></div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                {jurorHistory.length} panels served · {onTime}/{jurorHistory.length} on-time
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <p className="text-[10px] font-bold text-slate-300 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Weighted signals
              </p>
              <div className="mt-2 space-y-2">
                {signals.map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                      <span>{s.label} · {s.weight}</span>
                      <span className="text-slate-200">{s.score}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-400/80" style={{ width: `${s.score}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-100 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-rose-800 leading-relaxed">
              <strong>What does NOT affect your reputation:</strong> which side you vote for, whether you matched the
              majority, or declining an invitation because you are busy. You are a neutral decision-maker, and the score
              rewards exactly that behaviour.
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Recent reputation events</p>
            </div>
            <div className="divide-y divide-slate-50">
              {jurorHistory.map((h) => (
                <div key={h.caseId} className="px-4 py-3.5 flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black ${
                      h.reputationDelta >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    {h.reputationDelta >= 0 ? '+' : ''}
                    {h.reputationDelta}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-800">
                      {h.onTime ? 'On-time commit & reveal' : 'Late commit'} · <span className="font-mono text-blue-700">{h.caseNumber}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {h.category.replace('_', ' ')} · {formatDateSafe(h.completedAt)}
                    </p>
                  </div>
                  <Link
                    href={h.caseId.startsWith('case-') ? `/case-studies/${h.caseId}` : `/cases/${h.caseId}`}
                    className="text-[10px] font-black text-blue-600 hover:text-blue-700 shrink-0"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
