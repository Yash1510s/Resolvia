'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Scale, ArrowLeft, Check } from 'lucide-react';

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.26 5.66.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .31.21.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

export class AuthErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: String(error) };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.warn('Auth ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl shadow-xl text-center space-y-4">
          <Scale className="w-10 h-10 text-violet-600 mx-auto" />
          <h3 className="text-lg font-black text-slate-900">Sign-in Ready</h3>
          <p className="text-xs text-slate-500">A browser script refreshed. Click below to continue securely.</p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Refresh Sign In
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function AuthLayout({
  children,
  back = '/',
  backLabel = 'Back to Home',
}: {
  children: React.ReactNode;
  back?: string;
  backLabel?: string;
}) {
  return (
    <div className="min-h-screen bg-[#0b132b] flex flex-col relative overflow-hidden">
      {/* Ambient glows + watermark */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 w-[480px] h-[480px] bg-violet-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 -left-40 w-[480px] h-[480px] bg-blue-600/10 rounded-full blur-3xl"></div>
        <Scale className="absolute -bottom-20 -left-12 w-[420px] h-[420px] text-white/[0.04]" />
      </div>

      <header className="relative z-10 w-full px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link href={back} className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[15px] font-black tracking-tight text-white leading-none">Resolvia</p>
            <p className="text-[8.5px] text-slate-500 mt-0.5">People. Evidence. Fair Resolution.</p>
          </div>
        </Link>
        <Link
          href={back}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {backLabel}
        </Link>
      </header>

      <main className="relative z-10 flex-1 px-4 sm:px-6 lg:px-10 py-8">
        <AuthErrorBoundary>{children}</AuthErrorBoundary>
      </main>

      <footer className="relative z-10 px-5 sm:px-8 py-5 border-t border-white/5 flex items-center justify-between">
        <p className="text-[10px] text-slate-600">AI output on Resolvia is advisory and non-binding. Verdicts are rendered by the human jury.</p>
        <p className="text-[10px] text-slate-600 hidden sm:block">Secure Access. Trusted Identities. A Fairer Tomorrow.</p>
      </footer>
    </div>
  );
}

/* ─────────────────────────── Split: brand left + card right ─────────────────────────── */

export function BrandBullets({ items }: { items: { icon: React.ReactNode; title: string; sub: string }[] }) {
  return (
    <div className="space-y-5 mt-7">
      {items.map((x) => (
        <div key={x.title} className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-violet-300 flex items-center justify-center shrink-0">
            {x.icon}
          </div>
          <div>
            <p className="text-[13px] font-bold text-white">{x.title}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{x.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function BrandQuote({ quote, by = '— Resolvia' }: { quote: string; by?: string }) {
  return (
    <div className="mt-10 max-w-xs">
      <p className="italic text-slate-400 text-[13px] leading-relaxed">&ldquo;{quote}&rdquo;</p>
      <p className="text-[10px] text-slate-500 mt-1.5">{by}</p>
    </div>
  );
}

export function Split({ brand, children }: { brand: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-10 items-start">
      <div className="hidden lg:block pt-4">{brand}</div>
      <div className="w-full">{children}</div>
    </div>
  );
}

export function AuthCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-7">
      <h2 className="text-xl font-black text-slate-900">{title}</h2>
      {sub && <p className="text-[12px] text-slate-500 mt-1">{sub}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

/* ─────────────────────────── Step indicator ─────────────────────────── */

export function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-start justify-center mb-6">
      {steps.map((s, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1.5 w-16">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-colors ${
                  done
                    ? 'bg-violet-600 border-violet-600 text-white'
                    : active
                    ? 'bg-white border-violet-600 text-violet-700'
                    : 'bg-white/5 border-white/15 text-slate-500'
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : n}
              </div>
              <span className={`text-[8.5px] font-bold text-center leading-tight ${active ? 'text-violet-300' : done ? 'text-slate-300' : 'text-slate-500'}`}>
                {s}
              </span>
            </div>
            {i < steps.length - 1 && <div className={`w-8 sm:w-12 h-0.5 mt-4 ${done ? 'bg-violet-500' : 'bg-white/10'}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─────────────────────────── OTP boxes ─────────────────────────── */

export function OtpBoxes({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          value={value[i] || ''}
          disabled={disabled}
          onChange={(e) => {
            const ch = e.target.value.replace(/\D/g, '').slice(-1);
            if (!ch) {
              // allow clearing
              const next = value.split('');
              next[i] = '';
              onChange(next.join(''));
              return;
            }
            const next = value.split('');
            next[i] = ch;
            onChange(next.join('').slice(0, 6));
          }}
          onPaste={(e) => {
            e.preventDefault();
            const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
            if (digits) onChange(digits);
          }}
          inputMode="numeric"
          aria-label={`Digit ${i + 1}`}
          className="w-11 sm:w-12 h-14 rounded-xl border-2 border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none text-center text-xl font-black text-slate-900 disabled:opacity-50"
        />
      ))}
    </div>
  );
}

/* ─────────────────────────── Google (GSI) hook ─────────────────────────── */

declare global {
  interface Window {
    google?: any;
  }
}

const DEFAULT_GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '538051232460-ivt400142se1n83599tlmjag2ftriaej.apps.googleusercontent.com';

const DEFAULT_GITHUB_CLIENT_ID =
  process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID ||
  'Ov23liGL2GL7JiMfD1kK';

export function useGoogle(onCredential: (c: string) => void) {
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;

  const clientId = DEFAULT_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || typeof window === 'undefined') return;
    let cancelled = false;

    const render = () => {
      if (!ref.current || cancelled || !window.google?.accounts?.id) return;
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (r: any) => onCredentialRef.current?.(r.credential),
        });
        if (ref.current) {
          ref.current.innerHTML = '';
        }
        window.google.accounts.id.renderButton(ref.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          width: 170,
        });
        if (!cancelled) setReady(true);
      } catch (err) {
        console.warn('Google GSI render error:', err);
      }
    };

    if (window.google?.accounts?.id) {
      render();
      return () => {
        cancelled = true;
      };
    }

    const existing = document.getElementById('google-gsi-client') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => {
        if (!cancelled) render();
      });
      return () => {
        cancelled = true;
      };
    }

    const s = document.createElement('script');
    s.id = 'google-gsi-client';
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => {
      if (!cancelled) render();
    };
    document.head.appendChild(s);

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  return { ref, ready, enabled: Boolean(clientId) };
}

/* ─────────────────────────── GitHub OAuth hook ─────────────────────────── */

export function useGitHub() {
  const clientId = DEFAULT_GITHUB_CLIENT_ID;
  const enabled = Boolean(clientId);

  const login = () => {
    if (!clientId || typeof window === 'undefined') return;
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    const scope = 'read:user user:email';
    const url = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
    window.location.href = url;
  };

  return { enabled, login };
}

export function SocialRow({
  googleRef,
  googleReady,
  googleEnabled,
  githubEnabled,
  onGithubClick,
}: {
  googleRef: React.RefObject<HTMLDivElement | null>;
  googleReady: boolean;
  googleEnabled: boolean;
  githubEnabled?: boolean;
  onGithubClick?: () => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 my-4">
        <div className="h-px flex-1 bg-slate-200"></div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">or continue with</span>
        <div className="h-px flex-1 bg-slate-200"></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {/* Google OAuth: self-closing div with NO React children so React never conflicts with Google's iframe */}
        <div className="relative h-11 flex items-center justify-center">
          <div
            ref={googleRef as React.RefObject<HTMLDivElement>}
            className={`h-full w-full flex items-center justify-center overflow-hidden ${!googleReady ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity`}
          />
          {!googleReady && (
            <div className="absolute inset-0 pointer-events-none px-3 rounded-full border border-slate-200 bg-white text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 shadow-xs">
              <span className="text-[13px] font-black">
                <span className="text-blue-500">G</span>
                <span className="text-red-500">o</span>
                <span className="text-amber-500">o</span>
                <span className="text-blue-500">g</span>
                <span className="text-green-600">l</span>
                <span className="text-red-500">e</span>
              </span>
            </div>
          )}
        </div>

        {/* GitHub OAuth */}
        <button
          type="button"
          onClick={onGithubClick}
          className="h-11 px-4 rounded-full border border-slate-200 bg-white hover:bg-slate-900 hover:text-white hover:border-slate-900 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs group"
          title="Continue with GitHub"
        >
          <GithubIcon className="w-4 h-4 text-slate-900 group-hover:text-white transition-colors" />
          <span>GitHub</span>
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────── Buttons ─────────────────────────── */

export function BtnPrimary({
  children,
  onClick,
  disabled,
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[13px] font-black transition-all shadow-lg shadow-violet-600/20 flex items-center justify-center gap-2 cursor-pointer"
    >
      {children}
    </button>
  );
}

export function BtnBack({ onClick, children = 'Back' }: { onClick: () => void; children?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-[13px] font-bold transition-all flex items-center gap-2 cursor-pointer"
    >
      <ArrowLeft className="w-4 h-4" />
      {children}
    </button>
  );
}

/* ─────────────────────────── Dev code hint (dev mode only) ─────────────────────────── */

export function DevCodeHint({ code }: { code: string }) {
  return (
    <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
      <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Dev mode — your code</p>
      <p className="text-xl font-black tracking-[0.4em] text-amber-800 font-mono mt-1">{code}</p>
    </div>
  );
}
