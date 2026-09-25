'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

/** Short case id: "case-0765" → "#0765". */
export function shortCaseId(id: string): string {
  const m = id.match(/(\d{3,})$/);
  return '#' + (m ? m[1] : id);
}

export function fmtDate(iso?: string, withTime = false): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  if (!withTime) return date;
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time}`;
}

export function timeLeft(iso?: string): { text: string; urgent: boolean } | null {
  if (!iso) return null;
  const d = new Date(iso);
  const diff = d.getTime() - Date.now();
  if (isNaN(d.getTime())) return null;
  if (diff <= 0) return { text: 'Passed', urgent: false };
  const hrs = Math.floor(diff / 3_600_000);
  if (hrs >= 48) return { text: `${Math.floor(hrs / 24)}d left`, urgent: false };
  const mins = Math.floor(diff / 60_000);
  return { text: hrs > 0 ? `${hrs}h ${mins % 60}m left` : `${mins}m left`, urgent: hrs < 6 };
}

const TONES: Record<string, string> = {
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  teal: 'bg-teal-50 text-teal-700 border-teal-200',
};

export type Tone = keyof typeof TONES;

export function Chip({ tone = 'slate', children, dot = false, className = '' }: { tone?: Tone; children: React.ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${TONES[tone]} ${className}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function statusTone(status: string): Tone {
  switch (status) {
    case 'SUBMITTED':
    case 'RESPONDENT_WINDOW':
      return 'blue';
    case 'EVIDENCE_LOCKED':
    case 'AI_ANALYSIS':
      return 'amber';
    case 'JURY_COMMIT':
    case 'JURY_REVEAL':
    case 'APPEAL_WINDOW':
      return 'violet';
    case 'VERDICT':
    case 'FINALIZED':
    case 'CLOSED':
      return 'green';
    default:
      return 'slate';
  }
}

export const CATEGORY_LABELS: Record<string, { label: string; tone: Tone }> = {
  FINANCIAL_PAYMENT: { label: 'Financial / Payment', tone: 'blue' },
  ECOMMERCE_MARKETPLACE: { label: 'E-commerce', tone: 'teal' },
  CONTRACT_OBLIGATION: { label: 'Contract', tone: 'indigo' },
  BUSINESS_PEER: { label: 'Business / Peer', tone: 'orange' },
  PROPERTY_SERVICE: { label: 'Property / Service', tone: 'slate' },
  DIGITAL_PLATFORM: { label: 'Digital Platform', tone: 'indigo' },
  GENERAL_EVIDENCE: { label: 'General Evidence', tone: 'slate' },
  FREELANCE_DEV: { label: 'Freelance / Dev', tone: 'teal' },
  MARKETPLACE: { label: 'Marketplace', tone: 'teal' },
  DAO_GOVERNANCE: { label: 'DAO Governance', tone: 'indigo' },
  IP_ACADEMIC: { label: 'IP / Academic', tone: 'violet' },
  SERVICE_SLA: { label: 'Service / SLA', tone: 'orange' },
  CAMPUS_LIFE: { label: 'Campus Life', tone: 'amber' },
  ACADEMIC: { label: 'Academic', tone: 'violet' },
  COMMUNITY: { label: 'Community', tone: 'green' },
};

export function categoryLabel(cat: string): { label: string; tone: Tone } {
  return CATEGORY_LABELS[cat] || { label: cat.replace(/_/g, ' '), tone: 'slate' as Tone };
}

export function Card({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${onClick ? 'cursor-pointer hover:border-violet-300 transition-colors' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHead({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-[13px] text-slate-500 mt-1 max-w-2xl">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function SectionHead({ title, action }: { title: string; action?: { label: string; href?: string; onClick?: () => void } }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[15px] font-black text-slate-900">{title}</h2>
      {action &&
        (action.href ? (
          <Link href={action.href} className="flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:text-violet-700">
            {action.label} <ArrowRight className="w-3 h-3" />
          </Link>
        ) : (
          <button onClick={action.onClick} className="flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:text-violet-700">
            {action.label} <ArrowRight className="w-3 h-3" />
          </button>
        ))}
    </div>
  );
}

/** SVG progress ring for reputation / XP. */
export function Ring({ value, max, size = 116, stroke = 10, label, sub }: { value: number; max: number; size?: number; stroke?: number; label: string; sub?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / max);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#ringGrad)" strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-slate-900 leading-none">{value}</span>
        <span className="text-[10px] font-semibold text-slate-400 mt-0.5">/ {max.toLocaleString()} XP</span>
        {label && <span className="text-[10px] font-black text-violet-600 mt-1">{label}</span>}
        {sub && <span className="text-[9px] text-slate-400 text-center px-3 leading-tight">{sub}</span>}
      </div>
    </div>
  );
}

export function Toggle({ on, onChange, disabled = false }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${on ? 'bg-violet-600' : 'bg-slate-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-pressed={on}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeMap = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4.5 h-4.5',
    lg: 'w-6 h-6',
  };
  return (
    <svg
      className={`animate-spin text-current ${sizeMap[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200/80 rounded-xl ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-16 h-5 rounded-full" />
      </div>
      <Skeleton className="w-3/4 h-5" />
      <Skeleton className="w-full h-3" />
      <Skeleton className="w-1/2 h-3" />
      <div className="pt-2 flex items-center justify-between border-t border-slate-100">
        <Skeleton className="w-20 h-4" />
        <Skeleton className="w-28 h-8 rounded-xl" />
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center space-y-4 shadow-xs">
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
          {icon}
        </div>
      )}
      <div className="max-w-md mx-auto">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}

export function BtnPrimary({
  children,
  onClick,
  href,
  className = '',
  disabled = false,
  loading = false,
  loadingText,
  type,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  type?: 'button' | 'submit';
}) {
  const cls = `inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${className}`;
  if (href && !disabled && !loading) return <Link href={href} className={cls}>{children}</Link>;
  return (
    <button
      type={type || 'button'}
      onClick={onClick}
      disabled={disabled || loading}
      className={cls}
    >
      {loading ? (
        <>
          <Spinner size="sm" />
          <span>{loadingText || 'Processing…'}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function BtnGhost({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold transition-all ${className}`}>
      {children}
    </button>
  );
}

export function ComingSoon({ text = 'Protocol Roadmap' }: { text?: string }) {
  return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-bold">{text}</span>;
}

export function ExternalIcon() {
  return <ArrowUpRight className="w-3 h-3" />;
}
