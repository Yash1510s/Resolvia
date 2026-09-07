'use client';

import React from 'react';
import { Landmark, Info } from 'lucide-react';
import { useApp } from '../../lib/app-context';
import { OnChainProtocol } from '../../components/OnChainProtocol';

export default function ProtocolPage() {
  const { cases, getCase } = useApp();
  // Prefer a real, active case so the on-chain demo references a genuine case number
  const dispute = cases.find((c) => c.status === 'JURY_COMMIT' || c.status === 'JURY_REVEAL') || cases[0];

  if (!dispute) return null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-900">On-Chain Protocol</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          A live end-to-end demo on the local chain: stake, escrow, jury panel, commit–reveal, and settlement are all
          real transactions.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-800 leading-relaxed">
          This page demonstrates the <strong>protocol layer</strong> in isolation (case{' '}
          <span className="font-mono font-bold">{dispute.caseNumber}</span>). The product-level case lifecycle lives in{' '}
          <strong>My Cases → Case Details</strong>; the on-chain demo here shows the underlying mechanics with real
          transactions and real fund movement on settlement. Requires the local chain to be running.
        </p>
      </div>

      <OnChainProtocol dispute={dispute} />
    </div>
  );
}
