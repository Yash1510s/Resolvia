'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  User,
  Shield,
  Bell,
  Users,
  Lock,
  SlidersHorizontal,
  Boxes as ChainIcon,
  Database,
  Accessibility as A11yIcon,
  CheckCircle2,
  Mail,
  GraduationCap,
  MapPin,
  Pencil,
  Download,
  Trash2,
  Monitor,
  Smartphone,
  KeyRound,
  Fingerprint,
  Gavel,
  Info,
  Camera,
} from 'lucide-react';
import { useApp } from '../../lib/app-context';
import { useAuth } from '../../lib/auth-context';
import { useTheme } from '../../lib/theme-context';
import { Card, BtnPrimary, Toggle } from '../../components/ui';

type Section = 'account' | 'security' | 'notifications' | 'jury' | 'privacy' | 'preferences' | 'blockchain' | 'data' | 'accessibility';

const NAV: { id: Section; label: string; sub: string; icon: React.ReactNode }[] = [
  { id: 'account', label: 'Account', sub: 'Profile and basic information', icon: <User className="w-4.5 h-4.5" /> },
  { id: 'security', label: 'Security', sub: 'Password, 2FA, and login', icon: <Shield className="w-4.5 h-4.5" /> },
  { id: 'notifications', label: 'Notifications', sub: 'Manage alerts and updates', icon: <Bell className="w-4.5 h-4.5" /> },
  { id: 'jury', label: 'Jury Availability', sub: 'Pool, schedule, concurrency', icon: <Gavel className="w-4.5 h-4.5" /> },
  { id: 'privacy', label: 'Privacy', sub: 'Control your data and visibility', icon: <Lock className="w-4.5 h-4.5" /> },
  { id: 'preferences', label: 'Preferences', sub: 'Appearance and language', icon: <SlidersHorizontal className="w-4.5 h-4.5" /> },
  { id: 'blockchain', label: 'Blockchain', sub: 'Wallet and on-chain settings', icon: <ChainIcon className="w-4.5 h-4.5" /> },
  { id: 'data', label: 'Data & Export', sub: 'Download or delete your data', icon: <Database className="w-4.5 h-4.5" /> },
  { id: 'accessibility', label: 'Accessibility', sub: 'Make Resolvia work for you', icon: <A11yIcon className="w-4.5 h-4.5" /> },
];

function getSessionIdFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length >= 2) {
      const payload = JSON.parse(atob(parts[1]));
      return payload.sid || payload.jti || null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export default function SettingsPage() {
  const { profilePrefs, setProfilePrefs, availability, setAvailability, resetDemoData, cases, logout } = useApp();
  const { user: authUser, updateProfile, linkWallet, unlinkWallet } = useAuth();
  const [section, setSection] = useState<Section>('account');
  const initialEmail = authUser?.email || (profilePrefs.email === 'alex.vance@resolvia.network' ? '' : profilePrefs.email) || '';
  const initialPhone = authUser?.phone || (typeof window !== 'undefined' ? localStorage.getItem('resolvia_user_phone') : null) || '';

  const [account, setAccount] = useState<{
    name: string;
    email: string;
    phone: string;
    institution: string;
    location: string;
    role: import('../../types').RoleType;
    bio: string;
  }>({
    name: authUser?.name || (typeof window !== 'undefined' ? localStorage.getItem('resolvia_user_name') : null) || 'Community Member',
    email: initialEmail,
    phone: initialPhone,
    institution: profilePrefs.institution,
    location: profilePrefs.location,
    role: profilePrefs.roleType || 'STUDENT',
    bio: profilePrefs.bio,
  });

  const [walletLinking, setWalletLinking] = useState(false);
  const [walletMsg, setWalletMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleLinkMetaMask = async () => {
    setWalletLinking(true);
    setWalletMsg(null);
    try {
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        setWalletMsg({ type: 'err', text: 'MetaMask or Web3 extension not found in this browser.' });
        setWalletLinking(false);
        return;
      }
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || !accounts[0]) {
        setWalletMsg({ type: 'err', text: 'No accounts selected in MetaMask.' });
        setWalletLinking(false);
        return;
      }
      const chosen = accounts[0];
      const res = await linkWallet(chosen);
      if (res.error) {
        setWalletMsg({ type: 'err', text: res.error });
      } else {
        setWalletMsg({ type: 'ok', text: `Linked MetaMask wallet ${chosen.slice(0, 6)}...${chosen.slice(-4)} successfully!` });
      }
    } catch (e: any) {
      setWalletMsg({ type: 'err', text: e.message || 'MetaMask connection rejected.' });
    } finally {
      setWalletLinking(false);
    }
  };

  const handleUnlinkMetaMask = async () => {
    if (!window.confirm('Unlink your personal MetaMask wallet and revert to the custodial platform key?')) return;
    setWalletMsg(null);
    const res = await unlinkWallet();
    if (res.error) {
      setWalletMsg({ type: 'err', text: res.error });
    } else {
      setWalletMsg({ type: 'ok', text: 'Personal wallet unlinked.' });
    }
  };

  useEffect(() => {
    if (authUser) {
      setAccount((prev) => ({
        ...prev,
        name: authUser.name || prev.name,
        email: authUser.email || (prev.email === 'alex.vance@resolvia.network' ? '' : prev.email),
        phone: authUser.phone || prev.phone,
      }));
    }
  }, [authUser]);
  const [savedFlash, setSavedFlash] = useState(false);
  const { theme, setTheme } = useTheme();
  const [language, setLanguageState] = useState<string>('English (Default)');
  const setLanguage = (v: string) => {
    setLanguageState(v);
    if (typeof window !== 'undefined') localStorage.setItem('resolvia_language', v);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const [twoFA, setTwoFAState] = useState<boolean>(true);
  const setTwoFA = (v: boolean) => {
    setTwoFAState(v);
    if (typeof window !== 'undefined') localStorage.setItem('resolvia_2fa_enabled', String(v));
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const [loginNotifs, setLoginNotifsState] = useState<boolean>(true);
  const setLoginNotifs = (v: boolean) => {
    setLoginNotifsState(v);
    if (typeof window !== 'undefined') localStorage.setItem('resolvia_login_notifs', String(v));
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const [avatarUrl, setAvatarUrl] = useState<string | null>(authUser?.avatarUrl || null);
  const userSelectedAvatarRef = useRef<boolean>(false);
  const [hydrated, setHydrated] = useState<boolean>(false);

  const [mobileRevoked, setMobileRevokedState] = useState<boolean>(false);
  const [mobileRevokedConfirmed, setMobileRevokedConfirmed] = useState<boolean>(false);
  const [checkingMobileStatus, setCheckingMobileStatus] = useState<boolean>(false);
  const lastRevocationTimeRef = useRef<number>(0);
  const statusSeqRef = useRef<number>(0);

  const checkMobileStatus = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('resolvia_token') : null;
    if (!token) {
      setMobileRevokedState(false);
      setMobileRevokedConfirmed(false);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('resolvia_mobile_session_revoked');
      }
      return;
    }
    const seq = ++statusSeqRef.current;
    const reqTime = Date.now();
    setCheckingMobileStatus(true);
    try {
      const r = await fetch('/api/backend/auth/sessions/mobile-status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (seq !== statusSeqRef.current) {
        return;
      }
      if (!r.ok) {
        throw new Error(`Status check returned HTTP ${r.status}`);
      }
      const status = await r.json();

      if (seq !== statusSeqRef.current) {
        return;
      }

      // Ignore responses initiated before a successful revocation to prevent stale
      // active-session results from clearing the REVOKED state or its stored marker
      if (lastRevocationTimeRef.current >= reqTime) {
        return;
      }
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('resolvia_mobile_session_revoked');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const revokedAtMs = typeof parsed?.revokedAt === 'number'
              ? (parsed.revokedAt < 1e11 ? parsed.revokedAt * 1000 : parsed.revokedAt)
              : 0;
            if (parsed?.revoked && revokedAtMs >= reqTime) {
              return;
            }
          } catch {}
        }
      }
      if (status && status.hasMobileSession) {
        if (status.revoked) {
          setMobileRevokedState(true);
          setMobileRevokedConfirmed(true);
          if (typeof window !== 'undefined') {
            const serverRevokedAt = typeof status.revokedAt === 'number'
              ? (status.revokedAt < 1e11 ? status.revokedAt * 1000 : status.revokedAt)
              : typeof status.revoked_at === 'number'
              ? (status.revoked_at < 1e11 ? status.revoked_at * 1000 : status.revoked_at)
              : null;
            const finalRevokedAt = serverRevokedAt ?? Date.now();
            localStorage.setItem(
              'resolvia_mobile_session_revoked',
              JSON.stringify({ sessionId: status.sessionId, revoked: true, revokedAt: finalRevokedAt })
            );
          }
        } else {
          // Newer active session confirmed: clear marker and reset revoked state, exposing Revoke action
          setMobileRevokedState(false);
          setMobileRevokedConfirmed(false);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('resolvia_mobile_session_revoked');
          }
        }
      } else if (status && !status.hasMobileSession) {
        setMobileRevokedState(false);
        setMobileRevokedConfirmed(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('resolvia_mobile_session_revoked');
        }
      }
    } catch {
      // Apply error handling only if it is still the latest request
      if (seq !== statusSeqRef.current) {
        return;
      }
      // Retain stale-request guard using lastRevocationTimeRef
      if (lastRevocationTimeRef.current >= reqTime) {
        return;
      }
      // Preserve stored revocation marker and leave mobileRevokedState unchanged;
      // keep mobileRevokedConfirmed false so the UI shows UNCONFIRMED
      setMobileRevokedConfirmed(false);
    } finally {
      // Apply cleanup only if still the latest request
      if (seq === statusSeqRef.current) {
        setCheckingMobileStatus(false);
      }
    }
  }, []);

  // One-time localStorage reads for language and security preferences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem('resolvia_language');
      if (storedLang) setLanguageState(storedLang);

      const stored2FA = localStorage.getItem('resolvia_2fa_enabled');
      if (stored2FA !== null) setTwoFAState(stored2FA === 'true');

      const storedNotifs = localStorage.getItem('resolvia_login_notifs');
      if (storedNotifs !== null) setLoginNotifsState(storedNotifs === 'true');

      const storedMobileRev = localStorage.getItem('resolvia_mobile_session_revoked');
      const isMobileDevice = typeof navigator !== 'undefined' && /mobi|android|touch|mini/i.test(navigator.userAgent);

      if (isMobileDevice) {
        // If currently in an active mobile session, clear any stale revocation flag
        if (storedMobileRev !== null) {
          localStorage.removeItem('resolvia_mobile_session_revoked');
        }
        setMobileRevokedState(false);
        setMobileRevokedConfirmed(false);
      } else if (storedMobileRev !== null) {
        // Clear legacy numeric timestamp markers or raw boolean markers before session-ID matching
        const isLegacyNumeric = !isNaN(Number(storedMobileRev)) && storedMobileRev.trim() !== '';
        const isLegacyBoolean = storedMobileRev === 'true' || storedMobileRev === 'false';

        if (isLegacyNumeric || isLegacyBoolean || !storedMobileRev.trim()) {
          localStorage.removeItem('resolvia_mobile_session_revoked');
          setMobileRevokedState(false);
          setMobileRevokedConfirmed(false);
        } else {
          let parsedRecord: { sessionId?: string; revoked?: boolean } | null = null;
          try {
            parsedRecord = JSON.parse(storedMobileRev);
          } catch {
            parsedRecord = null;
          }

          // When revocation status cannot be established, clear marker and reset revoked state instead of displaying REVOKED indefinitely
          if (
            !parsedRecord ||
            typeof parsedRecord !== 'object' ||
            typeof parsedRecord.sessionId !== 'string' ||
            !parsedRecord.sessionId.trim() ||
            typeof parsedRecord.revoked !== 'boolean'
          ) {
            localStorage.removeItem('resolvia_mobile_session_revoked');
            setMobileRevokedState(false);
            setMobileRevokedConfirmed(false);
          } else {
            setMobileRevokedState(parsedRecord.revoked);
            // Stored marker does not establish confirmed revocation; show unconfirmed state until server confirms status
            setMobileRevokedConfirmed(false);
            if (!parsedRecord.revoked) {
              localStorage.removeItem('resolvia_mobile_session_revoked');
            }
          }
        }
      }

      // Check server-provided mobile-session status so reloads reflect current mobile state,
      // including after signing in again on mobile
      checkMobileStatus();
    }
    setHydrated(true);
  }, [checkMobileStatus]);

  // Initialize avatar preference without overwriting a user-selected in-memory avatar
  useEffect(() => {
    if (userSelectedAvatarRef.current) return;
    if (typeof window !== 'undefined') {
      const storedAvatar = localStorage.getItem('resolvia_custom_avatar');
      if (storedAvatar) {
        setAvatarUrl(storedAvatar);
        return;
      }
    }
    if (authUser?.avatarUrl) {
      setAvatarUrl(authUser.avatarUrl);
    }
  }, [authUser?.avatarUrl]);
  const [revokingMobile, setRevokingMobile] = useState<boolean>(false);
  const setMobileRevoked = async (v: boolean) => {
    if (!v) {
      setMobileRevokedState(false);
      setMobileRevokedConfirmed(false);
      if (typeof window !== 'undefined') localStorage.removeItem('resolvia_mobile_session_revoked');
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('resolvia_token') : null;
    if (!token) {
      alert('Authentication required. Please sign in to revoke sessions.');
      return;
    }
    setRevokingMobile(true);
    try {
      const res = await fetch('/api/backend/auth/sessions/revoke-mobile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json().catch(() => ({}));
      const now = Date.now();
      lastRevocationTimeRef.current = now;

      // When no matching mobile session was found or revoked=False, do not display REVOKED or store a marker
      if (!data.revoked) {
        setMobileRevokedState(false);
        setMobileRevokedConfirmed(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('resolvia_mobile_session_revoked');
        }
        alert(data.message || 'No active mobile session found to revoke.');
        return;
      }

      // Use server-provided mobile-session state instead of desktop token's session ID
      const mobileSessionId = data.mobileSessionId || data.sessionId || null;
      setMobileRevokedState(true);
      setMobileRevokedConfirmed(true);
      if (typeof window !== 'undefined') {
        const revokedAtMs = typeof data.revokedAt === 'number'
          ? (data.revokedAt < 1e11 ? data.revokedAt * 1000 : data.revokedAt)
          : now;
        const record = JSON.stringify({
          sessionId: mobileSessionId,
          revoked: true,
          revokedAt: revokedAtMs,
        });
        localStorage.setItem('resolvia_mobile_session_revoked', record);
      }
    } catch (err: any) {
      alert(`Failed to revoke mobile session on server: ${err?.message || 'Network error'}. State unchanged.`);
    } finally {
      setRevokingMobile(false);
    }
  };

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        userSelectedAvatarRef.current = true;
        setAvatarUrl(dataUrl);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('resolvia_custom_avatar', dataUrl);
          } catch {
            /* storage quota note */
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = (title: string) => {
    let data: any = {};
    const filename = `resolvia_${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.json`;
    if (title.includes('Profile')) {
      data = { profile: profilePrefs, account, user: authUser };
    } else if (title.includes('Case')) {
      data = { cases: cases.map((c) => ({ id: c.id, caseNumber: c.caseNumber, title: c.title, status: c.status, category: c.category, evidenceCount: c.evidence.length, votingDeadline: c.votingDeadline })) };
    } else {
      data = {
        chain: profilePrefs.blockchain.defaultNetwork,
        wallet: authUser?.wallet || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        receipts: cases.flatMap((c) => c.auditTrail).filter((a) => a.txHash && a.txHash !== '—'),
      };
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const [deletingAccount, setDeletingAccount] = useState<boolean>(false);
  const handleDeleteAccount = async () => {
    if (
      typeof window !== 'undefined' &&
      window.confirm('Are you sure you want to delete your account, wallet records, and saved workspace data? This cannot be undone.')
    ) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('resolvia_token') : null;
      if (!token) {
        alert('Authentication required. Please sign in to delete your account.');
        return;
      }
      setDeletingAccount(true);
      try {
        const acctRes = await fetch('/api/backend/auth/account', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!acctRes.ok) {
          const errData = await acctRes.json().catch(() => ({}));
          throw new Error(errData?.detail || `Failed to delete account (HTTP ${acctRes.status})`);
        }
        // Only after account deletion succeeds:
        if (typeof window !== 'undefined') {
          const keysToRemove = [
            'resolvia_token',
            'resolvia_refresh_token',
            'resolvia_app_state_v1',
            'resolvia_profile_prefs_v1',
            'resolvia_custom_avatar',
            'resolvia_user_phone',
            'resolvia_user_name',
            'resolvia_2fa_enabled',
            'resolvia_login_notifs',
            'resolvia_mobile_session_revoked',
            'resolvia_language',
          ];
          keysToRemove.forEach((k) => window.localStorage.removeItem(k));
          document.cookie = 'resolvia_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        }
        logout();
        window.location.href = '/login';
      } catch (err: any) {
        alert(`Account deletion failed: ${err?.message || 'Network error'}. You remain signed in so you can retry.`);
      } finally {
        setDeletingAccount(false);
      }
    }
  };

  const saveAccount = async () => {
    const trimmed = account.name.trim();
    const phoneTrimmed = account.phone.trim();
    if (updateProfile) {
      await updateProfile({
        name: trimmed || undefined,
        phone: phoneTrimmed || undefined,
        avatarUrl: avatarUrl || undefined,
      });
      try {
        if (typeof window !== 'undefined') {
          if (trimmed) localStorage.setItem('resolvia_user_name', trimmed);
          localStorage.setItem('resolvia_user_phone', phoneTrimmed);
          if (avatarUrl) localStorage.setItem('resolvia_custom_avatar', avatarUrl);
        }
      } catch {
        /* browser storage full / private mode quota error ignored */
      }
    }
    setProfilePrefs({
      ...profilePrefs,
      email: account.email,
      institution: account.institution,
      location: account.location,
      roleType: account.role,
      bio: account.bio,
    });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2500);
  };

  const ToggleRow = ({ label, sub, on, onChange, disabled }: { label: string; sub: string; on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div>
        <p className="text-[13px] font-bold text-slate-900 dark:text-white">{label}</p>
        <p className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300 mt-0.5">{sub}</p>
      </div>
      <Toggle
        on={on}
        onChange={(v) => {
          onChange(v);
          setSavedFlash(true);
          setTimeout(() => setSavedFlash(false), 2000);
        }}
        disabled={disabled}
      />
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Settings</h1>
            {savedFlash && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800 animate-fade-in shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Saved
              </span>
            )}
          </div>
          <p className="text-[13.5px] font-semibold text-slate-700 dark:text-slate-200 mt-1">Manage your account, preferences, and privacy settings.</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900/40 max-w-[260px]">
          <p className="italic text-[12px] font-medium text-slate-700 dark:text-slate-200">"Control your data. Contribute with confidence."</p>
          <p className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 mt-1.5">— Resolvia</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5">
        {/* Sub-nav */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 rounded-2xl p-2 h-fit">
          {NAV.map((n) => {
            const active = section === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setSection(n.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all cursor-pointer ${
                  active ? 'bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800' : 'border border-transparent hover:bg-slate-100/70 dark:hover:bg-white/5'
                }`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>{n.icon}</span>
                <span>
                  <span className={`block text-[12.5px] font-bold ${active ? 'text-violet-700 dark:text-violet-300' : 'text-slate-900 dark:text-white'}`}>{n.label}</span>
                  <span className="block text-[10.5px] font-medium text-slate-500 dark:text-slate-400">{n.sub}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="min-w-0 space-y-4">
          {/* ── Account ── */}
          {section === 'account' && (
            <>
              <div className="grid xl:grid-cols-[1fr_300px] gap-4">
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-[15px] font-black text-slate-900 dark:text-white">Profile Information</h2>
                      <p className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300 mt-0.5">Update your public profile information.</p>
                    </div>
                    <input
                      type="file"
                      ref={avatarInputRef}
                      onChange={handleAvatarChange}
                      className="hidden"
                      accept="image/*"
                    />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-700 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" /> Change Profile Picture
                    </button>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-600 text-white text-2xl font-black flex items-center justify-center shrink-0 overflow-hidden">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        account.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 flex-1">
                      <Field label="Full Name"><input value={account.name} onChange={(e) => setAccount({ ...account, name: e.target.value })} placeholder="Your full name" className={IN} /></Field>
                      <Field label="Role">
                        <select value={account.role} onChange={(e) => setAccount({ ...account, role: e.target.value as import('../../types').RoleType })} className={`${IN} cursor-pointer`}>
                          <option value="STUDENT">Student</option>
                          <option value="PROFESSIONAL">Professional</option>
                          <option value="INSTITUTION">Institution</option>
                          <option value="INDIVIDUAL">Individual</option>
                        </select>
                      </Field>
                      <Field label="Email Address">
                        <input
                          value={authUser?.email || account.email}
                          disabled
                          placeholder="Your verified email address"
                          className={`${IN} opacity-80 cursor-not-allowed bg-slate-50 dark:bg-slate-900/50`}
                        />
                      </Field>
                      <Field label="Mobile Number (for SMS & OTP Notifications)">
                        <input
                          value={account.phone}
                          onChange={(e) => setAccount({ ...account, phone: e.target.value })}
                          placeholder="e.g. +91 98765 43210"
                          className={IN}
                        />
                      </Field>
                      <Field label="Institution"><input value={account.institution} onChange={(e) => setAccount({ ...account, institution: e.target.value })} placeholder="e.g. University of Mumbai" className={IN} /></Field>
                      <Field label="Location"><input value={account.location} onChange={(e) => setAccount({ ...account, location: e.target.value })} placeholder="e.g. Mumbai, India" className={IN} /></Field>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Bio
                      </label>
                      <span className={`text-[11px] font-semibold tracking-tight ${account.bio.length > 350 ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}`}>
                        {account.bio.length} / 350
                      </span>
                    </div>
                    <textarea
                      value={account.bio}
                      onChange={(e) => setAccount({ ...account, bio: e.target.value.slice(0, 350) })}
                      rows={4}
                      placeholder="Tell us about yourself, your dispute resolution experience, or areas of interest..."
                      className="w-full block px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-[13px] font-medium leading-relaxed outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 shadow-xs resize-none transition-all min-h-[105px]"
                    />
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                      Brief summary displayed on your public profile, jury service cards, and community posts.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <BtnPrimary onClick={saveAccount}><CheckCircle2 className="w-4 h-4" /> Save Changes</BtnPrimary>
                    {savedFlash && <span className="text-[12px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Saved</span>}
                  </div>
                </Card>

                <Card className="p-5 h-fit">
                  <h2 className="text-[15px] font-black text-slate-900 dark:text-white">Account Status</h2>
                  <p className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300 mt-0.5 mb-4">Your account is in good standing.</p>
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0"><CheckCircle2 className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[12.5px] font-black text-emerald-800 dark:text-emerald-200">Verified Account</p>
                      <p className="text-[10.5px] font-medium text-emerald-600 dark:text-emerald-400">Your identity has been verified.</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-3">
                    {(() => {
                      const displayEmail = authUser?.email || (account.email && account.email !== 'alex.vance@resolvia.network' ? account.email : 'user@example.com');
                      const items = [
                        {
                          icon: <Mail className="w-4 h-4" />,
                          t: displayEmail.endsWith('@wallet.resolvia.eth') ? 'Web3 Identity' : 'Email Verified',
                          s: displayEmail.endsWith('@wallet.resolvia.eth') ? 'Web3 Authenticated (MetaMask)' : displayEmail,
                        },
                        ...(account.phone ? [{
                          icon: <Smartphone className="w-4 h-4" />,
                          t: 'Mobile Verified',
                          s: account.phone,
                        }] : []),
                        { icon: <GraduationCap className="w-4 h-4" />, t: 'Institution', s: account.institution || 'Individual Arbitrator' },
                        {
                          icon: <KeyRound className="w-4 h-4" />,
                          t: 'Sign-in method',
                          s: authUser
                            ? authUser.provider === 'wallet' || authUser.email?.endsWith('@wallet.resolvia.eth')
                              ? 'Web3 Signature (MetaMask)'
                              : `OAuth / OTP (${authUser.provider})`
                            : 'Email OTP (Verified)',
                        },
                      ];
                      return items.map((x, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">{x.icon}</div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-bold text-slate-900 dark:text-white">{x.t}</p>
                            <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 truncate">{x.s}</p>
                          </div>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        </div>
                      ));
                    })()}
                  </div>
                </Card>
              </div>
            </>
          )}

          {/* ── Security ── */}
          {section === 'security' && (
            <div className="grid xl:grid-cols-2 gap-4">
              <Card className="p-5">
                <h2 className="text-[15px] font-black text-slate-900 dark:text-white mb-1">Security Settings</h2>
                <p className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300 mb-4">Keep your account safe and secure.</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center"><KeyRound className="w-4 h-4" /></div>
                      <div>
                        <p className="text-[13px] font-bold text-slate-900 dark:text-white">Sign-in method</p>
                        <p className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300">Passwordless: email OTP or Google OAuth</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">ACTIVE</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center"><Fingerprint className="w-4 h-4" /></div>
                      <div>
                        <p className="text-[13px] font-bold text-slate-900 dark:text-white">Two-Factor Authentication (2FA)</p>
                        <p className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300">Add an extra layer of security with authenticator app</p>
                      </div>
                    </div>
                    {hydrated && <Toggle on={twoFA} onChange={setTwoFA} />}
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center"><Bell className="w-4 h-4" /></div>
                      <div>
                        <p className="text-[13px] font-bold text-slate-900 dark:text-white">Login Notifications</p>
                        <p className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300">Get notified of new logins</p>
                      </div>
                    </div>
                    {hydrated && <Toggle on={loginNotifs} onChange={setLoginNotifs} />}
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <h2 className="text-[15px] font-black text-slate-900 dark:text-white mb-4">Active Sessions</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                    <Monitor className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div className="flex-1">
                      <p className="text-[12.5px] font-bold text-slate-900 dark:text-white">This device · Desktop</p>
                      <p className="text-[10.5px] font-medium text-emerald-700 dark:text-emerald-300">Mumbai, IN · Active now</p>
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">CURRENT</span>
                  </div>
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10">
                    <Smartphone className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <div className="flex-1">
                      <p className="text-[12.5px] font-bold text-slate-900 dark:text-white">Mobile · Last active 2 days ago</p>
                      <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400">Mumbai, IN</p>
                    </div>
                    {mobileRevoked && mobileRevokedConfirmed ? (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-md">REVOKED</span>
                    ) : mobileRevoked ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">UNCONFIRMED</span>
                        <button
                          type="button"
                          onClick={() => checkMobileStatus()}
                          disabled={checkingMobileStatus}
                          className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer disabled:opacity-50"
                          title="Retry status check"
                        >
                          {checkingMobileStatus ? 'Checking…' : 'Retry'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setMobileRevoked(true)}
                        disabled={revokingMobile}
                        className="text-[11px] font-bold text-rose-500 hover:text-rose-600 cursor-pointer disabled:opacity-50"
                      >
                        {revokingMobile ? 'Revoking…' : 'Revoke'}
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mt-4 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" /> In production, sessions are JWT-based with rotating refresh tokens and device fingerprints.
                </p>
              </Card>
            </div>
          )}

          {/* ── Notifications ─ */}
          {section === 'notifications' && (
            <div className="space-y-4 max-w-2xl">
              {/* Delivery Channels */}
              <Card className="p-5">
                <h2 className="text-[15px] font-black text-slate-900 dark:text-white mb-1">Delivery Channels</h2>
                <p className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300 mb-4">Select where dispute alerts, OTPs, and jury invitations get delivered.</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                        <Mail className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-bold text-slate-900 dark:text-white">Email Dispatch</p>
                          <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">CONNECTED</span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                          {authUser?.email || account.email || 'No email configured'}
                        </p>
                      </div>
                    </div>
                    <Toggle
                      on={profilePrefs.notifications.email}
                      onChange={(v) => setProfilePrefs({ ...profilePrefs, notifications: { ...profilePrefs.notifications, email: v } })}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Smartphone className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-bold text-slate-900 dark:text-white">SMS / Mobile Dispatch</p>
                          {account.phone ? (
                            <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">ACTIVE</span>
                          ) : (
                            <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">ADD IN PROFILE</span>
                          )}
                        </div>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                          {account.phone ? `Instant SMS to ${account.phone}` : 'Add mobile number in Profile Information for instant SMS alerts'}
                        </p>
                      </div>
                    </div>
                    <Toggle
                      on={profilePrefs.notifications.sms ?? true}
                      onChange={(v) => setProfilePrefs({ ...profilePrefs, notifications: { ...profilePrefs.notifications, sms: v } })}
                      disabled={!account.phone}
                    />
                  </div>
                </div>
              </Card>

              {/* Notification Topics */}
              <Card className="p-5">
                <h2 className="text-[15px] font-black text-slate-900 dark:text-white mb-1">Notification Topics</h2>
                <p className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300 mb-4">Choose what you want to be notified about.</p>
                <ToggleRow label="Case Updates" sub="Status changes, new evidence, and verdicts" on={profilePrefs.notifications.caseUpdates} onChange={(v) => setProfilePrefs({ ...profilePrefs, notifications: { ...profilePrefs.notifications, caseUpdates: v } })} />
                <ToggleRow label="Jury Invitations" sub="Random pool invitations, voting deadlines, and juror summons" on={profilePrefs.notifications.juryInvitations} onChange={(v) => setProfilePrefs({ ...profilePrefs, notifications: { ...profilePrefs.notifications, juryInvitations: v } })} />
                <ToggleRow label="Discussion & Messages" sub="New discussion activity on your disputes and arbitrations" on={profilePrefs.notifications.inApp} onChange={(v) => setProfilePrefs({ ...profilePrefs, notifications: { ...profilePrefs.notifications, inApp: v } })} />
                <ToggleRow label="Security & Access Alerts" sub="OTP requests, new logins, 2FA events, wallet changes" on={profilePrefs.notifications.security} onChange={(v) => setProfilePrefs({ ...profilePrefs, notifications: { ...profilePrefs.notifications, security: v } })} />
                <ToggleRow label="Platform Announcements" sub="Important protocol updates and legal frameworks" on={profilePrefs.notifications.email} onChange={(v) => setProfilePrefs({ ...profilePrefs, notifications: { ...profilePrefs.notifications, email: v } })} />
                <ToggleRow label="Product & Case Digest" sub="Optional — weekly summaries and dispute resolution insights" on={profilePrefs.notifications.marketing} onChange={(v) => setProfilePrefs({ ...profilePrefs, notifications: { ...profilePrefs.notifications, marketing: v } })} />
              </Card>
            </div>
          )}

          {/* ── Jury Availability ── */}
          {section === 'jury' && (
            <Card className="p-5 max-w-2xl">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 flex items-center justify-center"><Gavel className="w-4.5 h-4.5" /></div>
                <div>
                  <h2 className="text-[15px] font-black text-slate-900 dark:text-white">Jury Availability</h2>
                  <p className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300">These settings directly control whether you are eligible for jury selection.</p>
                </div>
              </div>
              <div className="mt-4">
                <ToggleRow label="Join Jury Pool" sub="Receive invitations when you qualify (reputation + conflict checks)" on={availability.inPool} onChange={(v) => setAvailability({ ...availability, inPool: v })} />
                <div className="py-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-[13px] font-bold text-slate-900 dark:text-white mb-2">Availability state</p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { v: 'AVAILABLE', l: 'Available' },
                        { v: 'TEMPORARILY_UNAVAILABLE', l: 'Temporarily Unavailable' },
                        { v: 'OPTED_OUT', l: 'Opted Out' },
                      ] as const
                    ).map((o) => (
                      <button
                        key={o.v}
                        onClick={() => setAvailability({ ...availability, state: o.v, returnDate: o.v === 'TEMPORARILY_UNAVAILABLE' ? availability.returnDate : undefined })}
                        className={`px-4 py-2.5 rounded-xl border-2 text-[12px] font-bold transition-all cursor-pointer ${
                          availability.state === o.v
                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 shadow-sm'
                            : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
                        }`}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>
                  {availability.state === 'TEMPORARILY_UNAVAILABLE' && (
                    <div className="mt-3">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Return date</label>
                      <input
                        type="date"
                        value={availability.returnDate || ''}
                        onChange={(e) => setAvailability({ ...availability, returnDate: e.target.value })}
                        className="mt-1.5 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[12px] font-semibold text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  )}
                </div>
                <div className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-bold text-slate-900 dark:text-white">Max concurrent cases</p>
                      <p className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300">Selection will not assign you more than this at once</p>
                    </div>
                    <span className="text-[16px] font-black text-violet-700 dark:text-violet-400">{availability.maxConcurrent}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={availability.maxConcurrent}
                    onChange={(e) => setAvailability({ ...availability, maxConcurrent: Number(e.target.value) })}
                    className="w-full mt-3 accent-violet-600"
                  />
                </div>
              </div>
              <div className={`mt-4 p-4 rounded-xl border flex items-start gap-2.5 ${availability.inPool && availability.state === 'AVAILABLE' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'}`}>
                {availability.inPool && availability.state === 'AVAILABLE' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" /> : <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />}
                <p className={`text-[11.5px] font-medium leading-relaxed ${availability.inPool && availability.state === 'AVAILABLE' ? 'text-emerald-800 dark:text-emerald-200' : 'text-amber-800 dark:text-amber-200'}`}>
                  {availability.inPool && availability.state === 'AVAILABLE'
                    ? `You are eligible for selection. Selection considers reputation, category relevance, conflict checks, and a cap of ${availability.maxConcurrent} concurrent case(s).`
                    : 'You are currently not eligible for selection. Invitations respect this setting automatically — declining because you are busy never reduces your reputation.'}
                </p>
              </div>
            </Card>
          )}

          {/* ── Privacy ── */}
          {section === 'privacy' && (
            <Card className="p-5 max-w-2xl">
              <h2 className="text-[15px] font-black text-slate-900 dark:text-white mb-1">Privacy Settings</h2>
              <p className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300 mb-4">Control your visibility and data.</p>
              <ToggleRow label="Public Profile" sub="Anyone can view your profile and badges" on={profilePrefs.privacy.publicProfile} onChange={(v) => setProfilePrefs({ ...profilePrefs, privacy: { ...profilePrefs.privacy, publicProfile: v } })} />
              <ToggleRow label="Show Reputation" sub="Display your reputation score on your profile" on={profilePrefs.privacy.showReputation} onChange={(v) => setProfilePrefs({ ...profilePrefs, privacy: { ...profilePrefs.privacy, showReputation: v } })} />
              <ToggleRow label="Show Activity History" sub="Show your public case activity on your profile" on={profilePrefs.privacy.showHistory} onChange={(v) => setProfilePrefs({ ...profilePrefs, privacy: { ...profilePrefs.privacy, showHistory: v } })} />
              <ToggleRow label="Anonymise my case-study participation" sub="Publish your party role in studies with first name + initial only" on={profilePrefs.privacy.anonymizeCaseStudy} onChange={(v) => setProfilePrefs({ ...profilePrefs, privacy: { ...profilePrefs.privacy, anonymizeCaseStudy: v } })} />
              <ToggleRow label="Do not index my profile" sub="Opt out of platform search results" on={profilePrefs.privacy.doNotIndex} onChange={(v) => setProfilePrefs({ ...profilePrefs, privacy: { ...profilePrefs.privacy, doNotIndex: v } })} />
              <div className="mt-4 p-3.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/50">
                <p className="text-[11px] font-medium text-violet-900 dark:text-violet-200 leading-relaxed">
                  <strong>Juror anonymity is always on.</strong> In any jury panel you serve, only a pseudonym (e.g. Juror #A7F2) is ever
                  visible — your name, email, and wallet are protected regardless of these settings.
                </p>
              </div>
            </Card>
          )}

          {/* ── Preferences ── */}
          {section === 'preferences' && (
            <div className="grid xl:grid-cols-2 gap-4">
              <Card className="p-5">
                <h2 className="text-[15px] font-black text-slate-900 dark:text-white mb-1">Appearance &amp; Language</h2>
                <p className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300 mb-4">Customize how Resolvia looks and feels.</p>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Theme</label>
                <div className="grid grid-cols-3 gap-2.5 mt-1.5 mb-4">
                  {(['Light', 'Dark', 'System'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 text-[12px] font-bold transition-all cursor-pointer ${
                        theme === t
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 shadow-sm'
                          : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
                      }`}
                    >
                      <span className="text-base">{t === 'Light' ? '☀️' : t === 'Dark' ? '🌙' : '🖥️'}</span>
                      <span>{t}</span>
                    </button>
                  ))}
                </div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Language</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] font-semibold text-slate-900 dark:text-white outline-none">
                  <option>English (Default)</option>
                  <option>Hindi</option>
                </select>
              </Card>
              <Card className="p-5">
                <h2 className="text-[15px] font-black text-slate-900 dark:text-white mb-4">Data &amp; Account Actions</h2>
                <button
                  type="button"
                  onClick={() => {
                    handleDownload('Profile & reputation bundle');
                    setSection('data');
                  }}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/40 transition-colors text-left cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center"><Download className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-slate-900 dark:text-white">Download My Data</p>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Download profile and open data export hub</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                  className="w-full flex items-center gap-3 p-3.5 mt-3 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/30 hover:border-rose-300 dark:hover:border-rose-700 transition-colors text-left cursor-pointer disabled:opacity-50"
                >
                  <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center"><Trash2 className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-rose-600 dark:text-rose-400">
                      {deletingAccount ? 'Deleting Account…' : 'Delete Account'}
                    </p>
                    <p className="text-[11px] font-medium text-rose-500 dark:text-rose-400">Permanently delete your account and custodial wallet records</p>
                  </div>
                </button>
              </Card>
            </div>
          )}

          {/* ── Blockchain ── */}
          {section === 'blockchain' && (
            <Card className="p-5 max-w-2xl">
              <h2 className="text-[15px] font-black text-slate-900 dark:text-white mb-1">Wallet &amp; On-Chain Settings</h2>
              <p className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300 mb-4">Your on-chain decentralized identity, Web3 wallet, and network settings.</p>

              {walletMsg && (
                <div className={`p-3.5 rounded-xl mb-4 text-[12px] font-semibold flex items-center justify-between gap-2 ${
                  walletMsg.type === 'ok'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}>
                  <span>{walletMsg.text}</span>
                  <button onClick={() => setWalletMsg(null)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
                </div>
              )}

              {authUser ? (
                <div className="space-y-3 mb-5">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {authUser.metamaskAddress ? 'Personal Web3 Wallet (MetaMask)' : 'Platform Custodial Key'}
                      </p>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                        {authUser.metamaskAddress ? 'MetaMask Linked' : 'Custodial Active'}
                      </span>
                    </div>
                    <p className="font-mono text-[12.5px] font-bold text-slate-800 dark:text-slate-200 mt-1 break-all">
                      {authUser.metamaskAddress || authUser.wallet}
                    </p>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      {authUser.metamaskAddress
                        ? 'Connected to MetaMask · Voting & Case Claims signed with personal address'
                        : 'Connected · funded 0.5 ETH (testnet) · provider-assigned, custodial v1'}
                    </p>
                  </div>

                  {/* Link / Unlink Card */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 via-indigo-500/5 to-transparent border border-violet-200 dark:border-violet-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-[12.5px] font-black text-slate-800 dark:text-slate-200">
                        {authUser.metamaskAddress ? 'Manage Personal Web3 Wallet' : 'Link Personal MetaMask Wallet'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {authUser.metamaskAddress
                          ? 'Your account is linked to MetaMask. You can switch to another address or unlink.'
                          : 'Connect your personal MetaMask address to be used instead of the platform custodial key.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleLinkMetaMask}
                        disabled={walletLinking}
                        className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {walletLinking ? 'Connecting…' : authUser.metamaskAddress ? 'Switch MetaMask' : '🦊 Link MetaMask'}
                      </button>
                      {authUser.metamaskAddress && (
                        <button
                          type="button"
                          onClick={handleUnlinkMetaMask}
                          className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Unlink
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 mb-4">
                  <p className="text-[11.5px] text-amber-800 dark:text-amber-200">
                    Sign in to manage your on-chain wallet identity or link your personal MetaMask extension.
                  </p>
                </div>
              )}

              <ToggleRow label="Show wallet on my profile" sub="Display the shortened wallet address publicly" on={profilePrefs.blockchain.showWallet} onChange={(v) => setProfilePrefs({ ...profilePrefs, blockchain: { ...profilePrefs.blockchain, showWallet: v } })} />
              <ToggleRow label="Auto-approve low-risk transactions" sub="Skip confirmation for small network interactions" on={profilePrefs.blockchain.autoApprove} onChange={(v) => setProfilePrefs({ ...profilePrefs, blockchain: { ...profilePrefs.blockchain, autoApprove: v } })} />
              <div className="py-3">
                <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-2">Default network</p>
                <select value={profilePrefs.blockchain.defaultNetwork} onChange={(e) => setProfilePrefs({ ...profilePrefs, blockchain: { ...profilePrefs.blockchain, defaultNetwork: e.target.value } })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] font-semibold text-slate-900 dark:text-white outline-none">
                  <option>Local Testnet (Hardhat)</option>
                  <option>Ethereum Sepolia Testnet</option>
                  <option>Polygon Amoy Testnet</option>
                </select>
              </div>
              <p className="text-[10.5px] text-slate-400 mt-3 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Both custodial smart keys and self-custodied Web3 wallets (MetaMask) are fully supported.
              </p>
            </Card>
          )}

          {/* ── Data & Export ── */}
          {section === 'data' && (
            <div className="space-y-4 max-w-2xl">
              <Card className="p-5">
                <h2 className="text-[15px] font-black text-slate-900 dark:text-white mb-1">Export Your Data</h2>
                <p className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300 mb-4">Download a complete copy of your profile, cases, and on-chain activity.</p>
                <div className="space-y-3">
                  {[
                    { t: 'Profile & reputation bundle', s: 'JSON · includes badges, interests, reputation breakdown', size: '~18 KB' },
                    { t: 'Case history archive', s: 'All cases where you are a party or juror (party-side data only)', size: '~64 KB' },
                    { t: 'On-chain activity receipt', s: 'Commitments, reveals, and settlement tx hashes from the local testnet', size: '~9 KB' },
                  ].map((x) => (
                    <div key={x.t} className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10">
                      <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 flex items-center justify-center shrink-0"><Database className="w-4 h-4" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-bold text-slate-900 dark:text-white">{x.t}</p>
                        <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 truncate">{x.s} · {x.size}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownload(x.t)}
                        className="px-3.5 py-2 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/50 hover:bg-violet-100 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-[11px] font-bold cursor-pointer transition-colors"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="p-5 border-slate-200 dark:border-white/10">
                <h2 className="text-[15px] font-black text-slate-900 dark:text-white mb-1">Session State &amp; Local Storage</h2>
                <p className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300 mb-4">
                  Your platform workspace, active arbitration cases, jury decisions, and token balances are cached locally in this browser.
                  Reset clears local cache and restores original genesis state.
                </p>
                <button onClick={resetDemoData} className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors">
                  Clear Local Cache &amp; Reset State
                </button>
              </Card>
              <Card className="p-5 border-rose-200 dark:border-rose-900/50">
                <h2 className="text-[15px] font-black text-rose-600 dark:text-rose-400 mb-1">Danger Zone</h2>
                <p className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300 mb-4">Deleting your account removes your profile. On-chain records are immutable and remain in the ledger (they are public data).</p>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold cursor-pointer transition-colors"
                >
                  Delete Account
                </button>
              </Card>
            </div>
          )}

          {/* ── Accessibility ── */}
          {section === 'accessibility' && (
            <Card className="p-5 max-w-2xl">
              <h2 className="text-[15px] font-black text-slate-900 dark:text-white mb-1">Accessibility</h2>
              <p className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300 mb-4">Make Resolvia work for you.</p>
              <ToggleRow label="Reduced motion" sub="Minimise animations and transitions" on={profilePrefs.accessibility.reducedMotion} onChange={(v) => setProfilePrefs({ ...profilePrefs, accessibility: { ...profilePrefs.accessibility, reducedMotion: v } })} />
              <ToggleRow label="Large text" sub="Increase base font size across the app" on={profilePrefs.accessibility.largeText} onChange={(v) => setProfilePrefs({ ...profilePrefs, accessibility: { ...profilePrefs.accessibility, largeText: v } })} />
              <ToggleRow label="High contrast" sub="Stronger borders and text contrast" on={profilePrefs.accessibility.highContrast} onChange={(v) => setProfilePrefs({ ...profilePrefs, accessibility: { ...profilePrefs.accessibility, highContrast: v } })} />
              <ToggleRow label="Screen-reader announcements" sub="Verbose announcements for live regions" on={profilePrefs.accessibility.announcements} onChange={(v) => setProfilePrefs({ ...profilePrefs, accessibility: { ...profilePrefs.accessibility, announcements: v } })} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

const IN = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-[13px] font-medium outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 shadow-xs transition-all';

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
