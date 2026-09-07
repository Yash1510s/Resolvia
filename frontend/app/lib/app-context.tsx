'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  AppNotification,
  CommunityPost,
  DisputeCase,
  JuryAvailability,
  JuryInvitation,
  JurorHistoryItem,
  MyCaseRole,
  ProfilePrefs,
  VoteChoice,
} from '../types';
import { INITIAL_CASES, INITIAL_INVITATIONS, INITIAL_JUROR_HISTORY } from './mockData';
import { useAuth } from './auth-context';
import { computeSha256, formatHash } from './crypto';
import { jurorPseudonym } from './jury';

export interface Identity {
  name: string;
  email?: string;
  wallet: string;
  provider: 'google' | 'email' | 'demo';
  sub: string; // short wallet for display
}

interface AppContextValue {
  // core
  cases: DisputeCase[];
  activeRole: MyCaseRole;
  setActiveRole: (r: MyCaseRole) => void;
  identity: Identity;
  isLoggedIn: boolean;
  login: (role?: MyCaseRole) => void;
  logout: () => void;
  rslvBalance: number;
  claimFaucet: () => void;
  // case mutations
  createCase: (c: DisputeCase) => void;
  selectCase: (id: string) => void;
  activeCaseId: string;
  commitVote: (caseId: string, jurorId: string, commitment: string, vote: VoteChoice, salt: string) => void;
  revealVote: (caseId: string, jurorId: string, vote: VoteChoice, salt: string) => void;
  simulateOtherJurors: (caseId: string) => void;
  runAIAnalysis: (caseId: string) => void;
  submitResponse: (caseId: string, text: string) => void;
  fileAppeal: (caseId: string, by: 'Claimant' | 'Respondent', grounds: string) => void;
  addDiscussionPost: (caseId: string, post: Omit<CommunityPost, 'id' | 'createdAt' | 'likes' | 'reports'>) => void;
  addDeliberationPost: (caseId: string, body: string) => void;
  addEvidence: (caseId: string) => Promise<void>;
  // profile
  profilePrefs: ProfilePrefs;
  setProfilePrefs: (p: ProfilePrefs) => void;
  // jury
  availability: JuryAvailability;
  setAvailability: (a: JuryAvailability) => void;
  invitations: JuryInvitation[];
  acceptInvitation: (id: string) => void;
  declineInvitation: (id: string, reason: 'BUSY' | 'CONFLICT' | 'OTHER') => void;
  jurorHistory: JurorHistoryItem[];
  // notifications
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: number;
  // wizard
  wizardOpen: boolean;
  openWizard: () => void;
  closeWizard: () => void;
  // helpers
  getCase: (id: string) => DisputeCase | undefined;
  myJurorPseudonym: string;
}

const AppCtx = createContext<AppContextValue | null>(null);

const DEMO_IDENTITY: Identity = {
  name: 'Demo User',
  wallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  provider: 'demo',
  sub: '0xf39F…b92266',
};

const DEFAULT_PROFILE_PREFS: ProfilePrefs = {
  headline: 'Dispute resolution advocate & community researcher',
  interests: ['Smart contracts', 'Consumer protection', 'Escrow disputes', 'Open evidence', 'Campus governance'],
  bio: 'I believe disputes are resolved better with transparent process than with power. I file cases, serve as a juror when invited, and write up what I learn. On Resolvia I care about evidence quality and fair procedure.',
  location: 'Mumbai, India',
  institution: 'University of Mumbai',
  joinedDate: '2024-03-12',
  email: 'demo@resolvia.local',
  notifications: { email: true, inApp: true, juryInvitations: true, caseUpdates: true, security: true, marketing: false },
  privacy: {
    publicProfile: true,
    showReputation: true,
    showHistory: true,
    anonymizeCaseStudy: true,
    doNotIndex: false,
  },
  blockchain: { showWallet: true, autoApprove: false, defaultNetwork: 'Local Testnet (Hardhat)' },
  accessibility: { reducedMotion: false, largeText: false, highContrast: false, announcements: true },
};

function tsNow(): string {
  return new Date().toISOString();
}
function tsPretty(): string {
  return tsNow().replace('T', ' ').substring(0, 19) + ' UTC';
}
function rndTx(): string {
  return '0x' + Math.random().toString(16).substring(2, 66);
}
function pickVote(): VoteChoice {
  const r = Math.random();
  return r < 0.55 ? 'CLAIMANT_UPHELD' : r < 0.85 ? 'RESPONDENT_UPHELD' : 'SPLIT_SETTLEMENT';
}

