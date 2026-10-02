'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  provider: 'email' | 'google' | 'github' | 'wallet';
  wallet: string; // active connected / linked on-chain wallet
  custodialWallet?: string | null;
  metamaskAddress?: string | null;
  avatarUrl?: string | null;
  bgMediaUrl?: string | null;
  bgType?: 'video' | 'image' | null;
  bgTheme?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  requestOtp: (email: string, phone?: string) => Promise<{ devCode?: string; error?: string }>;
  verifyOtp: (email: string, code: string, phone?: string) => Promise<{ error?: string }>;
  googleLogin: (credential: string) => Promise<{ error?: string }>;
  githubLogin: (code: string) => Promise<{ error?: string }>;
  walletLogin: (walletAddress: string, name?: string) => Promise<{ error?: string }>;
  linkWallet: (walletAddress: string) => Promise<{ error?: string }>;
  unlinkWallet: () => Promise<{ error?: string }>;
  updateProfile: (profile: Partial<AuthUser>) => Promise<{ error?: string }>;
  logout: () => void;
}

const AuthCtx = createContext<AuthContextValue>({
  user: null,
  loading: true,
  requestOtp: async () => ({ error: 'unavailable' }),
  verifyOtp: async () => ({ error: 'unavailable' }),
  googleLogin: async () => ({ error: 'unavailable' }),
  githubLogin: async () => ({ error: 'unavailable' }),
  walletLogin: async () => ({ error: 'unavailable' }),
  linkWallet: async () => ({ error: 'unavailable' }),
  unlinkWallet: async () => ({ error: 'unavailable' }),
  updateProfile: async () => ({ error: 'unavailable' }),
  logout: () => {},
});

const TOKEN_KEY = 'resolvia_token';

