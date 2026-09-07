'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, ArrowRight, ShieldCheck, TrendingUp, Footprints, RefreshCw, KeyRound } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import {
  AuthLayout,
  Split,
  BrandBullets,
  BrandQuote,
  AuthCard,
  OtpBoxes,
  BtnPrimary,
  BtnBack,
  DevCodeHint,
  useGoogle,
  SocialRow,
} from '../components/auth-ui';

export default function LoginPage() {
  return <AuthLayout>
    <LoginInner />
  </AuthLayout>;
}

function LoginInner() {
  const router = useRouter();
  const { user, requestOtp, verifyOtp, googleLogin } = useAuth();

  const [stage, setStage] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const emailRef = useRef<HTMLInputElement>(null);

  const handleGoogle = useCallback(
    async (credential: string) => {
      const r = await googleLogin(credential);
      if (!r.error) router.push('/dashboard');
    },
    [googleLogin, router]
  );
  const { ref: googleRef, ready: googleReady, enabled: googleEnabled } = useGoogle(handleGoogle);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const sendCode = async () => {
    if (!validEmail || busy) return;
    setBusy(true);
    setError(null);
    const r = await requestOtp(email.trim());
    setBusy(false);
    if (r.error) {
      setError(r.error);
      return;
    }
    setDevCode(r.devCode || null);
    setCode('');
    setStage('code');
    setResendIn(60);
  };

  const verify = async () => {
    if (code.length !== 6 || busy) return;
    setBusy(true);
    setError(null);
    const r = await verifyOtp(email.trim(), code);
    setBusy(false);
    if (r.error) {
      setError(r.error);
      return;
    }
    router.push('/dashboard');
  };

  return (
    <Split
      brand={
        <div>
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-[1.15] tracking-tight">
            Welcome Back.
            <span className="block text-violet-400">Let&apos;s Resolve Together.</span>
          </h1>
          <BrandBullets
            items={[
              { icon: <Footprints className="w-5 h-5" />, title: 'Continue Your Journey', sub: 'Access your ongoing cases, evidence and jury roles.' },
              { icon: <ShieldCheck className="w-5 h-5" />, title: 'Secure Access', sub: 'Passwordless email verification — your data stays safe.' },
              { icon: <TrendingUp className="w-5 h-5" />, title: 'Make an Impact', sub: 'Be part of a fairer, more transparent society.' },
            ]}
          />
          <BrandQuote quote="Fairness is a choice. Choose it, every day." />
        </div>
      }
    >
      <AuthCard
        title="Log in to Resolvia"
        sub={stage === 'email' ? 'Enter your email to receive a 6-digit sign-in code. Resolvia is passwordless.' : `We've sent a 6-digit code to ${email}.`}
      >
        {stage === 'email' ? (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 mb-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
              </label>
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendCode()}
                placeholder="you@example.com"
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none text-[13px] font-semibold text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="p-3 rounded-xl bg-violet-50/70 border border-violet-100 flex items-start gap-2.5">
              <KeyRound className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
              <p className="text-[10.5px] text-violet-800 leading-relaxed">
                No passwords on Resolvia. We verify it&apos;s you with a one-time 6-digit code, then assign your
                on-chain identity automatically.
              </p>
            </div>

            {error && <p className="text-[11px] font-bold text-rose-600">{error}</p>}

            <BtnPrimary onClick={sendCode} disabled={!validEmail || busy}>
              {busy ? 'Sending…' : 'Send Code'} {!busy && <ArrowRight className="w-4 h-4" />}
            </BtnPrimary>

            <SocialRow googleRef={googleRef} googleReady={googleReady} googleEnabled={googleEnabled} />

            <p className="text-[11px] text-slate-500 text-center pt-1">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-black text-violet-600 hover:text-violet-700">
                Sign Up
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {devCode && <DevCodeHint code={devCode} />}
            <OtpBoxes value={code} onChange={setCode} disabled={busy} />
            {error && <p className="text-[11px] font-bold text-rose-600 text-center">{error}</p>}
            <BtnPrimary onClick={verify} disabled={code.length !== 6 || busy}>
              {busy ? 'Verifying…' : 'Verify & Continue'} {!busy && <ArrowRight className="w-4 h-4" />}
            </BtnPrimary>
            <div className="flex items-center justify-between">
              <BtnBack onClick={() => { setStage('email'); setError(null); }} />
              <button
                onClick={sendCode}
                disabled={resendIn > 0 || busy}
                className="flex items-center gap-1.5 text-[11px] font-bold text-violet-600 hover:text-violet-700 disabled:text-slate-300 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {resendIn > 0 ? `Resend in 00:${String(resendIn).padStart(2, '0')}` : 'Resend code'}
              </button>
            </div>
          </div>
        )}
      </AuthCard>
    </Split>
  );
}