const PANEL_WALLETS = ['0x2202...bb02', '0x3303...cc03', '0x4404...dd04', '0x5505...ee05', '0x6606...ff06'];

/** A fresh anonymous 5-juror panel (optionally with the given wallet as juror-01). */
function makePanel(userWallet?: string, includeUser = false): DisputeCase['jurors'] {
  const wallets = includeUser && userWallet ? [userWallet, ...PANEL_WALLETS.slice(0, 4)] : PANEL_WALLETS;
  return wallets.map((w, i) => ({
    jurorId: `juror-${String(i + 1).padStart(2, '0')}`,
    name: includeUser && i === 0 ? 'You (anonymous)' : `Juror ${String.fromCharCode(65 + i)}`,
    walletAddress: w,
    reputationScore: 88 + Math.floor(Math.random() * 10),
    stakedAmount: 2000 + Math.floor(Math.random() * 5) * 200,
    status: 'PENDING_COMMIT' as const,
  }));
}

function tallyVotes(jurors: DisputeCase['jurors']) {
  const revealed = jurors.filter((j) => j.status === 'REVEALED');
  const claimantVotes = revealed.filter((j) => j.revealedVote === 'CLAIMANT_UPHELD').length;
  const respondentVotes = revealed.filter((j) => j.revealedVote === 'RESPONDENT_UPHELD').length;
  const splitVotes = revealed.filter((j) => j.revealedVote === 'SPLIT_SETTLEMENT').length;
  return {
    revealedCount: revealed.length,
    allRevealed: revealed.length === jurors.length && jurors.length > 0,
    claimantVotes,
    respondentVotes,
    splitVotes,
  };
}

