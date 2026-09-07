'use client';

import React from 'react';
import {
  Scale,
  Shield,
  Coins,
  Cpu,
  CheckCircle,
  FileText,
  Clock,
  ChevronRight,
  Sparkles,
  Award,
  BarChart3,
  ExternalLink,
  Lock,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { UserRole } from '../types';

interface LandingPageProps {
  onGetStarted: () => void;
  onOpenDashboard: () => void;
  onOpenWizard: () => void;
  onSignInRole: (role: UserRole) => void;
  onWatchDemo: () => void;
  isLoggedIn: boolean;
  onLogout: () => void;
}

const FEATURES = [
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Zero-Trust Evidence Anchoring',
    description:
      'SHA-256 fingerprint every document and IPFS-anchor its content. If a single byte changes after the on-chain hash is recorded, the Verifier Portal flags it immediately.',
    stat: 'SHA-256 + IPFS CID',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: <Scale className="w-5 h-5" />,
    title: 'Commit-Reveal Jury Deliberation',
    description:
      'Jurors first lock their secret hash (commit) before the deadline; no vote can be bribed, changed, or swayed afterwards. Reveal is mathematically verifiable on-chain.',
    stat: 'Bribe-Proof Consensus',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: <Cpu className="w-5 h-5" />,
    title: 'AI Advisory, Human Verdict',
    description:
      'NeuralNLP cross-checks the evidence timeline, maps claims, and flags contradictions. Its advisory is always labeled non-binding: the jury alone writes the verdict.',
    stat: 'Advisory-Only Mode',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: 'BSA 2023 Legal Dossier',
    description:
      'Export a court-ready electronic evidence package: chronology, IPFS CIDs, tx hashes, AI advisory (clearly marked as hearsay), and a Section 63/65B certificate template.',
    stat: 'Section 63 Certificate',
    color: 'bg-amber-50 text-amber-600',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'File a Dispute',
    description: 'Upload evidence through a 5-step wizard. Every file is SHA-256 hashed live in your browser before it leaves your machine.',
  },
  {
    num: '02',
    title: 'Evidence Anchored',
    description: 'Hashes + IPFS CIDs are written to the EvidenceRegistry contract on Ethereum Sepolia. Stake is locked in escrow via ArbitrationHub.',
  },
  {
    num: '03',
    title: 'AI Advisory Generated',
    description: 'The engine maps claims to evidence, syncs the timeline, and runs a prompt-injection scan on all payloads.',
  },
  {
    num: '04',
    title: 'Jury Votes Blindly',
    description: 'A randomly selected panel of 5 jurors commits vote hashes, then reveals. 3+ identical votes settle the case.',
  },
  {
    num: '05',
    title: 'Verdict & Legal Dossier',
    description: 'Stake settles automatically, and a BSA 2023-compliant dossier is generated for court filing if either party escalates.',
  },
];

