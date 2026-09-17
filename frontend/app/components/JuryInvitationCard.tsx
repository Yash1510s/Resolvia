'use client';

import React from 'react';
import { Clock, Gavel, Check, X, Users, ShieldCheck } from 'lucide-react';
import { JuryInvitation } from '../types';
import { useApp } from '../lib/app-context';
import { formatHash } from '../lib/crypto';

interface Props {
  invitation: JuryInvitation;
}

export function JuryInvitationCard({ invitation: inv }: Props) {
  const { acceptInvitation, declineInvitation, availability, cases } = useApp();
  const [declineOpen, setDeclineOpen] = React.useState(false);

  const expired = new Date(inv.expiresAt).getTime() < Date.now() && inv.status === 'PENDING';
  // Availability wiring: settings actually gate the jury flow.
  const activeJury = cases.filter((c) => c.myRole === 'JUROR' && !c.verdictOutcome && c.status !== 'CLOSED').length;
  const pausedReason = !availability.inPool
    ? 'You are not in the jury pool (Settings → Jury availability).'
    : availability.state !== 'AVAILABLE'
    ? 'You are marked unavailable (Settings → Jury availability).'
    : activeJury >= availability.maxConcurrent
    ? `You already have ${activeJury} active panel(s) — max concurrent is ${availability.maxConcurrent}.`
    : null;
  const blocked = inv.status === 'PENDING' && !!pausedReason;

  return (
    <div
      className={`p-5 rounded-2xl border bg-white shadow-xs space-y-4 ${
        inv.status === 'PENDING' ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Gavel className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-900">
              Jury Invitation <span className="font-mono text-blue-700">· {inv.caseNumber}</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Category: <strong className="text-slate-700">{inv.category.replace('_', ' ')}</strong> · Est. effort{' '}
              <strong className="text-slate-700">~{inv.estimatedEffortMin} min</strong> · Stake{' '}
              <strong className="text-slate-700">{inv.stakeRequired.toLocaleString()} RSLV</strong>
            </p>
          </div>
        </div>
        <StatusPill status={inv.status} />
      </div>

      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
        <p className="flex items-center gap-2 font-bold text-slate-700 mb-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Limited details shown (by design)
        </p>
        Only the case ID, general category, effort estimate, and commitment are revealed before you accept. Full case
        content, evidence, and AI analysis unlock after acceptance and conflict checks — so your decision to serve is not
        influenced by either party.
      </div>

      <div className="flex items-center gap-4 text-[10px] text-slate-500 font-semibold flex-wrap">
        <span suppressHydrationWarning className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Accept by {new Date(inv.expiresAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          If you decline for availability, a replacement is auto-selected and your reputation is unaffected
        </span>
      </div>

      {inv.status === 'PENDING' && (
        <div className="flex items-center gap-2 flex-wrap">
          {blocked && (
            <p className="w-full text-[10.5px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Invitation paused — {pausedReason}
            </p>
          )}
          <button
            suppressHydrationWarning
            onClick={() => acceptInvitation(inv.id)}
            disabled={expired || blocked}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black transition-all shadow-md disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            {expired ? 'Expired' : 'Accept & Review Case'}
          </button>
          <button
            onClick={() => setDeclineOpen(!declineOpen)}
            disabled={blocked}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            Decline
          </button>
        </div>
      )}

      {declineOpen && inv.status === 'PENDING' && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
          <p className="text-[11px] font-bold text-amber-900">Why are you declining?</p>
          <div className="flex items-center gap-2 flex-wrap">
            {(['BUSY', 'CONFLICT', 'OTHER'] as const).map((r) => (
              <button
                key={r}
                onClick={() => declineInvitation(inv.id, r)}
                className="px-4 py-2 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-800 text-[11px] font-bold transition-all"
              >
                {r === 'BUSY' ? 'I am busy / unavailable' : r === 'CONFLICT' ? 'Conflict of interest' : 'Other'}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-amber-700">
            Declining because you are busy does <strong>not</strong> reduce your reputation. A replacement juror will be
            selected automatically.
          </p>
        </div>
      )}

      {inv.status === 'ACCEPTED' && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" /> You accepted — you are now on this panel. Open the case to review evidence and vote.
        </div>
      )}

      {(inv.status === 'DECLINED' || inv.status === 'EXPIRED' || inv.status === 'REPLACED') && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
          <Users className="w-4 h-4 shrink-0" />
          {inv.status === 'DECLINED'
            ? `Declined (${inv.declineReason === 'BUSY' ? 'availability' : inv.declineReason?.toLowerCase()}). Replacement juror auto-selected.`
            : 'Invitation lapsed. Replacement juror auto-selected.'}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: JuryInvitation['status'] }) {
  const map: Record<string, { t: string; c: string }> = {
    PENDING: { t: 'ACTION NEEDED', c: 'bg-blue-50 text-blue-700 border-blue-200' },
    ACCEPTED: { t: 'ACCEPTED', c: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    DECLINED: { t: 'DECLINED', c: 'bg-slate-100 text-slate-500 border-slate-200' },
    EXPIRED: { t: 'EXPIRED', c: 'bg-amber-50 text-amber-700 border-amber-200' },
    REPLACED: { t: 'REPLACED', c: 'bg-slate-100 text-slate-500 border-slate-200' },
  };
  const s = map[status];
  return <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${s.c}`}>{s.t}</span>;
}
