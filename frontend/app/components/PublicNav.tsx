'use client';

import React from 'react';
import Link from 'next/link';
import { Scale, ArrowRight } from 'lucide-react';

import { useAuth } from '../lib/auth-context';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/case-studies', label: 'Case Studies' },
  { href: '/proof-verifier', label: 'Proof Verifier' },
  { href: '/resources', label: 'Resources' },
];

export function PublicNav({ active, dark = false }: { active?: string; dark?: boolean }) {
  const { user: authUser } = useAuth();

  return (
    <nav className={`w-full px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between border-b ${dark ? 'bg-[#0b132b] border-white/5' : 'bg-white border-slate-200'} sticky top-0 z-30`}>
      <Link href="/" className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
          <Scale className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className={`text-[15px] font-black tracking-tight leading-none ${dark ? 'text-white' : 'text-slate-900'}`}>Resolvia</p>
          <p className={`text-[8.5px] mt-0.5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>People. Evidence. Fair Resolution.</p>
        </div>
      </Link>
      <div className="flex items-center gap-1">
        {LINKS.map((l) => {
          const pathKey = l.href === '/' ? 'home' : l.href.slice(1);
          const isActive = active === pathKey || (l.href === '/' && (active === 'home' || !active));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`hidden sm:flex px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? dark ? 'bg-white/10 text-white' : 'bg-violet-50 text-violet-700'
                  : dark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {l.label}
            </Link>
          );
        })}
        {authUser ? (
          <Link
            href="/dashboard"
            className="ml-2 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-sm shadow-violet-900/30"
          >
            Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <div className="flex items-center gap-2 ml-2">
            <Link
              href="/login"
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${dark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'}`}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-sm shadow-violet-900/30"
            >
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