function setSessionCookie(token: string) {
  if (typeof document === 'undefined') return;
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax${isSecure ? '; Secure' : ''}`;
}

function clearSessionCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

function getSessionCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + TOKEN_KEY + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

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
    setSessionCookie(token);
    setUser(u);
  }, []);

  useEffect(() => {
    const localToken = localStorage.getItem(TOKEN_KEY);
    const cookieToken = getSessionCookie();
    const token = localToken || cookieToken;

    if (!token) {
      clearSessionCookie();
      setLoading(false);
      return;
    }

    // Keep storage and cookie in sync
    localStorage.setItem(TOKEN_KEY, token);
    setSessionCookie(token);

    api<{ user: AuthUser }>('auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((d) => {
        setUser(d.user);
        // Auto-detect and sync MetaMask if installed in browser
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          (window as any).ethereum
            .request({ method: 'eth_accounts' })
            .then((accounts: string[]) => {
              if (accounts && accounts[0]) {
                const currentMetaMask = accounts[0].toLowerCase();
                // If user logged in via wallet, or hasn't linked a metamask address yet, auto-sync
                if (d.user.email?.endsWith('@wallet.resolvia.eth') || !d.user.metamaskAddress) {
                  api<{ status: string; user: AuthUser }>('user/link-wallet', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ wallet: currentMetaMask }),
                  })
                    .then((res) => {
                      if (res?.user) setUser(res.user);
                    })
                    .catch(() => {});
                }
              }
            })
            .catch(() => {});
        }
      })
      .catch((e) => {
        // Only a definite auth rejection kills the session. Transient network
        // errors (backend restart, blip) must NOT silently log the user out.
        if (e instanceof Error && ((e as any).status === 401 || (e as any).status === 403)) {
          localStorage.removeItem(TOKEN_KEY);
          clearSessionCookie();
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Listen to accountsChanged events so switching accounts in MetaMask updates instantly
  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;
    const eth = (window as any).ethereum;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts && accounts[0]) {
        const addr = accounts[0].toLowerCase();
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
          api<{ status: string; user: AuthUser }>('user/link-wallet', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify({ wallet: addr }),
          })
            .then((res) => {
              if (res?.user) setUser(res.user);
            })
            .catch(() => {
              setUser((prev) => (prev ? { ...prev, wallet: addr, metamaskAddress: addr } : null));
            });
        } else {
          setUser((prev) => (prev ? { ...prev, wallet: addr, metamaskAddress: addr } : null));
        }
      }
    };

    eth.on?.('accountsChanged', handleAccountsChanged);
    return () => {
      eth.removeListener?.('accountsChanged', handleAccountsChanged);
    };
  }, []);

  const requestOtp = useCallback(async (email: string, phone?: string) => {
    try {
      const d = await api<{ devCode?: string }>('auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({ email, phone }),
      });
      return { devCode: d.devCode };
    } catch (e: any) {
      return { error: e.message };
    }
  }, []);

  const verifyOtp = useCallback(
    async (email: string, code: string, phone?: string) => {
      try {
        const d = await api<{ token: string; user: AuthUser }>('auth/otp/verify', {
          method: 'POST',
          body: JSON.stringify({ email, code, phone }),
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

  const githubLogin = useCallback(
    async (code: string) => {
      try {
        const d = await api<{ token: string; user: AuthUser }>('auth/github', {
          method: 'POST',
          body: JSON.stringify({ code }),
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
        // 1. If an EIP-1193 provider (MetaMask) is available, perform real EIP-4361 SiWE
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          try {
            const nonceRes = await api<{ nonce: string; message: string }>(
              `auth/wallet/nonce?address=${encodeURIComponent(walletAddress)}`
            );
            if (nonceRes && nonceRes.message) {
              const signature = await (window as any).ethereum.request({
                method: 'personal_sign',
                params: [nonceRes.message, walletAddress],
              });
              const fallbackName = name || (walletAddress ? `Juror ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Resolvia Juror');
              const verified = await api<{ token: string; user: AuthUser }>('auth/wallet/verify', {
                method: 'POST',
                body: JSON.stringify({
                  address: walletAddress,
                  signature,
                  name: fallbackName,
                }),
              });
              adopt(verified.token, verified.user);
              return {};
            }
          } catch (signErr: any) {
            // User rejected signature prompt
            if (signErr.code === 4001 || signErr.message?.includes('User rejected')) {
              return { error: 'Signature request rejected by user' };
            }
          }
        }

        // 2. Dev / fallback flow for environments without interactive wallet extension
        const fallbackName = name || (walletAddress ? `Juror ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Resolvia Juror');
        const d = await api<{ token: string; user: AuthUser }>('auth/wallet', {
          method: 'POST',
          body: JSON.stringify({ wallet: walletAddress, name: fallbackName }),
        });
        adopt(d.token, d.user);
        return {};
      } catch (e: any) {
        return { error: e.message };
      }
    },
    [adopt]
  );

  const linkWallet = useCallback(async (walletAddress: string) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setUser((prev) => (prev ? { ...prev, wallet: walletAddress, metamaskAddress: walletAddress } : null));
        return {};
      }
      const res = await api<{ status: string; user: AuthUser; message: string }>('user/link-wallet', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ wallet: walletAddress }),
      });
      if (res && res.user) {
        setUser(res.user);
      }
      return {};
    } catch (e: any) {
      return { error: e.message || 'Failed to link wallet' };
    }
  }, []);

  const unlinkWallet = useCallback(async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setUser((prev) => (prev ? { ...prev, metamaskAddress: null } : null));
        return {};
      }
      const res = await api<{ status: string; user: AuthUser; message: string }>('user/unlink-wallet', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res && res.user) {
        setUser(res.user);
      }
      return {};
    } catch (e: any) {
      return { error: e.message || 'Failed to unlink wallet' };
    }
  }, []);

  const updateProfile = useCallback(async (profile: Partial<AuthUser>) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        // Guest mode fallback
        setUser((prev) => (prev ? { ...prev, ...profile } : null));
        return {};
      }
      const res = await api<{ status: string; user: AuthUser }>('user/profile', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(profile),
      });
      if (res && res.user) {
        setUser(res.user);
      }
      return {};
    } catch (e: any) {
      return { error: e.message || 'Profile update failed' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    try {
      localStorage.removeItem('resolvia_demo_state_v1');
    } catch {}
    clearSessionCookie();
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider
      value={{
        user,
        loading,
        requestOtp,
        verifyOtp,
        googleLogin,
        githubLogin,
        walletLogin,
        linkWallet,
        unlinkWallet,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
