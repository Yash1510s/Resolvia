'use client';

import React from 'react';
import { CaseStatus } from '../types';
import { statusStyle } from '../lib/caseLifecycle';

const TONES: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
};

export function StatusBadge({ status, className = '' }: { status: CaseStatus; className?: string }) {
  const s = statusStyle(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full border ${TONES[s.tone]} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
      {s.label.toUpperCase()}
    </span>
  );
}
