'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  provider: 'email' | 'google';
  wallet: string; // platform-assigned on-chain wallet
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  requestOtp: (email: string) => Promise<{ devCode?: string; error?: string }>;
  verifyOtp: (email: string, code: string) => Promise<{ error?: string }>;
  googleLogin: (credential: string) => Promise<{ error?: string }>;
  walletLogin: (walletAddress: string, name?: string) => Promise<{ error?: string }>;
  logout: () => void;
}

const AuthCtx = createContext<AuthContextValue>({
  user: null,
  loading: true,
  requestOtp: async () => ({ error: 'unavailable' }),
  verifyOtp: async () => ({ error: 'unavailable' }),
  googleLogin: async () => ({ error: 'unavailable' }),
  walletLogin: async () => ({ error: 'unavailable' }),
  logout: () => {},
});

const TOKEN_KEY = 'resolvia_token';

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/backend/${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  const data: T & { detail?: string } = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data && data.detail) || `Request failed (${res.status})`);
    (err as any).status = res.status;
    throw err;
  }
  return data;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const adopt = useCallback((token: string, u: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(u);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    api<{ user: AuthUser }>('auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((d) => setUser(d.user))
      .catch((e) => {
        // Only a definite auth rejection kills the session. Transient network
        // errors (backend restart, blip) must NOT silently log the user out.
        if (e instanceof Error && (e as any).status === 401 || (e as any).status === 403) {
          localStorage.removeItem(TOKEN_KEY);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const requestOtp = useCallback(async (email: string) => {
    try {
      const d = await api<{ devCode?: string }>('auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      return { devCode: d.devCode };
    } catch (e: any) {
      return { error: e.message };
    }
  }, []);

  const verifyOtp = useCallback(
    async (email: string, code: string) => {
      try {
        const d = await api<{ token: string; user: AuthUser }>('auth/otp/verify', {
          method: 'POST',
          body: JSON.stringify({ email, code }),
        });
        adopt(d.token, d.user);
        return {};
      } catch (e: any) {
        return { error: e.message };
      }
    },
    [adopt]
  );

  const googleLogin = useCallback(
    async (credential: string) => {
      try {
        const d = await api<{ token: string; user: AuthUser }>('auth/google', {
          method: 'POST',
          body: JSON.stringify({ credential }),
        });
        adopt(d.token, d.user);
        return {};
      } catch (e: any) {
        return { error: e.message };
      }
    },
    [adopt]
  );

  const walletLogin = useCallback(
    async (walletAddress: string, name?: string) => {
      try {
        const d = await api<{ token: string; user: AuthUser }>('auth/wallet', {
          method: 'POST',
          body: JSON.stringify({ wallet: walletAddress, name: name || 'Yash Vijay Singh' }),
        });
        adopt(d.token, d.user);
        return {};
      } catch (e: any) {
        return { error: e.message };
      }
    },
    [adopt]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, loading, requestOtp, verifyOtp, googleLogin, walletLogin, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
