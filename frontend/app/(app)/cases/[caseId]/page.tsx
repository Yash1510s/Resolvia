'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Users,
  Cpu,
  ShieldCheck,
  Gavel,
  Landmark,
  Clock,
  MessageSquare,
  BookOpen,
  ArrowLeft,
  Scale,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Lock,
  Download,
} from 'lucide-react';
import { useApp } from '../../../lib/app-context';
import { DisputeCase } from '../../../types';
import { StatusBadge } from '../../../components/StatusBadge';
import { StatusStepper } from '../../../components/StatusStepper';
import { JurorBadge, jurorDisplay } from '../../../components/JurorBadge';
import { EvidenceLocker } from '../../../components/EvidenceLocker';
import { AIAnalysisPanel } from '../../../components/AIAnalysisPanel';
import { CommitRevealVoting } from '../../../components/CommitRevealVoting';
import { AuditTrailView } from '../../../components/AuditTrailView';
import { LegalExportModal } from '../../../components/LegalExportModal';
import { CommunityDiscussion } from '../../../components/CommunityDiscussion';
import {
  visibleSections,
  statusIndex,
  appealAvailable,
} from '../../../lib/caseLifecycle';
import { formatDateSafe, formatHash } from '../../../lib/crypto';

const SECTION_ICON: Record<string, React.ReactNode> = {
  overview: <Scale className="w-4 h-4" />,
  response: <FileText className="w-4 h-4" />,
  evidence: <ShieldCheck className="w-4 h-4" />,
  ai: <Cpu className="w-4 h-4" />,
  jury: <Users className="w-4 h-4" />,
  voting: <Gavel className="w-4 h-4" />,
  verdict: <CheckCircle2 className="w-4 h-4" />,
  appeal: <AlertTriangle className="w-4 h-4" />,
  timeline: <Clock className="w-4 h-4" />,
  record: <BookOpen className="w-4 h-4" />,
  discussion: <MessageSquare className="w-4 h-4" />,
};

/** Which section the case is "currently at" (highlighted in the rail). */
function currentSectionForStatus(status: DisputeCase['status']): string {
  const i = statusIndex(status);
  if (status === 'DRAFT' || status === 'SUBMITTED') return 'overview';
  if (status === 'RESPONDENT_WINDOW') return 'response';
  if (status === 'EVIDENCE_LOCKED') return 'evidence';
  if (status === 'AI_ANALYSIS') return 'ai';
  if (status === 'JURY_COMMIT' || status === 'JURY_REVEAL') return 'voting';
  if (status === 'VERDICT') return 'verdict';
  if (status === 'APPEAL_WINDOW') return 'appeal';
  if (status === 'FINALIZED') return 'record';
  if (status === 'CLOSED') return 'discussion';
  return 'overview';
}

