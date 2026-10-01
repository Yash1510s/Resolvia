'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Landmark,
  Eye,
  ShieldCheck,
  MessageSquare,
  Download,
  Info,
  CheckCircle2,
  Scale,
  FileCheck,
  Users,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../../lib/app-context';
import { CommunityDiscussion } from '../../../components/CommunityDiscussion';
import { LegalExportModal } from '../../../components/LegalExportModal';
import { formatHash, formatDateSafe } from '../../../lib/crypto';
import { jurorPseudonym } from '../../../lib/jury';
import { Card, Chip, categoryLabel, fmtDate, shortCaseId } from '../../../components/ui';

type Level = 1 | 2 | 3;
type DetailTab = 'overview' | 'evidence' | 'deliberation' | 'outcome';

export default function CaseStudyDetail({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = React.use(params);
  const { getCase } = useApp();
  const c = getCase(caseId);
  const [level, setLevel] = useState<Level>(1);
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');
  const [legalOpen, setLegalOpen] = useState(false);

  if (!c) {
    return (
      <Card className="p-10 text-center max-w-lg mx-auto my-12">
        <p className="text-sm font-bold text-slate-900">Case not found</p>
        <p className="text-xs text-slate-400 mt-1">This case does not exist or has not synced to this session.</p>
        <Link href="/case-studies" className="inline-flex items-center gap-1.5 px-4 py-2 mt-4 rounded-xl bg-violet-600 text-white text-xs font-bold">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Case Studies
        </Link>
      </Card>
    );
  }

  if (c.status !== 'CLOSED' && c.status !== 'FINALIZED') {
    return (
      <Card className="p-8 text-center max-w-lg mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center mx-auto">
          <Scale className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900">{c.title}</h2>
          <p className="text-xs text-slate-500 mt-1.5">
            This dispute is currently an <strong>Active Proceeding</strong> in the{' '}
            <span className="font-bold text-violet-700">{c.status.replace(/_/g, ' ')}</span> phase.
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Case studies with jury reasoning are published upon finalization.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <Link
            href={`/cases/${c.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-colors"
          >
            Inspect Live Case &amp; Evidence <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/case-studies"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> All Studies
          </Link>
        </div>
      </Card>
    );
  }

  const v = c.verdictOutcome;
  const winner = v?.winner;
  const winnerText = winner === 'Claimant' ? 'In Favor of Claimant' : winner === 'Respondent' ? 'In Favor of Respondent' : 'Partial Resolution';

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card className="p-5">
        <Link href="/case-studies" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-violet-600 hover:text-violet-700">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Case Studies
        </Link>
        <div className="flex flex-wrap items-start gap-5 mt-3">
          <div className="flex-1 min-w-[260px]">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-[15px] font-black text-slate-900">{shortCaseId(c.id)}</span>
              <Chip tone="green">Closed</Chip>
            </div>
            <h1 className="text-[22px] font-black text-slate-900 tracking-tight mt-2">{c.title}</h1>
            <p className="text-[13px] text-slate-500 mt-1">{c.claimSummary}</p>
            <div className="flex items-center gap-2 flex-wrap mt-3">
              <Chip tone={categoryLabel(c.category).tone}>{categoryLabel(c.category).label}</Chip>
              <Chip tone="slate">
                <CheckCircle2 className="w-3 h-3" /> Closed on {fmtDate(c.caseStudy?.closedAt)}
              </Chip>
              <Chip tone={winner === 'Claimant' ? 'green' : winner === 'Respondent' ? 'rose' : 'amber'} dot>{winnerText}</Chip>
            </div>
          </div>
          <div className="w-28 h-20 rounded-xl bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shrink-0">
            <Scale className="w-9 h-9 text-white/70" />
          </div>
        </div>
      </Card>

      {/* Disclosure levels */}
      <div>
        <h2 className="text-[15px] font-black text-slate-900">Choose the level of detail you want to view</h2>
        <p className="text-[12px] text-slate-500 mt-1">Different levels provide different depth of information. Some require verification for logging purposes.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {(
          [
            { l: 1 as Level, icon: <Eye className="w-4.5 h-4.5" />, t: '1. Overview', d: 'A brief summary of the case, key facts, and outcome.', pts: ['No verification required', 'Great for quick understanding'], cta: 'View Overview' },
            { l: 2 as Level, icon: <BookOpen className="w-4.5 h-4.5" />, t: '2. Detailed Case Study', d: 'Detailed case information including evidence summary, jury reasoning, and final verdict.', pts: ['Verify yourself (for log purpose)', 'Recorded on blockchain'], cta: 'Verify & View Detailed' },
            { l: 3 as Level, icon: <Landmark className="w-4.5 h-4.5" />, t: '3. Legal-Forensic Record', d: 'Full verified record with all evidence, statements, and final verdict. Useful for academic or legal reference.', pts: ['Verify yourself (for log purpose)', 'Access is logged and restricted'], cta: 'Verify & View Full Record' },
          ]
        ).map((o) => {
          const active = level === o.l;
          return (
            <button
              key={o.l}
              onClick={() => setLevel(o.l)}
              className={`p-5 rounded-2xl border-2 text-left transition-all ${active ? 'border-violet-500 bg-violet-50/50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${active ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{o.icon}</div>
                <p className="text-[13px] font-black text-slate-900">{o.t}</p>
              </div>
              <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed">{o.d}</p>
              <ul className="space-y-1.5 mt-3">
                {o.pts.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-[10.5px] font-semibold text-slate-500">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {p}
                  </li>
                ))}
              </ul>
              <span className={`mt-4 inline-flex items-center gap-1.5 w-full justify-center px-4 py-2.5 rounded-xl text-[11px] font-bold transition-colors ${active ? 'bg-violet-600 text-white' : 'border border-violet-200 bg-violet-50 text-violet-700'}`}>
                {active ? <CheckCircle2 className="w-3.5 h-3.5" /> : null} {active ? 'Active Level' : o.cta}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400 flex items-center gap-1.5 -mt-1">
        <ShieldCheck className="w-3.5 h-3.5" /> Your viewing activity is recorded on the blockchain to ensure transparency and prevent misuse.
      </p>

      {/* ── Level 1: Overview ── */}
      {level === 1 && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-5 md:col-span-2">
            <h3 className="text-[14px] font-black text-slate-900 mb-2">Case Summary</h3>
            <p className="text-[12.5px] text-slate-600 leading-relaxed">
              {c.claimant.name.replace(/ \(Claimant\)/, '')} (claimant) brought a dispute against {c.respondent.name.replace(/ \(Respondent\)/, '')} (respondent). {c.claimSummary} The panel reviewed the anchored evidence and rendered its verdict independently.
            </p>
            <h3 className="text-[13px] font-black text-slate-900 mt-5 mb-2.5">Key Details</h3>
            <div className="space-y-2">
              {[
                ['Category', categoryLabel(c.category).label],
                ['Parties', `${c.claimant.name.replace(/ \(Claimant\)/, '')} (Claimant) vs ${c.respondent.name.replace(/ \(Respondent\)/, '')} (Respondent)`],
                ['Issue', c.title],
                ['Verdict', winnerText],
                ['Closed', fmtDate(c.caseStudy?.closedAt)],
              ].map(([k, val]) => (
                <div key={k} className="grid grid-cols-[90px_1fr] gap-3 text-[12px]">
                  <span className="text-slate-400 font-semibold">{k}</span>
                  <span className="text-slate-700 font-semibold">{val}</span>
                </div>
              ))}
            </div>
            <h3 className="text-[13px] font-black text-slate-900 mt-5 mb-2.5">Key Takeaways</h3>
            <ul className="space-y-2">
              {['Documentation quality decided this case more than rhetoric did.', 'Deadlines (response & evidence windows) shape what a jury can consider.', 'Post-closure discussion is for learning — it cannot change the verdict and is not an appeal.'].map((t) => (
                <li key={t} className="flex items-start gap-2 text-[12px] text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> {t}
                </li>
              ))}
            </ul>
          </Card>
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#171f3d] to-[#43307a] text-white">
              <p className="italic text-[13px] leading-relaxed">"Small disputes, when resolved fairly, create a stronger community."</p>
              <p className="text-[10px] text-slate-400 mt-2.5">— Resolvia</p>
            </div>
            <Card className="p-4 space-y-2.5">
              {[
                ['AI↔Jury agreement', `${c.caseStudy?.aiAgreement ?? '—'}%`],
                ['Appeal filed', c.caseStudy?.appealFiled ? 'Yes' : 'No'],
                ['Disclosure', c.caseStudy?.disclosureNote || 'Anonymised'],
              ].map(([k, val]) => (
                <div key={k} className="flex items-center justify-between text-[11.5px]">
                  <span className="text-slate-400 font-semibold">{k}</span>
                  <span className="text-slate-700 font-bold">{val}</span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}

      {/* ── Level 2: Detailed ── */}
      {level === 2 && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap gap-1.5 px-5 pt-4 border-b border-slate-100">
            {(
              [
                { id: 'overview', l: 'Overview' },
                { id: 'evidence', l: 'Evidence' },
                { id: 'deliberation', l: 'Jury Deliberation' },
                { id: 'outcome', l: 'Outcome' },
              ] as { id: DetailTab; l: string }[]
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setDetailTab(t.id)}
                className={`px-3.5 py-2.5 text-[12px] font-bold border-b-2 -mb-px transition-colors ${detailTab === t.id ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                {t.l}
              </button>
            ))}
          </div>
          <div className="p-5">
            {detailTab === 'overview' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Claim (as filed)</p>
                  <p className="text-[12px] text-slate-600 leading-relaxed">{c.claimSummary}</p>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-3 mb-1">Relief sought</p>
                  <p className="text-[11.5px] text-slate-600">{c.reliefSought}</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Response (as filed)</p>
                  <p className="text-[12px] text-slate-600 leading-relaxed">{c.counterClaimSummary || 'No response recorded.'}</p>
                </div>
              </div>
            )}
            {detailTab === 'evidence' && (
              <div>
                <div className="grid md:grid-cols-[1fr_260px] gap-4">
                  <div>
                    <p className="text-[13px] font-black text-slate-900 mb-3">Evidence Summary</p>
                    <div className="space-y-2.5">
                      {c.evidence.map((e, i) => (
                        <div key={e.id} className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                            <FileCheck className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-bold text-slate-800 truncate">{i + 1}. {e.title}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Submitted by {e.submittedBy} · {formatDateSafe(e.submittedAt)}</p>
                            <p className="text-[9.5px] font-mono text-slate-300 truncate mt-0.5">SHA-256 {formatHash(e.sha256Hash, 24)}…</p>
                          </div>
                          <Chip tone={e.accessTier === 'PUBLIC' ? 'green' : 'amber'}>{e.accessTier === 'PUBLIC' ? 'Public' : 'Controlled'}</Chip>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3.5">
                    <div className="p-4 rounded-xl border border-slate-200">
                      <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2.5">Parties</p>
                      <p className="text-[12px] font-bold text-slate-800">{c.claimant.name.replace(/ \(Claimant\)/, '')} <span className="text-[10px] text-slate-400 font-semibold block">Claimant</span></p>
                      <p className="text-[12px] font-bold text-slate-800 mt-2.5">{c.respondent.name.replace(/ \(Respondent\)/, '')} <span className="text-[10px] text-slate-400 font-semibold block">Respondent</span></p>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200">
                      <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2.5">Jury Panel (anonymised)</p>
                      <div className="flex items-center gap-1.5">
                        {c.jurors.slice(0, 3).map((j) => (
                          <div key={j.jurorId} className="text-center">
                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 text-[9px] font-black flex items-center justify-center">
                              {jurorPseudonym(j.walletAddress || j.jurorId).replace('Juror ', '').slice(0, 2)}
                            </div>
                            <p className="text-[8.5px] text-slate-400 mt-1">Juror #{jurorPseudonym(j.walletAddress || j.jurorId).replace('Juror ', '').slice(0, 4)}</p>
                          </div>
                        ))}
                        {c.jurors.length > 3 && <span className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 text-[9px] font-black flex items-center justify-center">+{c.jurors.length - 3}</span>}
                      </div>
                      <p className="text-[9.5px] text-slate-400 mt-2 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Identities hidden</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {detailTab === 'deliberation' && (
              <div>
                <p className="text-[13px] font-black text-slate-900 mb-1">Discussion Highlights</p>
                <p className="text-[11px] text-slate-400 mb-4">Private, anonymous jury deliberation — published here only after closure, with pseudonyms.</p>
                {(c.deliberation || []).length === 0 && <p className="text-[12px] text-slate-400 py-4 text-center">No deliberation was recorded for this panel.</p>}
                <div className="space-y-3">
                  {(c.deliberation || []).map((p) => (
                    <div key={p.id} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-400 to-indigo-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                        {(p.author || '?').replace('#', '').charAt(0)}
                      </div>
                      <div>
                        <p className="text-[11.5px] font-bold text-slate-800">{p.authorBadge || p.author}</p>
                        <p className="text-[11.5px] text-slate-600 mt-1 leading-relaxed">{p.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {c.aiAnalysis && (
                  <div className="mt-4 p-4 rounded-xl bg-violet-50 border border-violet-100">
                    <p className="text-[12px] font-black text-violet-900 flex items-center gap-2"><Sparkles className="w-4 h-4" /> AI-Assisted Analysis (non-binding)</p>
                    <p className="text-[11.5px] text-slate-600 mt-2 leading-relaxed">
                      Favored: <strong>{c.aiAnalysis.advisoryRecommendation.favoredParty}</strong> · Confidence {c.aiAnalysis.advisoryRecommendation.confidence}%. {c.aiAnalysis.advisoryRecommendation.rationale}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-2">Advisory only — it never determined the verdict.</p>
                  </div>
                )}
              </div>
            )}
            {detailTab === 'outcome' && (
              <div className="space-y-4">
                <div className="p-5 rounded-xl bg-violet-50 border border-violet-100 text-center">
                  <p className="text-[11px] font-black uppercase tracking-wider text-violet-500">Verdict</p>
                  <p className="text-[18px] font-black text-slate-900 mt-1">{winnerText}</p>
                  {v && (
                    <p className="text-[11.5px] text-slate-500 mt-1.5">
                      Vote: {v.voteCount.claimant} claimant · {v.voteCount.respondent} respondent · {v.voteCount.split} shared (of {v.totalJurors}) · finalized {fmtDate(v.finalizedAt)}
                    </p>
                  )}
                </div>
                {c.appeal?.outcomeNote && (
                  <p className="text-[11.5px] text-slate-500 p-4 rounded-xl bg-slate-50 border border-slate-100">{c.appeal.outcomeNote}</p>
                )}
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    ['Verdict hash', v ? formatHash(v.verdictHash, 20) + '…' : '—'],
                    ['AI↔Jury agreement', `${c.caseStudy?.aiAgreement ?? '—'}%`],
                    ['Appeal', c.caseStudy?.appealFiled ? 'Filed' : 'None filed'],
                  ].map(([k, val]) => (
                    <div key={k} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[9.5px] font-black uppercase tracking-wider text-slate-400">{k}</p>
                      <p className="text-[11.5px] font-bold text-slate-700 mt-1 font-mono break-all">{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── Level 3: Legal-Forensic Record ── */}
      {level === 3 && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-violet-50/70 border border-violet-100 flex items-start gap-2.5">
            <Landmark className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
            <p className="text-[11.5px] text-violet-900 leading-relaxed">
              <strong>Official Case Record (Legal-Forensic Format).</strong> This record is a complete and immutable record of the case, stored on the
              blockchain. All data is tamper-proof and cryptographically verified. Admissibility in any court or forum depends on
              jurisdiction — this is a verified artefact, not a guarantee of court acceptance.
            </p>
          </div>
          <ForensicBody c={c} onExport={() => setLegalOpen(true)} />
        </div>
      )}

      {/* Community discussion */}
      {(c.discussion || []).length > 0 && (
        <div className="space-y-3 pt-1">
          <h2 className="text-[13px] font-black text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-violet-500" /> Community Discussion
          </h2>
          <CommunityDiscussion dispute={c} />
        </div>
      )}

      <LegalExportModal isOpen={legalOpen} onClose={() => setLegalOpen(false)} dispute={c} />
    </div>
  );
}

function ForensicBody({ c, onExport }: { c: import('../../../types').DisputeCase; onExport: () => void }) {
  const lp = c.legalPackage;
  if (!lp) {
    return (
      <Card className="p-8 text-center">
        <Info className="w-6 h-6 text-slate-300 mx-auto" />
        <p className="text-xs font-bold text-slate-500 mt-2">Forensic manifest not assembled for this case</p>
        <p className="text-[11px] text-slate-400 mt-1">The case closed before the audit package was generated.</p>
      </Card>
    );
  }
  return (
    <div className="grid md:grid-cols-[1fr_300px] gap-4">
      <Card className="p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h3 className="text-[14px] font-black text-slate-900">1. Case Metadata</h3>
          <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{lp.integrityStatus}</span>
        </div>
        <div className="space-y-2">
          {[
            ['Case ID', shortCaseId(c.id)],
            ['Category', categoryLabel(c.category).label],
            ['Date of Submission', fmtDate(c.createdAt, true)],
            ['Date of Closure', fmtDate(c.caseStudy?.closedAt, true)],
            ['Verdict', c.verdictOutcome ? (c.verdictOutcome.winner === 'Claimant' ? 'In Favor of Claimant' : c.verdictOutcome.winner === 'Respondent' ? 'In Favor of Respondent' : 'Partial Resolution') : '—'],
            ['Transaction Hash', formatHash(lp.anchoredTxHash, 18) + '…'],
          ].map(([k, val]) => (
            <div key={k} className="grid grid-cols-[140px_1fr] gap-3 text-[12px] py-1.5 border-b border-slate-50 last:border-0">
              <span className="text-slate-400 font-semibold">{k}</span>
              <span className="text-slate-700 font-semibold font-mono text-[11px] break-all">{val}</span>
            </div>
          ))}
        </div>
        <h3 className="text-[14px] font-black text-slate-900 mt-5 mb-3">2. Evidence Manifest</h3>
        <div className="space-y-2">
          {c.evidence.map((e, i) => (
            <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-black text-slate-400 w-5">{i + 1}.</span>
              <div className="min-w-0 flex-1">
                <p className="text-[11.5px] font-bold text-slate-700 truncate">{e.title}</p>
                <p className="text-[9.5px] font-mono text-slate-400 truncate">SHA-256 {formatHash(e.sha256Hash, 28)}… · CID {formatHash(e.ipfsCid, 16)}…</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>
          ))}
        </div>
        <h3 className="text-[14px] font-black text-slate-900 mt-5 mb-3">3. Chain of Custody — Signatories</h3>
        <div className="space-y-1.5">
          {lp.chainOfCustodySigners.map((s, i) => (
            <p key={i} className="text-[11.5px] text-slate-600 flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {s}
            </p>
          ))}
        </div>
        <div className="mt-5 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-[10.5px] text-slate-500 leading-relaxed">
          <p className="font-black text-slate-600 mb-1">Certification standard</p>
          {lp.statutoryStandard}. Certificate <span className="font-mono">{lp.certificateId}</span> · Generated {formatDateSafe(lp.generatedAt)}.
        </div>
        <button
          onClick={onExport}
          className="mt-4 w-full p-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black transition-all flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" /> Download Evidence &amp; Audit Package
        </button>
      </Card>
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <p className="text-[11px] font-black text-slate-700 mb-2 flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-violet-500" /> Disclosure</p>
          <p className="text-[10.5px] text-slate-500 leading-relaxed">{c.caseStudy?.disclosureNote || 'Anonymised publication with party consent.'}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <p className="text-[11px] font-black text-slate-700 mb-1.5">Canonical record hash</p>
          <p className="text-[10px] font-mono text-slate-500 break-all">{formatHash(lp.canonicalRecordHash, 48)}…</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <p className="text-[11px] font-black text-slate-700 mb-1.5">IPFS manifest CID</p>
          <p className="text-[10px] font-mono text-slate-500 break-all">{formatHash(lp.ipfsManifestCid, 40)}…</p>
        </div>
        <p className="text-[10px] italic text-slate-400 px-1">"Transparency today empowers fairer systems tomorrow." — Resolvia</p>
      </div>
    </div>
  );
}
