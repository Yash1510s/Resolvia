'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Scale, Gavel, Cpu, Landmark, FileText, AlertTriangle } from 'lucide-react';
import { PublicNav } from '../components/PublicNav';

const SECTIONS = [
  {
    icon: <Scale className="w-4 h-4" />,
    title: 'What Resolvia is (and is not)',
    body: [
      'Resolvia is an AI-assisted, blockchain-anchored dispute resolution platform. You agree to use it for genuine disputes between consenting parties.',
      'Resolvia is not a law firm and does not provide legal advice. Nothing on the platform — including the AI advisory and the legal export package — is legal advice. Consult a qualified lawyer before relying on any outcome.',
    ],
  },
  {
    icon: <Gavel className="w-4 h-4" />,
    title: 'Verdicts & binding effect',
    body: [
      'The only binding outcome of a case is the human jury\u2019s verdict. The AI advisory is non-binding and always labelled as such. The blockchain provides tamper-evident records; it does not decide cases.',
      'By filing a case or responding to one, the parties agree to be bound by the jury\u2019s verdict and the escrow settlement that follows it. A 48-hour appeal window may follow a verdict; appeals are heard by a fresh panel.',
    ],
  },
  {
    icon: <FileText className="w-4 h-4" />,
    title: 'Evidence integrity',
    body: [
      'Evidence is fingerprinted (SHA-256) and anchored. You warrant that evidence you submit is authentic, lawfully obtained, and that you have the right to disclose it.',
      'Deliberate submission of fabricated, doctored, or stolen evidence may lead to case dismissal, stake forfeiture, and reputation penalties. Post-anchoring tampering is detectable by the Proof Verifier.',
    ],
  },
  {
    icon: <Cpu className="w-4 h-4" />,
    title: 'AI advisory — limits',
    body: [
      'AI output is advisory, can be wrong, and is excluded from the basis of any verdict. It is presented in legal exports as non-binding hearsay material.',
      'You are responsible for the content you feed into the platform. Prompt-injection patterns in uploaded text are scanned and isolated, but no input can be guaranteed safe.',
    ],
  },
  {
    icon: <Landmark className="w-4 h-4" />,
    title: 'Legal exports & court use',
    body: [
      'The Legal \u2013 Forensic Record / Evidence & Audit Package (including the BSA 2023 \u00a763 certificate template) is prepared to facilitate court filing. Resolvia makes no claim that any export is guaranteed admissible in any court; admissibility is decided by the court under applicable law.',
      'Certificate templates follow the BSA 2023 \u00a763 format (two signatories, mandatory hash, Schedule Part A/B). Execution of the certificate remains the responsibility of the signatories and their counsel.',
    ],
  },
  {
    icon: <AlertTriangle className="w-4 h-4" />,
    title: 'Protocol execution & network assets',
    body: [
      'Resolvia operates decentralized smart contracts with native cryptographic utility and governance tokens (RSLV). Execution of settlements adheres to deterministic on-chain rules.',
      'Features and capabilities follow the active Resolvia Protocol governance specification.',
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-violet-600 hover:text-violet-700">
          <ArrowLeft className="w-3.5 h-3.5" /> Home
        </Link>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-4">Terms of Service</h1>
        <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">
          The ground rules for filing, responding to, and judging disputes on Resolvia. Last updated: September 2026.
        </p>

        <div className="mt-8 space-y-6">
          {SECTIONS.map((s) => (
            <section key={s.title} className="p-5 rounded-2xl border border-slate-200">
              <h2 className="flex items-center gap-2.5 text-[14px] font-black text-slate-900">
                <span className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">{s.icon}</span>
                {s.title}
              </h2>
              {s.body.map((p, i) => (
                <p key={i} className="text-[12.5px] text-slate-600 mt-3 leading-relaxed">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>

        <p className="text-[11px] text-slate-400 mt-8">
          Resolvia Protocol Specification v1.0. All interactions are subject to decentralized consensus rules and immutable smart contract logic.
        </p>
      </div>
    </div>
  );
}
