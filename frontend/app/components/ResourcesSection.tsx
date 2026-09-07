'use client';

import React from 'react';
import {
  BookOpen,
  FileText,
  Shield,
  ExternalLink,
  Download,
  HelpCircle,
  ArrowRight,
  Code,
  CheckCircle,
  Database,
} from 'lucide-react';

interface ResourcesSectionProps {
  onOpenDashboard: () => void;
}

export const ResourcesSection: React.FC<ResourcesSectionProps> = ({ onOpenDashboard }) => {
  return (
    <div className="w-full text-slate-900 animate-fade-in selection:bg-blue-600 selection:text-white">
      {/* Hero Header */}
      <section className="bg-[#070d1d] text-white py-14 px-6 border-b border-white/[0.08]">
        <div className="max-w-[1400px] mx-auto text-center space-y-4">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-blue-400 block">
            KNOWLEDGE BASE & ARCHITECTURE
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Resolvia Resources & Documentation
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Explore our whitepaper, technical specifications, smart contract addresses, legal compliance guidelines (BSA 2023), and dispute arbitration frameworks.
          </p>
        </div>
      </section>

      {/* 4 Key Resource Categories */}
      <section className="bg-white py-14 px-6 border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Item 1: Whitepaper */}
          <div className="p-6 rounded-2xl bg-[#f8fafc] border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Technical Whitepaper</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Full cryptographic architecture, commit-reveal game-theory mechanisms, and AI prompt-injection defense pipeline specification.
              </p>
            </div>
            <div className="pt-4 mt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-blue-600">
              <span>Read Spec (v1.2)</span>
              <Download className="w-4 h-4" />
            </div>
          </div>

          {/* Item 2: Smart Contract Registry */}
          <div className="p-6 rounded-2xl bg-[#f8fafc] border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Code className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Smart Contract Code</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Verified Solidity contracts for CaseRegistry, VotingManager, EvidenceRegistry, and ResolviaToken on Sepolia testnet.
              </p>
            </div>
            <div className="pt-4 mt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-purple-600">
              <span>View On GitHub</span>
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>

          {/* Item 3: BSA 2023 & ISO 27037 */}
          <div className="p-6 rounded-2xl bg-[#f8fafc] border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">BSA 2023 Legal Dossier</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Admissibility standards for on-chain digital records, ISO/IEC 27037 chain-of-custody hashes, and Section 63 certificate format.
              </p>
            </div>
            <div className="pt-4 mt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-emerald-600">
              <span>Legal Guidelines</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Item 4: Juror Guidelines */}
          <div className="p-6 rounded-2xl bg-[#f8fafc] border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Juror Manual & Staking</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Rules of evidence evaluation, blind commit-reveal voting schedules, DRA token slashing rules, and payout reward calculations.
              </p>
            </div>
            <div className="pt-4 mt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-amber-700">
              <span>Juror Handbook</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="bg-[#f8fafc] py-16 px-6">
        <div className="max-w-[1000px] mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 block">
              COMMON QUESTIONS
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'How does AI assist without replacing human judges?',
                a: 'The AI engine performs passive data analysis: it isolates prompt injection attacks, maps claims to uploaded documents, detects chronological contradictions, and outputs a non-binding advisory report. Final verdict authority rests 100% with the elected human jury.',
              },
              {
                q: 'What prevents jurors from copying each other’s votes?',
                a: 'Resolvia enforces a two-phase Commit-Reveal scheme. During the commit phase, jurors submit a blind hash of their vote combined with a secret cryptographic salt. In the reveal phase, they open their vote. No juror can inspect others’ votes beforehand.',
              },
              {
                q: 'How is evidence protected against tampering?',
                a: 'Uploaded files are hashed using SHA-256 and pinned to IPFS. The cryptographic hash and block timestamp are anchored on the blockchain smart contract, creating an immutable, court-admissible audit trail under ISO/IEC 27037.',
              },
              {
                q: 'What tokens are used for arbitration escrow?',
                a: 'Disputes can be backed by standard ERC-20 stablecoins (USDC/USDT) or native testnet currency locked in smart escrow, while jurors stake DRA/RSLV governance tokens to participate and earn arbitration fees.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{faq.q}</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>

          {/* Quick CTA */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
            <div>
              <h4 className="text-base font-bold">Have an ongoing dispute to file?</h4>
              <p className="text-xs text-blue-100 mt-0.5">Submit your evidence and let our decentralized arbitration panel resolve it.</p>
            </div>
            <button
              onClick={onOpenDashboard}
              className="px-5 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-xs hover:bg-blue-50 transition-colors shrink-0 shadow-sm cursor-pointer"
            >
              Open Dispute Wizard
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
