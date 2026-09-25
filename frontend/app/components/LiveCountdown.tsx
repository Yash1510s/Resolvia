'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export interface CountdownState {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
  urgent: boolean; // < 6 hours remaining
  formatted: string;
  text: string;
}

/**
 * Hydration-safe live countdown hook that updates every 1000ms.
 */
export function useLiveCountdown(targetIsoOrMs?: string | number | null): CountdownState | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // Synchronize immediately on mount
    setNow(Date.now());
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!targetIsoOrMs || now === null) {
    return null;
  }

  const targetMs = typeof targetIsoOrMs === 'number' ? targetIsoOrMs : new Date(targetIsoOrMs).getTime();
  if (isNaN(targetMs)) return null;

  const diff = targetMs - now;
  if (diff <= 0) {
    return {
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: true,
      urgent: false,
      formatted: 'Voting closed',
      text: 'Voting closed',
    };
  }

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);

  const pad = (n: number) => String(n).padStart(2, '0');
  const formatted = days > 0
    ? `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`
    : `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;

  return {
    totalMs: diff,
    days,
    hours,
    minutes,
    seconds,
    expired: false,
    urgent: diff < 6 * 3_600_000,
    formatted,
    text: formatted,
  };
}

export interface LiveCountdownProps {
  target?: string | number | null;
  deadline?: string | number | null;
  className?: string;
  compact?: boolean;
}

/**
 * High-performance digital countdown card with active pulse indicator.
 */
export function LiveCountdownDisplay({
  target,
  className = '',
  compact = false,
}: {
  target?: string | number | null;
  className?: string;
  compact?: boolean;
}) {
  const countdown = useLiveCountdown(target);

  if (!target) return null;

  // Initial SSR fallback placeholder before mount
  if (!countdown) {
    if (compact) {
      return (
        <div className={`inline-flex items-center gap-2 font-mono text-[13px] font-bold text-slate-800 ${className}`}>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>--:--:--</span>
        </div>
      );
    }
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Live Consensus Window</span>
        </div>
        <div className="flex items-baseline gap-1 font-mono">
          <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-lg sm:text-xl font-black tracking-wider shadow-inner border border-slate-800">
            <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>--h --m --s</span>
          </div>
        </div>
      </div>
    );
  }

  if (countdown.expired) {
    return (
      <div className={`inline-flex items-center gap-1.5 text-rose-600 font-bold ${className}`}>
        <span className="w-2 h-2 rounded-full bg-rose-500" />
        <span>Voting Window Closed</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 font-mono text-[13px] font-bold ${countdown.urgent ? 'text-amber-600' : 'text-slate-800'} ${className}`}>
        <span className={`w-2 h-2 rounded-full ${countdown.urgent ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
        <span>{countdown.formatted}</span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${countdown.urgent ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
          {countdown.urgent ? 'Expiring Soon' : 'Live Consensus Window'}
        </span>
      </div>
      <div className="flex items-baseline gap-1 font-mono">
        <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-lg sm:text-xl font-black tracking-wider shadow-inner border border-slate-800">
          <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{countdown.formatted}</span>
        </div>
      </div>
    </div>
  );
}

export function LiveCountdown({ target, deadline, className, compact }: LiveCountdownProps) {
  return <LiveCountdownDisplay target={target ?? deadline} className={className} compact={compact} />;
}
