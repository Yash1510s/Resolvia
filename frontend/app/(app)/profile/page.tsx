'use client';

import React, { useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import {
  BadgeCheck,
  MapPin,
  GraduationCap,
  Camera,
  Pencil,
  Shield,
  TrendingUp,
  FileText,
  Gavel,
  MessageSquare,
  BookOpen,
  Award,
  Star,
  Check,
  X,
  ArrowRight,
  ThumbsUp,
  Link2,
  Mail,
  Calendar,
  Users,
  Sparkles,
  FileCheck,
  Scale,
} from 'lucide-react';
import { useApp } from '../../lib/app-context';
import { useAuth } from '../../lib/auth-context';
import { isClosed } from '../../lib/caseLifecycle';
import { Card, Chip, BtnPrimary, categoryLabel, fmtDate, shortCaseId, statusTone } from '../../components/ui';

type Tab = 'overview' | 'activity' | 'cases' | 'contributions' | 'achievements' | 'settings';

export default function ProfilePage() {
  const { cases, jurorHistory, profilePrefs, setProfilePrefs } = useApp();
  const { user: authUser } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(profilePrefs);
  const [avatarImg, setAvatarImg] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const coverThemes = [
    'from-[#101a33] via-[#1c2447] to-[#4a3a7c]',
    'from-[#0b3c49] via-[#145266] to-[#3a7d8c]',
    'from-[#3b1238] via-[#521c4e] to-[#75326d]',
    'from-[#1a2e1d] via-[#244229] to-[#3f6b47]',
  ];
  const [coverGradient, setCoverGradient] = useState(coverThemes[0]);

  const cycleCover = () => {
    setCoverGradient((prev) => {
      const idx = coverThemes.indexOf(prev);
      return coverThemes[(idx + 1) % coverThemes.length];
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatarImg(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const displayName = authUser ? authUser.name : profilePrefs.email.split('@')[0] || 'Community Member';
  const myCases = cases.filter((c) => c.myRole);
  const closed = myCases.filter((c) => isClosed(c));
  const asJuror = myCases.filter((c) => c.myRole === 'JUROR');
  const rep = 820;

  const contributions = useMemo(() => {
    const list: { icon: React.ReactNode; tone: string; text: string; xp: number; when: string }[] = [];
    for (const c of myCases.filter((c) => c.myRole !== 'JUROR')) {
      list.push({ icon: <FileText className="w-4 h-4" />, tone: 'bg-violet-100 text-violet-600', text: `Filed case ${shortCaseId(c.id)} · ${c.title}`, xp: 15, when: fmtDate(c.createdAt).split(',')[0] });
    }
    for (const h of jurorHistory) {
      list.push({ icon: <Gavel className="w-4 h-4" />, tone: 'bg-blue-100 text-blue-600', text: `Participated as juror in ${shortCaseId(h.caseId)}`, xp: h.reputationDelta, when: fmtDate(h.completedAt).split(',')[0] });
    }
    list.push({ icon: <ThumbsUp className="w-4 h-4" />, tone: 'bg-emerald-100 text-emerald-600', text: 'Helpful comment in a closed case discussion', xp: 15, when: '3 days ago' });
    list.push({ icon: <FileCheck className="w-4 h-4" />, tone: 'bg-emerald-100 text-emerald-600', text: 'Evidence verified by another juror', xp: 25, when: '5 days ago' });
    return list.slice(0, 6);
  }, [myCases, jurorHistory]);

  const badges = [
    { name: 'Active Juror', tone: 'from-violet-500 to-indigo-500', icon: <Shield className="w-5 h-5" /> },
    { name: 'Helpful Member', tone: 'from-orange-400 to-amber-500', icon: <MessageSquare className="w-5 h-5" /> },
    { name: 'Verified Contributor', tone: 'from-emerald-400 to-teal-500', icon: <Check className="w-5 h-5" /> },
    { name: 'Top 20%', tone: 'from-amber-400 to-orange-500', icon: <Award className="w-5 h-5" /> },
  ];

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Users className="w-4 h-4" /> },
    { id: 'activity', label: 'My Activity', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'cases', label: 'Cases', icon: <FileText className="w-4 h-4" /> },
    { id: 'contributions', label: 'Contributions', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'achievements', label: 'Achievements', icon: <Award className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Pencil className="w-4 h-4" /> },
  ];

  const saveProfile = () => {
    setProfilePrefs(form);
    setEditing(false);
  };

  return (
    <div>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        {/* ═══ Main ══ */}
        <div className="min-w-0 space-y-4">
          {/* Cover */}
          <div className="relative h-40 rounded-2xl overflow-hidden bg-[#101a33]">
            <div className={`absolute inset-0 bg-gradient-to-r ${coverGradient} transition-all duration-500`} />
            <div className="absolute -left-10 -top-10 w-48 h-48 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="absolute right-0 bottom-0 left-0 h-16 bg-gradient-to-t from-[#0d1526]/80 to-transparent" />
            <div className="absolute right-5 top-4 flex flex-col items-end">
              <p className="italic text-[13px] text-slate-200 text-right max-w-xs leading-relaxed hidden sm:block">"Better communities are built by fairer people."</p>
              <p className="text-[10px] text-slate-400 mt-1 hidden sm:block">— Resolvia</p>
              <button
                type="button"
                onClick={cycleCover}
                className="mt-2.5 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/40 backdrop-blur border border-white/10 text-white text-[11px] font-bold hover:bg-black/60 transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" /> Edit Cover
              </button>
            </div>
          </div>

          {/* Identity card */}
          <Card className="p-5 -mt-10 relative mx-4 sm:mx-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="relative -mt-14">
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarChange}
                  className="hidden"
                  accept="image/*"
                />
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-600 border-4 border-white flex items-center justify-center text-white text-3xl font-black shadow-lg overflow-hidden">
                  {avatarImg ? (
                    <img src={avatarImg} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full bg-slate-700 hover:bg-slate-900 text-white flex items-center justify-center border-2 border-white transition-colors cursor-pointer"
                  title="Change photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 min-w-[220px] pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-[20px] font-black text-slate-900">{displayName}</h1>
                  <BadgeCheck className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-[12px] font-bold text-slate-600 mt-1 flex items-center gap-1.5 flex-wrap">
                  <GraduationCap className="w-3.5 h-3.5 text-violet-600" /> {form.roleType === 'PROFESSIONAL' ? 'Professional' : form.roleType === 'INSTITUTION' ? 'Institution' : 'Student'}
                  <span className="text-slate-300">|</span> {form.institution}
                </p>
                <p className="text-[11.5px] text-slate-400 mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {form.location}
                </p>
              </div>
              <button
                onClick={() => {
                  setForm(profilePrefs);
                  setEditing(!editing);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
            {!editing && <p className="text-[12.5px] text-slate-600 mt-3">{form.bio}</p>}
            {editing && (
              <div className="mt-3 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Role</label>
                    <select value={form.roleType} onChange={(e) => setForm({ ...form, roleType: e.target.value as typeof form.roleType })} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold outline-none">
                      <option value="STUDENT">Student</option>
                      <option value="PROFESSIONAL">Professional</option>
                      <option value="INSTITUTION">Institution</option>
                      <option value="INDIVIDUAL">Individual</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Institution</label>
                    <input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Location</label>
                    <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email</label>
                    <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bio</label>
                  <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={2} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] outline-none resize-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Interests (comma separated)</label>
                  <input
                    value={form.interests.join(', ')}
                    onChange={(e) => setForm({ ...form, interests: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <BtnPrimary onClick={saveProfile} className="!py-2">
                    <Check className="w-3.5 h-3.5" /> Save Changes
                  </BtnPrimary>
                  <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1.5">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              </div>
            )}
          </Card>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 bg-white border border-slate-200 rounded-2xl p-1.5">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all ${tab === t.id ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <span className={tab === t.id ? 'text-white' : 'text-slate-400'}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Overview ─ */}
          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-5">
                  <h3 className="text-[14px] font-black text-slate-900 flex items-center gap-2 mb-4">
                    <span className="w-7 h-7 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center"><Shield className="w-4 h-4" /></span>
                    Reputation Overview
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center shrink-0">
                      <Star className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="text-[26px] font-black text-slate-900 leading-none">{rep}</p>
                      <p className="text-[11px] font-semibold text-slate-400 mt-1">Reputation Score</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-[15px] font-black text-emerald-600">↑ +120</p>
                      <p className="text-[10px] text-slate-400">(Last 30 days)</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" style={{ width: `${(rep / 1000) * 100}%` }} />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10.5px] font-bold text-slate-500">Top 20% of users</span>
                      <span className="text-[10.5px] font-bold text-slate-400">{rep} / 1000</span>
                    </div>
                  </div>
                </Card>
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[14px] font-black text-slate-900 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center"><TrendingUp className="w-4 h-4" /></span>
                      Activity Stats
                    </h3>
                    <span className="text-[10.5px] font-bold text-slate-400">Last 6 Months</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2.5">
                    {[
                      { v: myCases.filter((c) => c.myRole === 'CLAIMANT').length, l: 'Cases Created', icon: <FileText className="w-4 h-4" /> },
                      { v: asJuror.length, l: 'As a Juror', icon: <Gavel className="w-4 h-4" /> },
                      { v: 18, l: 'Helpful Answers', icon: <MessageSquare className="w-4 h-4" /> },
                      { v: 7, l: 'Case Studies Read', icon: <BookOpen className="w-4 h-4" /> },
                    ].map((s) => (
                      <div key={s.l} className="rounded-xl border border-slate-100 p-3 text-center">
                        <div className="w-8 h-8 mx-auto rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">{s.icon}</div>
                        <p className="text-[16px] font-black text-slate-900 mt-2 leading-none">{s.v}</p>
                        <p className="text-[9px] font-semibold text-slate-400 mt-1 leading-tight">{s.l}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[14px] font-black text-slate-900">Recent Cases</h3>
                    <Link href="/cases" className="flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:text-violet-700">View All <ArrowRight className="w-3 h-3" /></Link>
                  </div>
                  <div className="space-y-3">
                    {myCases.slice(0, 5).map((c) => (
                      <Link key={c.id} href={c.myRole === 'JUROR' && !isClosed(c) ? `/jury/${c.id}` : `/cases/${c.id}`} className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                          <Scale className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-bold text-slate-800 group-hover:text-violet-700 transition-colors">
                            <span className="font-mono text-violet-700">{shortCaseId(c.id)}</span> {c.title}
                          </p>
                          <p className="text-[10.5px] text-slate-400 truncate mt-0.5">{c.claimSummary}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Chip tone={statusTone(c.status)}>{isClosed(c) ? 'Closed' : 'In Review'}</Chip>
                          <Chip tone={c.myRole === 'JUROR' ? 'violet' : c.myRole === 'RESPONDENT' ? 'orange' : 'blue'}>{c.myRole === 'JUROR' ? 'Juror' : c.myRole === 'RESPONDENT' ? 'Respondent' : 'Claimant'}</Chip>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0 hidden sm:block">{fmtDate(c.createdAt).split(',')[0]}</span>
                      </Link>
                    ))}
                    {myCases.length === 0 && <p className="text-[12px] text-slate-400 py-4 text-center">No cases yet.</p>}
                  </div>
                </Card>

                <Card className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[14px] font-black text-slate-900">Recent Contributions</h3>
                    <Link href="/reputation" className="flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:text-violet-700">View All <ArrowRight className="w-3 h-3" /></Link>
                  </div>
                  <div className="space-y-3">
                    {contributions.map((x, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${x.tone}`}>{x.icon}</div>
                        <p className="text-[12px] font-semibold text-slate-700 flex-1 min-w-0 truncate">{x.text}</p>
                        <span className="text-[11px] font-black text-emerald-600 shrink-0">+{x.xp}</span>
                        <span className="text-[10px] text-slate-400 shrink-0 w-20 text-right">{x.when}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ── Activity ── */}
          {tab === 'activity' && (
            <Card className="p-5">
              <h3 className="text-[14px] font-black text-slate-900 mb-4">Activity Timeline</h3>
              <ol className="relative border-l-2 border-slate-100 ml-2.5 space-y-5">
                {[
                  ...myCases.map((c) => ({ t: fmtDate(c.createdAt, true), text: `Filed / joined case ${shortCaseId(c.id)} · ${c.title}`, icon: <FileText className="w-3.5 h-3.5" /> })),
                  ...jurorHistory.map((h) => ({ t: fmtDate(h.completedAt, true), text: `Served as juror in ${shortCaseId(h.caseId)} — voted ${h.voteChoice.replace(/_/g, ' ')}`, icon: <Gavel className="w-3.5 h-3.5" /> })),
                ]
                  .sort((a, b) => new Date(b.t).getTime() - new Date(a.t).getTime())
                  .slice(0, 8)
                  .map((x, i) => (
                    <li key={i} className="relative pl-6">
                      <span className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-white border-2 border-violet-500 flex items-center justify-center text-violet-600">{x.icon}</span>
                      <p className="text-[10.5px] font-bold text-slate-400">{x.t}</p>
                      <p className="text-[12.5px] font-semibold text-slate-700 mt-0.5">{x.text}</p>
                    </li>
                  ))}
              </ol>
            </Card>
          )}

          {/* ── Cases ── */}
          {tab === 'cases' && (
            <Card className="p-5">
              <h3 className="text-[14px] font-black text-slate-900 mb-4">All My Cases ({myCases.length})</h3>
              <div className="space-y-2.5">
                {myCases.map((c) => (
                  <Link key={c.id} href={c.myRole === 'JUROR' && !isClosed(c) ? `/jury/${c.id}` : `/cases/${c.id}`} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-violet-200 transition-colors">
                    <span className="font-mono text-[12px] font-black text-violet-700 w-16 shrink-0">{shortCaseId(c.id)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-bold text-slate-800 truncate">{c.title}</p>
                      <p className="text-[10.5px] text-slate-400 truncate">{c.claimSummary}</p>
                    </div>
                    <Chip tone={categoryLabel(c.category).tone} className="hidden sm:inline-flex">{categoryLabel(c.category).label}</Chip>
                    <Chip tone={statusTone(c.status)}>{isClosed(c) ? 'Closed' : c.status.replace(/_/g, ' ')}</Chip>
                  </Link>
                ))}
                {myCases.length === 0 && <p className="text-[12px] text-slate-400 py-4 text-center">No cases yet.</p>}
              </div>
            </Card>
          )}

          {/* ── Contributions ─ */}
          {tab === 'contributions' && (
            <Card className="p-5">
              <h3 className="text-[14px] font-black text-slate-900 mb-4">All Contributions</h3>
              <div className="space-y-3">
                {contributions.map((x, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${x.tone}`}>{x.icon}</div>
                    <p className="text-[12.5px] font-semibold text-slate-700 flex-1">{x.text}</p>
                    <span className="text-[12px] font-black text-emerald-600">+{x.xp} XP</span>
                    <span className="text-[10.5px] text-slate-400 w-20 text-right">{x.when}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ── Achievements ── */}
          {tab === 'achievements' && (
            <Card className="p-5">
              <h3 className="text-[14px] font-black text-slate-900 mb-4">Badges &amp; Achievements</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {badges.map((b) => (
                  <div key={b.name} className="p-4 rounded-2xl border border-slate-100 text-center">
                    <div className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr ${b.tone} text-white flex items-center justify-center shadow-md`}>{b.icon}</div>
                    <p className="text-[12px] font-black text-slate-800 mt-3">{b.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Earned this quarter</p>
                  </div>
                ))}
                {[
                  { name: 'First Verdict', d: 'Cast your first blind vote', got: true },
                  { name: 'Diligent Reviewer', d: 'Reviewed 10 cases on time', got: true },
                  { name: 'Bridge Builder', d: 'Helpful in 5 discussions', got: false },
                  { name: 'Long Service', d: 'Active for 6 months', got: false },
                ].map((b) => (
                  <div key={b.name} className={`p-4 rounded-2xl border text-center ${b.got ? 'border-slate-100' : 'border-dashed border-slate-200 opacity-50'}`}>
                    <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center ${b.got ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-300'}`}>
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <p className="text-[12px] font-black text-slate-800 mt-3">{b.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{b.d}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ── Settings (profile settings shortcut) ── */}
          {tab === 'settings' && (
            <Card className="p-6">
              <h3 className="text-[14px] font-black text-slate-900">Profile Settings</h3>
              <p className="text-[12px] text-slate-500 mt-1">Manage your public profile information here. For account security, notifications, and blockchain settings, use the full Settings section.</p>
              <div className="mt-4">
                <BtnPrimary href="/settings">
                  Open Full Settings <ArrowRight className="w-3.5 h-3.5" />
                </BtnPrimary>
              </div>
              <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] font-black text-slate-600 mb-2">Quick facts</p>
                <div className="grid sm:grid-cols-2 gap-2 text-[12px]">
                  <p><span className="text-slate-400 font-semibold">Email:</span> <span className="font-semibold text-slate-700">{profilePrefs.email}</span></p>
                  <p><span className="text-slate-400 font-semibold">Joined:</span> <span className="font-semibold text-slate-700">{fmtDate(profilePrefs.joinedDate)}</span></p>
                  <p><span className="text-slate-400 font-semibold">Institution:</span> <span className="font-semibold text-slate-700">{profilePrefs.institution}</span></p>
                  <p><span className="text-slate-400 font-semibold">Location:</span> <span className="font-semibold text-slate-700">{profilePrefs.location}</span></p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* ═══ Right rail ═══ */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-violet-50 border border-violet-100">
            <p className="italic text-[12.5px] text-slate-600 leading-relaxed">"Knowledge, empathy, and evidence can solve even the toughest disputes."</p>
            <p className="text-[10.5px] text-slate-400 mt-2">— {displayName}</p>
          </div>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-[14px] font-black text-slate-900">Badges</h3>
              <button onClick={() => setTab('achievements')} className="flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:text-violet-700">View All <ArrowRight className="w-3 h-3" /></button>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {badges.map((b) => (
                <div key={b.name} className="text-center">
                  <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-tr ${b.tone} text-white flex items-center justify-center shadow-sm`}>{b.icon}</div>
                  <p className="text-[9px] font-bold text-slate-500 mt-1.5 leading-tight">{b.name}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-black text-slate-900">Interests</h3>
              <button onClick={() => setTab('settings')} className="flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:text-violet-700"><Pencil className="w-3 h-3" /> Edit</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profilePrefs.interests.map((i) => (
                <span key={i} className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-600">{i}</span>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-black text-slate-900">Account Information</h3>
              <button onClick={() => setTab('settings')} className="flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:text-violet-700"><Pencil className="w-3 h-3" /> Edit</button>
            </div>
            <div className="space-y-3">
              {[
                { icon: <Mail className="w-4 h-4" />, v: profilePrefs.email },
                { icon: <GraduationCap className="w-4 h-4" />, v: profilePrefs.institution },
                { icon: <MapPin className="w-4 h-4" />, v: profilePrefs.location },
                { icon: <Calendar className="w-4 h-4" />, v: `Joined on ${fmtDate(profilePrefs.joinedDate)}` },
                { icon: <Link2 className="w-4 h-4" />, v: 'linkedin.com/in/resolvia-user' },
                { icon: <Link2 className="w-4 h-4" />, v: 'github.com/resolvia-user' },
              ].map((x, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">{x.icon}</div>
                  <p className="text-[12px] font-semibold text-slate-700 truncate">{x.v}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

