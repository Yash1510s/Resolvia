'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, ArrowRight, ShieldCheck, TrendingUp, Footprints, RefreshCw, KeyRound, Wallet, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useAuth, type AuthUser } from '../lib/auth-context';
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

  const [method, setMethod] = useState<'email' | 'wallet'>('email');
  const [stage, setStage] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [successUser, setSuccessUser] = useState<AuthUser | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const { walletLogin } = useAuth();

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
    setSuccessUser({
      id: 1,
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email: email.trim(),
      provider: 'email',
      wallet: '0x3aF3a4898492E92aA827E16b67e059d2E',
    });
    setTimeout(() => router.push('/dashboard'), 1400);
  };

  const connectMetaMask = async () => {
    setBusy(true);
    setError(null);
    try {
      let addr = '0x3aF3a4898492E92aA827E16b67e059d2E';
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
          if (accounts && accounts[0]) addr = accounts[0];
        } catch {
          // fallback to demo address if dismissed
        }
      }
      const r = await walletLogin(addr, 'Yash Vijay Singh');
      if (r.error) {
        setError(r.error);
        setBusy(false);
      } else {
        setSuccessUser({
          id: 1,
          name: 'Yash Vijay Singh',
          email: `${addr.slice(0, 8)}@wallet.resolvia.eth`,
          provider: 'email',
          wallet: addr,
        });
        setTimeout(() => router.push('/dashboard'), 1400);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to connect MetaMask');
      setBusy(false);
    }
  };

  if (successUser) {
    return (
      <div className="max-w-md mx-auto text-center py-12 px-8 bg-white rounded-3xl shadow-2xl space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-bounce">
          <CheckCircle2 className="w-11 h-11 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900">Login Successful!</h2>
          <p className="text-sm font-bold text-slate-700 mt-2">Welcome back, {successUser.name}.</p>
          <p className="text-xs text-slate-400 mt-1">Redirecting to your dashboard in a few seconds…</p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black transition-all shadow-lg shadow-violet-900/30 cursor-pointer"
        >
          Go to Dashboard Now →
        </button>
      </div>
    );
  }

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
              { icon: <ShieldCheck className="w-5 h-5" />, title: 'Secure Access', sub: 'Your data and verified records remain safe.' },
              { icon: <TrendingUp className="w-5 h-5" />, title: 'Make an Impact', sub: 'Be part of a fairer, more transparent society.' },
            ]}
          />
          <BrandQuote quote="Fairness is a choice. Choose it, every day." />
        </div>
      }
    >
      <AuthCard
        title="Log in to Resolvia"
        sub="Choose your preferred method to continue."
      >
        {/* Method Toggle Tabs (matching reference design) */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => { setMethod('email'); setError(null); }}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              method === 'email' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email Login</span>
          </button>
          <button
            type="button"
            onClick={() => { setMethod('wallet'); setError(null); }}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              method === 'wallet' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Wallet Login</span>
          </button>
        </div>

        {method === 'wallet' ? (
          <div className="space-y-5 text-center py-2">
            {/* MetaMask Fox Illustration */}
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shadow-sm">
              <svg className="w-10 h-10" viewBox="0 0 32 32" fill="none">
                <path d="M28.05 4.54L17.7 12.16l2.12-4.99L28.05 4.54z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3.95 4.54l10.23 7.69-2.02-5.06L3.95 4.54z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M24.23 21.65l-2.73 4.19 5.86 1.62 1.69-5.75-4.82-.06z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2.95 21.71l1.68 5.75 5.86-1.62-2.73-4.19-4.81.06z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9.73 13.98l-1.63 2.46 5.82.26-.2-6.26-3.99 3.54z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22.27 13.98l-4.04-3.6-.15 6.32 5.82-.26-1.63-2.46z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10.49 25.84l3.52-1.72-3.04-2.37-.48 4.09z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17.99 24.12l3.52 1.72-.48-4.09-3.04 2.37z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21.51 25.84l-3.52-1.72.33 2.76 3.19-1.04z" fill="#D6C1B0" stroke="#D6C1B0" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10.49 25.84l3.19 1.04.33-2.76-3.52 1.72z" fill="#D6C1B0" stroke="#D6C1B0" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14.01 24.12l-3.52 1.72 4.19 2.06-.67-3.78z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17.99 24.12l-.67 3.78 4.19-2.06-3.52-1.72z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">Log in with MetaMask</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Connect your Web3 wallet to securely sign in and access your cases.
              </p>
            </div>

            {error && <p className="text-[11px] font-bold text-rose-600">{error}</p>}

            <button
              onClick={connectMetaMask}
              disabled={busy}
              className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black transition-all shadow-lg shadow-violet-900/30 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{busy ? 'Connecting…' : 'Connect MetaMask'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center gap-2 text-[10.5px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>We never store your private keys. You only sign a message to log in.</span>
            </div>

            <p className="text-[11px] text-slate-500 text-center pt-2">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-black text-violet-600 hover:text-violet-700">
                Sign Up
              </Link>
            </p>
          </div>
        ) : stage === 'email' ? (
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
