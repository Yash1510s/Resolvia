'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  Fingerprint,
  Globe2,
  GraduationCap,
  Briefcase,
  Landmark,
  Check,
  Camera,
  RefreshCw,
  PartyPopper,
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { AppProvider, useApp } from '../lib/app-context';
import type { RoleType } from '../types';
import {
  AuthLayout,
  Split,
  BrandBullets,
  BrandQuote,
  AuthCard,
  StepIndicator,
  OtpBoxes,
  BtnPrimary,
  BtnBack,
  DevCodeHint,
  useGoogle,
  SocialRow,
} from '../components/auth-ui';

const STEPS = ['Account', 'Role Selection', 'Profile Details', 'Complete'];

const ROLES: { id: RoleType; icon: React.ReactNode; title: string; sub: string }[] = [
  { id: 'INDIVIDUAL', icon: <User className="w-5 h-5" />, title: 'Individual', sub: 'For personal disputes, consumer issues, and everyday conflicts.' },
  { id: 'STUDENT', icon: <GraduationCap className="w-5 h-5" />, title: 'Student', sub: 'For academic disputes, college communities, and student forums.' },
  { id: 'PROFESSIONAL', icon: <Briefcase className="w-5 h-5" />, title: 'Professional', sub: 'For workplace conflicts, contracts, and professional matters.' },
  { id: 'INSTITUTION', icon: <Landmark className="w-5 h-5" />, title: 'Institution', sub: 'For organizations, colleges, NGOs, and official dispute handling.' },
];

export default function SignupPage() {
  return (
    <AuthLayout back="/home" backLabel="Back to Home">
      <AppProvider>
        <SignupInner />
      </AppProvider>
    </AuthLayout>
  );
}

