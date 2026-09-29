'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { Scale, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * GitHub OAuth callback page.
 * GitHub redirects here with ?code=... after user authorizes.
 * We exchange the code via our backend and log the user in.
 */
export default function GitHubCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0b132b] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
      </div>
    }>
      <GitHubCallbackInner />
    </Suspense>
  );
}

function GitHubCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { githubLogin } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMsg(searchParams.get('error_description') || 'GitHub authorization was denied.');
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMsg('No authorization code received from GitHub.');
      return;
    }

    // Exchange the code for a session
    let cancelled = false;
    (async () => {
      const result = await githubLogin(code);
      if (cancelled) return;
      if (result.error) {
        setStatus('error');
        setErrorMsg(result.error);
      } else {
        setStatus('success');
        setTimeout(() => router.push('/dashboard'), 1200);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#0b132b] flex items-center justify-center relative overflow-hidden">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 w-[480px] h-[480px] bg-violet-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 -left-40 w-[480px] h-[480px] bg-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center space-y-6">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-black text-slate-900">Resolvia</span>
          </div>

          {status === 'loading' && (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-violet-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Signing in with GitHub…</h2>
                <p className="text-sm text-slate-500 mt-1">Verifying your account, hang tight.</p>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Welcome to Resolvia!</h2>
                <p className="text-sm text-slate-500 mt-1">Redirecting to your dashboard…</p>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 flex items-center justify-center">
                <AlertCircle className="w-9 h-9 text-rose-600" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Sign-in Failed</h2>
                <p className="text-sm text-rose-600 mt-1 font-medium">{errorMsg}</p>
              </div>
              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={() => router.push('/login')}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Back to Login
                </button>
                <button
                  onClick={() => router.push('/signup')}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