export default function CaseDetailsRoute({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = React.use(params);
  return (
    <Suspense fallback={<p className="text-xs text-slate-400">Loading case…</p>}>
      <CaseDetails caseId={caseId} />
    </Suspense>
  );
}

function CaseDetails({ caseId }: { caseId: string }) {
  const { getCase, identity, myJurorPseudonym, runAIAnalysis } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispute = getCase(caseId);

  const [section, setSection] = useState<string>(() => searchParams.get('section') || currentSectionForStatus(getCase(caseId)?.status || 'SUBMITTED'));
  const [analyzing, setAnalyzing] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);

  const sections = useMemo(() => (dispute ? visibleSections(dispute.status) : []), [dispute]);

  if (!dispute) {
    return (
      <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
        <p className="text-sm font-bold text-slate-900">Case not found</p>
        <p className="text-xs text-slate-500">This case ID does not exist in the current workspace.</p>
        <Link href="/cases" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Cases
        </Link>
      </div>
    );
  }

  const myRole = dispute.myRole || 'CLAIMANT';
  const activeSection = sections.find((s) => s.id === section) ? section : 'overview';

  const myJuror = dispute.jurors.find((j) => j.walletAddress === identity.wallet) ||
    (myRole === 'JUROR' ? dispute.jurors[0] : undefined);

  const goto = (s: string) => {
    setSection(s);
    router.replace(`/cases/${caseId}?section=${s}`, { scroll: false });
  };

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                {dispute.caseNumber}
              </span>
              <StatusBadge status={dispute.status} />
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                {dispute.category.replace(/_/g, ' ')}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                Your role: {dispute.myRole ? (dispute.myRole === 'JUROR' ? `Juror ${myJurorPseudonym} (anonymous)` : dispute.myRole) : 'Observer (no role assigned)'}
              </span>
            </div>
            <h1 className="text-lg font-black text-slate-900 mt-2 leading-snug">{dispute.title}</h1>
            <p className="text-[11px] text-slate-500 mt-1">
              {dispute.claimant.name} (Claimant) vs {dispute.respondent.name} (Respondent) · Disputed amount:{' '}
              <strong className="text-slate-700">{dispute.disputeAmount}</strong>
            </p>
          </div>
          <Link
            href="/cases"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1.5 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> My Cases
          </Link>
        </div>

        <StatusStepper status={dispute.status} />

        {/* Deadline chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {dispute.responseDeadline && statusIndex(dispute.status) <= statusIndex('RESPONDENT_WINDOW') && (
            <DeadlineChip label="Response due" iso={dispute.responseDeadline} />
          )}
          {dispute.votingDeadline && statusIndex(dispute.status) >= statusIndex('EVIDENCE_LOCKED') && statusIndex(dispute.status) <= statusIndex('JURY_REVEAL') && (
            <DeadlineChip label="Voting deadline" iso={dispute.votingDeadline} />
          )}
          {dispute.appeal && !dispute.appeal.filed && dispute.appeal.windowClosesAt && (
            <DeadlineChip label="Appeal window closes" iso={dispute.appeal.windowClosesAt} tone="rose" />
          )}
          <span className="text-[10px] text-slate-400 font-semibold ml-auto">
            Created {formatDateSafe(dispute.createdAt)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ── Section rail ── */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-2.5 sticky top-36 space-y-0.5">
            {sections.map((s) => {
              const isCurrent = currentSectionForStatus(dispute.status) === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => goto(s.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeSection === s.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : isCurrent
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className={activeSection === s.id ? 'text-white' : isCurrent ? 'text-blue-600' : 'text-slate-400'}>
                    {SECTION_ICON[s.id]}
                  </span>
                  {s.label}
                  {isCurrent && activeSection !== s.id && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Section content ── */}
        <div className="lg:col-span-9 space-y-4 min-w-0">
          {activeSection === 'overview' && <OverviewSection dispute={dispute} myRole={myRole} />}
          {activeSection === 'response' && <ResponseSection dispute={dispute} myRole={myRole} />}
          {activeSection === 'evidence' && (
            <EvidenceSection dispute={dispute} />
          )}
          {activeSection === 'ai' && (
            <AISection
              dispute={dispute}
              analyzing={analyzing}
              onRun={() => {
                setAnalyzing(true);
                runAIAnalysis(dispute.id);
                setTimeout(() => setAnalyzing(false), 1500);
              }}
            />
          )}
          {activeSection === 'jury' && <JurySection dispute={dispute} myJuror={myJuror} myRole={myRole} />}
          {activeSection === 'voting' && <VotingSection dispute={dispute} myJuror={myJuror} myRole={myRole} />}
          {activeSection === 'verdict' && <VerdictSection dispute={dispute} />}
          {activeSection === 'appeal' && <AppealSection dispute={dispute} myRole={myRole} />}
          {activeSection === 'timeline' && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4">Timeline & On-Chain Audit Trail</h3>
              <AuditTrailView events={dispute.auditTrail} />
            </div>
          )}
          {activeSection === 'record' && <RecordSection dispute={dispute} onGenerate={() => setLegalOpen(true)} />}
          {activeSection === 'discussion' && <CommunityDiscussion dispute={dispute} />}
        </div>
      </div>

      <LegalExportModal isOpen={legalOpen} onClose={() => setLegalOpen(false)} dispute={dispute} />
    </div>
  );
}

function DeadlineChip({ label, iso, tone = 'blue' }: { label: string; iso: string; tone?: 'blue' | 'rose' }) {
  const past = new Date(iso).getTime() < Date.now();
  const c =
    tone === 'rose'
      ? past
        ? 'bg-rose-50 text-rose-700 border-rose-200'
        : 'bg-rose-50 text-rose-700 border-rose-200'
      : past
      ? 'bg-slate-100 text-slate-500 border-slate-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';
  return (
    <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${c}`}>
      <Clock className="w-3 h-3" />
      {label}: {new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
      {past && ' (passed)'}
    </span>
  );
}

/* ════════════════ SECTIONS ════════════════ */

function EvidenceSection({ dispute }: { dispute: DisputeCase }) {
  const { addEvidence } = useApp();
  const [adding, setAdding] = useState(false);
  return (
    <EvidenceLocker
      evidence={dispute.evidence}
      caseId={dispute.id}
      onAddEvidenceClick={async () => {
        if (adding) return;
        setAdding(true);
        await addEvidence(dispute.id);
        setAdding(false);
      }}
    />
  );
}

function OverviewSection({ dispute, myRole }: { dispute: DisputeCase; myRole: string }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PartyCard label="Claimant" name={dispute.claimant.name} wallet={dispute.claimant.wallet} stake={dispute.claimant.stake} highlight={myRole === 'CLAIMANT'} />
        <PartyCard label="Respondent" name={dispute.respondent.name} wallet={dispute.respondent.wallet} stake={dispute.respondent.stake} responded={dispute.respondent.responded} highlight={myRole === 'RESPONDENT'} />
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-200">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Claim Summary</h3>
        <p className="text-xs text-slate-700 leading-relaxed">{dispute.claimSummary}</p>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-200">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Relief Sought</h3>
        <p className="text-xs text-slate-700 leading-relaxed">{dispute.reliefSought}</p>
      </div>

      {dispute.status === 'DRAFT' && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
          <Eye className="w-4 h-4 shrink-0" />
          This case is a draft and has not been submitted to the protocol yet.
        </div>
      )}
    </div>
  );
}

function PartyCard({ label, name, wallet, stake, responded, highlight }: { label: string; name: string; wallet: string; stake: number; responded?: boolean; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-2xl border ${highlight ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        {highlight && <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-blue-600 text-white">YOU</span>}
        {responded && !highlight && <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">RESPONDED</span>}
      </div>
      <p className="text-xs font-bold text-slate-900 mt-2">{name}</p>
      <p className="text-[10px] font-mono text-slate-400 mt-1">{wallet}</p>
      <p className="text-[10px] text-slate-500 mt-1.5">
        Stake locked: <strong className="text-slate-700">{stake.toLocaleString()} RSLV</strong>
      </p>
    </div>
  );
}

function ResponseSection({ dispute, myRole }: { dispute: DisputeCase; myRole: string }) {
  const { submitResponse } = useApp();
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const canRespond =
    myRole === 'RESPONDENT' && !dispute.respondent.responded && (dispute.status === 'SUBMITTED' || dispute.status === 'RESPONDENT_WINDOW');

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-100 flex items-start gap-2.5">
        <FileText className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-sky-800 leading-relaxed">
          The respondent has <strong>48 hours</strong> to submit a formal response and counter-stake. Communication is
          restricted to the official claim / response / evidence channels — there is no open chat during an active dispute.
        </p>
      </div>

      {dispute.counterClaimSummary ? (
        <div className="p-5 rounded-2xl bg-white border border-slate-200">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Respondent&apos;s Response</h3>
          <p className="text-xs text-slate-700 leading-relaxed">{dispute.counterClaimSummary}</p>
          <p className="text-[10px] text-emerald-600 font-bold mt-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Counter-stake recorded — evidence window locked
          </p>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 text-center py-8">
          <Clock className="w-6 h-6 text-slate-300 mx-auto" />
          <p className="text-xs font-bold text-slate-500 mt-2">Awaiting respondent response…</p>
          <p className="text-[10px] text-slate-400 mt-1">
            Deadline {new Date(dispute.responseDeadline).toLocaleString('en-IN')}
          </p>
        </div>
      )}

      {canRespond && (
        <div className="p-5 rounded-2xl bg-white border-2 border-blue-200 ring-1 ring-blue-100 space-y-3">
          <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
            <Gavel className="w-4 h-4 text-blue-600" /> Submit Your Response (You are the Respondent)
          </h3>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="State your defence: what happened, why the claim is wrong or exaggerated, and any supporting documentation you will attach as evidence…"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs resize-none"
          />
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-[10px] text-slate-400">Submitting locks a 250 RSLV counter-stake into escrow.</p>
            <button
              onClick={() => {
                submitResponse(dispute.id, text.trim() || 'Respondent contests the claim and provides the counter-statement on record.');
                setSubmitted(true);
              }}
              disabled={!text.trim() || submitted}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all shadow-md disabled:opacity-40"
            >
              {submitted ? 'Response submitted ✓' : 'Submit Response & Counter-Stake'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AISection({ dispute, analyzing, onRun }: { dispute: DisputeCase; analyzing: boolean; onRun: () => void }) {
  return (
    <div className="space-y-4">
      <AIAnalysisPanel report={dispute.aiAnalysis || null} isAnalyzing={analyzing} onRunAnalysis={onRun} />
      {dispute.aiAnalysis && (
        <div className="p-4 rounded-xl bg-violet-50/70 border border-violet-100 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-violet-800 leading-relaxed">
            <strong>AI-Assisted Analysis — non-binding advisory.</strong> This report does not determine the final
            verdict. It is shown to parties for navigation; jurors never see it before their independent review and blind
            commit.
          </p>
        </div>
      )}
    </div>
  );
}

function JurySection({ dispute, myJuror, myRole }: { dispute: DisputeCase; myJuror?: DisputeCase['jurors'][number]; myRole: string }) {
  return (
    <div className="space-y-4">
      {dispute.jurors.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
          <Users className="w-6 h-6 text-slate-300 mx-auto" />
          <p className="text-xs font-bold text-slate-500">Jury panel not yet selected</p>
          <p className="text-[10px] text-slate-400 max-w-sm mx-auto leading-relaxed">
            Once evidence is locked and AI analysis completes, a weighted-random selection picks 5 available jurors with
            conflict checks. Selected jurors receive an invitation with minimal case details.
          </p>
        </div>
      ) : (
        <>
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              <strong>5-juror panel selected</strong> via weighted random selection with conflict checks. Juror
              identities are pseudonymised — the protocol only ever needs to know that each commitment comes from a
              staked, eligible wallet.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dispute.jurors.map((j) => (
              <div
                key={j.jurorId}
                className={`p-4 rounded-2xl border bg-white ${
                  myJuror && j.jurorId === myJuror.jurorId ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'
                }`}
              >
                <JurorBadge juror={j} isYou={!!myJuror && j.jurorId === myJuror.jurorId} />
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10px]">
                  <span className="text-slate-400 font-semibold">
                    Status: <strong className="text-slate-700 uppercase">{j.status.replace(/_/g, ' ')}</strong>
                  </span>
                  {j.revealedVote && (
                    <span className="text-emerald-600 font-bold text-right">
                      Voted: {j.revealedVote.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {myRole === 'JUROR' && (
            <Link
              href={`/jury/${dispute.id}`}
              className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-md"
            >
              <Gavel className="w-4 h-4" />
              Open Your Jury Workspace (anonymous deliberation)
            </Link>
          )}
        </>
      )}
    </div>
  );
}

function VotingSection({ dispute, myJuror, myRole }: { dispute: DisputeCase; myJuror?: DisputeCase['jurors'][number]; myRole: string }) {
  const { commitVote, revealVote } = useApp();
  const voting = dispute.status === 'JURY_COMMIT' || dispute.status === 'JURY_REVEAL';

  if (!voting) {
    return (
      <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
        <Lock className="w-6 h-6 text-slate-300 mx-auto" />
        <p className="text-xs font-bold text-slate-500">Voting is not active in this phase</p>
        <p className="text-[10px] text-slate-400 max-w-sm mx-auto">
          The commit–reveal vote opens when the case reaches the Jury phase. {dispute.verdictOutcome
            ? 'The verdict for this case has already been rendered — see the Verdict section.'
            : ''}
        </p>
      </div>
    );
  }

  if (dispute.jurors.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
        <Users className="w-6 h-6 text-slate-300 mx-auto" />
        <p className="text-xs font-bold text-slate-500">Jury panel selection in progress</p>
        <p className="text-[10px] text-slate-400 max-w-sm mx-auto leading-relaxed">
          The weighted-random selection is forming a 5-juror panel with conflict checks. Commit status will appear here
          once the panel is appointed.
        </p>
      </div>
    );
  }

  if (myRole !== 'JUROR' || !myJuror) {
    return (
      <div className="space-y-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Jury Panel — Commit Status</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dispute.jurors.map((j) => (
              <div key={j.jurorId} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <JurorBadge juror={j} />
                <p className="text-[10px] font-bold mt-2.5 uppercase text-slate-500">{j.status.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-4">
            You are following this case as {myRole}. Only the assigned (anonymous) jurors can commit and reveal votes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <CommitRevealVoting
      jurors={dispute.jurors}
      currentJurorId={myJuror.jurorId}
      votingDeadline={dispute.votingDeadline}
      onCommitVote={(jurorId, commitment, vote, salt) => commitVote(dispute.id, jurorId, commitment, vote, salt)}
      onRevealVote={(jurorId, vote, salt) => revealVote(dispute.id, jurorId, vote, salt)}
    />
  );
}

function VerdictSection({ dispute }: { dispute: DisputeCase }) {
  const v = dispute.verdictOutcome;
  if (!v) {
    return (
      <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
        <Gavel className="w-6 h-6 text-slate-300 mx-auto" />
        <p className="text-xs font-bold text-slate-500">Verdict not yet rendered</p>
        <p className="text-[10px] text-slate-400">A verdict appears once all assigned jurors reveal and quorum is met.</p>
      </div>
    );
  }
  const total = v.totalJurors || 5;
  const rows = [
    { label: 'Claimant upheld', n: v.voteCount.claimant, color: 'bg-emerald-500' },
    { label: 'Respondent upheld', n: v.voteCount.respondent, color: 'bg-rose-500' },
    { label: 'Split settlement', n: v.voteCount.split, color: 'bg-amber-400' },
  ];
  return (
    <div className="space-y-4">
      <div
        className={`p-6 rounded-2xl border text-center space-y-3 ${
          v.winner === 'Claimant'
            ? 'bg-emerald-50/60 border-emerald-200'
            : v.winner === 'Respondent'
            ? 'bg-rose-50/60 border-rose-200'
            : 'bg-amber-50/60 border-amber-200'
        }`}
      >
        <Gavel className="w-8 h-8 mx-auto text-slate-700" />
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Jury Verdict — Final</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            {v.winner === 'Claimant' ? 'Claimant Upheld' : v.winner === 'Respondent' ? 'Respondent Upheld' : 'Split Settlement'}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            {v.voteCount.claimant}–{v.voteCount.respondent}–{v.voteCount.split} · {v.totalJurors} jurors · finalized{' '}
            {formatDateSafe(v.finalizedAt)}
          </p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
              <span>{r.label}</span>
              <span>{r.n}/{total}</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div className={`h-full ${r.color} rounded-full`} style={{ width: `${(r.n / total) * 100}%` }}></div>
            </div>
          </div>
        ))}
        <p className="text-[10px] font-mono text-slate-400 pt-2">
          verdict hash: <span className="text-blue-600 font-bold">{formatHash(v.verdictHash, 20)}</span>
        </p>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
        <strong>What happens now:</strong> escrow settles automatically (winner recovers the stake; jurors are rewarded),
        a 48-hour appeal window opens, and a <strong>Verified Case Record</strong> is generated. If no appeal is filed,
        the case finalizes and becomes a public case study.
      </div>
    </div>
  );
}

function AppealSection({ dispute, myRole }: { dispute: DisputeCase; myRole: string }) {
  const { fileAppeal } = useApp();
  const [grounds, setGrounds] = useState('');
  const a = dispute.appeal;
  const canFile = appealAvailable(dispute) && (myRole === 'CLAIMANT' || myRole === 'RESPONDENT');
  const isFinal = dispute.status === 'FINALIZED' || dispute.status === 'CLOSED';

  return (
    <div className="space-y-4">
      {!a && !dispute.verdictOutcome ? (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
          <AlertTriangle className="w-6 h-6 text-slate-300 mx-auto" />
          <p className="text-xs font-bold text-slate-500">Appeal window opens after a verdict</p>
        </div>
      ) : (
        <>
          <div
            className={`p-5 rounded-2xl border ${
              a?.filed ? 'bg-amber-50/60 border-amber-200' : isFinal ? 'bg-emerald-50/60 border-emerald-200' : 'bg-white border-slate-200'
            }`}
          >
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Appeal Window</h3>
            {a?.filed ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Appeal filed by {a.filedBy}
                </p>
                {a.grounds && <p className="text-[11px] text-slate-700 leading-relaxed">&ldquo;{a.grounds}&rdquo;</p>}
                <p className="text-[10px] text-slate-500">
                  A fresh 7-juror panel (different from the original) will review the case. The original verdict is
                  suspended pending the appeal.
                </p>
              </div>
            ) : isFinal ? (
              <p className="text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {a?.outcomeNote || 'Appeal window closed without filing. The verdict stands as final.'}
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Either party may file an appeal within 48 hours of the verdict. Grounds include: procedural error,
                  evidence that was improperly excluded, or a conflict of interest on the panel. Appeals are heard by a{' '}
                  <strong>fresh 7-juror panel</strong>.
                </p>
                {a?.windowClosesAt && (
                  <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Window closes {new Date(a.windowClosesAt).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            )}
          </div>

          {canFile && (
            <div className="p-5 rounded-2xl bg-white border-2 border-amber-200 ring-1 ring-amber-100 space-y-3">
              <h3 className="text-xs font-black text-slate-900">File an Appeal</h3>
              <textarea
                value={grounds}
                onChange={(e) => setGrounds(e.target.value)}
                rows={3}
                placeholder="State the grounds for appeal (procedural error, excluded evidence, panel conflict)…"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none text-xs resize-none"
              />
              <button
                onClick={() => fileAppeal(dispute.id, myRole === 'CLAIMANT' ? 'Claimant' : 'Respondent', grounds.trim())}
                disabled={!grounds.trim()}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition-all shadow-md disabled:opacity-40"
              >
                Submit Appeal
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RecordSection({ dispute, onGenerate }: { dispute: DisputeCase; onGenerate: () => void }) {
  const lp = dispute.legalPackage;
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-2.5">
        <Landmark className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-800 leading-relaxed">
          A <strong>Verified Case Record</strong> (also exportable as a Legal / Forensic Record or Evidence &amp; Audit
          Package) is a structured, hash-anchored electronic record of the dispute. It is designed to be presented to
          courts or forums; <strong>admissibility depends on the jurisdiction and forum</strong> — this is not legal
          advice.
        </p>
      </div>

      {lp ? (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" /> Verified Case Record
            </h3>
            <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {lp.integrityStatus}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
            <MetaRow label="Package ID" value={lp.packageId} mono />
            <MetaRow label="Certificate" value={lp.certificateId} mono />
            <MetaRow label="Statutory standard" value={lp.statutoryStandard} />
            <MetaRow label="Canonical record hash" value={formatHash(lp.canonicalRecordHash, 24)} mono />
            <MetaRow label="IPFS manifest CID" value={formatHash(lp.ipfsManifestCid, 24)} mono />
            <MetaRow label="Anchored tx" value={formatHash(lp.anchoredTxHash, 20)} mono />
          </div>
          <div className="pt-3 border-t border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Chain of custody — signatories</p>
            <div className="space-y-1.5">
              {lp.chainOfCustodySigners.map((s, i) => (
                <p key={i} className="text-[11px] text-slate-600 flex items-center gap-2 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {s}
                </p>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
          <BookOpen className="w-6 h-6 text-slate-300 mx-auto" />
          <p className="text-xs font-bold text-slate-500">Record will be generated after finalization</p>
          <p className="text-[10px] text-slate-400 max-w-sm mx-auto">
            Once the case finalizes, the protocol assembles the verified record with hashes, CIDs, and the audit trail.
          </p>
        </div>
      )}

      <button
        onClick={onGenerate}
        className="w-full p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-all flex items-center justify-center gap-2"
      >
        <Download className="w-4 h-4" />
        Generate Legal / Forensic Export Package
      </button>
    </div>
  );
}

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`text-slate-800 font-semibold mt-0.5 ${mono ? 'font-mono text-[10px] break-all' : ''}`}>{value}</p>
    </div>
  );
}