function verdictFromTally(t: ReturnType<typeof tallyVotes>, totalJurors: number) {
  const winner =
    t.claimantVotes >= t.respondentVotes && t.claimantVotes >= t.splitVotes
      ? 'Claimant'
      : t.respondentVotes >= t.splitVotes
      ? 'Respondent'
      : 'Split Settlement';
  return {
    winner: winner as 'Claimant' | 'Respondent' | 'Split Settlement',
    voteCount: { claimant: t.claimantVotes, respondent: t.respondentVotes, split: t.splitVotes },
    totalJurors,
    finalizedAt: tsNow(),
    verdictHash: rndTx(),
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser } = useAuth();
  const [cases, setCases] = useState<DisputeCase[]>(INITIAL_CASES);
  const [activeRole, setActiveRole] = useState<MyCaseRole>('CLAIMANT');
  const [activeCaseId, setActiveCaseId] = useState<string>('case-084');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [rslvBalance, setRslvBalance] = useState<number>(150);
  const [wizardOpen, setWizardOpen] = useState<boolean>(false);
  const [availability, setAvailability] = useState<JuryAvailability>({
    inPool: true,
    state: 'AVAILABLE',
    maxConcurrent: 3,
  });
  const [invitations, setInvitations] = useState<JuryInvitation[]>(INITIAL_INVITATIONS);
  const [jurorHistory] = useState<JurorHistoryItem[]>(INITIAL_JUROR_HISTORY);
  const [profilePrefs, setProfilePrefsState] = useState<ProfilePrefs>(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('resolvia_profile_prefs_v1') : null;
      if (raw) return { ...DEFAULT_PROFILE_PREFS, ...(JSON.parse(raw) as Partial<ProfilePrefs>) };
    } catch {
      /* ignore */
    }
    return DEFAULT_PROFILE_PREFS;
  });
  const setProfilePrefs = useCallback((p: ProfilePrefs) => {
    setProfilePrefsState(p);
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem('resolvia_profile_prefs_v1', JSON.stringify(p));
    } catch {
      /* ignore */
    }
  }, []);

  const [notifications, setNotifications] = useState<AppNotification[]>([
    { id: 'n-1', kind: 'JURY_INVITATION', title: 'Jury invitation — RSLV-2026-102', body: 'You were selected for a BUSINESS_PEER freight dispute. Accept within 48h. Minimal details shown until you accept.', caseId: 'case-102', createdAt: '2026-09-06T09:00:00Z', read: false, link: '/jury/case-102' },
    { id: 'n-2', kind: 'COMMIT_DEADLINE', title: 'Commit deadline approaching — RSLV-2026-084', body: 'Your blind vote commitment is due Sep 07, 18:00 UTC. Independent review recommended before committing.', caseId: 'case-084', createdAt: '2026-09-06T08:00:00Z', read: false, link: '/cases/case-084?voting' },
    { id: 'n-3', kind: 'RESPONSE_RECEIVED', title: 'Respondent notified — RSLV-2026-092', body: 'Your case was acknowledged by the respondent; counter-stake locked.', caseId: 'case-092', createdAt: '2026-09-03T09:15:00Z', read: true, link: '/cases/case-092' },
    { id: 'n-4', kind: 'APPEAL_WINDOW', title: 'Appeal window open — RSLV-2026-071', body: 'You may file an appeal before Sep 09, 18:05 UTC. Appeals are heard by a fresh 7-juror panel.', caseId: 'case-071', createdAt: '2026-08-25T18:05:00Z', read: true, link: '/cases/case-071?appeal' },
    { id: 'n-5', kind: 'CASE_STUDY', title: 'Case study published — RSLV-2026-059', body: 'A closed case is now available as an anonymised public case study with community discussion.', caseId: 'case-059', createdAt: '2026-07-30T14:00:00Z', read: true, link: '/case-studies/case-059' },
  ]);

  const identity: Identity = useMemo(() => {
    if (authUser) {
      return {
        name: authUser.name,
        email: authUser.email,
        wallet: authUser.wallet,
        provider: authUser.provider,
        sub: authUser.wallet.slice(0, 6) + '…' + authUser.wallet.slice(-4),
      };
    }
    return DEMO_IDENTITY;
  }, [authUser]);

  const myJurorPseudonym = useMemo(() => jurorPseudonym(identity.wallet), [identity.wallet]);

  const pushNotification = useCallback((n: Omit<AppNotification, 'id' | 'read' | 'createdAt'> & { createdAt?: string }) => {
    setNotifications((prev) => [
      { id: 'n-' + Date.now() + Math.floor(Math.random() * 1000), read: false, createdAt: n.createdAt || tsNow(), ...n },
      ...prev,
    ]);
  }, []);

  const login = useCallback(
    (role?: MyCaseRole) => {
      if (role) setActiveRole(role);
      setIsLoggedIn(true);
    },
    []
  );
  const logout = useCallback(() => {
    setIsLoggedIn(false);
  }, []);
  const claimFaucet = useCallback(() => setRslvBalance((b) => b + 50), []);
  const openWizard = useCallback(() => setWizardOpen(true), []);
  const closeWizard = useCallback(() => setWizardOpen(false), []);
  const selectCase = useCallback((id: string) => setActiveCaseId(id), []);
  const getCase = useCallback((id: string) => cases.find((c) => c.id === id), [cases]);

  const createCase = useCallback(
    (c: DisputeCase) => {
      setCases((prev) => [c, ...prev]);
      setActiveCaseId(c.id);
      setRslvBalance((b) => Math.max(0, b - 10));
      pushNotification({
        kind: 'CASE_SUBMITTED',
        title: `Case submitted — ${c.caseNumber}`,
        body: 'Your case is registered. The respondent has been notified and has 48h to respond.',
        caseId: c.id,
        link: `/cases/${c.id}`,
      });
    },
    [pushNotification]
  );

  const commitVote = useCallback(
    (caseId: string, jurorId: string, commitment: string, vote: VoteChoice, salt: string) => {
      setCases((prev) =>
        prev.map((c) => {
          if (c.id !== caseId) return c;
          const jurors = c.jurors.map((j) =>
            j.jurorId === jurorId
              ? { ...j, status: 'COMMITTED' as const, commitmentHash: commitment, revealedVote: vote, salt, commitTimestamp: tsNow() }
              : j
          );
          const audit = [
            ...c.auditTrail,
            { eventId: 'evt-c-' + Date.now(), eventNumber: 'EVENT COMMIT', title: `Vote commitment submitted (${jurorPseudonym(identity.wallet)})`, actor: jurorPseudonym(identity.wallet), actorRole: 'Juror (anonymous)', timestamp: tsPretty(), txHash: rndTx(), blockNumber: 6286120 + Math.floor(Math.random() * 50), metadataHash: commitment, details: `Blind commitment ${formatHash(commitment, 10)} recorded on ledger.` },
          ];
          return { ...c, jurors, auditTrail: audit };
        })
      );
      pushNotification({ kind: 'COMMIT_DEADLINE', title: 'Vote commitment recorded', body: 'Your blind commitment is anchored on-chain.', caseId, link: `/cases/${caseId}?voting` });
    },
    [identity.wallet, pushNotification]
  );

  const revealVote = useCallback(
    (caseId: string, jurorId: string, vote: VoteChoice, salt: string) => {
      setCases((prev) =>
        prev.map((c) => {
          if (c.id !== caseId) return c;
          const jurors = c.jurors.map((j) => (j.jurorId === jurorId ? { ...j, status: 'REVEALED' as const, revealedVote: vote, salt, revealTimestamp: tsNow() } : j));
          const t = tallyVotes(jurors);
          let next = { ...c, jurors };
          if (t.allRevealed) {
            next = { ...next, status: 'VERDICT' as const, verdictOutcome: verdictFromTally(t, jurors.length) };
            pushNotification({ kind: 'VERDICT', title: `Verdict rendered — ${c.caseNumber}`, body: `Supermajority decision reached. A 48h appeal window has opened.`, caseId, link: `/cases/${caseId}?verdict` });
          }
          const audit = [
            ...next.auditTrail,
            { eventId: 'evt-r-' + Date.now(), eventNumber: 'EVENT REVEAL', title: `Vote revealed & verified (${jurorPseudonym(identity.wallet)})`, actor: jurorPseudonym(identity.wallet), actorRole: 'Juror (anonymous)', timestamp: tsPretty(), txHash: rndTx(), blockNumber: 6286200 + Math.floor(Math.random() * 50), metadataHash: rndTx(), details: `Salt matched commitment. Vote ${vote.replace('_', ' ')} tallied.` },
          ];
          return { ...next, auditTrail: audit };
        })
      );
    },
    [identity.wallet, pushNotification]
  );

  /** Demo helper: commit + reveal every juror except the current user, then settle if quorum met. */
  const simulateOtherJurors = useCallback(
    (caseId: string) => {
      setCases((prev) =>
        prev.map((c) => {
          if (c.id !== caseId) return c;
          const now = tsNow();
          const before = c.jurors;
          // The "me" juror = wallet match, or the first juror when this case is one you serve on
          const me = c.jurors.find((j) => j.walletAddress === identity.wallet) || (c.myRole === 'JUROR' ? c.jurors[0] : undefined);
          const jurors = c.jurors.map((j) => {
            if (me && j.jurorId === me.jurorId) return j; // leave the user's own vote untouched
            if (j.status === 'PENDING_COMMIT' || j.status === 'COMMITTED') {
              const v = pickVote();
              return {
                ...j,
                status: 'REVEALED' as const,
                revealedVote: v,
                salt: rndTx().slice(0, 22),
                commitmentHash: '0x' + formatHash(v + j.jurorId, 64),
                commitTimestamp: now,
                revealTimestamp: now,
              };
            }
            return j;
          });
          const t = tallyVotes(jurors);
          let next = { ...c, jurors };
          const revealedCount = jurors.filter((j) => j.status === 'REVEALED').length - before.filter((j) => j.status === 'REVEALED').length;
          const audit = [
            ...next.auditTrail,
            { eventId: 'evt-sim-' + Date.now(), eventNumber: 'EVENT SIM', title: `Demo: ${Math.max(0, revealedCount)} other juror(s) committed & revealed`, actor: 'Demo Simulation', actorRole: 'Protocol Engine', timestamp: tsPretty(), txHash: rndTx(), blockNumber: 6286700 + Math.floor(Math.random() * 50), metadataHash: rndTx(), details: 'Simulated for the prototype so the lifecycle can complete. In production each juror acts independently.' },
          ];
          if (t.allRevealed) {
            next = { ...next, status: 'VERDICT' as const, verdictOutcome: verdictFromTally(t, jurors.length), auditTrail: audit };
            pushNotification({ kind: 'VERDICT', title: `Verdict rendered — ${c.caseNumber}`, body: 'Quorum met. A 48h appeal window has opened.', caseId, link: `/cases/${caseId}?verdict` });
          } else {
            next = { ...next, auditTrail: audit };
          }
          return next;
        })
      );
    },
    [identity.wallet, pushNotification]
  );

  const runAIAnalysis = useCallback(
    (caseId: string) => {
      setCases((prev) =>
        prev.map((c) => {
          if (c.id !== caseId) return c;
          const needsReport = !c.aiAnalysis;
          // When the advisory is generated and no panel exists yet, select the jury.
          const needsPanel = needsReport && c.jurors.length === 0;
          const panel = needsPanel ? makePanel(identity.wallet, c.myRole === 'JUROR') : c.jurors;
          const panelAudit = needsPanel
            ? [
                { eventId: 'evt-panel-' + Date.now(), eventNumber: 'EVENT PANEL', title: 'Jury panel selected via weighted PRNG', actor: 'JuryManager', actorRole: 'Smart Contract', timestamp: tsPretty(), txHash: rndTx(), blockNumber: 6286800 + Math.floor(Math.random() * 50), metadataHash: rndTx(), details: '5 anonymous jurors selected with conflict checks; invitations sent.' },
              ]
            : [];
          return {
            ...c,
            status: c.status === 'AI_ANALYSIS' ? 'JURY_COMMIT' : c.status,
            jurors: panel,
            auditTrail: needsPanel ? [...c.auditTrail, ...panelAudit] : c.auditTrail,
            aiAnalysis: needsReport
              ? {
                  reportId: `AIR-${c.caseNumber}-AUTO`,
                    caseId: c.id,
                    generatedAt: tsNow(),
                    modelIdentifier: 'Resolvia-LegalNLP-v2.4 (Transformer & Hybrid Verifier)',
                    promptInjectionDefense: { status: 'SECURE_CLEARED', threatsDetected: 0, notes: 'Evidence payloads scanned; zero prompt overrides identified.' },
                    claimMappings: [
                      { claimId: 'CLM-1', party: 'Claimant', assertion: 'Core claim substantiated by anchored evidence.', evidenceIds: c.evidence[0]?.id ? [c.evidence[0].id] : [], credibilityScore: 88, aiObservation: 'Cryptographic anchors verify the primary assertion.' },
                      { claimId: 'CLM-2', party: 'Respondent', assertion: 'Counter-assertion raises a documentation gap.', evidenceIds: c.evidence[1]?.id ? [c.evidence[1].id] : [], credibilityScore: 71, aiObservation: 'Provenance is present but the governing document is disputed.' },
                    ],
                    timeline: [
                      { time: '2026-08-01', event: 'Agreement / transaction established' },
                      { time: '2026-08-20', event: 'Disputed event occurs' },
                      { time: tsPretty(), event: 'AI advisory analysis generated' },
                    ],
                    contradictions: [
                      { id: 'CONTRA-AUTO', severity: 'MODERATE', title: 'Documentation ordering', description: 'Two documents conflict on which terms govern; the earlier-dated one may prevail.', evidenceRefs: c.evidence.slice(0, 2).map((e) => e.id) },
                    ],
                    advisoryRecommendation: { favoredParty: 'Split Settlement', confidence: 62, rationale: 'Both parties present credible, anchored documentation. A split or partial outcome best fits the record.', uncertaintyFactors: ['Governing document is disputed.', 'Third-party corroboration is limited.'] },
                    advisoryDisclaimer: 'IMPORTANT: This AI synthesis is non-binding and advisory only. The authoritative verdict rests solely with the elected human jury.',
                    reportSha256: rndTx().slice(2),
                  }
              : c.aiAnalysis,
          };
        })
      );
      pushNotification({ kind: 'AI_COMPLETED', title: `AI analysis completed — ${caseId}`, body: 'A non-binding advisory report is now available for review.', caseId, link: `/cases/${caseId}?ai` });
    },
    [identity.wallet, pushNotification]
  );

  const submitResponse = useCallback(
    (caseId: string, text: string) => {
      setCases((prev) =>
        prev.map((c) => {
          if (c.id !== caseId) return c;
          return {
            ...c,
            status: c.status === 'RESPONDENT_WINDOW' || c.status === 'SUBMITTED' ? 'EVIDENCE_LOCKED' : c.status,
            respondent: { ...c.respondent, responded: true },
            counterClaimSummary: text,
            auditTrail: [
              ...c.auditTrail,
              { eventId: 'evt-resp-' + Date.now(), eventNumber: 'EVENT RESP', title: 'Respondent response submitted', actor: c.respondent.wallet, actorRole: 'Respondent', timestamp: tsPretty(), txHash: rndTx(), blockNumber: 6286300 + Math.floor(Math.random() * 50), metadataHash: rndTx(), details: 'Counter-statement recorded; evidence window now locked.' },
            ],
          };
        })
      );
      pushNotification({ kind: 'RESPONSE_RECEIVED', title: `Response submitted — ${caseId}`, body: 'Your response is recorded and the evidence window is locked.', caseId, link: `/cases/${caseId}` });
    },
    [pushNotification]
  );

  const fileAppeal = useCallback(
    (caseId: string, by: 'Claimant' | 'Respondent', grounds: string) => {
      setCases((prev) =>
        prev.map((c) => {
          if (c.id !== caseId) return c;
          return {
            ...c,
            status: 'APPEAL_WINDOW',
            appeal: { windowClosesAt: c.appeal?.windowClosesAt || tsNow(), filed: true, filedBy: by, grounds },
            auditTrail: [
              ...c.auditTrail,
              { eventId: 'evt-appeal-' + Date.now(), eventNumber: 'EVENT APPEAL', title: `Appeal filed by ${by}`, actor: by, actorRole: by, timestamp: tsPretty(), txHash: rndTx(), blockNumber: 6286400 + Math.floor(Math.random() * 50), metadataHash: rndTx(), details: 'Appeal registered; a fresh 7-juror panel will be convened.' },
            ],
          };
        })
      );
      pushNotification({ kind: 'APPEAL_WINDOW', title: `Appeal filed — ${caseId}`, body: 'Your appeal is registered. A fresh panel will be convened.', caseId, link: `/cases/${caseId}?appeal` });
    },
    [pushNotification]
  );

  const addDiscussionPost = useCallback(
    (caseId: string, post: Omit<CommunityPost, 'id' | 'createdAt' | 'likes' | 'reports'>) => {
      setCases((prev) =>
        prev.map((c) =>
          c.id === caseId
            ? { ...c, discussion: [{ ...post, id: 'disc-' + Date.now(), createdAt: tsNow(), likes: 0, reports: 0 }, ...(c.discussion || [])] }
            : c
        )
      );
    },
    []
  );

  /** Add a post to a case's private, anonymous Jury Deliberation channel (in-progress cases only). */
  const addDeliberationPost = useCallback(
    (caseId: string, body: string) => {
      const text = body.trim();
      if (!text) return;
      setCases((prev) =>
        prev.map((c) =>
          c.id === caseId
            ? {
                ...c,
                deliberation: [
                  ...(c.deliberation || []),
                  { id: 'del-' + Date.now(), author: myJurorPseudonym, authorRole: 'Juror (anonymous)', authorBadge: 'Juror ' + myJurorPseudonym, body: text, createdAt: tsNow(), likes: 0, reports: 0 },
                ],
              }
            : c
        )
      );
    },
    [myJurorPseudonym]
  );

  const addEvidence = useCallback(
    async (caseId: string) => {
      const name = `exhibit_${Date.now()}.pdf`;
      const h = await computeSha256(name + ':resolvia-evidence');
      const now = tsNow();
      setCases((prev) =>
        prev.map((c) =>
          c.id === caseId
            ? {
                ...c,
                evidence: [
                  ...c.evidence,
                  {
                    id: 'ev-' + Date.now(),
                    title: 'Uploaded Exhibit',
                    description: 'Uploaded by ' + identity.name + ' — SHA-256 fingerprinted in browser, pinned to IPFS.',
                    fileName: name,
                    fileSize: (200 + Math.floor(Math.random() * 2200)).toString() + ' KB',
                    mimeType: 'application/pdf',
                    sha256Hash: h,
                    ipfsCid: 'bafybei' + h.slice(0, 44),
                    submittedBy: 'Claimant' as const,
                    submitterWallet: identity.sub,
                    submittedAt: now,
                    accessTier: 'PUBLIC',
                    encrypted: false,
                  },
                ],
                auditTrail: [
                  ...c.auditTrail,
                  { eventId: 'evt-ev-' + Date.now(), eventNumber: 'EVENT EV', title: 'New evidence submitted', actor: identity.sub, actorRole: 'Party', timestamp: tsPretty(), txHash: rndTx(), blockNumber: 6286600 + Math.floor(Math.random() * 50), metadataHash: h, details: `Exhibit ${name} hashed (SHA-256) and anchored; hash ${formatHash(h, 12)}…` },
                ],
              }
            : c
        )
      );
    },
    [identity.name, identity.sub]
  );

  const acceptInvitation = useCallback(
    (id: string) => {
      setInvitations((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'ACCEPTED' } : i)));
      const inv = invitations.find((i) => i.id === id);
      if (inv) {
        setCases((prev) =>
          prev.map((c) =>
            c.id === inv.caseId
              ? {
                  ...c,
                  myRole: 'JUROR',
                  status: c.status === 'EVIDENCE_LOCKED' ? 'JURY_COMMIT' : c.status,
                  jurors: c.jurors.length
                    ? c.jurors
                    : [
                        { jurorId: 'juror-01', name: 'You (anonymous)', walletAddress: identity.wallet, reputationScore: 82, stakedAmount: 2500, status: 'PENDING_COMMIT' },
                        { jurorId: 'juror-02', name: 'Juror B', walletAddress: '0x2202...bb02', reputationScore: 95, stakedAmount: 2400, status: 'PENDING_COMMIT' },
                        { jurorId: 'juror-03', name: 'Juror C', walletAddress: '0x3303...cc03', reputationScore: 93, stakedAmount: 2600, status: 'PENDING_COMMIT' },
                        { jurorId: 'juror-04', name: 'Juror D', walletAddress: '0x4404...dd04', reputationScore: 91, stakedAmount: 2200, status: 'PENDING_COMMIT' },
                        { jurorId: 'juror-05', name: 'Juror E', walletAddress: '0x5505...ee05', reputationScore: 94, stakedAmount: 2800, status: 'PENDING_COMMIT' },
                      ],
                  auditTrail: [
                    ...c.auditTrail,
                    { eventId: 'evt-acc-' + Date.now(), eventNumber: 'EVENT INV-ACC', title: 'Jury invitation accepted', actor: identity.wallet, actorRole: 'Juror (anonymous)', timestamp: tsPretty(), txHash: rndTx(), blockNumber: 6286500 + Math.floor(Math.random() * 50), metadataHash: rndTx(), details: `Juror ${myJurorPseudonym} accepted; 5-juror panel formed. Commit phase opened.` },
                  ],
                }
              : c
          )
        );
        pushNotification({ kind: 'COMMIT_DEADLINE', title: `You accepted the jury panel — ${inv.caseNumber}`, body: 'Review the evidence independently, then commit your blind vote before the deadline.', caseId: inv.caseId, link: `/jury/${inv.caseId}` });
      }
    },
    [identity.wallet, invitations, myJurorPseudonym, pushNotification]
  );

  const declineInvitation = useCallback(
    (id: string, reason: 'BUSY' | 'CONFLICT' | 'OTHER') => {
      setInvitations((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'DECLINED', declineReason: reason, replacementPicked: true } : i)));
      const inv = invitations.find((i) => i.id === id);
      if (inv) {
        pushNotification({ kind: 'JURY_REPLACEMENT', title: `Jury replacement selected — ${inv.caseNumber}`, body: reason === 'BUSY' ? 'Your availability decline did not affect your reputation. A replacement juror was auto-selected.' : 'A conflict was recorded and a replacement juror was auto-selected.' });
      }
    },
    [invitations, pushNotification]
  );

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);
  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value: AppContextValue = {
    cases,
    activeRole,
    setActiveRole,
    identity,
    isLoggedIn,
    login,
    logout,
    rslvBalance,
    claimFaucet,
    createCase,
    selectCase,
    activeCaseId,
    commitVote,
    revealVote,
    simulateOtherJurors,
    runAIAnalysis,
    submitResponse,
    fileAppeal,
    addDiscussionPost,
    addDeliberationPost,
    addEvidence,
    profilePrefs,
    setProfilePrefs,
    availability,
    setAvailability,
    invitations,
    acceptInvitation,
    declineInvitation,
    jurorHistory,
    notifications,
    markNotificationRead,
    markAllRead,
    unreadCount,
    wizardOpen,
    openWizard,
    closeWizard,
    getCase,
    myJurorPseudonym,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
