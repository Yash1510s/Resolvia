'use client';

import React from 'react';
import { ExternalLink, Activity } from 'lucide-react';
import { AuditEvent } from '../types';
import { formatHash } from '../lib/crypto';

interface AuditTrailViewProps {
  events: AuditEvent[];
}

export function AuditTrailView({ events }: AuditTrailViewProps) {
  return (
    <div className="space-y-0">
      {events.length === 0 ? (
        <p className="text-xs text-slate-400 p-4 rounded-xl bg-slate-50 border border-slate-100">
          No on-chain events recorded yet.
        </p>
      ) : (
        events.map((e, i) => (
          <div key={e.eventId} className="flex gap-4">
            {/* Rail */}
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              {i < events.length - 1 && <div className="w-px flex-1 bg-slate-200"></div>}
            </div>

            {/* Content */}
            <div className="flex-1 pb-6 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                    {e.eventNumber}
                  </span>
                  <h5 className="text-xs font-bold text-slate-900">{e.title}</h5>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{e.timestamp}</span>
              </div>

              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{e.details}</p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[10px] font-mono">
                <span className="text-slate-400">
                  actor: <span className="text-slate-700 font-bold">{e.actor}</span>
                </span>
                <span className="text-slate-400">
                  tx: <span className="text-blue-600">{formatHash(e.txHash, 10)}</span>
                </span>
                <span className="text-slate-400">
                  block: <span className="text-slate-700">{e.blockNumber.toLocaleString()}</span>
                </span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
