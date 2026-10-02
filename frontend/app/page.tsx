'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scale, ArrowRight, BookOpen, Shield, LogIn } from 'lucide-react';
import { useAuth } from './lib/auth-context';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { PublicNav } from './components/PublicNav';
import { LiveExampleModal } from './components/LiveExampleModal';

export default function Root() {
  const router = useRouter();
  const { user: authUser, logout: authLogout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  // ?signin=1 -> open sign-in modal
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('signin=1') && !authUser) {
      setAuthOpen(true);
      window.history.replaceState(null, '', '/');
    }
  }, [authUser]);

  const getStarted = () => {
    if (authUser) router.push('/dashboard');
    else router.push('/login');
  };

  const watchDemo = () => {
    setDemoOpen(true);
  };

  const openWizard = () => {
    if (authUser) router.push('/create');
    else router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#0b132b] flex flex-col">
      {/* Public top bar */}
      <PublicNav dark active="home" />

      <div id="how-it-works" className="flex-1">
        <LandingPage
          onGetStarted={getStarted}
          onOpenDashboard={() => router.push(authUser ? '/dashboard' : '/login?redirect=/dashboard')}
          onOpenWizard={openWizard}
          onWatchDemo={watchDemo}
          isLoggedIn={!!authUser}
          onLogout={() => {
            authLogout();
            router.push('/');
          }}
        />
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <LiveExampleModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
