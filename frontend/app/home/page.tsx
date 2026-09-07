'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scale, ArrowRight, BookOpen } from 'lucide-react';
import { AuthProvider, useAuth } from '../lib/auth-context';
import { useApp } from '../lib/app-context';
import { LandingPage } from '../components/LandingPage';
import { AuthModal } from '../components/AuthModal';
import { UserRole } from '../types';

function PublicLanding() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  // ?signin=1 → open the sign-in modal (used by the app-shell "Sign in" link)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('signin=1') && !authUser) {
      setAuthOpen(true);
      window.history.replaceState(null, '', '/home');
    }
  }, [authUser]);

  const getStarted = () => {
    // Demo-first: enter the app straight away (demo identity). Real sign-in stays available in the top bar.
    if (authUser) router.push('/dashboard');
    else router.push('/dashboard?persona=CLAIMANT');
  };

  const watchDemo = () => {
    router.push('/cases/case-084');
  };

  const openWizard = () => {
    if (authUser) router.push('/create');
    else setAuthOpen(true);
  };

  const enterAs = (role: UserRole) => {
    // Demo persona entry for journey exploration (clearly a demo path)
    const map: Record<string, 'CLAIMANT' | 'RESPONDENT' | 'JUROR'> = {
      CLAIMANT: 'CLAIMANT',
      RESPONDENT: 'RESPONDENT',
      JUROR_1: 'JUROR',
      JUROR_2: 'JUROR',
      LEGAL_AUDITOR: 'JUROR',
      ADMIN: 'JUROR',
    };
    router.push(`/dashboard?persona=${map[role] || 'CLAIMANT'}`);
  };

  return (
    <div className="min-h-screen bg-[#0b132b] flex flex-col">
      {/* Public top bar */}
      <nav className="w-full px-4 sm:px-6 lg:px-12 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">Resolvia</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/about')} className="hidden sm:flex px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            About
          </button>
          <button
            onClick={() => router.push('/how-it-works')}
            className="hidden sm:flex px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            How It Works
          </button>
          <button
            onClick={() => router.push('/case-studies')}
            className="hidden sm:flex px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Case Studies
          </button>
          <button
            onClick={() => router.push('/resources')}
            className="hidden md:flex px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            Resources
          </button>
          {authUser ? (
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5"
            >
              Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Sign in
            </button>
          )}
        </div>
      </nav>

      <div id="how-it-works" className="flex-1">
        <LandingPage
          onGetStarted={getStarted}
          onOpenDashboard={() => router.push('/dashboard')}
          onOpenWizard={openWizard}
          onSignInRole={enterAs}
          onWatchDemo={watchDemo}
          isLoggedIn={!!authUser}
          onLogout={() => router.push('/home')}
        />
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}

export default function Home() {
  return <PublicLanding />;
}
