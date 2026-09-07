'use client';

import React from 'react';
import Link from 'next/link';
import { Scale, ArrowRight } from 'lucide-react';

const LINKS = [
  { href: '/home', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/case-studies', label: 'Case Studies' },
  { href: '/resources', label: 'Resources' },
];

export function PublicNav({ active, dark = false }: { active?: string; dark?: boolean }) {
  return (
    <nav className={`w-full px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between border-b ${dark ? 'bg-[#0b132b] border-white/5' : 'bg-white border-slate-200'}`}>
      <Link href="/home" className="flex items-center gap-2.5">
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
          const isActive = active === l.href.slice(1) || (l.href === '/home' && !active);
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
        <Link
          href="/home?signin=1"
          className="ml-2 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-sm"
        >
          Get Started <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </nav>
  );
}
