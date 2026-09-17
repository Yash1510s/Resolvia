'use client';

import React, { useState } from 'react';
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

export default function SettingsPage() {
  const { profilePrefs, setProfilePrefs, availability, setAvailability, resetDemoData } = useApp();
  const { user: authUser } = useAuth();
  const [section, setSection] = useState<Section>('account');
  const [account, setAccount] = useState<{ name: string; email: string; institution: string; location: string; role: import('../../types').RoleType; bio: string }>({
    name: authUser?.name || 'Community Member',
    email: profilePrefs.email,
    institution: profilePrefs.institution,
    location: profilePrefs.location,
    role: profilePrefs.roleType || 'STUDENT',
    bio: profilePrefs.bio,
  });
  const [savedFlash, setSavedFlash] = useState(false);
  const [theme, setTheme] = useState('Light');
  const [language, setLanguage] = useState('English (Default)');
  const [twoFA, setTwoFA] = useState(true);
  const [loginNotifs, setLoginNotifs] = useState(true);

  const saveAccount = () => {
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
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-50 last:border-0">
      <div>
        <p className="text-[13px] font-bold text-slate-800">{label}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
      </div>
      <Toggle on={on} onChange={onChange} disabled={disabled} />
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Settings</h1>
          <p className="text-[13px] text-slate-500 mt-1">Manage your account, preferences, and privacy settings.</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-violet-50 border border-violet-100 max-w-[260px]">
          <p className="italic text-[12px] text-slate-600">"Control your data. Contribute with confidence."</p>
          <p className="text-[10px] text-slate-400 mt-1.5">— Resolvia</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5">
        {/* Sub-nav */}
        <div className="bg-white border border-slate-200 rounded-2xl p-2 h-fit">
          {NAV.map((n) => {
            const active = section === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setSection(n.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all ${
                  active ? 'bg-violet-50 border border-violet-200' : 'border border-transparent hover:bg-slate-50'
                }`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{n.icon}</span>
                <span>
                  <span className={`block text-[12.5px] font-bold ${active ? 'text-violet-700' : 'text-slate-700'}`}>{n.label}</span>
                  <span className="block text-[10px] text-slate-400">{n.sub}</span>
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
                      <h2 className="text-[15px] font-black text-slate-900">Profile Information</h2>
                      <p className="text-[11px] text-slate-400 mt-0.5">Update your public profile information.</p>
                    </div>
                    <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-700 text-[11px] font-bold transition-colors">
                      <Camera className="w-3.5 h-3.5" /> Change Profile Picture
                    </button>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-600 text-white text-2xl font-black flex items-center justify-center shrink-0">
                      {account.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 flex-1">
                      <Field label="Full Name"><input value={account.name} onChange={(e) => setAccount({ ...account, name: e.target.value })} className={IN} /></Field>
                      <Field label="Role">
                        <select value={account.role} onChange={(e) => setAccount({ ...account, role: e.target.value as import('../../types').RoleType })} className={IN}>
                          <option value="STUDENT">Student</option>
                          <option value="PROFESSIONAL">Professional</option>
                          <option value="INSTITUTION">Institution</option>
                          <option value="INDIVIDUAL">Individual</option>
                        </select>
                      </Field>
                      <Field label="Institution"><input value={account.institution} onChange={(e) => setAccount({ ...account, institution: e.target.value })} className={IN} /></Field>
                      <Field label="Location"><input value={account.location} onChange={(e) => setAccount({ ...account, location: e.target.value })} className={IN} /></Field>
                    </div>
                  </div>
                  <Field label={`Bio (${account.bio.length}/200)`} className="mt-3">
                    <textarea value={account.bio} onChange={(e) => setAccount({ ...account, bio: e.target.value.slice(0, 200) })} rows={2} className="in resize-none" />
                  </Field>
                  <div className="mt-4 flex items-center gap-3">
                    <BtnPrimary onClick={saveAccount}><CheckCircle2 className="w-4 h-4" /> Save Changes</BtnPrimary>
                    {savedFlash && <span className="text-[12px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Saved</span>}
                  </div>
                </Card>

                <Card className="p-5 h-fit">
                  <h2 className="text-[15px] font-black text-slate-900">Account Status</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5 mb-4">Your account is in good standing.</p>
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0"><CheckCircle2 className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[12.5px] font-black text-emerald-800">Verified Account</p>
                      <p className="text-[10.5px] text-emerald-600">Your identity has been verified.</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-3">
                    {[
                      { icon: <Mail className="w-4 h-4" />, t: 'Email Verified', s: account.email },
                      { icon: <GraduationCap className="w-4 h-4" />, t: 'Institution', s: account.institution },
                      { icon: <KeyRound className="w-4 h-4" />, t: 'Sign-in method', s: authUser ? `OAuth / OTP (${authUser.provider})` : 'Email OTP (demo)' },
                    ].map((x, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">{x.icon}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-bold text-slate-700">{x.t}</p>
                          <p className="text-[10.5px] text-slate-400 truncate">{x.s}</p>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </>
          )}

          {/* ── Security ── */}
          {section === 'security' && (
            <div className="grid xl:grid-cols-2 gap-4">
              <Card className="p-5">
                <h2 className="text-[15px] font-black text-slate-900 mb-1">Security Settings</h2>
                <p className="text-[11px] text-slate-400 mb-4">Keep your account safe and secure.</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center"><KeyRound className="w-4 h-4" /></div>
                      <div>
                        <p className="text-[13px] font-bold text-slate-800">Sign-in method</p>
                        <p className="text-[11px] text-slate-400">Passwordless: email OTP or Google OAuth</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">ACTIVE</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center"><Fingerprint className="w-4 h-4" /></div>
                      <div>
                        <p className="text-[13px] font-bold text-slate-800">Two-Factor Authentication (2FA)</p>
                        <p className="text-[11px] text-slate-400">Add an extra layer of security (prototype)</p>
                      </div>
                    </div>
                    <Toggle on={twoFA} onChange={setTwoFA} />
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center"><Bell className="w-4 h-4" /></div>
                      <div>
                        <p className="text-[13px] font-bold text-slate-800">Login Notifications</p>
                        <p className="text-[11px] text-slate-400">Get notified of new logins</p>
                      </div>
                    </div>
                    <Toggle on={loginNotifs} onChange={setLoginNotifs} />
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <h2 className="text-[15px] font-black text-slate-900 mb-4">Active Sessions</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
                    <Monitor className="w-5 h-5 text-emerald-600" />
                    <div className="flex-1">
                      <p className="text-[12.5px] font-bold text-slate-800">This device · Desktop</p>
                      <p className="text-[10.5px] text-slate-400">Mumbai, IN · Active now</p>
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">CURRENT</span>
                  </div>
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <Smartphone className="w-5 h-5 text-slate-400" />
                    <div className="flex-1">
                      <p className="text-[12.5px] font-bold text-slate-800">Mobile · Last active 2 days ago</p>
                      <p className="text-[10.5px] text-slate-400">Mumbai, IN</p>
                    </div>
                    <button className="text-[11px] font-bold text-rose-500 hover:text-rose-600">Revoke</button>
                  </div>
                </div>
                <p className="text-[10.5px] text-slate-400 mt-4 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" /> In production, sessions are JWT-based with rotating refresh tokens and device fingerprints.
                </p>
              </Card>
            </div>
          )}

          {/* ── Notifications ─ */}
          {section === 'notifications' && (
            <Card className="p-5 max-w-2xl">
              <h2 className="text-[15px] font-black text-slate-900 mb-1">Notification Preferences</h2>
              <p className="text-[11px] text-slate-400 mb-4">Choose what you want to be notified about.</p>
              <ToggleRow label="Case Updates" sub="Status changes, new evidence, verdicts" on={profilePrefs.notifications.caseUpdates} onChange={(v) => setProfilePrefs({ ...profilePrefs, notifications: { ...profilePrefs.notifications, caseUpdates: v } })} />
              <ToggleRow label="Jury Invitations" sub="Invitations and jury related updates" on={profilePrefs.notifications.juryInvitations} onChange={(v) => setProfilePrefs({ ...profilePrefs, notifications: { ...profilePrefs.notifications, juryInvitations: v } })} />
              <ToggleRow label="Messages" sub="New discussion activity on your closed cases" on={profilePrefs.notifications.inApp} onChange={(v) => setProfilePrefs({ ...profilePrefs, notifications: { ...profilePrefs.notifications, inApp: v } })} />
              <ToggleRow label="Security Alerts" sub="New logins, 2FA events, wallet changes" on={profilePrefs.notifications.security} onChange={(v) => setProfilePrefs({ ...profilePrefs, notifications: { ...profilePrefs.notifications, security: v } })} />
              <ToggleRow label="Platform Announcements" sub="Important news and feature updates" on={profilePrefs.notifications.email} onChange={(v) => setProfilePrefs({ ...profilePrefs, notifications: { ...profilePrefs.notifications, email: v } })} />
              <ToggleRow label="Product Newsletters" sub="Optional — tips, new case studies, community highlights" on={profilePrefs.notifications.marketing} onChange={(v) => setProfilePrefs({ ...profilePrefs, notifications: { ...profilePrefs.notifications, marketing: v } })} />
            </Card>
          )}

          {/* ── Jury Availability ── */}
          {section === 'jury' && (
            <Card className="p-5 max-w-2xl">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center"><Gavel className="w-4.5 h-4.5" /></div>
                <div>
                  <h2 className="text-[15px] font-black text-slate-900">Jury Availability</h2>
                  <p className="text-[11px] text-slate-400">These settings directly control whether you are eligible for jury selection.</p>
                </div>
              </div>
              <div className="mt-4">
                <ToggleRow label="Join Jury Pool" sub="Receive invitations when you qualify (reputation + conflict checks)" on={availability.inPool} onChange={(v) => setAvailability({ ...availability, inPool: v })} />
                <div className="py-3 border-b border-slate-50">
                  <p className="text-[13px] font-bold text-slate-800 mb-2">Availability state</p>
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
                        className={`px-4 py-2.5 rounded-xl border-2 text-[12px] font-bold transition-all ${availability.state === o.v ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>
                  {availability.state === 'TEMPORARILY_UNAVAILABLE' && (
                    <div className="mt-3">
                      <label className="text-[11px] font-bold text-slate-500">Return date</label>
                      <input
                        type="date"
                        value={availability.returnDate || ''}
                        onChange={(e) => setAvailability({ ...availability, returnDate: e.target.value })}
                        className="mt-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-[12px] outline-none"
                      />
                    </div>
                  )}
                </div>
                <div className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-bold text-slate-800">Max concurrent cases</p>
                      <p className="text-[11px] text-slate-400">Selection will not assign you more than this at once</p>
                    </div>
                    <span className="text-[16px] font-black text-violet-700">{availability.maxConcurrent}</span>
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
              <div className={`mt-4 p-4 rounded-xl border flex items-start gap-2.5 ${availability.inPool && availability.state === 'AVAILABLE' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                {availability.inPool && availability.state === 'AVAILABLE' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                <p className={`text-[11.5px] leading-relaxed ${availability.inPool && availability.state === 'AVAILABLE' ? 'text-emerald-800' : 'text-amber-800'}`}>
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
              <h2 className="text-[15px] font-black text-slate-900 mb-1">Privacy Settings</h2>
              <p className="text-[11px] text-slate-400 mb-4">Control your visibility and data.</p>
              <ToggleRow label="Public Profile" sub="Anyone can view your profile and badges" on={profilePrefs.privacy.publicProfile} onChange={(v) => setProfilePrefs({ ...profilePrefs, privacy: { ...profilePrefs.privacy, publicProfile: v } })} />
              <ToggleRow label="Show Reputation" sub="Display your reputation score on your profile" on={profilePrefs.privacy.showReputation} onChange={(v) => setProfilePrefs({ ...profilePrefs, privacy: { ...profilePrefs.privacy, showReputation: v } })} />
              <ToggleRow label="Show Activity History" sub="Show your public case activity on your profile" on={profilePrefs.privacy.showHistory} onChange={(v) => setProfilePrefs({ ...profilePrefs, privacy: { ...profilePrefs.privacy, showHistory: v } })} />
              <ToggleRow label="Anonymise my case-study participation" sub="Publish your party role in studies with first name + initial only" on={profilePrefs.privacy.anonymizeCaseStudy} onChange={(v) => setProfilePrefs({ ...profilePrefs, privacy: { ...profilePrefs.privacy, anonymizeCaseStudy: v } })} />
              <ToggleRow label="Do not index my profile" sub="Opt out of platform search results" on={profilePrefs.privacy.doNotIndex} onChange={(v) => setProfilePrefs({ ...profilePrefs, privacy: { ...profilePrefs.privacy, doNotIndex: v } })} />
              <div className="mt-4 p-3.5 rounded-xl bg-violet-50 border border-violet-100">
                <p className="text-[11px] text-violet-900 leading-relaxed">
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
                <h2 className="text-[15px] font-black text-slate-900 mb-1">Appearance &amp; Language</h2>
                <p className="text-[11px] text-slate-400 mb-4">Customize how Resolvia looks and feels.</p>
                <label className="text-[11px] font-bold text-slate-500">Theme</label>
                <div className="grid grid-cols-3 gap-2 mt-1.5 mb-4">
                  {['Light', 'Dark', 'System'].map((t) => (
                    <button key={t} onClick={() => setTheme(t)} className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 text-[12px] font-bold transition-all ${theme === t ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                      {t === 'Light' ? '☀️' : t === 'Dark' ? '🌙' : '🖥️'} {t}
                    </button>
                  ))}
                </div>
                <label className="text-[11px] font-bold text-slate-500">Language</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-600 outline-none">
                  <option>English (Default)</option>
                  <option>Hindi</option>
                </select>
              </Card>
              <Card className="p-5">
                <h2 className="text-[15px] font-black text-slate-900 mb-4">Data &amp; Account Actions</h2>
                <button onClick={() => setSection('data')} className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-violet-300 transition-colors text-left">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center"><Download className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-slate-800">Download My Data</p>
                    <p className="text-[11px] text-slate-400">Get a copy of your data</p>
                  </div>
                </button>
                <button onClick={() => setSection('data')} className="w-full flex items-center gap-3 p-3.5 mt-3 rounded-xl border border-rose-100 hover:border-rose-300 bg-rose-50/40 transition-colors text-left">
                  <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-500 flex items-center justify-center"><Trash2 className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-rose-600">Delete Account</p>
                    <p className="text-[11px] text-rose-400">Permanently delete your account</p>
                  </div>
                </button>
              </Card>
            </div>
          )}

          {/* ── Blockchain ── */}
          {section === 'blockchain' && (
            <Card className="p-5 max-w-2xl">
              <h2 className="text-[15px] font-black text-slate-900 mb-1">Wallet &amp; On-Chain Settings</h2>
              <p className="text-[11px] text-slate-400 mb-4">Your on-chain identity on the local testnet.</p>
              {authUser ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 mb-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Assigned wallet</p>
                  <p className="font-mono text-[12.5px] font-bold text-slate-800 mt-1 break-all">{authUser.wallet}</p>
                  <p className="text-[10.5px] text-slate-400 mt-1.5 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Connected · funded 0.5 ETH (testnet) · provider-assigned, custodial v1</p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 mb-4">
                  <p className="text-[11.5px] text-amber-800">Sign in to receive your platform-assigned on-chain identity. No MetaMask required — a wallet is provisioned for you and seeded with testnet funds.</p>
                </div>
              )}
              <ToggleRow label="Show wallet on my profile" sub="Display the shortened wallet address publicly" on={profilePrefs.blockchain.showWallet} onChange={(v) => setProfilePrefs({ ...profilePrefs, blockchain: { ...profilePrefs.blockchain, showWallet: v } })} />
              <ToggleRow label="Auto-approve low-risk transactions" sub="Skip confirmation for stakes & votes (prototype)" on={profilePrefs.blockchain.autoApprove} onChange={(v) => setProfilePrefs({ ...profilePrefs, blockchain: { ...profilePrefs.blockchain, autoApprove: v } })} />
              <div className="py-3">
                <p className="text-[13px] font-bold text-slate-800 mb-2">Default network</p>
                <select value={profilePrefs.blockchain.defaultNetwork} onChange={(e) => setProfilePrefs({ ...profilePrefs, blockchain: { ...profilePrefs.blockchain, defaultNetwork: e.target.value } })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-600 outline-none">
                  <option>Local Testnet (Hardhat)</option>
                  <option>Testnet (coming soon)</option>
                </select>
              </div>
              <p className="text-[10.5px] text-slate-400 mt-3 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" /> ERC-4337 account abstraction for self-custody is planned for a later milestone.
              </p>
            </Card>
          )}

          {/* ── Data & Export ── */}
          {section === 'data' && (
            <div className="space-y-4 max-w-2xl">
              <Card className="p-5">
                <h2 className="text-[15px] font-black text-slate-900 mb-1">Export Your Data</h2>
                <p className="text-[11px] text-slate-400 mb-4">Download a complete copy of your profile, cases, and on-chain activity.</p>
                <div className="space-y-3">
                  {[
                    { t: 'Profile & reputation bundle', s: 'JSON · includes badges, interests, reputation breakdown', size: '~18 KB' },
                    { t: 'Case history archive', s: 'All cases where you are a party or juror (party-side data only)', size: '~64 KB' },
                    { t: 'On-chain activity receipt', s: 'Commitments, reveals, and settlement tx hashes from the local testnet', size: '~9 KB' },
                  ].map((x) => (
                    <div key={x.t} className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100">
                      <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center"><Database className="w-4 h-4" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-bold text-slate-800">{x.t}</p>
                        <p className="text-[10.5px] text-slate-400 truncate">{x.s} · {x.size}</p>
                      </div>
                      <button className="px-3.5 py-2 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-700 text-[11px] font-bold">Download</button>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="p-5 border-amber-100">
                <h2 className="text-[15px] font-black text-amber-600 mb-1">Demo Data</h2>
                <p className="text-[11px] text-slate-400 mb-4">
                  Your in-app progress (cases, votes, jury decisions, balance) is saved locally so a refresh doesn&apos;t lose it.
                  Reset restores the original demo dataset and re-opens all deadlines.
                </p>
                <button onClick={resetDemoData} className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-bold">
                  Reset demo data
                </button>
              </Card>
              <Card className="p-5 border-rose-100">
                <h2 className="text-[15px] font-black text-rose-600 mb-1">Danger Zone</h2>
                <p className="text-[11px] text-slate-400 mb-4">Deleting your account removes your profile. On-chain records are immutable and remain in the ledger (they are public data).</p>
                <button className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-bold">Delete Account (prototype)</button>
              </Card>
            </div>
          )}

          {/* ── Accessibility ── */}
          {section === 'accessibility' && (
            <Card className="p-5 max-w-2xl">
              <h2 className="text-[15px] font-black text-slate-900 mb-1">Accessibility</h2>
              <p className="text-[11px] text-slate-400 mb-4">Make Resolvia work for you.</p>
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

const IN = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[12px] outline-none bg-white text-slate-700 focus:border-violet-400 transition-colors';

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
