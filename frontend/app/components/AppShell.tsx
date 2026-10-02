'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Scale,
  Home,
  FileText,
  FilePlus,
  Users,
  BookOpen,
  MessageSquare,
  ShieldCheck,
  Library,
  User,
  Settings,
  Bell,
  ChevronDown,
  Wallet,
  LogOut,
  Shield,
  Gavel,
  Search,
  Menu,
  X,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useApp } from '../lib/app-context';
import { useAuth } from '../lib/auth-context';
import { PublicNav } from './PublicNav';
import { AmbientBackground } from './AmbientBackground';
import { ProfileCustomizerModal } from './ProfileCustomizerModal';
import { NameSetupModal } from './NameSetupModal';
import { WalletModal } from './WalletModal';
import type { MyCaseRole } from '../types';


const NAV: { href: string; label: string; icon: React.ReactNode; badgeKey?: 'messages' | 'jury' }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <Home className="w-[18px] h-[18px]" /> },
  { href: '/cases', label: 'My Cases', icon: <FileText className="w-[18px] h-[18px]" /> },
  { href: '/create', label: 'Create Case', icon: <FilePlus className="w-[18px] h-[18px]" /> },
  { href: '/jury', label: 'Jury Panel', icon: <Users className="w-[18px] h-[18px]" />, badgeKey: 'jury' },
  { href: '/case-studies', label: 'Case Studies', icon: <BookOpen className="w-[18px] h-[18px]" /> },
  { href: '/messages', label: 'Messages', icon: <MessageSquare className="w-[18px] h-[18px]" />, badgeKey: 'messages' },
  { href: '/reputation', label: 'Reputation', icon: <ShieldCheck className="w-[18px] h-[18px]" /> },
  { href: '/resources', label: 'Resources', icon: <Library className="w-[18px] h-[18px]" /> },
  { href: '/profile', label: 'Profile', icon: <User className="w-[18px] h-[18px]" /> },
  { href: '/settings', label: 'Settings', icon: <Settings className="w-[18px] h-[18px]" /> },
];

