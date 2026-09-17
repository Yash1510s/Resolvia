'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Fingerprint, EyeOff, Server } from 'lucide-react';
import { PublicNav } from '../components/PublicNav';

const SECTIONS = [
  {
    icon: <Fingerprint className="w-4 h-4" />,
    title: 'What we store about you',
    body: [
      'Your account stores your name, email address, and — if you sign in with Google — your Google user ID. We do not store passwords: sign-in is passwordless (email OTP or Google).',
      'For every account we provision a platform-assigned on-chain wallet. Its private key is generated server-side, encrypted (AES-256-GCM), and never exposed to your browser or to anyone except the platform operators. Your login is your recovery mechanism — there are no seed phrases to lose.',
    ],
  },
  {
    icon: <EyeOff className="w-4 h-4" />,
    title: 'Juror identity protection',
    body: [
      'When you serve as a juror, your identity is hidden from the parties and from other jurors. You are known only by a pseudonym (e.g. Juror #A7F2) derived from your wallet address.',
      'Jury deliberation is a private, anonymous channel. It is never merged with the public post-closure Community Discussion, and it cannot influence a verdict after votes are locked.',
    ],
  },
  {
    icon: <Server className="w-4 h-4" />,
    title: 'On-chain records are public',
    body: [
      'Case metadata, evidence hashes (SHA-256 fingerprints), IPFS CIDs, vote commitments and verdicts are anchored to the blockchain ledger. Blockchains are public: anyone can inspect these records.',
      'The content of evidence files is not published by the platform in this prototype; only its cryptographic fingerprint is recorded. In production, disclosure of evidence content follows the per-item access tier (Public / Authorized / Party-only).',
    ],
  },
  {
    icon: <Shield className="w-4 h-4" />,
    title: 'Case Studies & disclosure',
    body: [
      'Closed cases may be published as anonymised public Case Studies. Party names are reduced to first name + role, wallets are redacted, and jurors appear only as pseudonyms — and only with the parties\u2019 consent where required.',
      'You can control this per-case from your profile privacy settings (anonymise my case study, do-not-index).',
    ],
  },
  {
    icon: <EyeOff className="w-4 h-4" />,
    title: 'AI advisory processing',
    body: [
      'Case text and evidence descriptions may be processed by the AI advisory engine to produce a non-binding analytical report. The advisory never determines the outcome and is always labelled as non-binding hearsay in any legal export.',
      'All inputs pass a prompt-injection scan before processing.',
    ],
  },
  {
    icon: <Shield className="w-4 h-4" />,
    title: 'Prototype notice',
    body: [
      'Resolvia is currently a testnet prototype. Data shown in demos may be synthetic. This page describes the platform\u2019s intended production behaviour; where the prototype differs (e.g. custodial wallet keys held by platform operators), that difference is marked in-app.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-violet-600 hover:text-violet-700">
          <ArrowLeft className="w-3.5 h-3.5" /> Home
        </Link>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-4">Privacy</h1>
        <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">
          How Resolvia handles your identity, your evidence, and your juror anonymity. Last updated: September 2026.
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
          Questions about your data? Contact the Resolvia platform team. This document is part of a testnet prototype and is
          not legal advice.
        </p>
      </div>
    </div>
  );
}
