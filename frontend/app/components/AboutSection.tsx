'use client';

import React from 'react';
import {
  Shield,
  Users,
  Globe,
  Scale,
  Eye,
  Target,
  Heart,
  ArrowRight,
  Play,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface AboutSectionProps {
  onOpenDashboard: () => void;
  onOpenVideoModal?: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  onOpenDashboard,
  onOpenVideoModal,
}) => {
  return (
    <div className="w-full text-slate-900 animate-fade-in selection:bg-blue-600 selection:text-white">
      {/* ═══════════════ TOP HERO SECTION (DARK BLUE CINEMATIC) ═══════════════ */}
      <section className="relative overflow-hidden bg-[#070d1d] text-white pt-10 pb-16 px-6 border-b border-white/[0.08]">
        {/* Glow effects */}
        <div className="absolute top-0 right-1/3 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Text Column */}
          <div className="lg:col-span-6 space-y-6">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-blue-400 block">
              ABOUT RESOLVIA
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-black tracking-tight text-white leading-[1.1]">
              Reimagining Justice <br />
              for a <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">Connected World.</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              Resolvia is an AI-assisted, blockchain-powered dispute arbitration platform designed to make conflict resolution fair, transparent, accessible, and verifiable for individuals, institutions, and communities.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onOpenDashboard}
                className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-[0_0_25px_rgba(37,99,235,0.4)] hover:shadow-[0_0_35px_rgba(37,99,235,0.6)] transition-all cursor-pointer active:scale-[0.98]"
              >
                <span>Our Mission</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenVideoModal}
                className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white text-xs sm:text-sm font-semibold border border-white/[0.15] transition-all cursor-pointer backdrop-blur-md"
              >
                <span>Watch Video</span>
                <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center">
                  <Play className="w-2.5 h-2.5 fill-white text-white ml-0.5" />
                </div>
              </button>
            </div>

            {/* Quote */}
            <p className="text-xs sm:text-sm text-slate-400 italic pt-2 font-serif">
              &ldquo;Justice is not just a destination, it&apos;s a process we can all trust.&rdquo;
              <span className="block not-italic font-sans text-xs text-slate-500 mt-1 font-semibold">
                — The Resolvia Team
              </span>
            </p>
          </div>

          {/* Right Visual Graphic (Law Library with Scales & Books) */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            <div className="w-full max-w-lg rounded-3xl bg-gradient-to-br from-[#0c1630] via-[#091024] to-[#050914] border border-blue-500/20 p-6 shadow-2xl relative overflow-hidden group">
              {/* Neon backdrop sign */}
              <div className="text-center py-4 border-b border-white/[0.08] relative">
                <div className="absolute inset-0 flex items-center justify-center blur-2xl bg-blue-500/10 pointer-events-none" />
                <p className="font-mono text-xs tracking-widest text-blue-400 uppercase font-black">
                  DISPUTES TODAY
                </p>
                <p className="font-mono text-sm tracking-wider text-indigo-300 font-extrabold mt-0.5">
                  BETTER TOMORROW
                </p>
              </div>

              {/* Stack of Law & Tech Books */}
              <div className="py-6 flex flex-col items-center justify-center relative">
                {/* Scale of Justice */}
                <div className="w-20 h-20 rounded-2xl bg-blue-600/20 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-[0_0_30px_rgba(37,99,235,0.5)] mb-6 group-hover:scale-110 transition-transform">
                  <Scale className="w-10 h-10 text-blue-400" />
                </div>

                {/* 4 Stacked Spine Labels */}
                <div className="w-64 space-y-1.5 text-center">
                  <div className="py-1.5 px-3 rounded-lg bg-slate-800/90 border border-slate-700 text-[11px] font-mono tracking-wider text-slate-300 font-bold shadow-sm">
                    TECHNOLOGY
                  </div>
                  <div className="py-1.5 px-3 rounded-lg bg-slate-800/90 border border-slate-700 text-[11px] font-mono tracking-wider text-slate-300 font-bold shadow-sm">
                    PEOPLE
                  </div>
                  <div className="py-1.5 px-3 rounded-lg bg-slate-800/90 border border-slate-700 text-[11px] font-mono tracking-wider text-slate-300 font-bold shadow-sm">
                    FAIRNESS
                  </div>
                  <div className="py-1.5 px-3 rounded-lg bg-blue-900/60 border border-blue-500/40 text-[11px] font-mono tracking-wider text-blue-200 font-bold shadow-md">
                    A BETTER TOMORROW
                  </div>
                </div>
              </div>

              {/* Floating Quote Badge */}
              <div className="mt-4 p-4 rounded-2xl bg-slate-900/90 border border-blue-500/30 text-white shadow-xl backdrop-blur-md">
                <p className="text-xs text-slate-200 leading-snug font-medium italic">
                  &ldquo;Technology should empower fairness, not replace humanity.&rdquo;
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[10px] text-blue-400 font-bold">
                  <span>Resolvia</span>
                  <span>Trust & Transparency</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 4 VALUE CARDS + STATS STRIP ═══════════════ */}
      <section className="bg-white py-12 px-6 border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* 4 Core Pillars */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Our Purpose */}
              <div className="p-5 rounded-2xl bg-[#f8fafc] border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5">Our Purpose</h3>
                <p className="text-xs text-slate-600 leading-relaxed flex-1">
                  To provide a secure, transparent, and unbiased platform for resolving disputes using the combined power of AI and blockchain.
                </p>
              </div>

              {/* Card 2: Who We Serve */}
              <div className="p-5 rounded-2xl bg-[#f8fafc] border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5">Who We Serve</h3>
                <p className="text-xs text-slate-600 leading-relaxed flex-1">
                  Students, professionals, institutions, freelancers, and communities — anyone with a legitimate dispute that needs a fair resolution.
                </p>
              </div>

              {/* Card 3: Why It Matters */}
              <div className="p-5 rounded-2xl bg-[#f8fafc] border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-3">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5">Why It Matters</h3>
                <p className="text-xs text-slate-600 leading-relaxed flex-1">
                  Traditional dispute resolution is often slow, expensive, and inaccessible. Resolvia offers a modern alternative that is faster, fairer, and more transparent.
                </p>
              </div>

              {/* Card 4: Our Approach */}
              <div className="p-5 rounded-2xl bg-[#f8fafc] border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                  <Scale className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5">Our Approach</h3>
                <p className="text-xs text-slate-600 leading-relaxed flex-1">
                  We combine AI for objective analysis, a decentralized jury for human judgment, and blockchain for immutable records — ensuring trust at every step.
                </p>
              </div>
            </div>

            {/* Gradient Stats Card */}
            <div className="lg:col-span-4 rounded-2xl bg-gradient-to-br from-[#0c183b] to-[#1e1b4b] p-6 text-white shadow-md flex flex-col justify-between border border-blue-900/50">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300 block mb-1">
                  Impact & Traction
                </span>
                <h3 className="text-base font-extrabold text-white">
                  Building a Fairer Tomorrow
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 my-4">
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-blue-400 font-mono">100+</p>
                  <p className="text-[11px] text-slate-300 font-semibold mt-0.5">Disputes Resolved</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">4.8/5</p>
                  <p className="text-[11px] text-slate-300 font-semibold mt-0.5">User Trust Rating</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-purple-400 font-mono">10+</p>
                  <p className="text-[11px] text-slate-300 font-semibold mt-0.5">Categories Supported</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">50+</p>
                  <p className="text-[11px] text-slate-300 font-semibold mt-0.5">Active Community</p>
                </div>
              </div>

              <button
                onClick={onOpenDashboard}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>View Real-Time Metrics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ OUR STORY & VALUES DUAL SECTION ═══════════════ */}
      <section className="bg-[#f8fafc] py-16 px-6">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Our Story & Timeline */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 block">
                OUR JOURNEY
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                Our Story: <span className="text-blue-600">From an Idea to a Movement</span>
              </h2>
            </div>

            <div className="space-y-3.5 text-sm text-slate-600 leading-relaxed">
              <p>
                Resolvia was born from a simple realization — that millions of small and medium disputes never reach formal courts, yet they significantly impact people&apos;s lives, livelihoods, and peace of mind.
              </p>
              <p>
                We saw an opportunity to use technology not to replace human judgment, but to support and strengthen it through objective legal NLP analysis and decentralized cryptoeconomic consensus.
              </p>
              <p>
                Today, Resolvia is a growing platform, driven by a vision of accessible, transparent, and trustworthy dispute resolution for everyone.
              </p>
            </div>

            {/* Handwritten style tagline */}
            <div className="pt-2">
              <span className="text-xl sm:text-2xl font-serif italic text-purple-700 font-bold tracking-wide">
                People. Evidence. Fair Resolution.
              </span>
            </div>

            {/* Timeline matching reference screenshot */}
            <div className="pt-6 border-t border-slate-200 space-y-5">
              {[
                {
                  year: '2024',
                  title: 'The Idea',
                  desc: 'Identified the need for a fair, transparent, and accessible platform for everyday disputes.',
                  isCurrent: false,
                },
                {
                  year: '2024',
                  title: 'Research & Design',
                  desc: 'Explored AI, blockchain, and decentralized governance models to create a viable, fair arbitration solution.',
                  isCurrent: false,
                },
                {
                  year: '2025',
                  title: 'Prototype Development',
                  desc: 'Built the first version of Resolvia with core features like case submission, AI analysis, and jury deliberation.',
                  isCurrent: true,
                },
                {
                  year: '2025',
                  title: 'Community Testing',
                  desc: 'Gathered feedback from real users and refined the platform for better usability, fairness, and security.',
                  isCurrent: false,
                },
                {
                  year: 'Future',
                  title: 'A Fairer Tomorrow',
                  desc: 'Scaling Resolvia to empower individuals, institutions, and communities worldwide with borderless justice.',
                  isCurrent: false,
                  isStar: true,
                },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 group">
                  <div className="w-16 shrink-0 text-right">
                    <span className="text-xs font-black font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {item.year}
                    </span>
                  </div>

                  {/* Bullet Dot */}
                  <div className="relative flex flex-col items-center">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      item.isStar
                        ? 'bg-purple-600 border-purple-400 text-white'
                        : item.isCurrent
                        ? 'bg-blue-600 border-blue-400 shadow-[0_0_8px_rgba(37,99,235,0.6)]'
                        : 'bg-slate-300 border-slate-200'
                    }`}>
                      {item.isStar && <span className="text-[8px]">★</span>}
                    </div>
                    {idx < 4 && <div className="w-0.5 h-12 bg-slate-200 my-1" />}
                  </div>

                  {/* Content */}
                  <div className="pb-3 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Visual Banner & Core Tenets */}
          <div className="lg:col-span-5 space-y-6">
            {/* Visual Collaboration Card */}
            <div className="rounded-3xl bg-gradient-to-tr from-[#111c38] to-[#1e293b] p-6 text-white shadow-lg border border-slate-700 relative overflow-hidden">
              <div className="relative z-10 space-y-2">
                <span className="text-[10px] font-mono tracking-widest text-blue-400 uppercase font-black">
                  CULTURE & COMMITMENT
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
                  FAIR IDEAS. <br />REAL IMPACT.
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed pt-1">
                  We believe technology should eliminate procedural barriers, reduce bias, and make dispute resolution accessible to all parties regardless of economic standing.
                </p>
              </div>

              {/* Decorative background circle */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl" />
            </div>

            {/* Vision, Mission & Values Cards */}
            <div className="space-y-3.5">
              {/* Vision */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Our Vision</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                    A world where every dispute can be resolved fairly, transparently, and without fear or bias.
                  </p>
                </div>
              </div>

              {/* Mission */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Our Mission</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                    To build a trusted, technology-driven platform that empowers people to resolve disputes with evidence, reason, and fairness.
                  </p>
                </div>
              </div>

              {/* Values */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Our Values</h4>
                  <p className="text-xs text-slate-600 font-semibold mt-1">
                    Transparency • Impartiality • Integrity • Accessibility • Human-Centric
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
