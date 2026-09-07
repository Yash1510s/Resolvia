'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Bell,
  BookOpen,
  Search,
  ChevronRight,
  Megaphone,
  FileCheck,
  Users,
  Gavel,
  ArrowLeft,
  Share2,
  MoreVertical,
  ThumbsUp,
  ThumbsDown,
  Reply,
  Image as ImageIcon,
  Link2,
  Type,
  Scale,
  CheckCircle2,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { useApp } from '../../lib/app-context';
import { isClosed } from '../../lib/caseLifecycle';
import { jurorPseudonym } from '../../lib/jury';
import { Card, Chip, categoryLabel, fmtDate, shortCaseId } from '../../components/ui';

type Tab = 'ALL' | 'NOTIFICATIONS' | 'DISCUSSIONS';
type CasePaneTab = 'discussion' | 'summary' | 'evidence' | 'verdict' | 'takeaways';

export default function MessagesPage() {
  const { cases, notifications, addDiscussionPost, identity } = useApp();
  const [tab, setTab] = useState<Tab>('ALL');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null); // case id, or `n:<id>` for notification
  const [paneTab, setPaneTab] = useState<CasePaneTab>('discussion');
  const [comment, setComment] = useState('');

  const discussionCases = useMemo(() => cases.filter((c) => isClosed(c) && (c.discussion || []).length > 0), [cases]);
  const allNotifications = notifications;

  const items = useMemo(() => {
    const list: { kind: 'case' | 'notif'; id: string; title: string; sub: string; preview: string; date: string; badge?: string; icon?: React.ReactNode; tone?: string; read?: boolean; href?: string }[] = [];
    for (const c of discussionCases) {
      const last = (c.discussion || [])[0];
      list.push({
        kind: 'case',
        id: c.id,
        title: `${shortCaseId(c.id)} · ${c.title}`,
        sub: 'Public discussion',
        preview: last ? `↪ ${last.body}` : 'Start the discussion',
        date: c.caseStudy?.closedAt || c.verdictOutcome?.finalizedAt || c.createdAt,
        badge: 'Discussion Open',
      });
    }
    for (const n of allNotifications) {
      list.push({
        kind: 'notif',
        id: n.id,
        title: n.title,
        sub: n.kind.replace(/_/g, ' ').toLowerCase(),
        preview: n.body,
        date: n.createdAt,
        read: n.read,
        href: n.link,
        icon: <Bell className="w-4.5 h-4.5" />,
        tone: 'bg-slate-200 text-slate-600',
      });
    }
    const query = q.toLowerCase().trim();
    const filtered = query ? list.filter((i) => (i.title + ' ' + i.preview).toLowerCase().includes(query)) : list;
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [discussionCases, allNotifications, q]);

  const shown = useMemo(() => {
    if (tab === 'NOTIFICATIONS') return items.filter((i) => i.kind === 'notif');
    if (tab === 'DISCUSSIONS') return items.filter((i) => i.kind === 'case');
    return items;
  }, [tab, items]);

  const selected = selectedId ? items.find((i) => i.id === selectedId) || null : shown[0] || null;
  const selectedCase = selected?.kind === 'case' ? cases.find((c) => c.id === selected.id) : undefined;
  const selectedNotif = selected?.kind === 'notif' ? allNotifications.find((n) => n.id === selected.id) : undefined;

  const unreadNotifs = allNotifications.filter((n) => !n.read).length;

  const post = () => {
    if (!comment.trim() || !selectedCase) return;
    addDiscussionPost(selectedCase.id, { author: identity.name, authorRole: 'Party', body: comment.trim() });
    setComment('');
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Messages</h1>
          <p className="text-[13px] text-slate-500 mt-1">Case-specific discussions, notifications and updates. No global chat.</p>
        </div>
        {selected && (
          <div className="flex items-center gap-2">
            {selectedCase && (
              <Link href={`/cases/${selectedCase.id}`} className="px-4 py-2.5 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold transition-colors">
                View Case Details
              </Link>
            )}
            <button className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors inline-flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
            <button className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-400">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-4">
        {/* ═══ Left: list ═══ */}
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2 mb-3.5">
            {(
              [
                { id: 'ALL', l: 'All', icon: <MessageSquare className="w-4 h-4" />, n: items.length },
                { id: 'NOTIFICATIONS', l: 'Notifications', icon: <Bell className="w-4 h-4" />, n: unreadNotifs },
                { id: 'DISCUSSIONS', l: 'Closed Case Discussions', icon: <BookOpen className="w-4 h-4" />, n: discussionCases.length },
              ] as { id: Tab; l: string; icon: React.ReactNode; n: number }[]
            ).map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    active ? 'bg-violet-50 border-violet-300 text-violet-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span className={active ? 'text-violet-600' : 'text-slate-400'}>{t.icon}</span>
                  {t.l}
                  <span className={`min-w-[18px] h-4.5 px-1 rounded-full text-[10px] font-black flex items-center justify-center ${active ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{t.n}</span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 mb-3">
            <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages…" className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-slate-400" />
            </div>
            <button className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-500">Newest First</button>
          </div>

          <div className="space-y-2.5">
            {shown.length === 0 && (
              <Card className="p-8 text-center">
                <MessageSquare className="w-8 h-8 text-slate-200 mx-auto" />
                <p className="text-xs font-bold text-slate-500 mt-2.5">Nothing here yet</p>
              </Card>
            )}
            {shown.map((i) => {
              const active = selected?.id === i.id;
              return (
                <button
                  key={i.id}
                  onClick={() => {
                    setSelectedId(i.id);
                    setPaneTab('discussion');
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                    active ? 'bg-violet-50 border-violet-300' : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {i.kind === 'case' ? (
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shrink-0">
                      <Scale className="w-5 h-5 text-slate-400" />
                    </div>
                  ) : (
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${i.tone}`}>{i.icon}</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-[12.5px] font-bold truncate ${active ? 'text-violet-800' : 'text-slate-800'}`}>{i.title}</p>
                      {i.badge && <Chip tone="violet" className="shrink-0 !text-[9px] !px-2">{i.badge}</Chip>}
                      {i.kind === 'notif' && !i.read && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />}
                    </div>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">{i.sub} · {fmtDate(i.date).split(',')[0]}</p>
                    <p className="text-[11px] text-slate-500 mt-1 truncate">{i.preview}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 mt-1 ${active ? 'text-violet-500' : 'text-slate-300'}`} />
                </button>
              );
            })}
          </div>

          <div className="mt-3.5 p-3.5 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[10.5px] text-blue-800 leading-relaxed">
              <strong>No discussion rooms are available for ongoing cases.</strong> To maintain a fair resolution process, public
              discussions are enabled only after a case is closed.
            </p>
          </div>
        </div>

        {/* ═══ Right: detail ═══ */}
        <div className="min-w-0">
          {!selected && (
            <Card className="p-10 text-center">
              <MessageSquare className="w-9 h-9 text-slate-200 mx-auto" />
              <p className="text-sm font-bold text-slate-500 mt-3">Select a conversation or notification</p>
            </Card>
          )}

          {selected && selectedCase && (
            <div className="space-y-4">
              {/* Case header */}
              <Card className="p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shrink-0">
                    <Scale className="w-8 h-8 text-white/70" />
                  </div>
                  <div className="flex-1 min-w-[220px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Chip tone="green">Closed</Chip>
                      <span className="font-mono text-[14px] font-black text-slate-900">{shortCaseId(selectedCase.id)}</span>
                    </div>
                    <h2 className="text-[17px] font-black text-slate-900 mt-1.5">{selectedCase.title}</h2>
                    <p className="text-[12px] text-slate-500 mt-0.5">{selectedCase.claimSummary}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-2.5">
                      <Chip tone={categoryLabel(selectedCase.category).tone}>{categoryLabel(selectedCase.category).label}</Chip>
                      <Chip tone="slate">
                        <CheckCircle2 className="w-3 h-3" /> Closed on {fmtDate(selectedCase.caseStudy?.closedAt || selectedCase.verdictOutcome?.finalizedAt)}
                      </Chip>
                      {selectedCase.verdictOutcome && <Chip tone={selectedCase.verdictOutcome.winner === 'Claimant' ? 'green' : selectedCase.verdictOutcome.winner === 'Respondent' ? 'orange' : 'violet'}>In Favor of {selectedCase.verdictOutcome.winner}</Chip>}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Pane tabs */}
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'discussion', l: 'Discussion' },
                    { id: 'summary', l: 'Case Summary' },
                    { id: 'evidence', l: 'Evidence' },
                    { id: 'verdict', l: 'Jury Verdict' },
                    { id: 'takeaways', l: 'Key Takeaways' },
                  ] as { id: CasePaneTab; l: string }[]
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setPaneTab(t.id)}
                    className={`px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all ${paneTab === t.id ? 'bg-violet-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  >
                    {t.l}
                  </button>
                ))}
              </div>

              {paneTab === 'discussion' && (
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[15px] font-black text-slate-900">Community Discussion</h3>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                      <Users className="w-3.5 h-3.5" /> {(selectedCase.discussion || []).length + 20} participants
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-4">Share your thoughts, ask questions, and discuss the case. Keep the discussion respectful and constructive.</p>

                  {/* Composer */}
                  <div className="flex items-start gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-full bg-slate-700 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                      {identity.name.charAt(0).toUpperCase()}
                    </div>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={2}
                      placeholder="Write a thoughtful comment…"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:border-violet-400 focus:bg-white outline-none text-[12px] resize-none transition-colors"
                    />
                  </div>
                  <div className="flex items-center justify-between pl-12 pb-4">
                    <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
                      <button className="flex items-center gap-1 hover:text-slate-600"><ImageIcon className="w-3.5 h-3.5" /> Add Image</button>
                      <button className="flex items-center gap-1 hover:text-slate-600"><Link2 className="w-3.5 h-3.5" /> Link</button>
                      <button className="flex items-center gap-1 hover:text-slate-600"><Type className="w-3.5 h-3.5" /> Format</button>
                    </div>
                    <button onClick={post} disabled={!comment.trim()} className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-[11px] font-bold transition-colors">
                      Post Comment
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 -mt-2 mb-4 pl-12">Be respectful. No personal attacks. Discussions are for learning and knowledge sharing. This discussion cannot change the verdict and is not an appeal.</p>

                  {/* Posts */}
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    {(selectedCase.discussion || []).length === 0 && <p className="text-[12px] text-slate-400 text-center py-4">No comments yet — be the first to share.</p>}
                    {(selectedCase.discussion || []).map((p) => (
                      <div key={p.id} className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-500 to-slate-700 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                          {p.author.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-bold text-slate-800">
                            {p.author} <span className="text-slate-400 font-medium">· {fmtDate(p.createdAt).split(',')[0]}</span>
                            <span className="ml-2 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{p.authorRole}</span>
                          </p>
                          <p className="text-[12px] text-slate-600 mt-1 leading-relaxed">{p.body}</p>
                          <div className="flex items-center gap-4 mt-2 text-[10.5px] font-bold text-slate-400">
                            <button className="flex items-center gap-1 hover:text-violet-600"><ThumbsUp className="w-3 h-3" /> {p.likes}</button>
                            <button className="flex items-center gap-1 hover:text-rose-500"><ThumbsDown className="w-3 h-3" /> {p.reports}</button>
                            <button className="flex items-center gap-1 hover:text-slate-600"><Reply className="w-3 h-3" /> Reply</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {paneTab === 'summary' && (
                <Card className="p-5 space-y-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Claim</p>
                    <p className="text-[12.5px] text-slate-700 mt-1.5 leading-relaxed">{selectedCase.claimSummary}</p>
                    <p className="text-[11px] text-slate-500 mt-2"><strong>Relief sought:</strong> {selectedCase.reliefSought}</p>
                  </div>
                  {selectedCase.counterClaimSummary && (
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Response</p>
                      <p className="text-[12.5px] text-slate-700 mt-1.5 leading-relaxed">{selectedCase.counterClaimSummary}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Claimant</p>
                      <p className="text-[12px] font-bold text-slate-800 mt-1">{selectedCase.claimant.name}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Respondent</p>
                      <p className="text-[12px] font-bold text-slate-800 mt-1">{selectedCase.respondent.name}</p>
                    </div>
                  </div>
                </Card>
              )}

              {paneTab === 'evidence' && (
                <Card className="p-5">
                  <h3 className="text-[14px] font-black text-slate-900 mb-1">Anchored Evidence</h3>
                  <p className="text-[11px] text-slate-400 mb-4">Evidence is publicly viewable in closed cases with hashes for verification. Sensitive exhibits remain access-controlled.</p>
                  <div className="space-y-2.5">
                    {selectedCase.evidence.map((ev) => (
                      <div key={ev.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                          <FileCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-bold text-slate-800 truncate">{ev.title}</p>
                          <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">SHA-256 {ev.sha256Hash.slice(0, 26)}…</p>
                        </div>
                        <Chip tone={ev.accessTier === 'PUBLIC' ? 'green' : 'amber'}>{ev.accessTier === 'PUBLIC' ? 'Public' : 'Access-controlled'}</Chip>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {paneTab === 'verdict' && (
                <Card className="p-5">
                  <h3 className="text-[14px] font-black text-slate-900 mb-4">Jury Verdict</h3>
                  {selectedCase.verdictOutcome ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-violet-50 border border-violet-100 text-center">
                        <p className="text-[11px] font-black uppercase tracking-wider text-violet-500">Outcome</p>
                        <p className="text-[18px] font-black text-slate-900 mt-1">In Favor of {selectedCase.verdictOutcome.winner}</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {selectedCase.verdictOutcome.voteCount.claimant}–{selectedCase.verdictOutcome.voteCount.respondent}–{selectedCase.verdictOutcome.voteCount.split} (claimant / respondent / shared) · {fmtDate(selectedCase.verdictOutcome.finalizedAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2.5">Panel (anonymous)</p>
                        <div className="grid grid-cols-5 gap-2">
                          {selectedCase.jurors.map((j) => (
                            <div key={j.jurorId} className="p-2.5 rounded-xl border border-slate-200 text-center">
                              <div className="w-8 h-8 mx-auto rounded-full bg-slate-200 text-slate-500 text-[10px] font-black flex items-center justify-center">
                                {j.revealedVote === 'CLAIMANT_UPHELD' ? 'C' : j.revealedVote === 'RESPONDENT_UPHELD' ? 'R' : 'S'}
                              </div>
                              <p className="text-[9px] font-bold text-slate-500 mt-1.5">Juror {jurorPseudonym(j.walletAddress).replace('Juror ', '')}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2.5 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5" /> Juror identities are permanently hidden — only pseudonyms are shown.
                        </p>
                      </div>
                      {selectedCase.appeal?.outcomeNote && <p className="text-[11px] text-slate-500 p-3 rounded-xl bg-slate-50 border border-slate-100">{selectedCase.appeal.outcomeNote}</p>}
                    </div>
                  ) : (
                    <p className="text-[12px] text-slate-400">No verdict recorded.</p>
                  )}
                </Card>
              )}

              {paneTab === 'takeaways' && (
                <Card className="p-5 space-y-3">
                  <h3 className="text-[14px] font-black text-slate-900 mb-1">Key Takeaways</h3>
                  {[
                    'Document everything — anchored evidence decided this case more than rhetoric did.',
                    'Deadlines matter: the response and evidence windows shaped what the jury could consider.',
                    'A jury verdict is final; the post-closure discussion is for learning, not appeal.',
                    selectedCase.caseStudy ? `AI advisory agreement: ${selectedCase.caseStudy.aiAgreement}% — the advisory is never binding.` : 'The AI advisory, where present, is non-binding and advisory only.',
                  ].map((t, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-[12px] text-slate-600 leading-relaxed">{t}</p>
                    </div>
                  ))}
                </Card>
              )}
            </div>
          )}

          {selected && selectedNotif && (
            <Card className="p-6">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[15px] font-black text-slate-900">{selectedNotif.title}</h2>
                    {!selectedNotif.read && <span className="w-2 h-2 rounded-full bg-rose-500" />}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">{selectedNotif.kind.replace(/_/g, ' ')} · {fmtDate(selectedNotif.createdAt, true)}</p>
                  <p className="text-[13px] text-slate-600 mt-3 leading-relaxed">{selectedNotif.body}</p>
                  {selectedNotif.link && (
                    <Link href={selectedNotif.link} className="inline-flex items-center gap-1.5 mt-4 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors">
                      Go to Case <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