export function LandingPage({
  onGetStarted,
  onOpenDashboard,
  onOpenWizard,
  onSignInRole,
  onWatchDemo,
  isLoggedIn,
  onLogout,
}: LandingPageProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* ═══════ HERO SECTION ═══════ */}
      <section className="relative px-4 sm:px-6 lg:px-12 pt-12 pb-16 overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -left-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left: Copy */}
          <div className="lg:col-span-6 space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI-Assisted Decentralized Arbitration</span>
            </span>

            <h1 className="text-4xl sm:text-5xl font-black text-white leading-[1.15] tracking-tight">
              Disputes Deserve
              <span className="block text-violet-400">A Fairer Tomorrow</span>
            </h1>

            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-lg">
              An AI-assisted, blockchain-powered dispute resolution platform for individuals,
              institutions and communities. AI analyzes the evidence. People make the decision.
              Blockchain preserves the record.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={onGetStarted}
                className="px-7 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-all shadow-lg shadow-violet-600/30 cursor-pointer flex items-center gap-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onWatchDemo}
                className="px-7 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-sm font-bold transition-all cursor-pointer"
              >
                Watch Demo
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 max-w-lg">
              {[
                { v: '100+', l: 'Disputes Resolved' },
                { v: '4.8/5', l: 'User Trust Rating' },
                { v: '15', l: 'Case Categories' },
                { v: '50+', l: 'Active Community' },
              ].map((s) => (
                <div key={s.l} className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                  <p className="text-lg font-black text-white leading-none">{s.v}</p>
                  <p className="text-[9.5px] font-semibold text-slate-400 mt-1.5 leading-tight">{s.l}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 max-w-lg">
              {[
                { icon: <Cpu className="w-4 h-4" />, t: 'AI-Assisted Analysis', s: 'Objective insights from evidence' },
                { icon: <Shield className="w-4 h-4" />, t: 'Decentralized Jury', s: 'Fair & unbiased deliberation' },
                { icon: <Lock className="w-4 h-4" />, t: 'Blockchain Records', s: 'Immutable & tamper-proof' },
                { icon: <CheckCircle className="w-4 h-4" />, t: 'Accessible to All', s: 'Fast, affordable, transparent' },
              ].map((x) => (
                <div key={x.t} className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-center">
                  <div className="w-8 h-8 mx-auto rounded-lg bg-violet-500/20 text-violet-300 flex items-center justify-center">{x.icon}</div>
                  <p className="text-[10.5px] font-bold text-slate-200 mt-2 leading-tight">{x.t}</p>
                  <p className="text-[8.5px] text-slate-500 mt-1 leading-tight">{x.s}</p>
                </div>
              ))}
            </div>

            {/* Trust strip */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-emerald-400" /> SHA-256 Anchoring</span>
              <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-400" /> Sepolia Testnet</span>
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-blue-400" /> Commit-Reveal Voting</span>
              <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-purple-400" /> BSA 2023 Export</span>
            </div>
          </div>

          {/* Right: Mock Case Card Stack */}
          <div className="lg:col-span-6">
            <div className="relative max-w-md mx-auto lg:ml-auto">
              {/* Glow behind card */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 rounded-3xl blur-2xl"></div>

              {/* Main mock case card */}
              <div className="relative bg-[#0e1630] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-blue-400 bg-blue-500/10 border border-blue-400/20 px-2 py-0.5 rounded">
                      RSV-2026-084
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-400/20">
                      JURY_REVEAL
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">Sepolia • Block 6,284,190</span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">
                    Smart Contract Delivery Dispute — Sepolia Staging
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Alice Vance (Claimant) vs Apex Blockchain Labs (Respondent)
                  </p>
                </div>

                {/* Evidence mini rows */}
                <div className="space-y-2">
                  {[
                    { name: 'deliverable_reentrancy.patch', cid: 'QmX4b...f92a', status: 'VERIFIED' },
                    { name: 'telegram_dispute_log.txt', cid: 'Qm7cD...11be', status: 'VERIFIED' },
                    { name: 'staging_reentrancy_trace.log', cid: 'QmW3d...904c', status: 'FLAGGED' },
                  ].map((ev) => (
                    <div key={ev.name} className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-slate-300 truncate">{ev.name}</p>
                          <p className="text-[10px] text-slate-600 font-mono truncate">CID {ev.cid}</p>
                        </div>
                      </div>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                          ev.status === 'VERIFIED'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {ev.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Jury tally */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jury Tally</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-emerald-400">3 Claimant</span>
                    <span className="text-slate-600 text-[10px]">|</span>
                    <span className="text-[11px] font-bold text-rose-400">2 Respondent</span>
                  </div>
                </div>
              </div>

              {/* Floating chip: AI advisory */}
              <div className="absolute -bottom-5 -left-6 bg-[#111a38] border border-white/10 rounded-xl px-4 py-3 shadow-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white">AI Advisory: Claimant favoured</p>
                  <p className="text-[9px] text-slate-500">Confidence 82% • Non-binding</p>
                </div>
              </div>

              {/* Floating chip: on-chain */}
              <div className="absolute -top-4 -right-4 bg-[#111a38] border border-white/10 rounded-xl px-4 py-3 shadow-xl flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-blue-400" />
                <p className="text-[10px] font-bold text-white">
                  Commitment <span className="font-mono text-blue-400">0x8f3a…c91d</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FEATURE GRID ═══════ */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Built for evidence, not eloquence
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              Every claim must map to an anchored artefact. Every hash is verifiable by
              anyone, forever, with zero trust in any single party.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-colors"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="text-sm font-bold text-white">{f.title}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{f.description}</p>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-4">
                  {f.stat}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ 5-STEP PIPELINE ═══════ */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight text-center mb-10">
            How a case moves through Resolvia
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {STEPS.map((s, i) => (
              <div key={s.num} className="relative">
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 h-full">
                  <span className="text-2xl font-black text-blue-500/40 font-mono">{s.num}</span>
                  <h4 className="text-xs font-bold text-white mt-3">{s.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{s.description}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-slate-600 absolute top-1/2 -right-4 hidden md:block z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CTA BAND ═══════ */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 border-t border-white/5">
        <div className="max-w-4xl mx-auto p-8 sm:p-10 rounded-3xl bg-gradient-to-tr from-blue-600/20 to-purple-600/20 border border-white/10 text-center space-y-4">
          <h2 className="text-2xl font-black text-white">Experience the full lifecycle</h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Switch between Claimant, Respondent, Juror, and Admin personas in one click.
            File a case, watch it get hashed, vote blindly, and export the legal dossier.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={isLoggedIn ? onOpenDashboard : () => onSignInRole('CLAIMANT')}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg"
            >
              {isLoggedIn ? 'Open Dashboard' : 'Enter as Claimant'}
            </button>
            <button
              onClick={() => onSignInRole('JUROR_1')}
              className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              Enter as Juror
            </button>
            {isLoggedIn && (
              <button
                onClick={onLogout}
                className="px-6 py-3 rounded-xl bg-transparent hover:bg-white/5 border border-white/10 text-slate-400 text-xs font-bold transition-all cursor-pointer"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="px-4 sm:px-6 lg:px-12 py-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white">Resolvia</span>
            <span className="text-[10px] text-slate-500 ml-2">Ethereum Sepolia Testnet • RSLV</span>
          </div>
          <p className="text-[10px] text-slate-600">
            AI output on this platform is advisory and non-binding. Final verdicts are rendered exclusively by the human jury.
          </p>
        </div>
      </footer>
    </div>
  );
}
