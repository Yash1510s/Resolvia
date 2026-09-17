'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { JurorAssignment } from '../types';
import { jurorLabel, jurorPseudonym } from '../lib/jury';

/**
 * Anonymous juror chip. Never shows a real name or full wallet — only a
 * stable pseudonym derived from the wallet hash (e.g. "Juror #A7F2").
 */
export function JurorBadge({ juror, isYou = false }: { juror: JurorAssignment; isYou?: boolean }) {
  const label = jurorPseudonym(juror.walletAddress || juror.jurorId);
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          isYou ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'
        }`}
        title={ANONYMITY_TITLE}
      >
        <ShieldCheck className="w-4 h-4" />
      </div>
      <div className="leading-tight">
        <p className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
          {isYou && (
            <span className="text-[8px] bg-violet-600 text-white px-1.5 py-0.5 rounded-full font-black">YOU</span>
          )}
          <span className="font-mono">Juror {label}</span>
        </p>
        <p className="text-[9px] text-slate-400">identity protected</p>
      </div>
    </div>
  );
}

const ANONYMITY_TITLE = 'Juror identities are pseudonymised to keep deliberation independent.';

/** Plain label helper for use inside tables/lists. */
export function jurorDisplay(j: JurorAssignment): string {
  return jurorLabel(j);
}
