'use client';

import React from 'react';
import Link from 'next/link';
import { Gavel, Info, TrendingUp } from 'lucide-react';
import { useApp } from '../../../lib/app-context';
import { formatDateSafe } from '../../../lib/crypto';

const VOTE_LABEL: Record<string, { t: string; c: string }> = {
  CLAIMANT_UPHELD: { t: 'Claimant upheld', c: 'text-emerald-600' },
  RESPONDENT_UPHELD: { t: 'Respondent upheld', c: 'text-rose-600' },
  SPLIT_SETTLEMENT: { t: 'Split settlement', c: 'text-amber-600' },
};

export default function JuryHistoryPage() {
  const { jurorHistory, myJurorPseudonym } = useApp();
  const onTime = jurorHistory.filter((h) => h.onTime).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-900">Jury History</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Every panel you have served on, with your (anonymous) record.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Panels served" value={String(jurorHistory.length)} />
        <MiniStat label="On-time commits" value={`${onTime}/${jurorHistory.length}`} />
        <MiniStat label="Reputation" value="82" sub="trust score" />
      </div>

      <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5">
        <TrendingUp className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-indigo-800 leading-relaxed">
          <strong>Reputation is NOT “majority vote = good.”</strong> Your score reflects reliability (committing and
          revealing on time), diligence (reading the record), and integrity (declaring conflicts, not colluding) — not
          whether your vote matched the outcome. You will never be penalised for voting against the majority, and
          declining an invitation because you are busy does not reduce your reputation.
        </p>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Case</th>
              <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Category</th>
              <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Completed</th>
              <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Your vote</th>
              <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">On-time</th>
              <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Δ Reputation</th>
            </tr>
          </thead>
          <tbody>
            {jurorHistory.map((h) => (
              <tr key={h.caseId} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                <td className="px-4 py-3.5">
                  <span className="font-mono text-[10px] font-bold text-blue-700">{h.caseNumber}</span>
                </td>
                <td className="px-4 py-3.5 text-[11px] font-semibold text-slate-600">{h.category.replace('_', ' ')}</td>
                <td className="px-4 py-3.5 text-[11px] text-slate-500">{formatDateSafe(h.completedAt)}</td>
                <td className="px-4 py-3.5">
                  <span className={`text-[11px] font-bold ${VOTE_LABEL[h.voteChoice]?.c || 'text-slate-600'}`}>
                    {VOTE_LABEL[h.voteChoice]?.t || h.voteChoice}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-[11px] font-bold">
                  {h.onTime ? <span className="text-emerald-600">Yes</span> : <span className="text-amber-600">Late</span>}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className={`text-[11px] font-black font-mono ${h.reputationDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {h.reputationDelta >= 0 ? '+' : ''}
                    {h.reputationDelta}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-500 leading-relaxed">
          “Aligned with outcome” is shown for transparency but is <strong>excluded</strong> from your reputation score. A
          well-reasoned minority vote is valued, not punished.
        </p>
      </div>
    </div>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center">
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">{label}</p>
      {sub && <p className="text-[9px] text-slate-400">{sub}</p>}
    </div>
  );
}
