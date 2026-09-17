'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Mail, Lock, CheckCircle2, AlertTriangle, Loader2, Wallet } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { shortAddr } from '../lib/chain';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const existing = document.getElementById('gis-script') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('GIS failed')));
      return;
    }
    const s = document.createElement('script');
    s.id = 'gis-script';
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load Google sign-in (offline?)'));
    document.head.appendChild(s);
  });
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { requestOtp, verifyOtp, googleLogin, user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement | null>(null);
  const [justSignedIn, setJustSignedIn] = useState(false);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  // After a successful sign-in, take the user to their dashboard
  useEffect(() => {
    if (justSignedIn && user) {
      const t = setTimeout(() => router.push('/dashboard'), 1500);
      return () => clearTimeout(t);
    }
  }, [justSignedIn, user, router]);

  useEffect(() => {
    if (!open) {
      setStep('email');
      setEmail('');
      setCode('');
      setDevCode(null);
      setError(null);
      setJustSignedIn(false);
      return;
    }
    if (!googleClientId || user) return;
    let cancelled = false;
    loadGisScript()
      .then(() => {
        if (cancelled || !googleBtnRef.current) return;
        window.google.accounts.id.initialize({ client_id: googleClientId, callback: (resp: any) => handleGoogle(resp.credential) });
        if (googleBtnRef.current) {
          window.google.accounts.id.renderButton(googleBtnRef.current, { theme: 'outline', size: 'medium', text: 'continue_with' });
        }
        setGoogleReady(true);
      })
      .catch(() => setGoogleReady(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, googleClientId, user]);

  const handleGoogle = useCallback(
    async (credential: string) => {
      setBusy(true);
      setError(null);
      const res = await googleLogin(credential);
      setBusy(false);
      if (res.error) {
        setError(res.error);
      } else {
        setJustSignedIn(true);
        setTimeout(onClose, 1800);
      }
    },
    [googleLogin, onClose]
  );

  const sendOtp = async () => {
    setBusy(true);
    setError(null);
    const res = await requestOtp(email.trim());
    setBusy(false);
    if (res.error) {
      setError(res.error);
    } else {
      setDevCode(res.devCode || null);
      setStep('otp');
      setCode('');
    }
  };

  const submitCode = async () => {
    setBusy(true);
    setError(null);
    const res = await verifyOtp(email.trim(), code.trim());
    setBusy(false);
    if (res.error) {
      setError(res.error);
    } else {
      setJustSignedIn(true);
      setTimeout(onClose, 1800);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 space-y-4">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Sign in to Resolvia</h3>
            <p className="text-[10px] text-slate-500">
              We'll assign you an on-chain wallet — no MetaMask, no seed phrases.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-700 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {justSignedIn && user ? (
          <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-sm font-black text-emerald-900">Welcome, {user.name}!</p>
            <p className="text-[11px] text-emerald-700">Your Resolvia wallet has been assigned:</p>
            <p className="font-mono text-xs font-bold text-emerald-800 bg-white border border-emerald-200 rounded-lg px-3 py-1.5 inline-block">
              {shortAddr(user.wallet)}
            </p>
          </div>
        ) : (
          <>
            {step === 'email' ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email address</label>
                  <div className="mt-1.5 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && email.includes('@') && sendOtp()}
                      placeholder="you@example.com"
                      className="w-full py-2.5 text-xs font-semibold bg-transparent outline-none text-slate-900"
                    />
                  </div>
                </div>
                <button
                  onClick={sendOtp}
                  disabled={busy || !email.includes('@')}
                  className="w-full p-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  <span>Send verification code</span>
                </button>
                {googleClientId && (
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                    <div className="relative flex justify-center"><span className="bg-white px-2 text-[9px] font-bold uppercase text-slate-400">or</span></div>
                  </div>
                )}
                {googleClientId ? (
                  <div ref={googleBtnRef} className="flex justify-center min-h-[42px]"></div>
                ) : (
                  <button
                    disabled
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                    title="Set NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable"
                  >
                    <GoogleGlyph />
                    <span>Continue with Google (not configured)</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-600">
                  We sent a 6-digit code to <strong>{email}</strong>.
                </p>
                {devCode && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                    <strong>Dev mode:</strong> no email server here — your code is{' '}
                    <span className="font-mono font-black text-base tracking-[0.3em]">{devCode}</span>
                  </div>
                )}
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={(e) => e.key === 'Enter' && code.length === 6 && submitCode()}
                  placeholder="••••••"
                  className="w-full p-3 text-center font-mono text-xl font-black tracking-[0.5em] bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400"
                  autoFocus
                />
                <button
                  onClick={submitCode}
                  disabled={busy || code.length !== 6}
                  className="w-full p-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Verify &amp; create my wallet</span>
                </button>
                <button onClick={() => setStep('email')} className="w-full text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer">
                  ← use a different email
                </button>
              </div>
            )}
          </>
        )}

        <p className="text-[9px] text-slate-400 leading-relaxed">
          Your wallet key is generated server-side, encrypted at rest, and recovered via your login — you never
          handle private keys. Production: ERC-4337 smart accounts + passkeys.
        </p>
      </div>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
