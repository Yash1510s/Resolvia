'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { CaseStatus } from '../types';
import { LIFECYCLE, stepIndexForStatus } from '../lib/caseLifecycle';

/** Horizontal lifecycle stepper. Completed = filled, current = ringed, upcoming = muted. */
export function StatusStepper({ status, compact = false }: { status: CaseStatus; compact?: boolean }) {
  const current = stepIndexForStatus(status);
  return (
    <div className={`flex items-center ${compact ? 'gap-1' : 'gap-1.5'} overflow-x-auto pb-1 scrollbar-none`}>
      {LIFECYCLE.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={step.key} className="flex items-center gap-1 shrink-0">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                done
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : active
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              {done ? <Check className="w-3 h-3" /> : <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : 'bg-slate-300'}`}></span>}
              {!compact || done || active ? step.label : ''}
            </div>
            {i < LIFECYCLE.length - 1 && <div className={`w-2.5 h-0.5 rounded ${i < current ? 'bg-emerald-300' : 'bg-slate-200'}`}></div>}
          </div>
        );
      })}
    </div>
  );
}
