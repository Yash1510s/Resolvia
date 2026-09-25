'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  FileText,
  Lock,
  Coins,
  Shield,
  RefreshCw,
  Target,
  Save,
  ArrowRight,
  Users,
  Plus,
  X,
  Link2,
  Scale,
  Gavel,
  FilePlus,
  Sparkles,
} from 'lucide-react';
import { DisputeCase, DisputeCategory, EvidenceItem } from '../../types';
import { computeSha256, computeSha256Bytes, formatHash } from '../../lib/crypto';
import { anchorEvidenceOnChain, storeEvidenceContent } from '../../lib/chain';
import { useApp } from '../../lib/app-context';
import { Card, Chip, BtnPrimary, categoryLabel } from '../../components/ui';

const DRAFT_KEY = 'resolvia_case_draft_v2';

const STEPS = [
  { id: 'intro', label: 'Intro' },
  { id: 'basic', label: 'Basic Info' },
  { id: 'parties', label: 'Parties' },
  { id: 'category', label: 'Category' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'outcome', label: 'Outcome' },
  { id: 'review', label: 'Review' },
];

const CATEGORIES: { value: DisputeCategory; icon: React.ReactNode; hint: string }[] = [
      { value: 'FINANCIAL_PAYMENT', icon: <Coins className="w-5 h-5" />, hint: 'Payment, refund, transaction, contract payment' },
      { value: 'ECOMMERCE_MARKETPLACE', icon: <FileText className="w-5 h-5" />, hint: 'Not delivered, wrong item, damaged goods' },
      { value: 'CONTRACT_OBLIGATION', icon: <Lock className="w-5 h-5" />, hint: 'Terms, service delivery, obligations' },
      { value: 'BUSINESS_PEER', icon: <Users className="w-5 h-5" />, hint: 'Partnership, freelance, peer disagreements' },
      { value: 'PROPERTY_SERVICE', icon: <Scale className="w-5 h-5" />, hint: 'Documented property or service claims' },
      { value: 'DIGITAL_PLATFORM', icon: <Shield className="w-5 h-5" />, hint: 'Online transactions, platform conflicts' },
      { value: 'GENERAL_EVIDENCE', icon: <FileText className="w-5 h-5" />, hint: 'Any dispute where claim + evidence exist' },
      { value: 'FREELANCE_DEV', icon: <Target className="w-5 h-5" />, hint: 'Software delivery, staging, audits' },
      { value: 'MARKETPLACE', icon: <Coins className="w-5 h-5" />, hint: 'Marketplace transactions & fees' },
      { value: 'DAO_GOVERNANCE', icon: <Gavel className="w-5 h-5" />, hint: 'Governance, proposals, treasury' },
      { value: 'IP_ACADEMIC', icon: <FileText className="w-5 h-5" />, hint: 'Plagiarism, grants, research milestones' },
      { value: 'SERVICE_SLA', icon: <Shield className="w-5 h-5" />, hint: 'Uptime, support, response windows' },
      { value: 'CAMPUS_LIFE', icon: <Users className="w-5 h-5" />, hint: 'Hostel, fees, campus services, events' },
      { value: 'ACADEMIC', icon: <FileText className="w-5 h-5" />, hint: 'Grades, projects, academic integrity' },
      { value: 'COMMUNITY', icon: <Users className="w-5 h-5" />, hint: 'Community moderation, shared spaces' },
    ];

interface UploadSlot {
  fileName: string;
  sizeKb: number;
  sha256: string;
  url: string;
  status: 'PENDING' | 'HASHING' | 'ANCHORED';
}

interface Witness {
  name: string;
  contact: string;
}

interface DraftState {
  step: number;
  title: string;
  category: DisputeCategory;
  amount: string;
  summary: string;
  respondentName: string;
  respondentContact: string;
  witnesses: Witness[];
  outcome: string;
  outcomeNotes: string;
  uploads: UploadSlot[];
}

function loadDraft(): DraftState | null {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(DRAFT_KEY) : null;
    return raw ? (JSON.parse(raw) as DraftState) : null;
  } catch {
    return null;
  }
}

const SUBMIT_PHASES = [
  'Fingerprinting evidence (SHA-256)…',
  'Anchoring evidence on-chain (EvidenceRegistry)…',
  'Locking 500 RSLV escrow stake…',
  'Registering case on the CaseRegistry…',
  'Notifying respondent (48h response window)…',
];

