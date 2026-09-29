'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  Play,
  FileText,
  Sparkles,
  Users,
  Gavel,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  FileCheck,
  Coins,
  Cpu,
} from 'lucide-react';

interface LiveExampleModalProps {
  open: boolean;
  onClose: () => void;
}

const DEMO_STEPS = [
  {
    step: 1,
    title: 'Case Filing & Staking',
    short: 'Filing',
    icon: <FileText className="w-4 h-4" />,
    badge: 'Step 1 of 5',
    headline: 'E-Commerce Merchant files breach of delivery SLA against logistics provider',
    details: [
      { label: 'Case Number', value: 'RSLV-2026-084' },
      { label: 'Claimant', value: 'Priya Sharma (Retail Merchant, Mumbai)' },
      { label: 'Respondent', value: 'SpeedLogistics Courier Ltd' },
      { label: 'Disputed Escrow', value: '2,500 USDC' },
      { label: 'Stake Locked', value: '500 RSLV Claimant · 500 RSLV Respondent' },
    ],
    content: (
      <div className="space-y-3">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Statement of Claim</p>
          <p className="text-[13px] text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
            "I booked express priority freight for 40 luxury artisan handicraft boxes promised for Diwali exhibition delivery by Oct 18. Consignment was held at regional transit hub without notification and delivered Nov 2, causing 100% canceled customer orders and direct financial loss."
          </p>
        </div>
        <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Coins className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
            <span className="text-[12px] font-semibold text-violet-900 dark:text-violet-200">
              Escrow Protection Active: 2,500 USDC safely locked in Hardhat Smart Contract.
            </span>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full shrink-0">
            Escrow Secured
          </span>
        </div>
      </div>
    ),
  },
  {
    step: 2,
    title: 'Evidence Locker & Anchoring',
    short: 'Evidence',
    icon: <Lock className="w-4 h-4" />,
    badge: 'Step 2 of 5',
    headline: 'Tamper-evident documents hashed in browser and registered on-chain',
    details: [
      { label: 'Total Exhibits', value: '3 Documented Exhibits' },
      { label: 'Hashing Algorithm', value: 'SHA-256 client-side fingerprinting' },
      { label: 'Storage Layer', value: 'Decentralized IPFS (content-addressed)' },
      { label: 'Anchor Tx', value: '0x8f3c…49b1 (Block #6,286,120)' },
    ],
    content: (
      <div className="space-y-2.5">
        {[
          {
            name: 'Original_Bill_Of_Lading_SLA_Contract.pdf',
            size: '2.4 MB',
            hash: '0x94f1c7d8b52e3914a60812739485b018593a20f92b7c4d11',
            status: 'Anchored on-chain',
          },
          {
            name: 'Hub_GPS_Tracking_Logs_Export.csv',
            size: '840 KB',
            hash: '0x3a19e84b2c15987d60514930129487c5b12849204859a1c2',
            status: 'Anchored on-chain',
          },
          {
            name: 'WhatsApp_Merchant_Notice_Notice_To_Carrier.png',
            size: '1.1 MB',
            hash: '0x5c882194b1239857d9012487593821094857b29104859c22',
            status: 'Anchored on IPFS',
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                <FileCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[12.5px] font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate">
                  SHA-256: {item.hash.slice(0, 24)}… ({item.size})
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full shrink-0">
              {item.status}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    step: 3,
    title: 'Objective AI Analysis',
    short: 'AI Insights',
    icon: <Sparkles className="w-4 h-4" />,
    badge: 'Step 3 of 5',
    headline: 'AI generates an advisory, non-binding synthesis highlighting facts and discrepancies',
    details: [
      { label: 'AI Model', value: 'Resolvia Neural Arbitrator v2.1' },
      { label: 'Role of AI', value: 'Advisory Only (Never Decides Final Verdict)' },
      { label: 'Claimant Score', value: '88% Evidentiary Consistency' },
      { label: 'Carrier Score', value: '34% (Unverified force majeure claim)' },
    ],
    content: (
      <div className="space-y-3">
        <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/40">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" /> Key Pattern Surfaced
            </span>
            <span className="text-[10.5px] font-black text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full">
              High Confidence
            </span>
          </div>
          <p className="text-[12.5px] text-slate-800 dark:text-slate-200 leading-relaxed">
            Carrier claimed delay was caused by regional road closure due to severe flooding. However, GPS telemetry logs indicate 4 other carrier consignments through the exact same route completed within 18 hours. Contract Section 4.2 specifically warrants a 100% refund for transit delays exceeding 96 hours without certified force majeure.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
            <p className="text-[18px] font-black text-emerald-600 dark:text-emerald-400">88%</p>
            <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">Claimant Reliability</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
            <p className="text-[18px] font-black text-amber-600 dark:text-amber-400">Clause 4.2</p>
            <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">SLA Breach Triggered</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    step: 4,
    title: 'Human Jury Deliberation',
    short: 'Jury Panel',
    icon: <Users className="w-4 h-4" />,
    badge: 'Step 4 of 5',
    headline: '5 randomly selected, anonymous peer jurors review evidence and cast blind votes',
    details: [
      { label: 'Jury Size', value: '5 Anonymous Verified Jurors' },
      { label: 'Voting Protocol', value: 'Two-Phase Commit-Reveal Scheme' },
      { label: 'Deliberation', value: 'Private, peer-reviewed channel' },
      { label: 'Consensus Met', value: '4 Claimant · 1 Split · 0 Respondent' },
    ],
    content: (
      <div className="space-y-2.5">
        {[
          {
            juror: 'Juror 01 (Commercial Logistics Expert)',
            rep: '98 Reputation',
            vote: 'Claimant Upheld',
            reason: 'Documented transit timestamp violates Section 4.2 warranty. Carrier failed to notify shipper.',
          },
          {
            juror: 'Juror 02 (Contract Arbitrator)',
            rep: '94 Reputation',
            vote: 'Claimant Upheld',
            reason: 'GPS telemetry completely contradicts the carrier’s weather defense. Clear financial loss established.',
          },
          {
            juror: 'Juror 03 (Independent Peer)',
            rep: '91 Reputation',
            vote: 'Claimant Upheld',
            reason: 'Diwali stock delivered after festival has zero salvage value for merchant.',
          },
          {
            juror: 'Juror 04 (Retail Specialist)',
            rep: '96 Reputation',
            vote: 'Claimant Upheld',
            reason: 'Carrier contract clause 4.2 governs explicitly. Full refund warranted.',
          },
        ].map((j, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1"
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-800 dark:text-slate-200">{j.juror}</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                {j.vote}
              </span>
            </div>
            <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-snug">"{j.reason}"</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    step: 5,
    title: 'Enforced Settlement & Audit',
    short: 'Resolution',
    icon: <Gavel className="w-4 h-4" />,
    badge: 'Step 5 of 5',
    headline: 'Smart contract automatically executes verdict and releases escrowed funds',
    details: [
      { label: 'Final Ruling', value: 'In Favor of Claimant (100% Payout)' },
      { label: 'USDC Payout', value: '2,500 USDC transferred to Claimant wallet' },
      { label: 'Stake Returned', value: '500 RSLV returned + 150 RSLV arbitration reward' },
      { label: 'Settlement Tx', value: '0x3d7b92…11e0 (Hardhat Block #6,286,720)' },
    ],
    content: (
      <div className="space-y-3">
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-2 shadow-md shadow-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-[15px] font-black text-emerald-900 dark:text-emerald-200">
            Verdict Enforced: 2,500 USDC Released
          </p>
          <p className="text-[12px] text-emerald-700 dark:text-emerald-400 mt-1 max-w-md mx-auto">
            Dispute resolved fairly and completely in 72 hours without expensive legal retainers or courtroom bureaucracy.
          </p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900 text-white font-mono text-[11px] space-y-1">
          <p className="text-slate-400 text-[10px] uppercase font-bold">Immutable Ledger Audit Record</p>
          <p className="truncate text-violet-300">Transaction: 0x3d7b92f08a417c84918471b02948572184918231</p>
          <p className="text-slate-400">Gas Used: 142,390 gwei · Escrow Contract: ArbitrationHub.sol</p>
        </div>
      </div>
    ),
  },
];

export function LiveExampleModal({ open, onClose }: LiveExampleModalProps) {
  const [activeStep, setActiveStep] = useState(1);

  if (!open) return null;

  const current = DEMO_STEPS.find((s) => s.step === activeStep) || DEMO_STEPS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-gradient-to-r from-violet-500/10 via-indigo-500/5 to-transparent">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Play className="w-3 h-3 fill-current" /> Live Example Walkthrough
              </span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                No Login Required
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1.5 tracking-tight">
              Case #RSLV-2026-084: Logistics SLA & Escrow Dispute
            </h2>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">
              Interactive demonstration of the full 5-stage decentralized resolution pipeline.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Tabs */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 overflow-x-auto flex gap-2">
          {DEMO_STEPS.map((s) => {
            const isCurrent = s.step === activeStep;
            const isDone = s.step < activeStep;
            return (
              <button
                key={s.step}
                onClick={() => setActiveStep(s.step)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  isCurrent
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : isDone
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 hover:border-slate-300'
                }`}
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black bg-black/10 dark:bg-white/10">
                  {isDone ? '✓' : s.step}
                </span>
                <span>{s.short}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded-md">
              {current.badge} · {current.title}
            </span>
            <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
              {current.headline}
            </h3>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {current.details.map((d, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60"
              >
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{d.label}</p>
                <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">{d.value}</p>
              </div>
            ))}
          </div>

          {/* Step-specific rich component */}
          {current.content}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {activeStep > 1 && (
              <button
                onClick={() => setActiveStep((p) => p - 1)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Previous Step
              </button>
            )}
            {activeStep < DEMO_STEPS.length ? (
              <button
                onClick={() => setActiveStep((p) => p + 1)}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-md shadow-violet-600/20"
              >
                Next: {DEMO_STEPS[activeStep].short} <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setActiveStep(1)}
                className="px-4 py-2 rounded-xl border border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 text-xs font-bold hover:bg-violet-50 dark:hover:bg-violet-950/40 cursor-pointer transition-colors"
              >
                Replay From Step 1
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/signup"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold cursor-pointer transition-colors shadow-xs"
            >
              Create Account
            </Link>
            <Link
              href="/cases/case-084"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors flex items-center gap-1"
            >
              Open Full Case Record <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
