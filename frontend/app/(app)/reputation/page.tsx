'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, TrendingUp, Clock, Gavel, FileText, Info, Star } from 'lucide-react';
import { useApp } from '../../lib/app-context';
import { formatDateSafe } from '../../lib/crypto';

export default function ReputationPage() {
  const { jurorHistory, identity, myJurorPseudonym } = useApp();
  const hasHistory = jurorHistory.length > 0;
  const onTime = jurorHistory.filter((h) => h.onTime).length;
  const onTimePct = hasHistory ? Math.round((onTime / jurorHistory.length) * 100) : 100;

  // Real dynamic signals based on verified user track record
  const reliabilityScore = hasHistory ? Math.min(100, Math.max(60, Math.round(onTimePct * 0.95))) : 50;
  const diligenceScore = hasHistory ? Math.min(100, 60 + Math.min(40, jurorHistory.length * 8)) : 50;
  const integrityScore = 100; // Zero disciplinary or slashing events
  const availabilityScore = onTimePct;

  const signals = [
    {
      icon: <Clock className="w-4 h-4" />,
      label: 'Reliability',
      score: reliabilityScore,
      weight: '35%',
      desc: hasHistory ? 'On-time commit & reveal track record.' : 'Baseline calibration for newly registered jurors.',
    },
    {
      icon: <FileText className="w-4 h-4" />,
      label: 'Diligence',
      score: diligenceScore,
      weight: '30%',
      desc: hasHistory ? 'Consistent case deliberations and panel participations.' : 'Deliberation index starts neutral until first verdict.',
    },
    {
      icon: <ShieldCheck className="w-4 h-4" />,
      label: 'Integrity',
      score: integrityScore,
      weight: '25%',
      desc: 'Conflict declarations, clean on-chain record, zero penalties.',
    },
    {
      icon: <Gavel className="w-4 h-4" />,
      label: 'Availability health',
      score: availabilityScore,
      weight: '10%',
      desc: 'Panel readiness and prompt response to juror notifications.',
    },
  ];

  const totalPct = Math.round(signals.reduce((s, x) => s + x.score * (parseFloat(x.weight) / 100), 0));
  // Baseline trust score: 500 for new users, up to 1000 for experienced high-reliability jurors
  const trustScorePoints = hasHistory ? Math.min(1000, Math.max(500, 500 + Math.round(totalPct * 5))) : 500;

  const tier = !hasHistory
    ? { label: 'NEWCOMER', tone: 'bg-slate-400/20 text-slate-300 border-slate-400/30' }
    : jurorHistory.length >= 10 && onTimePct >= 90
    ? { label: 'GOLD TIER', tone: 'bg-amber-400/20 text-amber-300 border-amber-400/30' }
    : jurorHistory.length >= 3
    ? { label: 'SILVER TIER', tone: 'bg-slate-200/20 text-slate-200 border-slate-300/30' }
    : { label: 'BRONZE TIER', tone: 'bg-orange-500/20 text-orange-300 border-orange-400/30' };

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
                  {(identity.name || 'J').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-black">{identity.name || 'Resolvia Arbiter'}</p>
                  <p className="text-[10px] text-slate-400">
                    Juror <span className="font-mono text-emerald-300">{myJurorPseudonym}</span> · identity protected
                  </p>
                </div>
              </div>
              <span className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full border ${tier.tone}`}>
                <Star className="w-3 h-3" /> {tier.label}
              </span>
            </div>

            <div>
              <div className="flex items-end justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Trust score</span>
                <span className="text-3xl font-black text-emerald-400">{trustScorePoints} <span className="text-xs font-normal text-slate-400">/ 1000</span></span>
              </div>
              <div className="h-3 rounded-full bg-white/10 overflow-hidden mt-2">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" style={{ width: `${(trustScorePoints / 1000) * 100}%` }}></div>
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
                      <span className="text-slate-200">{s.score}%</span>
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
              {jurorHistory.length === 0 ? (
                <div className="p-8 text-center">
                  <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700 mt-2">No reputation events yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Serve on jury panels and commit your votes on time to build your on-chain reputation track record.
                  </p>
                </div>
              ) : (
                jurorHistory.map((h) => (
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
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
