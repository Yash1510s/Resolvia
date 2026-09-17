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
} from 'lucide-react';
import { useApp } from '../lib/app-context';
import { useAuth } from '../lib/auth-context';
import type { MyCaseRole } from '../types';

const ROLES: { id: MyCaseRole; label: string; desc: string }[] = [
  { id: 'CLAIMANT', label: 'Claimant', desc: 'File & track claims' },
  { id: 'RESPONDENT', label: 'Respondent', desc: 'Answer disputes' },
  { id: 'JUROR', label: 'Juror', desc: 'Serve on panels' },
];

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
  const { activeRole, setActiveRole, unreadCount, invitations, profilePrefs, rslvBalance, claimFaucet, isLoggedIn, logout: demoLogout } = useApp();
  const { user: authUser, logout: authLogout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [q, setQ] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const pendingInvites = invitations.filter((i) => i.status === 'PENDING').length;

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
    if (key === 'messages') return unreadCount;
    if (key === 'jury') return pendingInvites;
    return 0;
  };

  const demoRoleLabel = activeRole === 'CLAIMANT' ? 'Claimant' : activeRole === 'RESPONDENT' ? 'Respondent' : 'Juror';
  const displayName = authUser ? authUser.name : isLoggedIn ? `Demo ${demoRoleLabel}` : 'Guest User';
  const displayRole = authUser
    ? profilePrefs.roleType === 'PROFESSIONAL'
      ? 'Professional'
      : profilePrefs.roleType === 'INSTITUTION'
      ? 'Institution'
      : 'Member'
    : isLoggedIn
    ? 'Demo persona'
    : 'Not signed in';
  const walletShort = authUser ? `${authUser.wallet.slice(0, 6)}…${authUser.wallet.slice(-4)}` : null;

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

  return (
    <div className="min-h-screen bg-[#eef1f6] flex flex-col">
      {/* ── Top bar ── */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-3 sm:px-5 sticky top-0 z-40">
        <button className="lg:hidden p-2 -ml-1 text-slate-500" onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex-1 max-w-xl flex items-center gap-2.5 bg-slate-100 hover:bg-slate-200/70 rounded-xl px-3.5 py-2.5 cursor-text transition-colors">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            ref={searchRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={doSearch}
            placeholder="Search cases, users, categories…"
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-slate-400 text-slate-700"
          />
          <kbd className="hidden sm:block text-[10px] font-bold text-slate-400 bg-white border border-slate-200 rounded-md px-1.5 py-0.5">Ctrl K</kbd>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
          {/* RSLV balance */}
          <div className="hidden md:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-xl text-[11px] font-bold">
            <span>{rslvBalance.toFixed(0)} RSLV</span>
            <button onClick={claimFaucet} className="bg-emerald-500 hover:bg-emerald-400 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black leading-none" title="Claim testnet RSLV (faucet)">
              +
            </button>
          </div>

          <Link href="/messages" className="relative w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors" title="Messages">
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>

          {/* Wallet chip */}
          {authUser && walletShort ? (
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl pl-1.5 pr-2.5 py-1.5" title={`Assigned wallet ${authUser.wallet}`}>
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="leading-tight">
                <p className="text-[11px] font-bold text-slate-700 font-mono">{walletShort}</p>
                <p className="text-[9px] font-bold text-emerald-600">Connected</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          ) : !isLoggedIn ? (
            <button onClick={() => router.push('/login')} className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors">
              <Wallet className="w-4 h-4" />
              Sign in
            </button>
          ) : (
            <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 text-[11px] font-bold">
              Demo session · {demoRoleLabel}
            </span>
          )}

          {/* User chip */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 pl-1.5 pr-2 py-1 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <p className="text-[12px] font-bold text-slate-800">{displayName}</p>
                <p className="text-[10px] text-slate-500">{displayRole}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800">{displayName}</p>
                  <p className="text-[11px] text-slate-500">{authUser ? `Signed in via ${authUser.provider} · ${walletShort}` : 'Sign in to link your on-chain identity'}</p>
                </div>
                <p className="px-4 pt-2 pb-1 text-[9px] font-black uppercase tracking-widest text-slate-400">Viewing as (demo)</p>
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setActiveRole(r.id);
                      setUserMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors ${activeRole === r.id ? 'bg-violet-50 text-violet-700' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    {r.label}
                    <span className="block text-[10px] font-normal text-slate-400">{r.desc}</span>
                  </button>
                ))}
                <div className="mt-1 pt-2 border-t border-slate-100 space-y-0.5">
                  <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <User className="w-4 h-4 text-slate-400" /> Profile
                  </Link>
                  <Link href="/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <Settings className="w-4 h-4 text-slate-400" /> Settings
                  </Link>
                  {authUser && (
                    <button
                      onClick={() => {
                        authLogout();
                        demoLogout();
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
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
            <p className="text-[11px] text-slate-400">© 2026 Resolvia. Justice Reimagined. <span className="hidden md:inline">(Testnet prototype)</span></p>
          </footer>
        </main>
      </div>
    </div>
  );
}
