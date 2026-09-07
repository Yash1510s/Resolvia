'use client';

import React from 'react';
import { Clock, Shield, ArrowRight, ExternalLink, Hash } from 'lucide-react';
import { AuditEvent } from '../types';
import { formatAddress, formatHash } from '../lib/crypto';

interface AuditTrailViewProps {
  events: AuditEvent[];
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ events }) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>Append-Only Event Ledger & Chain of Custody</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Every state transition is sequenced with block number, actor signature, and cryptographic event root.
        </p>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-200">
        {events.map((evt, idx) => (
          <div key={evt.eventId || idx} className="relative group">
            {/* Timeline bullet dot */}
            <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-white border-2 border-blue-600 group-hover:scale-125 transition-transform shadow-xs"></div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 shadow-xs transition-all space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                    {evt.eventNumber}
                  </span>
                  <span className="font-bold text-xs text-slate-900">{evt.title}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{evt.timestamp}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{evt.details}</p>

              {/* Transaction & Metadata Hashes */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px] font-mono">
                <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1 rounded-lg">
                  <span className="text-slate-400">Actor:</span>
                  <span className="text-slate-800 font-semibold">
                    {formatAddress(evt.actor)} ({evt.actorRole})
                  </span>
                </div>
                <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1 rounded-lg">
                  <span className="text-slate-400">Block:</span>
                  <span className="text-blue-700 font-bold">#{evt.blockNumber}</span>
                </div>
                <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1 rounded-lg">
                  <span className="text-slate-400">Tx Hash:</span>
                  <span className="text-emerald-700 font-bold">{formatHash(evt.txHash, 6)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