const SIDE_QUOTES: Record<string, string> = {
  dashboard: '"A fairer tomorrow is a collective effort."',
  cases: '"Fair processes build stronger communities."',
  create: '"Every dispute deserves a fair hearing."',
  jury: '"Justice is not a spectator sport."',
  'case-studies': '"Real cases. Real learnings. A fairer tomorrow."',
  messages: '"Different people. Shared fairness. Stronger outcomes."',
  reputation: '"Reputation is earned, not given."',
  resources: '"Knowledge is the foundation of fairness."',
  profile: '"Your contributions shape the community."',
  settings: '"Better systems create fairer people."',
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { identity, activeRole, setActiveRole, unreadCount, invitations, profilePrefs, rslvBalance, claimFaucet, isLoggedIn, logout: demoLogout } = useApp();
  const { user: authUser, loading: authLoading, logout: authLogout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [q, setQ] = useState('');
  const [mounted, setMounted] = useState(false);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [localName, setLocalName] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const pendingInvites = invitations.filter((i) => i.status === 'PENDING').length;

  useEffect(() => {
    setMounted(true);
    setCustomAvatar(localStorage.getItem('resolvia_custom_avatar'));
    setLocalName(localStorage.getItem('resolvia_user_name'));
  }, []);

  // Global Ctrl/Cmd+K focuses the search box (the hint in the input is real).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const section = '/' + (pathname.split('/')[1] || 'dashboard');
  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  const doSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = q.trim();
      router.push(query ? `/cases?search=${encodeURIComponent(query)}` : '/cases');
    }
  };

  const badgeFor = (key?: 'messages' | 'jury') => {
    if (!mounted) return 0;
    if (key === 'messages') return unreadCount;
    if (key === 'jury') return pendingInvites;
    return 0;
  };

  const displayName =
    authUser?.name ||
    localName ||
    (isLoggedIn && authUser ? identity.name : 'Guest User');
  const displayRole = authUser
    ? profilePrefs.roleType === 'PROFESSIONAL'
      ? 'Arbitration Professional'
      : profilePrefs.roleType === 'INSTITUTION'
      ? 'Institutional Member'
      : 'Verified Member'
    : 'Not signed in';
  const isMetaMaskLinked = Boolean(authUser?.metamaskAddress);
  const activeWalletAddress = authUser?.metamaskAddress || authUser?.wallet || null;
  const walletShort = activeWalletAddress
    ? `${activeWalletAddress.slice(0, 6)}…${activeWalletAddress.slice(-4)}`
    : null;

  const navItems = (
    <nav className="space-y-1">
      {NAV.map((n) => {
        const active = isActive(n.href);
        const badge = badgeFor(n.badgeKey);
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={() => setMobileNavOpen(false)}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
              active
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className={active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}>{n.icon}</span>
            <span className="flex-1">{n.label}</span>
            {badge > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                {badge}
              </span>
            )}
          </Link>
        );
      })}

      <p className="px-3.5 pt-4 pb-1 text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">Tools</p>
      {[
        { href: '/proof-verifier', label: 'Proof Verifier', icon: <Shield className="w-[18px] h-[18px]" /> },
        { href: '/protocol', label: 'On-Chain Protocol', icon: <Gavel className="w-[18px] h-[18px]" /> },
      ].map((n) => {
        const active = isActive(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={() => setMobileNavOpen(false)}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
              active
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{n.icon}</span>
            <span className="flex-1">{n.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const isPublicStandalone =
    pathname === '/proof-verifier' ||
    pathname === '/protocol' ||
    pathname === '/resources' ||
    pathname.startsWith('/case-studies');

  useEffect(() => {
    if (!authLoading && !authUser && !isPublicStandalone) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [authLoading, authUser, isPublicStandalone, pathname, router]);

  if (authLoading && !isPublicStandalone) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-3 border-violet-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Verifying session…</p>
        <p className="text-xs text-slate-400 mt-1">Please wait while we check your access</p>
      </div>
    );
  }

  if (!authUser && !isPublicStandalone) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] flex flex-col">
        <PublicNav active="home" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-5 shadow-lg shadow-violet-600/10">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Authentication Required</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            You must be signed in to access the Resolvia dashboard and dispute workspace.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <Link
              href={`/login?redirect=${encodeURIComponent(pathname)}`}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-violet-600/20"
            >
              Sign In to Continue
            </Link>
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!authUser && isPublicStandalone) {
    const activeKey = pathname.startsWith('/case-studies')
      ? 'case-studies'
      : pathname === '/proof-verifier'
      ? 'proof-verifier'
      : pathname === '/protocol'
      ? 'protocol'
      : 'resources';

    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col">
        <PublicNav active={activeKey} />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white px-4 sm:px-8 py-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-900/20">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-800 leading-none">Resolvia</p>
                <p className="text-[9px] text-slate-400 mt-0.5">People. Evidence. Fair Resolution.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-600">
              <Link href="/" className="hover:text-violet-600">Home</Link>
              <Link href="/about" className="hover:text-violet-600">About</Link>
              <Link href="/how-it-works" className="hover:text-violet-600">How It Works</Link>
              <Link href="/case-studies" className="hover:text-violet-600">Case Studies</Link>
              <Link href="/proof-verifier" className="hover:text-violet-600">Proof Verifier</Link>
              <Link href="/resources" className="hover:text-violet-600">Resources</Link>
              <Link href="/privacy" className="hover:text-violet-600">Privacy</Link>
              <Link href="/terms" className="hover:text-violet-600">Terms</Link>
            </div>
            <p className="text-[11px] text-slate-400">© 2026 Resolvia Protocol. All rights reserved.</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] flex flex-col relative text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <AmbientBackground />
      {/* ── Top bar ── */}
      <header className="h-14 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 flex items-center gap-3 px-3 sm:px-5 sticky top-0 z-40 text-slate-800 dark:text-slate-200 transition-colors">
        <button className="lg:hidden p-2 -ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-white" onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex-1 max-w-xl flex items-center gap-2.5 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200/70 dark:hover:bg-slate-800/90 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 cursor-text transition-colors">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            ref={searchRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={doSearch}
            placeholder="Search cases, users, categories…"
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100"
          />
          <kbd className="hidden sm:block text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-md px-1.5 py-0.5">Ctrl K</kbd>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
          {/* Live Node / Chain status indicator */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 text-[10px] font-bold text-slate-700 dark:text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>EVM Testnet Live</span>
          </div>

          {/* RSLV balance */}
          <div className="hidden md:flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-xl text-[11px] font-bold">
            <span>{mounted ? rslvBalance.toFixed(0) : '100'} RSLV</span>
            <button onClick={claimFaucet} className="bg-emerald-500 hover:bg-emerald-400 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black leading-none cursor-pointer" title="Claim testnet RSLV (faucet)">
              +
            </button>
          </div>

          <Link href="/messages" className="relative w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors" title="Messages">
            <Bell className="w-[18px] h-[18px]" />
            {mounted && unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>

          {/* Wallet / Sign in chip */}
          {mounted && authUser && walletShort ? (
            <button
              type="button"
              onClick={() => setWalletModalOpen(true)}
              className="hidden sm:flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-1.5 pr-2.5 py-1.5 transition-all cursor-pointer shadow-2xs group"
              title={
                isMetaMaskLinked
                  ? `MetaMask Connected: ${activeWalletAddress}. Click to manage.`
                  : `Custodial Key: ${activeWalletAddress}. Click to link your personal MetaMask wallet.`
              }
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-xs ${
                  isMetaMaskLinked
                    ? 'bg-gradient-to-tr from-amber-400 to-orange-500'
                    : 'bg-gradient-to-tr from-violet-500 to-indigo-600'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <div className="leading-tight text-left">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 font-mono group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  {walletShort}
                </p>
                <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {isMetaMaskLinked ? 'MetaMask' : 'Link Web3 Wallet'}
                </p>
              </div>
            </button>
          ) : (
            <button
              onClick={() => router.push(mounted && authUser ? '/settings' : '/login')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              Sign in
            </button>
          )}

          {/* Quick Customize Wallpaper Button */}
          <button
            onClick={() => setCustomizerOpen(true)}
            title="Customize Live Wallpaper & Avatar"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-bold transition-all border border-violet-200/60 dark:border-violet-800/40 cursor-pointer hidden md:flex"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 animate-pulse" />
            <span>Theme & Wallpaper</span>
          </button>

          {/* User chip */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 pl-1.5 pr-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div
                suppressHydrationWarning
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black overflow-hidden ring-2 ring-violet-500/20"
              >
                {mounted && (authUser?.avatarUrl || customAvatar) ? (
                  <img
                    src={authUser?.avatarUrl || customAvatar || ''}
                    alt={mounted ? displayName : 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span suppressHydrationWarning>
                    {mounted ? (displayName.charAt(0).toUpperCase() || 'U') : 'G'}
                  </span>
                )}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <p suppressHydrationWarning className="text-[12px] font-bold text-slate-900 dark:text-slate-100">
                  {mounted ? displayName : 'Guest User'}
                </p>
                <p suppressHydrationWarning className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  {mounted ? displayRole : 'Member'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/10 py-2 z-50 text-slate-200">
                <div className="px-4 py-2.5 border-b border-white/10">
                  <p suppressHydrationWarning className="text-xs font-bold text-white">
                    {mounted ? displayName : 'Guest User'}
                  </p>
                  <p suppressHydrationWarning className="text-[11px] text-slate-400 truncate">
                    {mounted && authUser
                      ? authUser.email?.endsWith('@wallet.resolvia.eth')
                        ? 'Web3 Connected · MetaMask'
                        : authUser.email
                      : 'Sign in to link your on-chain identity'}
                  </p>
                  {mounted && authUser && (
                    <p className="text-[10px] font-mono text-violet-400 mt-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Wallet: {walletShort}
                    </p>
                  )}
                </div>
                <div className="mt-1 pt-1 space-y-0.5">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      setCustomizerOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-violet-400 hover:bg-violet-950/40 cursor-pointer text-left transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-violet-400" /> Live Wallpaper & Avatar
                  </button>
                  <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 transition-colors">
                    <User className="w-4 h-4 text-slate-400" /> Profile
                  </Link>
                  <Link href="/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 transition-colors">
                    <Settings className="w-4 h-4 text-slate-400" /> Settings
                  </Link>
                  {authUser ? (
                    <button
                      onClick={() => {
                        authLogout();
                        demoLogout();
                        setUserMenuOpen(false);
                        router.push('/');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/30 cursor-pointer border-t border-white/10 mt-1 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        router.push('/login');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-violet-400 hover:bg-violet-950/30 cursor-pointer border-t border-white/10 mt-1 transition-colors"
                    >
                      <Wallet className="w-4 h-4" /> Sign in
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-[#0d1526] text-slate-300 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="px-5 pt-5 pb-4">
            <Link href="/dashboard" className="flex items-center gap-2.5" title="Back to dashboard">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-black text-[15px] leading-none tracking-tight">Resolvia</p>
                <p className="text-[9px] text-slate-500 mt-1">People. Evidence. Fair Resolution.</p>
              </div>
            </Link>
          </div>
          <div className="px-3.5 pb-4 flex-1">{navItems}</div>
          <div className="px-5 py-4 border-t border-white/5">
            <p className="text-[11px] italic text-slate-500 leading-relaxed">{SIDE_QUOTES[section] || '"Justice is a conversation."'}<span className="block not-italic text-slate-600 mt-1">— Resolvia</span></p>
            <div className="flex items-center gap-2 mt-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-semibold text-slate-500">All Systems Operational</span>
            </div>
          </div>
          <div className="px-5 py-4 border-t border-white/5 flex items-center gap-2.5">
            <Scale className="w-5 h-5 text-slate-500" />
            <div>
              <p className="text-white text-[12px] font-bold leading-none">Resolvia</p>
              <p className="text-[9px] text-slate-600 mt-0.5">People. Evidence. Fair Resolution.</p>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileNavOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileNavOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-64 bg-[#0d1526] text-slate-300 overflow-y-auto">
              <div className="flex items-center justify-between px-5 pt-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center">
                    <Scale className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-white font-black text-[15px]">Resolvia</p>
                </div>
                <button onClick={() => setMobileNavOpen(false)} className="p-2 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-3.5 py-4">{navItems}</div>
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 px-4 sm:px-6 lg:px-7 py-5 max-w-[1500px] w-full mx-auto">{children}</div>
          {/* Footer */}
          <footer className="border-t border-slate-200 bg-white px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-600">Resolvia</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] font-semibold text-slate-500">
              <Link href="/about" className="hover:text-violet-600">About</Link>
              <Link href="/case-studies" className="hover:text-violet-600">Case Studies</Link>
              <Link href="/resources" className="hover:text-violet-600">Resources</Link>
              <Link href="/how-it-works" className="hover:text-violet-600">How it works</Link>
              <Link href="/privacy" className="hover:text-violet-600">Privacy</Link>
              <Link href="/terms" className="hover:text-violet-600">Terms</Link>
            </div>
            <p className="text-[11px] text-slate-400">© 2026 Resolvia Protocol. Decentralized Justice Architecture. Mainnet-Ready Smart Contract Protocol.</p>
          </footer>
        </main>
      </div>
      <ProfileCustomizerModal open={customizerOpen} onClose={() => setCustomizerOpen(false)} />
      <NameSetupModal />
      <WalletModal open={walletModalOpen} onClose={() => setWalletModalOpen(false)} />
    </div>
  );
}