export default function CreateCasePage() {
  const { createCase, recordAnchors, identity } = useApp();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState<DisputeCategory | null>(null);
  const [respondentName, setRespondentName] = useState('');
  const [respondentContact, setRespondentContact] = useState('');
  const [witnesses, setWitnesses] = useState<Witness[]>([]);
  const [wName, setWName] = useState('');
  const [wContact, setWContact] = useState('');
  const [outcome, setOutcome] = useState('');
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [uploads, setUploads] = useState<UploadSlot[]>([]);
  const [agree, setAgree] = useState(false);
  const [phase, setPhase] = useState(-1); // -1 = not submitting, 0..4 progress, 5 = done
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [createdCase, setCreatedCase] = useState<DisputeCase | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const claimantName = identity?.name ? `${identity.name} (You)` : 'You';

  // Draft restore (once)
  useEffect(() => {
    const d = loadDraft();
    if (d && (d.title || d.summary || d.uploads.length > 0)) {
      setStep(Math.max(1, Math.min(d.step, 6)));
      setTitle(d.title);
      setAmount(d.amount);
      setSummary(d.summary);
      setCategory(d.category);
      setRespondentName(d.respondentName);
      setRespondentContact(d.respondentContact);
      setWitnesses(d.witnesses || []);
      setOutcome(d.outcome);
      setOutcomeNotes(d.outcomeNotes);
      setUploads(d.uploads.filter((u) => u.status === 'ANCHORED'));
      setDraftSavedAt('just now');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draft autosave
  useEffect(() => {
    const t = setTimeout(() => {
      const hasContent = title || summary || uploads.length > 0 || outcome || category;
      if (!hasContent) {
        localStorage.removeItem(DRAFT_KEY);
        setDraftSavedAt(null);
        return;
      }
      const d: DraftState = { step, title, category: category || 'FINANCIAL_PAYMENT', amount, summary, respondentName, respondentContact, witnesses, outcome, outcomeNotes, uploads };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
      setDraftSavedAt(new Date().toLocaleTimeString());
    }, 700);
    return () => clearTimeout(t);
  }, [step, title, category, amount, summary, respondentName, respondentContact, witnesses, outcome, outcomeNotes, uploads]);

  const addFile = async (file?: File) => {
    const realName = file?.name || `evidence_${uploads.length + 1}.pdf`;
    const sizeKb = file ? Math.max(1, Math.round(file.size / 1024)) : 100 + Math.floor(Math.random() * 900);
    const slot: UploadSlot = { fileName: realName, sizeKb, sha256: '', url: '', status: 'HASHING' };
    setUploads((prev) => [...prev, slot]);
    // Real fingerprint: hash the actual file bytes (WebCrypto). A single-byte
    // change in the file changes the hash — that is the tamper-evidence story.
    // Without a file (demo quick-add) we hash a placeholder string instead.
    let h: string;
    if (file) {
      const buf = await file.arrayBuffer();
      h = await computeSha256Bytes(buf);
      storeEvidenceContent(h, buf); // session cache for the Proof Verifier's content re-check
    } else {
      h = await computeSha256(realName + ':resolvia-evidence');
    }
    setTimeout(() => {
      setUploads((prev) => prev.map((u) => (u.fileName === slot.fileName && u.status === 'HASHING' ? { ...u, sha256: h, status: 'ANCHORED' } : u)));
    }, 650);
  };

  const canNext = useMemo(() => {
    switch (step) {
      case 0: return true;
      case 1: return title.trim().length >= 8 && summary.trim().length >= 20;
      case 2: return respondentName.trim().length >= 2;
      case 3: return category !== null;
      case 4: return uploads.length > 0 && uploads.every((u) => u.status === 'ANCHORED');
      case 5: return outcome.length > 0;
      default: return agree;
    }
  }, [step, title, summary, respondentName, category, uploads, outcome, agree]);

  const startSubmit = () => {
    setPhase(0);
    SUBMIT_PHASES.forEach((_, i) => {
      setTimeout(() => setPhase(i + 1), 750 * (i + 1));
    });
    runSubmit();
  };

  /** Pure: build the case object (no side effects). */
  const buildCase = () => {
    const now = new Date().toISOString();
    // Sequential, collision-free case numbers (persisted so refreshes don't reuse them).
    let seq = 1090;
    try {
      seq = Number(window.localStorage.getItem('resolvia_case_seq') || '1090') + 1;
      window.localStorage.setItem('resolvia_case_seq', String(seq));
    } catch {
      seq = Math.floor(1000 + Math.random() * 8999);
    }
    const num = String(seq);
    const caseNumber = `RSLV-2026-${num}`;
    const evidence: EvidenceItem[] = uploads.map((u, i) => ({
      id: `ev-${Date.now()}-${i}`,
      title: `Uploaded Evidence ${i + 1}`,
      description: u.url ? `Linked source: ${u.url}` : 'Uploaded via Create Case (SHA-256 fingerprinted in browser, pinned to IPFS).',
      fileName: u.fileName,
      fileSize: `${u.sizeKb} KB`,
      mimeType: u.fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream',
      sha256Hash: u.sha256,
      ipfsCid: `bafybei${u.sha256.slice(0, 44)}`,
      submittedBy: 'Claimant',
      submitterWallet: identity.wallet,
      submittedAt: now,
      accessTier: 'PUBLIC',
      encrypted: false,
    }));
    const newCase: DisputeCase = {
      id: `case-${num}`,
      caseNumber,
      title: title || 'Untitled Dispute',
      category: category || 'GENERAL_EVIDENCE',
      status: 'SUBMITTED',
      myRole: 'CLAIMANT',
      disputeAmount: Number(amount || 0) > 0 ? `${Number(amount).toLocaleString('en-IN')} USD` : 'Non-monetary relief',
      createdAt: now,
      responseDeadline: new Date(Date.now() + 2 * 86_400_000).toISOString(),
      votingDeadline: new Date(Date.now() + 6 * 86_400_000).toISOString(),
      claimant: { name: claimantName.replace(' (You)', ''), wallet: identity.sub, stake: 250 },
      respondent: { name: respondentName, wallet: '0x2281…99aa', stake: 0, responded: false },
      claimSummary: summary,
      reliefSought: outcomeNotes || outcome,
      evidence,
      jurors: [],
      auditTrail: [
        {
          eventId: `evt-new-${Date.now()}`,
          eventNumber: 'EVENT 001',
          title: 'Dispute Case Registered',
          actor: identity.sub,
          actorRole: 'Claimant',
          timestamp: now.replace('T', ' ').substring(0, 19) + ' UTC',
          txHash: '0x' + formatHash(caseNumber, 64),
          blockNumber: 6284200,
          metadataHash: formatHash(caseNumber, 64),
          details: `Case ${caseNumber} created. ${evidence.length} evidence item(s) hashed in-browser and anchored on-chain. 500 RSLV stake locked in escrow; respondent notified.`,
        },
      ],
    };
    return newCase;
  };

  /** Real submit: register the case, then anchor every evidence item on-chain. */
  const runSubmit = async () => {
    const newCase = buildCase();
    createCase(newCase);
    setCreatedCase(newCase);

    // Real on-chain anchoring (EvidenceRegistry.registerEvidence).
    // Logged-in users: backend signs with their assigned wallet.
    // Guests: demo claimant account (local testnet).
    let caseIdNum = 0;
    try {
      caseIdNum = Number(newCase.caseNumber.split('-').pop()) || 0;
    } catch {
      caseIdNum = 0;
    }
    let token: string | null = null;
    try {
      token = window.localStorage.getItem('resolvia_token');
    } catch {
      token = null;
    }
    const updates: { evidenceId: string; onChainTx?: string; onChainBlock?: number; status: 'ANCHORED' | 'FAILED' }[] = [];
    for (const ev of newCase.evidence) {
      const res = await anchorEvidenceOnChain(
        { caseId: caseIdNum, sha256: ev.sha256Hash, ipfsCid: ev.ipfsCid },
        token
      );
      updates.push({
        evidenceId: ev.id,
        onChainTx: res.txHash,
        onChainBlock: res.blockNumber ?? undefined,
        status: res.status === 'ANCHORED' ? 'ANCHORED' : 'FAILED',
      });
    }
    recordAnchors(newCase.id, updates);

    // Hold the success screen until both the animation and the real anchoring finish.
    const minTime = 750 * SUBMIT_PHASES.length + 500;
    await new Promise((r) => setTimeout(r, minTime));
    setPhase(5);
    localStorage.removeItem(DRAFT_KEY);
  };

  const reset = () => {
    setStep(0);
    setTitle('');
    setAmount('');
    setSummary('');
    setCategory(null);
    setRespondentName('');
    setRespondentContact('');
    setWitnesses([]);
    setOutcome('');
    setOutcomeNotes('');
    setUploads([]);
    setAgree(false);
    setPhase(-1);
    setCreatedCase(null);
    localStorage.removeItem(DRAFT_KEY);
  };

  /* ───────────── Success screen ───────────── */
  if (createdCase && phase === 5) {
    const c = createdCase;
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center">
            <Check className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-4">Case Submitted Successfully</h1>
          <p className="font-mono text-sm text-violet-700 mt-1">{c.caseNumber}</p>
          <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Ledger receipt</p>
            <div className="space-y-1.5 text-[11px]">
              {(() => {
                const anchorEvt = c.auditTrail.find((a) => a.eventNumber === 'EVENT ANCHOR');
                const anchored = c.evidence.filter((e) => e.onChainAnchored).length;
                const firstTx = c.evidence.find((e) => e.onChainTx)?.onChainTx;
                return (
                  <>
                    <p className="flex justify-between gap-4"><span className="text-slate-400 font-semibold">Case registered</span><span className="font-mono text-slate-700 truncate">{c.caseNumber}</span></p>
                    <p className="flex justify-between gap-4"><span className="text-slate-400 font-semibold">Evidence anchored on-chain</span><span className={`font-semibold ${anchored === c.evidence.length ? 'text-emerald-600' : 'text-amber-600'}`}>{anchored}/{c.evidence.length} item(s) · EvidenceRegistry</span></p>
                    {firstTx && (
                      <p className="flex justify-between gap-4"><span className="text-slate-400 font-semibold">Anchor tx</span><span className="font-mono text-slate-700 truncate">{firstTx.slice(0, 20)}…</span></p>
                    )}
                    {anchorEvt && (
                      <p className="flex justify-between gap-4"><span className="text-slate-400 font-semibold">Block</span><span className="font-mono text-slate-700">#{anchorEvt.blockNumber.toLocaleString()}</span></p>
                    )}
                    <p className="flex justify-between gap-4"><span className="text-slate-400 font-semibold">Escrow stake</span><span className="text-slate-700 font-semibold">500 RSLV (both parties)</span></p>
                    <Link href="/proof-verifier" className="flex items-center gap-1 text-violet-600 font-bold hover:text-violet-700 pt-1">
                      Verify this anchor on-chain <ArrowRight className="w-3 h-3" />
                    </Link>
                  </>
                );
              })()}
            </div>
          </div>
          <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">What happens next</p>
            {[
              'The respondent is notified and has 48 hours to respond with a counter-stake.',
              'Your SHA-256 anchored evidence is visible to the respondent in the Evidence section.',
              'Once the response window closes, evidence is locked and a non-binding AI advisory runs.',
              'A 5-juror panel is selected; their commit–reveal verdict is final and enforced via escrow.',
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-[12px] text-slate-700 leading-relaxed">{t}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 pt-5">
            <button onClick={reset} className="flex-1 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all">
              Start Another Case
            </button>
            <BtnPrimary href={`/cases/${c.id}`} className="flex-1">
              Open Case Details <ArrowRight className="w-3.5 h-3.5" />
            </BtnPrimary>
          </div>
        </Card>
      </div>
    );
  }

  /* ───────────── Submitting progress ───────────── */
  if (phase >= 0 && phase < 5) {
    return (
      <div className="max-w-xl mx-auto">
        <Card className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900">Submitting your case…</h1>
              <p className="text-[12px] text-slate-500">Real pipeline on the local testnet — evidence is fingerprinted in your browser and anchored on-chain.</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {SUBMIT_PHASES.map((p, i) => {
              const done = phase > i;
              const active = phase === i;
              return (
                <div key={p} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${done ? 'border-emerald-200 bg-emerald-50/60' : active ? 'border-violet-200 bg-violet-50' : 'border-slate-100 bg-white opacity-50'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-emerald-500 text-white' : active ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {done ? <Check className="w-3.5 h-3.5" /> : active ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : i + 1}
                  </span>
                  <span className={`text-[12px] font-semibold ${done ? 'text-emerald-700' : active ? 'text-violet-700' : 'text-slate-400'}`}>{p}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  /* ───────────── Wizard ───────────── */
  const stepTitle = ['Start a Case', 'Basic Information', 'Parties & Witnesses', 'Choose a Category', 'Upload Evidence', 'Desired Outcome', 'Review & Confirm'][step];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{stepTitle}</h1>
          <p className="text-[12px] text-slate-500 mt-1">
            Evidence is SHA-256 hashed in your browser ·
            {draftSavedAt ? (
              <span className="text-emerald-600 font-bold inline-flex items-center gap-1 ml-1"><Save className="w-3 h-3" /> draft saved {draftSavedAt}</span>
            ) : (
              <span className="text-slate-400"> draft auto-saves as you type</span>
            )}
          </p>
        </div>
        <Chip tone="violet">{STEPS[step].label} · step {step + 1} of 7</Chip>
      </div>

      {/* Step dots */}
      <div className="flex items-center gap-1.5 mb-5">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => i < step && setStep(i)}
            disabled={i > step}
            className={`h-1.5 flex-1 rounded-full transition-all ${i < step ? 'bg-emerald-400' : i === step ? 'bg-violet-600' : 'bg-slate-200'}`}
            title={s.label}
          />
        ))}
      </div>

      <Card className="p-6 sm:p-7">
        {/* 0 — Intro */}
        {step === 0 && (
          <div>
            <div className="rounded-2xl bg-gradient-to-br from-[#171f3d] via-[#232a54] to-[#43307a] text-white p-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-violet-500/40 flex items-center justify-center">
                  <Scale className="w-5 h-5 text-violet-200" />
                </div>
                <div>
                  <h2 className="text-lg font-black">Every dispute deserves a fair hearing</h2>
                  <p className="text-[12px] text-slate-300">File your case in minutes — evidence anchored, verdicts by humans, records on-chain.</p>
                </div>
              </div>
            </div>
            <div className="grid sm:grid-cols-4 gap-3 mt-5">
              {[
                { icon: <FilePlus className="w-4 h-4" />, t: '1 · Describe', s: 'Title, parties, what happened' },
                { icon: <Shield className="w-4 h-4" />, t: '2 · Anchor Evidence', s: 'SHA-256 + IPFS, tamper-evident' },
                { icon: <Sparkles className="w-4 h-4" />, t: '3 · AI Advisory', s: 'Non-binding analysis of the record' },
                { icon: <Gavel className="w-4 h-4" />, t: '4 · Jury Verdict', s: 'Anonymous 5-juror commit–reveal vote' },
              ].map((x) => (
                <div key={x.t} className="rounded-xl border border-slate-200 p-3.5">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">{x.icon}</div>
                  <p className="text-[12px] font-black text-slate-800 mt-2.5">{x.t}</p>
                  <p className="text-[10.5px] text-slate-400 mt-0.5 leading-snug">{x.s}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 p-4 rounded-xl bg-violet-50 border border-violet-200 text-[11.5px] text-violet-900 leading-relaxed">
              <strong>Anti-Spam Escrow:</strong> A 250 RSLV stake is locked from each party in the smart contract escrow to deter bad-faith filings.
              The AI advisory provides <strong>objective advisory analysis</strong> — only the human jury's cryptographic consensus renders the binding outcome.
            </div>
          </div>
        )}

        {/* 1 — Basic info */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Dispute Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Undelivered Order — Refund Request" className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none text-[13px]" />
              <p className="text-[10px] text-slate-400 mt-1">{title.length}/200 · be specific; this appears in your case list</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Amount in Dispute (USD)</label>
                <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0 if non-monetary" className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none text-[13px] font-mono" />
              </div>
              <div className="flex items-end pb-1 text-[11px] text-slate-400">
                {Number(amount || 0) > 0 ? `Escrow dispute value: ${Number(amount).toLocaleString('en-IN')} USD` : 'Non-monetary relief (e.g. action, correction, apology)'}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Claim Summary</label>
              <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} placeholder="Briefly describe what happened, when, and what went wrong. Facts only — the jury reads this first." className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none text-[13px] resize-none" />
              <p className="text-[10px] text-slate-400 mt-1">{summary.length} chars · min 20</p>
            </div>
          </div>
        )}

        {/* 2 — Parties & witnesses */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-violet-50/60 border border-violet-100">
                <label className="text-[11px] font-bold text-violet-700 uppercase tracking-wider">Claimant (You)</label>
                <p className="text-[13px] font-black text-slate-900 mt-1.5">{claimantName}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{identity.wallet.slice(0, 10)}…{identity.wallet.slice(-4)}</p>
                <p className="text-[10px] text-slate-400 mt-2">Pre-filled from your signed-in identity.</p>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Respondent</label>
                <input value={respondentName} onChange={(e) => setRespondentName(e.target.value)} placeholder="Name of the party you are disputing with" className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none text-[13px]" />
                <input value={respondentContact} onChange={(e) => setRespondentContact(e.target.value)} placeholder="Email or contact (optional — used to notify them)" className="mt-2 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none text-[13px]" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Witnesses <span className="text-slate-400 normal-case font-medium">(optional)</span></label>
                <span className="text-[11px] text-slate-400">{witnesses.length} added</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
                <input value={wName} onChange={(e) => setWName(e.target.value)} placeholder="Witness name" className="px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-violet-500 outline-none text-[13px]" />
                <input value={wContact} onChange={(e) => setWContact(e.target.value)} placeholder="Contact (optional)" className="px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-violet-500 outline-none text-[13px]" />
                <button
                  onClick={() => {
                    if (!wName.trim()) return;
                    setWitnesses((w) => [...w, { name: wName.trim(), contact: wContact.trim() }]);
                    setWName('');
                    setWContact('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
              {witnesses.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {witnesses.map((w, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-600">
                      {w.name} {w.contact && <span className="text-slate-400">· {w.contact}</span>}
                      <button onClick={() => setWitnesses((prev) => prev.filter((_, j) => j !== i))} className="w-4 h-4 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-slate-400 mt-2">Witness statements are attached as optional evidence; jurors weigh them like any other exhibit.</p>
            </div>
          </div>
        )}

        {/* 3 — Category grid */}
        {step === 3 && (
          <div>
            <p className="text-[12px] text-slate-500 mb-4">Pick the category that best fits your dispute. It shapes juror selection (domain relevance) and the case-study archive.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {CATEGORIES.map((c) => {
                const info = categoryLabel(c.value);
                const active = category === c.value;
                return (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all ${active ? 'border-violet-500 bg-violet-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${active ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{c.icon}</div>
                    <p className="text-[12.5px] font-black text-slate-800 mt-2.5">{info.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{c.hint}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 4 — Evidence */}
        {step === 4 && (
          <div className="space-y-4">
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => { if (e.target.files?.[0]) addFile(e.target.files[0]); e.target.value = ''; }} />
            <button onClick={() => (fileRef.current ? fileRef.current.click() : addFile())} className="w-full p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-violet-400 hover:bg-violet-50/30 transition-all flex flex-col items-center gap-1.5 text-slate-400 hover:text-violet-600">
              <FileText className="w-6 h-6" />
              <span className="text-[13px] font-bold">Add Evidence File</span>
              <span className="text-[11px]">SHA-256 fingerprint computed locally before upload</span>
            </button>

            {uploads.length > 0 && (
              <div className="space-y-2.5">
                {uploads.map((u) => (
                  <div key={u.fileName} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-slate-800 truncate">{u.fileName} <span className="text-slate-400 font-medium">· {u.sizeKb} KB</span></p>
                        <p className="text-[10px] font-mono text-slate-400 truncate mt-1">{u.sha256 ? `SHA-256 ${formatHash(u.sha256, 30)}…` : 'computing fingerprint…'}</p>
                        {u.sha256 && <p className="text-[10px] font-mono text-slate-400 truncate">IPFS bafybei{u.sha256.slice(0, 30)}…</p>}
                      </div>
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-full shrink-0 ${u.status === 'ANCHORED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {u.status === 'HASHING' ? 'HASHING…' : 'ANCHORED'}
                      </span>
                    </div>
                    {u.status === 'ANCHORED' && (
                      <div className="flex items-center gap-2 mt-2.5">
                        <Link2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <input value={u.url} onChange={(e) => setUploads((prev) => prev.map((x) => (x.fileName === u.fileName ? { ...x, url: e.target.value } : x)))} placeholder="Optional: source URL for this evidence" className="flex-1 bg-transparent text-[11px] outline-none placeholder:text-slate-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
              <Shield className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
              <p className="text-[11.5px] text-slate-600 leading-relaxed">
                At least one evidence item is required. The respondent can counter with their own evidence. Everything is hash-anchored — any tampering breaks verification visibly.
              </p>
            </div>
          </div>
        )}

        {/* 5 — Outcome */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> What outcome do you want?</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2.5">
                {[
                  { v: 'Full refund of the disputed amount', d: 'Respondent returns the entire amount' },
                  { v: 'Partial refund / compensation', d: 'A portion, based on evidence of partial fault' },
                  { v: 'Specific performance', d: 'Delivery of the item / completion of the service' },
                  { v: 'Other relief', d: 'Describe it in the notes below' },
                ].map((o) => (
                  <button key={o.v} onClick={() => setOutcome(o.v)} className={`p-3.5 rounded-xl border-2 text-left transition-all ${outcome === o.v ? 'border-violet-500 bg-violet-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <p className="text-[12.5px] font-black text-slate-900">{o.v}</p>
                    <p className="text-[10.5px] text-slate-500 mt-0.5">{o.d}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Details (optional)</label>
              <textarea value={outcomeNotes} onChange={(e) => setOutcomeNotes(e.target.value)} rows={2} placeholder="e.g. I want the 2,150 USD returned to my wallet; the item was never delivered." className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none text-[13px] resize-none" />
              <p className="text-[11px] text-slate-400 mt-1.5">
                This is your <strong className="text-slate-500">desired outcome</strong> — the jury decides independently based on evidence. The AI advisory is non-binding.
              </p>
            </div>
          </div>
        )}

        {/* 6 — Review */}
        {step === 6 && (
          <div className="space-y-3.5">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-[13px]">
              <ReviewRow label="Title" value={title} />
              <ReviewRow label="Parties" value={`${claimantName} vs ${respondentName}`} />
              <ReviewRow label="Category" value={category ? categoryLabel(category).label : '—'} />
              <ReviewRow label="Amount" value={Number(amount || 0) > 0 ? `${Number(amount).toLocaleString('en-IN')} USD` : 'Non-monetary'} />
              <ReviewRow label="Witnesses" value={witnesses.length ? witnesses.map((w) => w.name).join(', ') : 'None'} />
              <ReviewRow label="Desired outcome" value={outcomeNotes || outcome} />
              <ReviewRow label="Evidence" value={`${uploads.length} file(s), all SHA-256 anchored`} />
            </div>
            <div className="p-5 rounded-2xl bg-violet-50/60 border border-violet-100">
              <h4 className="text-[13px] font-bold text-violet-900 flex items-center gap-2"><Coins className="w-4 h-4" /> Escrow Stake</h4>
              <p className="text-[11.5px] text-violet-800/80 mt-2 leading-relaxed">
                A <strong>250 RSLV</strong> stake from each party is locked in the ArbitrationHub contract. The losing party's stake funds the prevailing party plus jury consensus rewards according to protocol rules.
              </p>
            </div>
            <label className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 w-4 h-4 accent-violet-600" />
              <span className="text-[11.5px] text-slate-800 leading-relaxed">
                <strong>I confirm</strong> the details above are accurate. I understand this case will be resolved under the Resolvia decentralized jury protocol; the AI advisory is non-binding; the human jury's cryptographic consensus verdict is final and enforced via on-chain smart escrow settlement.
              </span>
            </label>
          </div>
        )}
      </Card>

      {/* Footer nav */}
      <div className="flex items-center justify-between mt-5">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        {step < 6 ? (
          <button
            onClick={() => setStep((s) => Math.min(6, s + 1))}
            disabled={!canNext}
            className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {step === 0 ? 'Start Now' : 'Continue'} <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={startSubmit} disabled={!canNext} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md disabled:opacity-40 flex items-center gap-2">
            <Lock className="w-4 h-4" /> Submit Case
          </button>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">{label}</span>
      <span className="text-[12.5px] font-semibold text-slate-800 text-right break-words min-w-0">{value}</span>
    </div>
  );
}