function SignupInner() {
  const router = useRouter();
  const { user, requestOtp, verifyOtp, googleLogin } = useAuth();
  const { profilePrefs, setProfilePrefs } = useApp();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [terms, setTerms] = useState(false);
  const [roleType, setRoleType] = useState<RoleType>('INDIVIDUAL');
  const [displayName, setDisplayName] = useState('');
  const [institution, setInstitution] = useState('');
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [done, setDone] = useState(false);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleGoogle = useCallback(
    async (credential: string) => {
      const r = await googleLogin(credential);
      if (r.error) {
        setError(r.error);
        return;
      }
      // Google created/found the account — apply role defaults and go in.
      setProfilePrefs({ ...profilePrefs, roleType: 'INDIVIDUAL' });
      router.push('/dashboard');
    },
    [googleLogin, profilePrefs, setProfilePrefs, router]
  );
  const { ref: googleRef, ready: googleReady, enabled: googleEnabled } = useGoogle(handleGoogle);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

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
    setResendIn(60);
  };

  useEffect(() => {
    if (step === 4 && !done && !devCode) {
      sendCode();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }
  }, [step]);

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
    // Account created (or found) server-side with an assigned on-chain identity.
    setProfilePrefs({
      ...profilePrefs,
      roleType,
      email: email.trim(),
      headline: displayName || profilePrefs.headline,
      institution: institution || profilePrefs.institution,
      bio: bio || profilePrefs.bio,
    });
    setDone(true);
  };

  const step1Valid = name.trim().length > 1 && validEmail && terms;

  return (
    <Split
      brand={
        <div>
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-[1.15] tracking-tight">
            Join a Fairer
            <span className="block text-violet-400">Tomorrow.</span>
          </h1>
          <p className="text-slate-400 text-[13px] mt-4 leading-relaxed max-w-sm">
            Create your account and be a part of a trusted community for transparent and unbiased dispute resolution.
          </p>
          <BrandBullets
            items={[
              { icon: <ShieldCheck className="w-5 h-5" />, title: 'Secure & Private', sub: 'Your data is encrypted and protected. Passwordless by design.' },
              { icon: <Fingerprint className="w-5 h-5" />, title: 'Real Identity, Real Accountability', sub: 'Build trust in the community — your on-chain identity is assigned automatically.' },
              { icon: <Globe2 className="w-5 h-5" />, title: 'Access for Everyone', sub: 'Individuals, professionals, institutions — all in one platform.' },
            ]}
          />
          <BrandQuote quote="Justice is better when more people have a voice." />
        </div>
      }
    >
      <div>
        <StepIndicator steps={STEPS} current={done ? 5 : step} />
        <AuthCard
          title={
            step === 1 ? 'Create Your Account'
            : step === 2 ? 'How will you use Resolvia?'
            : step === 3 ? 'Complete Your Profile'
            : 'Verify Your Email'
          }
          sub={
            step === 1 ? 'Get started with Resolvia'
            : step === 2 ? 'Select the option that best describes you. You can change this later.'
            : step === 3 ? 'Help us build a trusted community by adding a few more details.'
            : `We've sent a 6-digit verification code to "${email}".`
          }
        >
          {/* ── Step 1: Account ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 mb-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Full Name
                </label>
                <input
                  value={name}
                  onChange={(e) => { setName(e.target.value); setDisplayName((d) => d || e.target.value); }}
                  placeholder="Yash Vijay Singh"
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none text-[13px] font-semibold text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 mb-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none text-[13px] font-semibold text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-violet-600"
                />
                <span className="text-[11px] text-slate-500 leading-relaxed">
                  I agree to the{' '}
                  <span className="font-bold text-violet-600">Terms of Service</span> and{' '}
                  <span className="font-bold text-violet-600">Privacy Policy</span>.
                </span>
              </label>
              {error && <p className="text-[11px] font-bold text-rose-600">{error}</p>}
              <BtnPrimary onClick={() => step1Valid && setStep(2)} disabled={!step1Valid}>
                Continue <ArrowRight className="w-4 h-4" />
              </BtnPrimary>
              <SocialRow googleRef={googleRef} googleReady={googleReady} googleEnabled={googleEnabled} />
              <p className="text-[11px] text-slate-500 text-center pt-1">
                Already have an account?{' '}
                <Link href="/login" className="font-black text-violet-600 hover:text-violet-700">
                  Log in
                </Link>
              </p>
            </div>
          )}

          {/* ── Step 2: Role selection ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ROLES.map((r) => {
                  const active = roleType === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setRoleType(r.id)}
                      className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        active ? 'border-violet-500 bg-violet-50/60 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          {r.icon}
                        </div>
                        {active && <Check className="w-4 h-4 text-violet-600" />}
                      </div>
                      <p className="text-[13px] font-black text-slate-900 mt-2.5">{r.title}</p>
                      <p className="text-[10.5px] text-slate-500 mt-1 leading-relaxed">{r.sub}</p>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between pt-1">
                <BtnBack onClick={() => setStep(1)} />
                <BtnPrimary onClick={() => setStep(3)}>
                  Continue <ArrowRight className="w-4 h-4" />
                </BtnPrimary>
              </div>
            </div>
          )}

          {/* ── Step 3: Profile details ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xl font-black">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt="avatar" className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      (displayName || name || '?').charAt(0).toUpperCase()
                    )}
                  </div>
                  <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center border-2 border-white cursor-pointer" title="Upload Photo (Optional, max 2MB)">
                    <Camera className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f && f.size <= 2 * 1024 * 1024) setPhoto(URL.createObjectURL(f));
                      }}
                    />
                  </label>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">Upload Photo<br />(Optional, max 2MB)</p>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Display Name</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={name}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none text-[13px] font-semibold text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Institute / Organization (Optional)</label>
                <input
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Xavier Institute of Engineering"
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none text-[13px] font-semibold text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Bio (Optional)</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 200))}
                  rows={3}
                  placeholder="Computer Science Student | Interested in Technology, Law and Social Impact."
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none text-[13px] font-semibold text-slate-900 placeholder:text-slate-400 resize-none"
                />
                <p className="text-right text-[10px] text-slate-400 mt-1">{bio.length}/200</p>
              </div>
              <div className="flex items-center justify-between pt-1">
                <BtnBack onClick={() => setStep(2)} />
                <BtnPrimary onClick={() => setStep(4)}>
                  Continue <ArrowRight className="w-4 h-4" />
                </BtnPrimary>
              </div>
            </div>
          )}

          {/* ── Step 4: Email verification ── */}
          {step === 4 && (
            <div className="space-y-4">
              {devCode && <DevCodeHint code={devCode} />}
              <OtpBoxes value={code} onChange={setCode} disabled={busy} />
              {error && <p className="text-[11px] font-bold text-rose-600 text-center">{error}</p>}
              <BtnPrimary onClick={verify} disabled={code.length !== 6 || busy}>
                {busy ? 'Verifying…' : 'Verify & Continue'} {!busy && <ArrowRight className="w-4 h-4" />}
              </BtnPrimary>
              <div className="flex items-center justify-between">
                <BtnBack onClick={() => setStep(3)} children="Back to Sign Up" />
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

          {/* ── Done ── */}
          {done && (
            <div className="text-center space-y-4 py-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                <PartyPopper className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-black text-slate-900">Account Created Successfully!</p>
                <p className="text-[12px] text-slate-500 mt-1.5 leading-relaxed">
                  Welcome to Resolvia, <strong>{displayName || name}</strong>. Your passwordless account is ready and an
                  on-chain identity has been assigned to you.
                </p>
              </div>
              {user && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Assigned on-chain identity</p>
                  <p className="font-mono text-[11px] font-bold text-slate-700 mt-1">
                    {user.wallet.slice(0, 10)}…{user.wallet.slice(-6)}
                  </p>
                </div>
              )}
              <BtnPrimary onClick={() => router.push('/dashboard')}>
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </BtnPrimary>
              <p className="text-[10.5px] italic text-slate-400 leading-relaxed">
                &ldquo;Every voice matters. Thank you for taking a step towards a fairer tomorrow.&rdquo;<br />— Resolvia
              </p>
            </div>
          )}
        </AuthCard>
      </div>
    </Split>
  );
}
