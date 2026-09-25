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
  Play,
} from 'lucide-react';
import { UserRole } from '../types';

interface LandingPageProps {
  onGetStarted: () => void;
  onOpenDashboard: () => void;
  onOpenWizard: () => void;
  onSignInRole?: (role: UserRole) => void;
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
                className="px-7 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-sm font-bold transition-all cursor-pointer flex items-center gap-2"
              >
                <Play className="w-4 h-4 text-violet-400 fill-violet-400" />
                <span>Watch Demo</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 max-w-lg">
              {[
                { v: '100+', l: 'Disputes Resolved' },
                { v: '4.8/5', l: 'User Trust Rating' },
                { v: '10+', l: 'Categories' },
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

          {/* Right: Lady Justice Hero Visual (matching reference design) */}
          <div className="lg:col-span-6">
            <div className="relative max-w-lg mx-auto lg:ml-auto">
              {/* Radial glow backdrop */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-violet-600/30 via-indigo-600/20 to-blue-500/20 rounded-3xl blur-3xl pointer-events-none" />

              {/* Main Visual Frame */}
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d152b]/90 backdrop-blur-md shadow-2xl shadow-violet-950/60 group">
                <div className="relative aspect-[4/3] sm:aspect-[16/11] w-full overflow-hidden">
                  <img
                    src="/hero_lady_justice.jpg"
                    alt="Lady Justice - Resolvia Decentralized Arbitration"
                    className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Atmospheric blend gradients */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b132b] via-transparent to-transparent opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0b132b]/40 via-transparent to-[#0b132b]/30" />

                  {/* Corner Badge: Justice Powered by Technology */}
                  <div className="absolute bottom-4 right-4 text-right">
                    <span className="inline-block text-[10px] font-black uppercase tracking-widest text-violet-200 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-violet-500/30 shadow-lg">
                      Justice Powered by Technology
                    </span>
                  </div>
                </div>

                {/* Floating pill: On-Chain Commitment */}
                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md border border-white/10 rounded-xl px-3.5 py-2 shadow-xl flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-bold text-white">
                    Commitment <span className="font-mono text-violet-300">0x8f3a…c91d</span>
                  </span>
                  <span className="text-[10px] text-slate-400 border-l border-white/15 pl-2">Sepolia</span>
                </div>

                {/* Floating pill: 100% On-Chain Verifiable */}
                <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 shadow-xl flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10.5px] font-bold text-white">100% On-Chain</span>
                </div>

                {/* Floating pill: AI Advisory */}
                <div className="absolute bottom-4 left-4 bg-[#0e1630]/90 backdrop-blur-md border border-white/15 rounded-xl px-3.5 py-2 shadow-xl flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[10.5px] font-bold text-white">AI Advisory: Non-binding</p>
                    <p className="text-[9px] text-slate-400">Jury renders sole binding verdict</p>
                  </div>
                </div>
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
        <div className="max-w-4xl mx-auto p-8 sm:p-10 rounded-3xl bg-gradient-to-tr from-violet-600/20 to-indigo-600/20 border border-white/10 text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Ready for Fair, Tamper-Evident Resolution?</h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Whether you need to file an enforceable claim, submit verifiable counter-evidence, or serve on an independent jury panel — Resolvia gives you transparent, cryptographic dispute resolution.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {isLoggedIn ? (
              <>
                <button
                  onClick={onOpenDashboard}
                  className="px-7 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg flex items-center gap-2"
                >
                  Open Dashboard
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onOpenWizard}
                  className="px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  File a New Dispute
                </button>
                <button
                  onClick={onLogout}
                  className="px-5 py-3.5 rounded-xl bg-transparent hover:bg-white/5 border border-white/10 text-slate-400 text-xs font-bold transition-all cursor-pointer"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onGetStarted}
                  className="px-7 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg flex items-center gap-2"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onWatchDemo}
                  className="px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Explore Active Case
                </button>
              </>
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
