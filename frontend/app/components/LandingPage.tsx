'use client';

import React, { useState } from 'react';
import {
  Scale,
  Sparkles,
  Shield,
  FileCheck,
  CheckCircle,
  Users,
  Database,
  Lock,
  Globe,
  ArrowRight,
  Play,
  Search,
  ChevronRight,
  GraduationCap,
  Briefcase,
  Building2,
  ShoppingCart,
  Laptop,
  MoreHorizontal,
  Gavel,
  FileText,
  Activity,
  Award,
  ExternalLink,
  Check,
  X,
  LogOut,
} from 'lucide-react';
import { UserRole } from '../types';
import { AboutSection } from './AboutSection';
import { ResourcesSection } from './ResourcesSection';
import { ContactSection } from './ContactSection';
import { SignInModal } from './SignInModal';

// Social media SVG icons (lucide-react doesn't export brand icons)
const GithubIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
);
const LinkedinIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
);
const TwitterIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
);
const YoutubeIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
);

export type PublicPageTab = 'home' | 'about' | 'how-it-works' | 'categories' | 'resources' | 'contact';

interface LandingPageProps {
  onGetStarted: () => void;
  onOpenDashboard: () => void;
  onOpenWizard: () => void;
  onSelectCategory?: (category: string) => void;
  onSignInRole?: (role: UserRole) => void;
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onOpenDashboard,
  onOpenWizard,
  onSignInRole,
  isLoggedIn = false,
  onLogout,
}) => {
  const [activePublicTab, setActivePublicTab] = useState<PublicPageTab>('home');
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [signInModalOpen, setSignInModalOpen] = useState(false);

  const handleNavClick = (tab: PublicPageTab) => {
    setActivePublicTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignIn = (role: UserRole) => {
    if (onSignInRole) {
      onSignInRole(role);
    } else {
      onOpenDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-[#070d1d] text-white flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* ═══════════════ TOP NAVBAR ═══════════════ */}
      <header className="sticky top-0 z-50 w-full bg-[#070d1d]/90 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-[1400px] mx-auto px-6 h-[72px] flex items-center justify-between gap-4">
          {/* Logo */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,99,235,0.5)] group-hover:scale-105 transition-transform">
              <Scale className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white font-sans block leading-none">
                Resolvia
              </span>
              <span className="text-[10px] text-slate-400 tracking-normal block mt-0.5">
                People. Evidence. Fair Resolution.
              </span>
            </div>
          </div>

          {/* Center Nav Links matching Reference Image with Underline */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => handleNavClick('home')}
              className={`px-3.5 py-2 rounded-lg text-[13px] transition-all cursor-pointer ${
                activePublicTab === 'home'
                  ? 'font-bold text-white border-b-2 border-white'
                  : 'font-medium text-slate-300 hover:text-white'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('about')}
              className={`px-3.5 py-2 rounded-lg text-[13px] transition-all cursor-pointer ${
                activePublicTab === 'about'
                  ? 'font-bold text-white border-b-2 border-white'
                  : 'font-medium text-slate-300 hover:text-white'
              }`}
            >
              About
            </button>
            <button
              onClick={() => handleNavClick('how-it-works')}
              className={`px-3.5 py-2 rounded-lg text-[13px] transition-all cursor-pointer ${
                activePublicTab === 'how-it-works'
                  ? 'font-bold text-white border-b-2 border-white'
                  : 'font-medium text-slate-300 hover:text-white'
              }`}
            >
              How It Works
            </button>
            <button
              onClick={() => handleNavClick('categories')}
              className={`px-3.5 py-2 rounded-lg text-[13px] transition-all cursor-pointer ${
                activePublicTab === 'categories'
                  ? 'font-bold text-white border-b-2 border-white'
                  : 'font-medium text-slate-300 hover:text-white'
              }`}
            >
              Case Studies
            </button>
            <button
              onClick={() => handleNavClick('resources')}
              className={`px-3.5 py-2 rounded-lg text-[13px] transition-all cursor-pointer ${
                activePublicTab === 'resources'
                  ? 'font-bold text-white border-b-2 border-white'
                  : 'font-medium text-slate-300 hover:text-white'
              }`}
            >
              Resources
            </button>
            <button
              onClick={() => handleNavClick('contact')}
              className={`px-3.5 py-2 rounded-lg text-[13px] transition-all cursor-pointer ${
                activePublicTab === 'contact'
                  ? 'font-bold text-white border-b-2 border-white'
                  : 'font-medium text-slate-300 hover:text-white'
              }`}
            >
              Contact
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button className="p-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer">
              <Search className="w-4 h-4" />
            </button>

            {isLoggedIn ? (
              <>
                <button
                  onClick={onOpenDashboard}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-bold shadow-sm transition-all cursor-pointer"
                >
                  <span>Dashboard Console</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-[13px] font-semibold transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => setSignInModalOpen(true)}
                  className="hidden sm:flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[13px] font-semibold text-slate-200 hover:text-white border border-white/[0.15] hover:border-white/[0.3] transition-all cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setSignInModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-bold shadow-[0_0_20px_rgba(37,99,235,0.35)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] transition-all cursor-pointer active:scale-[0.98]"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ═══════════════ MAIN VIEW ROUTER (NON-BLANK SECTIONS) ═══════════════ */}
      {activePublicTab === 'about' && (
        <AboutSection
          onOpenDashboard={() => setSignInModalOpen(true)}
          onOpenVideoModal={() => setDemoModalOpen(true)}
        />
      )}

      {activePublicTab === 'resources' && (
        <ResourcesSection
          onOpenDashboard={() => setSignInModalOpen(true)}
        />
      )}

      {activePublicTab === 'contact' && (
        <ContactSection />
      )}

      {(activePublicTab === 'home' || activePublicTab === 'how-it-works' || activePublicTab === 'categories') && (
        <>
          {/* ═══════════════ HERO SECTION ═══════════════ */}
          <section className="relative overflow-hidden pt-8 pb-0 px-6 bg-gradient-to-b from-[#070d1d] via-[#091226] to-[#0d1835]">
            {/* Background Glows */}
            <div className="absolute -top-40 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none"></div>
            <div className="absolute top-40 -left-20 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none"></div>

            <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
              {/* Left Hero Column */}
              <div className="lg:col-span-5 space-y-5 pt-4">
                {/* Pill Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-blue-950/70 border border-blue-500/25 text-[11px] font-semibold text-blue-300">
                  <span>Decentralized</span>
                  <span className="text-blue-500">•</span>
                  <span>AI-Assisted</span>
                  <span className="text-blue-500">•</span>
                  <span>Transparent</span>
                  <span className="text-blue-500">•</span>
                  <span>Secure</span>
                </div>

                {/* Headline */}
                <div className="space-y-1">
                  <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black tracking-tight text-white leading-[1.08]">
                    Disputes Deserve <br />
                    <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                      Better Solutions
                    </span>
                  </h1>
                </div>

                {/* Description */}
                <p className="text-[14px] text-slate-300 max-w-lg leading-relaxed">
                  Resolvia is an AI-assisted, blockchain-powered dispute arbitration
                  platform that enables fair, transparent, and verifiable resolutions
                  for individuals, institutions, and communities.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <button
                    onClick={() => setSignInModalOpen(true)}
                    className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold shadow-[0_0_25px_rgba(37,99,235,0.4)] hover:shadow-[0_0_35px_rgba(37,99,235,0.6)] transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <button
                    onClick={() => setDemoModalOpen(true)}
                    className="flex items-center gap-2.5 px-5 py-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white text-sm font-semibold border border-white/[0.15] transition-all cursor-pointer backdrop-blur-md"
                  >
                    <span>Watch Demo</span>
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                      <Play className="w-3 h-3 fill-white" />
                    </div>
                  </button>
                </div>

                {/* Tagline */}
                <p className="text-xs text-slate-400 leading-relaxed pt-1">
                  Justice shouldn&apos;t be slow, expensive, or inaccessible.<br />
                  <span className="text-slate-300 font-medium">Let&apos;s build a fairer tomorrow, together.</span>
                </p>
              </div>

              {/* Center: Lady Justice Cinematic Illustration */}
              <div className="lg:col-span-4 relative flex items-center justify-center min-h-[420px]">
                {/* Background Glow */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[350px] h-[350px] bg-blue-500/15 rounded-full blur-[80px]"></div>
                </div>

                {/* Lady Justice Visual */}
                <div className="relative z-10 flex flex-col items-center">
                  <p className="text-sm font-serif italic text-blue-300/70 tracking-wide rotate-[-5deg] mb-4 self-end mr-2">
                    Technology for Fairer<br />Societies
                  </p>

                  <div className="relative w-[280px] h-[300px]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-b from-amber-600/80 to-amber-800/60 mx-auto mb-1 shadow-[0_0_30px_rgba(217,119,6,0.3)] border border-amber-500/30"></div>
                        <div className="w-20 h-28 mx-auto bg-gradient-to-b from-slate-600/60 to-slate-800/50 rounded-t-3xl border border-white/10 shadow-lg relative">
                          <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-20 h-2.5 bg-amber-400/70 rounded-full"></div>
                        </div>
                        <div className="absolute top-14 -left-[90px] w-[260px] flex items-start justify-between">
                          <div className="flex flex-col items-center">
                            <div className="w-[2px] h-6 bg-amber-400/50"></div>
                            <div className="w-[2px] h-12 bg-blue-400/40"></div>
                            <div className="w-20 h-12 rounded-b-[50%] bg-gradient-to-b from-blue-500/30 to-blue-600/60 border-2 border-blue-400 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.6)]">
                              <span className="font-black text-sm text-blue-200 tracking-widest font-mono">AI</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-[2px] h-6 bg-amber-400/50"></div>
                            <div className="w-[2px] h-8 bg-amber-400/40"></div>
                            <div className="w-20 h-12 rounded-b-[50%] bg-gradient-to-b from-amber-500/30 to-amber-600/60 border-2 border-amber-400 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                              <span className="font-black text-[10px] text-amber-100 tracking-wider text-center leading-tight">
                                HUMAN<br />JURY
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-12 -left-[90px] w-[260px] h-1 bg-gradient-to-r from-blue-400 via-amber-300 to-amber-400 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.4)]"></div>
                        <div className="absolute top-[42px] left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-900 border-2 border-blue-400 flex items-center justify-center shadow-[0_0_12px_rgba(59,130,246,0.5)]">
                          <Scale className="w-3 h-3 text-blue-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Vertical Feature List */}
              <div className="lg:col-span-3 flex flex-col gap-3 pt-8">
                {[
                  { icon: Sparkles, label: 'AI Analysis' },
                  { icon: Users, label: 'Human Deliberation' },
                  { icon: Shield, label: 'Blockchain Security' },
                  { icon: FileCheck, label: 'Verifiable Records' },
                  { icon: Globe, label: 'Accessible to All' },
                ].map((f, idx) => {
                  const Icon = f.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-blue-500/30 hover:bg-white/[0.05] transition-all group cursor-default"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-600/30 transition-colors shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[13px] font-semibold text-slate-200 group-hover:text-white transition-colors">{f.label}</span>
                    </div>
                  );
                })}

                <div className="mt-2 p-4 rounded-xl bg-slate-950/60 border border-blue-500/15 text-[12px] text-slate-300 leading-relaxed italic">
                  &ldquo;Resolvia bridges technology and human judgment to make justice more accessible.&rdquo;
                </div>
              </div>
            </div>

            {/* ═══════════════ 5 VALUE CARDS & STATS STRIP ═══════════════ */}
            <div className="max-w-[1400px] mx-auto mt-10 pt-8 border-t border-white/[0.06] grid grid-cols-1 lg:grid-cols-12 gap-5 pb-12">
              <div className="lg:col-span-7 grid grid-cols-5 gap-3">
                {[
                  {
                    icon: Activity,
                    title: 'AI-Assisted Analysis',
                    desc: 'Objective insights from evidence',
                  },
                  {
                    icon: Users,
                    title: 'Decentralized Jury',
                    desc: 'Fair & unbiased deliberation',
                  },
                  {
                    icon: Database,
                    title: 'Blockchain Records',
                    desc: 'Immutable & tamper-proof',
                  },
                  {
                    icon: Shield,
                    title: 'Secure Evidence',
                    desc: 'Encrypted & verifiable',
                  },
                  {
                    icon: Globe,
                    title: 'Accessible to All',
                    desc: 'Fast, affordable and online',
                  },
                ].map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={idx}
                      className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-blue-500/25 hover:bg-white/[0.05] transition-all group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3 group-hover:bg-blue-600/25 transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className="text-[11px] font-bold text-white leading-tight mb-1">
                        {card.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-snug">
                        {card.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="lg:col-span-5 grid grid-cols-4 gap-1 items-center bg-white/[0.02] border border-white/[0.06] px-4 py-5 rounded-2xl">
                <div className="text-center">
                  <p className="text-2xl font-black text-blue-400 font-mono tracking-tight">100+</p>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold mt-1 leading-tight">Disputes<br />Resolved</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-amber-400 font-mono tracking-tight">4.8/5</p>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold mt-1 leading-tight">User Trust<br />Rating</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-purple-400 font-mono tracking-tight">10+</p>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold mt-1 leading-tight">Categories<br />Supported</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-emerald-400 font-mono tracking-tight">50+</p>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold mt-1 leading-tight">Active<br />Community</p>
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════════ LOWER WHITE SECTION ═══════════════ */}
          <section className="bg-[#f8fafc] text-slate-900 py-16 px-6 border-t border-slate-200">
            <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left: HOW RESOLVIA WORKS */}
              <div id="how-it-works" className="lg:col-span-6 space-y-6">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 block">
                    HOW RESOLVIA WORKS
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2 leading-tight">
                    From Dispute to Resolution — In a Few Steps
                  </h2>
                  <p className="text-sm text-slate-500 mt-2">
                    A simple, transparent, and structured process for everyone.
                  </p>
                </div>

                {/* 5-Step Horizontal Row with Arrows */}
                <div className="flex items-start gap-0 pt-2">
                  {[
                    {
                      step: '1',
                      icon: FileText,
                      title: 'Create Case',
                      desc: 'Submit your dispute with details and evidence.',
                      color: 'bg-purple-600',
                    },
                    {
                      step: '2',
                      icon: Sparkles,
                      title: 'AI Analysis',
                      desc: 'AI analyzes the evidence and provides an initial assessment.',
                      color: 'bg-blue-600',
                    },
                    {
                      step: '3',
                      icon: Users,
                      title: 'Jury Deliberation',
                      desc: 'A decentralized jury reviews the case and casts their votes.',
                      color: 'bg-purple-600',
                    },
                    {
                      step: '4',
                      icon: Gavel,
                      title: 'Final Verdict',
                      desc: 'Get a transparent decision with a verifiable record.',
                      color: 'bg-purple-600',
                    },
                    {
                      step: '5',
                      icon: FileCheck,
                      title: 'Case Record',
                      desc: 'A complete report is generated and stored on blockchain.',
                      color: 'bg-purple-600',
                    },
                  ].map((s, idx) => {
                    const Icon = s.icon;
                    return (
                      <React.Fragment key={s.step}>
                        <div className="flex-1 p-3 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2 text-center hover:border-blue-400 hover:shadow-md transition-all min-w-0">
                          <div className="flex flex-col items-center gap-1.5">
                            <div className={`w-6 h-6 rounded-full ${s.color} text-white text-[10px] font-bold flex items-center justify-center shadow-sm`}>
                              {s.step}
                            </div>
                            <Icon className="w-5 h-5 text-slate-500" />
                            <h4 className="text-[11px] font-bold text-slate-900 leading-tight">{s.title}</h4>
                          </div>
                          <p className="text-[9px] text-slate-500 leading-snug">
                            {s.desc}
                          </p>
                        </div>
                        {idx < 4 && (
                          <div className="flex items-center px-1 pt-8 text-slate-300 shrink-0">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setSignInModalOpen(true)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 active:scale-[0.98]"
                  >
                    <span>Explore the Process</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Right: DISPUTE CATEGORIES */}
              <div id="categories" className="lg:col-span-6 space-y-5">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 block">
                      DISPUTE CATEGORIES
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2 leading-tight">
                      Resolve a Wide Range of Disputes
                    </h2>
                    <p className="text-sm text-slate-500 mt-2">
                      From academic conflicts to professional disagreements, Resolvia supports diverse use cases.
                    </p>
                  </div>
                  <button
                    onClick={() => setSignInModalOpen(true)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    View All <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* 3x2 Category Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      icon: GraduationCap,
                      title: 'Academic Disputes',
                      desc: 'Attendance, grading, plagiarism, etc.',
                      color: 'text-purple-600 bg-purple-50',
                    },
                    {
                      icon: Briefcase,
                      title: 'Professional Disputes',
                      desc: 'Workplace conflicts, contract issues, etc.',
                      color: 'text-blue-600 bg-blue-50',
                    },
                    {
                      icon: Building2,
                      title: 'Community Disputes',
                      desc: 'Society, housing, local issues, etc.',
                      color: 'text-indigo-600 bg-indigo-50',
                    },
                    {
                      icon: ShoppingCart,
                      title: 'E-commerce Disputes',
                      desc: 'Buyer-seller disagreements, refunds, etc.',
                      color: 'text-emerald-600 bg-emerald-50',
                    },
                    {
                      icon: Laptop,
                      title: 'Freelance Disputes',
                      desc: 'Payments, deliverables, project issues, etc.',
                      color: 'text-purple-600 bg-purple-50',
                    },
                    {
                      icon: MoreHorizontal,
                      title: 'Other Disputes',
                      desc: 'Any legitimate dispute with evidence.',
                      color: 'text-blue-600 bg-blue-50',
                    },
                  ].map((cat, idx) => {
                    const Icon = cat.icon;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSignInModalOpen(true)}
                        className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex items-start gap-3 group"
                      >
                        <div className={`w-10 h-10 rounded-xl ${cat.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[12px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                            {cat.title}
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                            {cat.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="bg-white text-slate-900 border-t border-slate-200 py-6 px-6">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm block leading-tight">Resolvia</span>
              <span className="text-[10px] text-slate-400 block">People. Evidence. Fair Resolution.</span>
            </div>
          </div>

          {/* Center Links */}
          <div className="flex items-center gap-6 font-semibold text-slate-500">
            <button
              onClick={() => handleNavClick('home')}
              className={`hover:text-blue-600 cursor-pointer transition-colors ${activePublicTab === 'home' ? 'text-blue-600 font-bold' : ''}`}
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('about')}
              className={`hover:text-blue-600 cursor-pointer transition-colors ${activePublicTab === 'about' ? 'text-blue-600 font-bold' : ''}`}
            >
              About
            </button>
            <button
              onClick={() => handleNavClick('how-it-works')}
              className={`hover:text-blue-600 cursor-pointer transition-colors ${activePublicTab === 'how-it-works' ? 'text-blue-600 font-bold' : ''}`}
            >
              How It Works
            </button>
            <button
              onClick={() => handleNavClick('categories')}
              className={`hover:text-blue-600 cursor-pointer transition-colors ${activePublicTab === 'categories' ? 'text-blue-600 font-bold' : ''}`}
            >
              Case Studies
            </button>
            <button
              onClick={() => handleNavClick('resources')}
              className={`hover:text-blue-600 cursor-pointer transition-colors ${activePublicTab === 'resources' ? 'text-blue-600 font-bold' : ''}`}
            >
              Resources
            </button>
            <button
              onClick={() => handleNavClick('contact')}
              className={`hover:text-blue-600 cursor-pointer transition-colors ${activePublicTab === 'contact' ? 'text-blue-600 font-bold' : ''}`}
            >
              Contact
            </button>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-3">
            <a href="#" className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-blue-50 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors">
              <GithubIcon />
            </a>
            <a href="#" className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-blue-50 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors">
              <LinkedinIcon />
            </a>
            <a href="#" className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-blue-50 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors">
              <TwitterIcon />
            </a>
            <a href="#" className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-blue-50 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors">
              <YoutubeIcon />
            </a>
          </div>

          {/* Copyright */}
          <div className="text-center md:text-right text-[11px]">
            <p>© 2025 Resolvia. All rights reserved.</p>
            <p className="font-semibold text-slate-400">Justice Reimagined.</p>
          </div>
        </div>
      </footer>

      {/* ═══════════════ SIGN IN / ONBOARDING MODAL ═══════════════ */}
      <SignInModal
        isOpen={signInModalOpen}
        onClose={() => setSignInModalOpen(false)}
        onSignIn={(role) => handleSignIn(role)}
        currentRole="CLAIMANT"
      />

      {/* ═══════════════ DEMO MODAL ═══════════════ */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700 p-6 space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Play className="w-4 h-4 text-blue-400" />
                <span>Resolvia Platform Walkthrough</span>
              </h3>
              <button
                onClick={() => setDemoModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Watch how automated AI evidence parsing, blind commit-reveal jury deliberation, and BSA 2023 tamper-proof legal certificates come together for dispute resolution.
            </p>
            <div className="aspect-video rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-center p-4">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                </div>
                <p className="text-xs font-bold text-white">Interactive Mode Active</p>
                <p className="text-[10px] text-slate-400">Click below to enter the live interactive console dashboard directly.</p>
              </div>
            </div>
            <button
              onClick={() => {
                setDemoModalOpen(false);
                setSignInModalOpen(true);
              }}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all"
            >
              Enter Live Dashboard Console →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
