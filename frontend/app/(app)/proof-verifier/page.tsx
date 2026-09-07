'use client';

import React from 'react';
import { Fingerprint } from 'lucide-react';
import { useApp } from '../../lib/app-context';
import { VerificationPortal } from '../../components/VerificationPortal';

export default function ProofVerifierPage() {
  const { cases } = useApp();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-900">Proof Verifier</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Independently verify any evidence hash or case record. If a single byte changes after anchoring, the check
          breaks visibly — that is the whole point.
        </p>
      </div>
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-2.5">
        <Fingerprint className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-800 leading-relaxed">
          Pick a case, pick an evidence item, and <strong>Verify</strong> to recompute the SHA-256 fingerprint and compare
          it against the anchored hash. <strong>Simulate Tamper</strong> demonstrates how an alteration is detected.
        </p>
      </div>
      <VerificationPortal cases={cases} />
    </div>
  );
}
