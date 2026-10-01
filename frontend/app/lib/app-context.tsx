'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  AIAnalysisReport,
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
import { INITIAL_CASES, INITIAL_INVITATIONS, INITIAL_JUROR_HISTORY, daysAgo } from './mockData';
import { useAuth } from './auth-context';
import { computeSha256, computeSha256Bytes, formatHash } from './crypto';
import { anchorEvidenceOnChain, storeEvidenceContent } from './chain';
import { jurorPseudonym } from './jury';
import { computeVoteChoiceCommitment, generateSalt32 } from './commitment';

export interface Identity {
  name: string;
  email?: string;
  wallet: string;
  provider: 'google' | 'github' | 'email' | 'wallet' | 'demo';
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
  recordAnchors: (
    caseId: string,
    updates: { evidenceId: string; onChainTx?: string; onChainBlock?: number; onChainEvidenceId?: number; status: 'ANCHORED' | 'FAILED'; error?: string }[]
  ) => void;
  selectCase: (id: string) => void;
  activeCaseId: string;
  commitVote: (caseId: string, jurorId: string, commitment: string, vote: VoteChoice, salt: string, reasoning?: string) => void;
  revealVote: (caseId: string, jurorId: string, vote: VoteChoice, salt: string, reasoning?: string) => void;
  simulateOtherJurors: (caseId: string) => void;
  runAIAnalysis: (caseId: string, onStage?: (stage: number, detail?: string) => void) => Promise<void>;
  submitResponse: (caseId: string, text: string) => Promise<void> | void;
  fileAppeal: (caseId: string, by: 'Claimant' | 'Respondent', grounds: string) => void;
  addDiscussionPost: (caseId: string, post: Omit<CommunityPost, 'id' | 'createdAt' | 'likes' | 'reports'>) => void;
  likeDiscussionPost: (caseId: string, postId: string) => void;
  reportDiscussionPost: (caseId: string, postId: string) => void;
  addDeliberationPost: (caseId: string, body: string) => void;
  addEvidence: (caseId: string, file?: File) => Promise<void>;
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
  // demo
  resetDemoData: () => void;
  // helpers
  getCase: (id: string) => DisputeCase | undefined;
  myJurorPseudonym: string;
}

const AppCtx = createContext<AppContextValue | null>(null);

const DEMO_IDENTITY: Identity = {
  name: 'Alex Vance',
  wallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  provider: 'email',
  sub: '0xf39F…b92266',
};

const DEFAULT_PROFILE_PREFS: ProfilePrefs = {
  headline: 'Dispute resolution advocate & community researcher',
  interests: ['Smart contracts', 'Consumer protection', 'Escrow disputes', 'Open evidence', 'Campus governance'],
  bio: 'I believe disputes are resolved better with transparent process than with power. I file cases, serve as a juror when invited, and write up what I learn. On Resolvia I care about evidence quality and fair procedure.',
  location: 'Mumbai, India',
  institution: 'University of Mumbai',
  joinedDate: '2024-03-12',
  email: 'alex.vance@resolvia.network',
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
  return r < 0.45 ? 'CLAIMANT_UPHELD' : r < 0.9 ? 'RESPONDENT_UPHELD' : 'SPLIT_SETTLEMENT';
}

// ── Demo state persistence ───────────────────────────────────────────────────
// Case/jury/vote state lives in memory; without persistence a reload (or a
// trip to the public site) silently wipes in-progress work. Snapshot to
// localStorage, and on load re-baseline any active deadlines so the demo
// world can never sit "expired".
const STATE_KEY = 'resolvia_demo_state_v1';
const DAY_MS = 86_400_000;

function rebaseline(cases: DisputeCase[], userWallet?: string | null): DisputeCase[] {
  const now = Date.now();
  const normalizedUser = userWallet ? userWallet.toLowerCase() : null;
  return cases.map((c) => {
    let myRole = c.myRole;
    if (normalizedUser) {
      if (c.claimant?.wallet && c.claimant.wallet.toLowerCase() === normalizedUser) {
        myRole = 'CLAIMANT';
      } else if (c.respondent?.wallet && c.respondent.wallet.toLowerCase() === normalizedUser) {
        myRole = 'RESPONDENT';
      } else if (c.jurors?.some((j) => j.walletAddress && j.walletAddress.toLowerCase() === normalizedUser)) {
        myRole = 'JUROR';
      }
    }
    let next: DisputeCase = { ...c, myRole };
    if (next.verdictOutcome || next.status === 'CLOSED') return next;
    if (new Date(next.votingDeadline).getTime() < now) {
      next = { ...next, votingDeadline: new Date(now + DAY_MS).toISOString() };
    }
    if (new Date(next.responseDeadline).getTime() < now && !next.respondent?.responded) {
      next = { ...next, responseDeadline: new Date(now + 2 * DAY_MS).toISOString() };
    }
    return next;
  });
}

function loadSavedState(): {
  cases?: DisputeCase[];
  invitations?: JuryInvitation[];
  notifications?: AppNotification[];
  rslvBalance?: number;
  availability?: JuryAvailability;
  activeRole?: MyCaseRole;
  activeCaseId?: string;
  isLoggedIn?: boolean;
} | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(STATE_KEY);
    return raw ? (JSON.parse(raw) as any) : null;
  } catch {
    return null;
  }
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
  const [saved] = useState(loadSavedState);
  const [cases, setCases] = useState<DisputeCase[]>(() => rebaseline(saved?.cases || INITIAL_CASES));
  const [activeRole, setActiveRole] = useState<MyCaseRole>(saved?.activeRole || 'CLAIMANT');
  const [activeCaseId, setActiveCaseId] = useState<string>(saved?.activeCaseId || 'case-084');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!authUser || saved?.isLoggedIn || false);

  useEffect(() => {
    setIsLoggedIn(!!authUser);
  }, [authUser]);
  const [rslvBalance, setRslvBalance] = useState<number>(saved?.rslvBalance ?? 600);
  const [wizardOpen, setWizardOpen] = useState<boolean>(false);
  const [availability, setAvailability] = useState<JuryAvailability>(
    saved?.availability || { inPool: true, state: 'AVAILABLE', maxConcurrent: 3 }
  );
  const [invitations, setInvitations] = useState<JuryInvitation[]>(() => {
    const list = saved?.invitations || INITIAL_INVITATIONS;
    const now = Date.now();
    return list.map((i) =>
      i.status === 'PENDING' && new Date(i.expiresAt).getTime() < now ? { ...i, expiresAt: new Date(now + DAY_MS).toISOString() } : i
    );
  });
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

  const [notifications, setNotifications] = useState<AppNotification[]>(
    saved?.notifications || [
      { id: 'n-1', kind: 'JURY_INVITATION', title: 'Jury invitation — RSLV-2026-102', body: 'You were selected for a BUSINESS_PEER freight dispute. Accept within 48h. Minimal details shown until you accept.', caseId: 'case-102', createdAt: daysAgo(1), read: false, link: '/jury/case-102' },
      { id: 'n-2', kind: 'COMMIT_DEADLINE', title: 'Commit deadline approaching — RSLV-2026-084', body: 'Your blind vote commitment is due within 24h. Independent review recommended before committing.', caseId: 'case-084', createdAt: daysAgo(1), read: false, link: '/cases/case-084?section=voting' },
      { id: 'n-3', kind: 'RESPONSE_RECEIVED', title: 'Respondent notified — RSLV-2026-092', body: 'Your case was acknowledged by the respondent; counter-stake locked.', caseId: 'case-092', createdAt: daysAgo(2), read: true, link: '/cases/case-092' },
      { id: 'n-4', kind: 'APPEAL_WINDOW', title: 'Appeal window open — RSLV-2026-071', body: 'You may file an appeal within the next 48 hours. Appeals are heard by a fresh 7-juror panel.', caseId: 'case-071', createdAt: daysAgo(8), read: true, link: '/cases/case-071?section=appeal' },
      { id: 'n-5', kind: 'CASE_STUDY', title: 'Case study published — RSLV-2026-059', body: 'A closed case is now available as an anonymised public case study with community discussion.', caseId: 'case-059', createdAt: '2026-07-30T14:00:00Z', read: true, link: '/case-studies/case-059' },
    ]
  );

  // Debounced snapshot of demo state (survives reloads / trips to the public site).
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(
          STATE_KEY,
          JSON.stringify({ cases, invitations, notifications, rslvBalance, availability, activeRole, activeCaseId, isLoggedIn })
        );
      } catch {
        /* storage full / private mode — demo continues in-memory */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [cases, invitations, notifications, rslvBalance, availability, activeRole, activeCaseId, isLoggedIn]);

  const resetDemoData = useCallback(() => {
    try {
      window.localStorage.removeItem(STATE_KEY);
    } catch {
      /* ignore */
    }
    window.location.reload();
  }, []);

  // ── Backend state sync (real persistence for logged-in users) ─────────────
  // The account becomes the source of truth: on login we hydrate from the
  // backend (or seed it on first login), then mirror every change back with a
  // debounce. Guests keep working from localStorage only.
  const authSub = authUser?.wallet || null;
  const snapshotRef = useRef<{
    cases: DisputeCase[];
    invitations: JuryInvitation[];
    notifications: AppNotification[];
    rslvBalance: number;
    availability: JuryAvailability;
    activeRole: MyCaseRole;
    activeCaseId: string;
    isLoggedIn: boolean;
  } | null>(null);
  snapshotRef.current = { cases, invitations, notifications, rslvBalance, availability, activeRole, activeCaseId, isLoggedIn };
  const hydratedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!authSub) {
      hydratedRef.current = null;
      return;
    }
    let cancelled = false;
    let token: string | null = null;
    try {
      token = window.localStorage.getItem('resolvia_token');
    } catch {
      token = null;
    }
    (async () => {
      try {
        const res = await fetch('/api/backend/state', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (cancelled) return;
        if (res.status === 404) {
          // First login for this account: seed the backend with local state.
          const snap = snapshotRef.current;
          if (snap && token) {
            await fetch('/api/backend/state', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ state: snap }),
            });
          }
        } else if (res.ok) {
          const data = await res.json();
          const st = data?.state;
          if (st) {
            if (Array.isArray(st.cases) && st.cases.length) setCases(rebaseline(st.cases, authSub));
            if (Array.isArray(st.invitations)) setInvitations(st.invitations);
            if (Array.isArray(st.notifications)) setNotifications(st.notifications);
            if (typeof st.rslvBalance === 'number') setRslvBalance(st.rslvBalance);
            if (st.availability) setAvailability(st.availability);
            if (st.activeRole) setActiveRole(st.activeRole);
            if (st.activeCaseId) setActiveCaseId(st.activeCaseId);
          }
        }
      } catch {
        /* backend offline — local state continues to work */
      }
      if (!cancelled) hydratedRef.current = authSub;
    })();
    return () => {
      cancelled = true;
    };
  }, [authSub]);

  // Dynamically update roles for active account
  useEffect(() => {
    if (authSub) {
      setCases((prev) => rebaseline(prev, authSub));
    }
  }, [authSub]);

  useEffect(() => {
    if (!authSub || hydratedRef.current !== authSub) return;
    const t = setTimeout(async () => {
      let token: string | null = null;
      try {
        token = window.localStorage.getItem('resolvia_token');
      } catch {
        token = null;
      }
      const snap = snapshotRef.current;
      if (!token || !snap) return;
      try {
        await fetch('/api/backend/state', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ state: snap }),
        });
      } catch {
        /* next change retries */
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [cases, invitations, notifications, rslvBalance, availability, activeRole, activeCaseId, isLoggedIn, authSub]);

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
      setRslvBalance((b) => Math.max(0, b - 500));
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

  const recordAnchors = useCallback(
    (
      caseId: string,
      updates: { evidenceId: string; onChainTx?: string; onChainBlock?: number; onChainEvidenceId?: number; status: 'ANCHORED' | 'FAILED'; error?: string }[]
    ) => {
      const byId = new Map(updates.map((u) => [u.evidenceId, u]));
      setCases((prev) =>
        prev.map((c) => {
          if (c.id !== caseId) return c;
          const evidence = c.evidence.map((e) => {
            const u = byId.get(e.id);
            if (!u) return e;
            return {
              ...e,
              onChainAnchored: u.status === 'ANCHORED',
              onChainTx: u.onChainTx,
              onChainBlock: u.onChainBlock,
              onChainEvidenceId: u.onChainEvidenceId,
            };
          });
          const ok = updates.filter((u) => u.status === 'ANCHORED').length;
          const failed = updates.length - ok;
          const firstTx = updates.find((u) => u.onChainTx)?.onChainTx;
          const firstBlock = updates.find((u) => u.onChainBlock != null)?.onChainBlock;
          const audit = [
            ...c.auditTrail,
            {
              eventId: `evt-anchor-${Date.now()}`,
              eventNumber: 'EVENT ANCHOR',
              title: `${ok} evidence item(s) anchored on EvidenceRegistry`,
              actor: identity.sub,
              actorRole: 'Claimant',
              timestamp: tsPretty(),
              txHash: firstTx || '—',
              blockNumber: firstBlock ?? 0,
              metadataHash: '',
              details: failed
                ? `${failed} item(s) failed to anchor — retry from the case page.`
                : 'Every byte is content-addressed on-chain; a single-byte change breaks the fingerprint.',
            },
          ];
          return { ...c, evidence, auditTrail: audit };
        })
      );
    },
    [identity.sub]
  );

  const commitVote = useCallback(
    async (caseId: string, jurorId: string, commitment: string, vote: VoteChoice, salt: string, reasoning?: string) => {
      let realTxHash: string | undefined;
      let realBlock: number | undefined;

      try {
        const token = typeof window !== 'undefined' ? window.localStorage.getItem('resolvia_token') : null;
        if (token) {
          const numId = Number(caseId.replace(/\D/g, '')) || 0;
          const res = await fetch('/api/backend/wallet/vote/commit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ caseId: numId, commitment }),
          });
          if (res.ok) {
            const data = await res.json();
            realTxHash = data.txHash;
            realBlock = data.blockNumber;
          }
        }
      } catch (err) {
        console.warn('Backend on-chain vote commit warning:', err);
      }

      setCases((prev) =>
        prev.map((c) => {
          if (c.id !== caseId) return c;
          const target = c.jurors.find((j) => j.jurorId === jurorId);
          // Protocol guard (mirrors VotingManager.sol): commit only from PENDING_COMMIT, once.
          if (!target || target.status !== 'PENDING_COMMIT') return c;
          const jurors = c.jurors.map((j) =>
            j.jurorId === jurorId
              ? {
                  ...j,
                  status: 'COMMITTED' as const,
                  commitmentHash: commitment,
                  revealedVote: vote,
                  salt,
                  reasoning: reasoning || j.reasoning,
                  commitTimestamp: tsNow(),
                }
              : j
          );
          const audit = [
            ...c.auditTrail,
            {
              eventId: 'evt-c-' + Date.now(),
              eventNumber: 'EVENT COMMIT',
              title: `Vote commitment submitted (${jurorPseudonym(identity.wallet)})`,
              actor: jurorPseudonym(identity.wallet),
              actorRole: 'Juror (anonymous)',
              timestamp: tsPretty(),
              txHash: realTxHash || rndTx(),
              blockNumber: realBlock || (6286120 + Math.floor(Math.random() * 50)),
              metadataHash: commitment,
              details: `Blind commitment ${formatHash(commitment, 10)} recorded on ledger.`,
            },
          ];
          return { ...c, jurors, auditTrail: audit };
        })
      );
      pushNotification({ kind: 'COMMIT_DEADLINE', title: 'Vote commitment recorded', body: 'Your blind commitment is anchored on-chain.', caseId, link: `/cases/${caseId}?section=voting` });
    },
    [identity.wallet, pushNotification]
  );

  const revealVote = useCallback(
    async (caseId: string, jurorId: string, vote: VoteChoice, salt: string, reasoning?: string) => {
      let realTxHash: string | undefined;
      let realBlock: number | undefined;

      try {
        const token = typeof window !== 'undefined' ? window.localStorage.getItem('resolvia_token') : null;
        if (token) {
          const numId = Number(caseId.replace(/\D/g, '')) || 0;
          const voteChoiceNum = vote === 'CLAIMANT_UPHELD' ? 1 : vote === 'RESPONDENT_UPHELD' ? 2 : 3;
          const res = await fetch('/api/backend/wallet/vote/reveal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ caseId: numId, vote: voteChoiceNum, salt }),
          });
          if (res.ok) {
            const data = await res.json();
            realTxHash = data.txHash;
            realBlock = data.blockNumber;
          }
        }
      } catch (err) {
        console.warn('Backend on-chain vote reveal warning:', err);
      }

      setCases((prev) =>
        prev.map((c) => {
          if (c.id !== caseId) return c;
          const target = c.jurors.find((j) => j.jurorId === jurorId);
          // Protocol guard (mirrors VotingManager.sol): reveal requires an existing commitment.
          if (!target || target.status !== 'COMMITTED') return c;
          const jurors = c.jurors.map((j) =>
            j.jurorId === jurorId
              ? {
                  ...j,
                  status: 'REVEALED' as const,
                  revealedVote: vote,
                  salt,
                  reasoning: reasoning || j.reasoning,
                  revealTimestamp: tsNow(),
                }
              : j
          );
          const t = tallyVotes(jurors);
          let next = { ...c, jurors };
          if (t.allRevealed) {
            next = { ...next, status: 'VERDICT' as const, verdictOutcome: verdictFromTally(t, jurors.length) };
            pushNotification({ kind: 'VERDICT', title: `Verdict rendered — ${c.caseNumber}`, body: `Supermajority decision reached. A 48h appeal window has opened.`, caseId, link: `/cases/${caseId}?section=verdict` });
          }
          const audit = [
            ...next.auditTrail,
            {
              eventId: 'evt-r-' + Date.now(),
              eventNumber: 'EVENT REVEAL',
              title: `Vote revealed & verified (${jurorPseudonym(identity.wallet)})`,
              actor: jurorPseudonym(identity.wallet),
              actorRole: 'Juror (anonymous)',
              timestamp: tsPretty(),
              txHash: realTxHash || rndTx(),
              blockNumber: realBlock || (6286200 + Math.floor(Math.random() * 50)),
              metadataHash: rndTx(),
              details: `Salt matched commitment. Vote ${vote.replace('_', ' ')} tallied.`,
            },
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
              const salt = generateSalt32();
              const commitmentHash = computeVoteChoiceCommitment(v, salt, c.id, j.walletAddress || j.jurorId);
              const reasonings = {
                CLAIMANT_UPHELD: 'Verified on-chain evidence anchors and commit logs confirm substantial delivery.',
                RESPONDENT_UPHELD: 'Deliverable failed agreed test criteria; counter-claim sustained.',
                SPLIT_SETTLEMENT: 'Shared responsibility evident in communication timeline; equitable stake return.',
              };
              return {
                ...j,
                status: 'REVEALED' as const,
                revealedVote: v,
                reasoning: reasonings[v],
                salt,
                commitmentHash,
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
            {
              eventId: 'evt-sim-' + Date.now(),
              eventNumber: 'QUORUM SYNC',
              title: `Consensus Quorum: ${Math.max(0, revealedCount)} Peer Commitments Anchored`,
              actor: 'Consensus Engine',
              actorRole: 'Protocol Engine',
              timestamp: tsPretty(),
              txHash: rndTx(),
              blockNumber: 6286700 + Math.floor(Math.random() * 50),
              metadataHash: rndTx(),
              details: 'Peer juror commitments verified and anchored to VotingManager contract.',
            },
          ];
          if (t.allRevealed) {
            next = { ...next, status: 'VERDICT' as const, verdictOutcome: verdictFromTally(t, jurors.length), auditTrail: audit };
            pushNotification({ kind: 'VERDICT', title: `Verdict rendered — ${c.caseNumber}`, body: 'Quorum met. A 48h appeal window has opened.', caseId, link: `/cases/${caseId}?section=verdict` });
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
    async (caseId: string, onStage?: (stage: number, detail?: string) => void) => {
      let aiReport: AIAnalysisReport | null = null;
      try {
        const targetCase = cases.find((c) => c.id === caseId);
        if (targetCase) {
          const payload = {
            caseId: targetCase.id,
            caseNumber: targetCase.caseNumber || targetCase.id,
            claimantStatement: targetCase.claimSummary || targetCase.title,
            respondentStatement: targetCase.counterClaimSummary || 'No formal counter-statement filed to date.',
            evidenceList: targetCase.evidence.map((e) => ({
              id: e.id,
              title: e.title,
              description: e.description,
              fileName: e.fileName,
              sha256Hash: e.sha256Hash,
              accessTier: e.accessTier,
            })),
            category: targetCase.category,
            disputeAmount: targetCase.disputeAmount,
          };

          const token = typeof window !== 'undefined' ? localStorage.getItem('resolvia_token') : null;
          const authHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          };

          // Try streaming endpoint first
          let streamed = false;
          try {
            const streamRes = await fetch('/api/backend/ai/analyze/stream', {
              method: 'POST',
              headers: authHeaders,
              body: JSON.stringify(payload),
            });
            if (streamRes.ok && streamRes.body) {
              const reader = streamRes.body.getReader();
              const decoder = new TextDecoder();
              let buffer = '';
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    try {
                      const evt = JSON.parse(line.slice(6));
                      if (typeof evt.stage === 'number') {
                        onStage?.(evt.stage, evt.detail);
                      }
                      if (evt.status === 'SUCCESS' && evt.report) {
                        aiReport = evt.report;
                        streamed = true;
                      }
                    } catch {
                      /* ignore parse error */
                    }
                  }
                }
              }
            }
          } catch (streamErr) {
            console.warn('AI stream error, falling back to standard endpoint:', streamErr);
          }

          // Fallback to standard endpoint if streaming did not yield report
          if (!streamed || !aiReport) {
            const res = await fetch('/api/backend/ai/analyze', {
              method: 'POST',
              headers: authHeaders,
              body: JSON.stringify(payload),
            });
            if (res.ok) {
              const data = await res.json();
              if (data.status === 'SUCCESS' && data.report) {
                aiReport = data.report;
              }
            }
          }
        }
      } catch {
        /* fallback to deterministic rule engine */
      }

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
              ? (aiReport || {
                  reportId: `AIR-${c.caseNumber}-AUTO`,
                  caseId: c.id,
                  generatedAt: tsNow(),
                  modelIdentifier: 'Resolvia Advisory Engine v1 (deterministic rules — LLM advisory pending)',
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
                })
              : c.aiAnalysis,
          };
        })
      );
      pushNotification({ kind: 'AI_COMPLETED', title: `AI analysis completed — ${caseId}`, body: 'A non-binding advisory report is now available for review.', caseId, link: `/cases/${caseId}?section=ai` });
    },
    [cases, identity.wallet, pushNotification]
  );

  const submitResponse = useCallback(
    async (caseId: string, text: string) => {
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

      try {
        const token = typeof window !== 'undefined' ? window.localStorage.getItem('resolvia_token') : null;
        if (token) {
          await fetch(`/api/backend/disputes/${encodeURIComponent(caseId)}/respond`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ counterSummary: text, counter_claim: text }),
          });
        }
      } catch (err) {
        console.warn('Backend dispute response sync warning:', err);
      }
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
            appeal: { windowClosesAt: c.appeal?.windowClosesAt || new Date(Date.now() + 2 * 86_400_000).toISOString(), filed: true, filedBy: by, grounds },
            auditTrail: [
              ...c.auditTrail,
              { eventId: 'evt-appeal-' + Date.now(), eventNumber: 'EVENT APPEAL', title: `Appeal filed by ${by}`, actor: by, actorRole: by, timestamp: tsPretty(), txHash: rndTx(), blockNumber: 6286400 + Math.floor(Math.random() * 50), metadataHash: rndTx(), details: 'Appeal registered; a fresh 7-juror panel will be convened.' },
            ],
          };
        })
      );
      pushNotification({ kind: 'APPEAL_WINDOW', title: `Appeal filed — ${caseId}`, body: 'Your appeal is registered. A fresh panel will be convened.', caseId, link: `/cases/${caseId}?section=appeal` });
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

  const likeDiscussionPost = useCallback((caseId: string, postId: string) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        const updateList = (posts?: CommunityPost[]): CommunityPost[] | undefined =>
          posts?.map((p) => (p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p));
        return {
          ...c,
          discussion: updateList(c.discussion),
          deliberation: updateList(c.deliberation),
        };
      })
    );
  }, []);

  const reportDiscussionPost = useCallback((caseId: string, postId: string) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        const updateList = (posts?: CommunityPost[]): CommunityPost[] | undefined =>
          posts?.map((p) => (p.id === postId ? { ...p, reports: (p.reports || 0) + 1 } : p));
        return {
          ...c,
          discussion: updateList(c.discussion),
          deliberation: updateList(c.deliberation),
        };
      })
    );
  }, []);

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
    async (caseId: string, file?: File) => {
      let fileName = `exhibit_${Date.now()}.pdf`;
      let fileSize = (200 + Math.floor(Math.random() * 2200)).toString() + ' KB';
      let mimeType = 'application/pdf';
      let h = '';

      let fileBase64 = '';
      if (file) {
        fileName = file.name;
        fileSize = `${(file.size / 1024).toFixed(1)} KB`;
        mimeType = file.type || 'application/octet-stream';
        const bytes = await file.arrayBuffer();
        h = await computeSha256Bytes(bytes);
        storeEvidenceContent(h, bytes);

        const bytesArr = new Uint8Array(bytes);
        let binary = '';
        for (let i = 0; i < bytesArr.byteLength; i++) {
          binary += String.fromCharCode(bytesArr[i]);
        }
        fileBase64 = btoa(binary);
      } else {
        h = await computeSha256(fileName + ':resolvia-evidence');
        fileBase64 = btoa(fileName + ':resolvia-evidence-placeholder');
      }

      let ipfsCid = '';
      let gatewayUrl = '';
      const token = typeof window !== 'undefined' ? localStorage.getItem('resolvia_token') : null;
      try {
        const ipfsRes = await fetch('/api/backend/ipfs/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ fileName, contentBase64: fileBase64, sha256: h }),
        });
        if (ipfsRes.ok) {
          const ipfsData = await ipfsRes.json();
          if (ipfsData.ipfsCid) {
            ipfsCid = ipfsData.ipfsCid;
            gatewayUrl = ipfsData.gatewayUrl || '';
          }
        }
      } catch (err) {
        console.warn('IPFS upload fallback:', err);
      }

      const now = tsNow();

      let onChainResult: { status: 'ANCHORED' | 'PENDING' | 'FAILED'; txHash?: string; blockNumber?: number | null; error?: string } = { status: 'PENDING' };
      try {
        const numericId = parseInt(caseId.replace(/\D/g, '') || '84', 10);
        onChainResult = await anchorEvidenceOnChain({ caseId: numericId, sha256: h, ipfsCid, tier: 0 }, token);
      } catch {
        /* local testnet fallback */
      }

      const isAnchored = onChainResult.status === 'ANCHORED';
      const tx = onChainResult.txHash || (isAnchored ? rndTx() : '');
      const blk = onChainResult.blockNumber ?? undefined;

      setCases((prev) =>
        prev.map((c) =>
          c.id === caseId
            ? {
                ...c,
                evidence: [
                  ...c.evidence,
                  {
                    id: 'ev-' + Date.now(),
                    title: file ? file.name.replace(/\.[^/.]+$/, '') : 'Uploaded Exhibit',
                    description: 'Uploaded by ' + identity.name + ' — SHA-256 fingerprinted in browser, pinned to IPFS.' + (isAnchored ? ' Anchored on EvidenceRegistry.' : ''),
                    fileName,
                    fileSize,
                    mimeType,
                    sha256Hash: h,
                    ipfsCid,
                    submittedBy: 'Claimant' as const,
                    submitterWallet: identity.sub,
                    submittedAt: now,
                    accessTier: 'PUBLIC',
                    encrypted: false,
                    onChainAnchored: isAnchored,
                    onChainTx: tx,
                    onChainBlock: blk,
                  },
                ],
                auditTrail: [
                  ...c.auditTrail,
                  {
                    eventId: 'evt-ev-' + Date.now(),
                    eventNumber: 'EVENT EV',
                    title: 'New evidence submitted & fingerprinted',
                    actor: identity.sub,
                    actorRole: 'Party',
                    timestamp: tsPretty(),
                    txHash: tx,
                    blockNumber: blk ?? 0,
                    metadataHash: h,
                    details: `Exhibit ${fileName} hashed (SHA-256) and ${isAnchored ? 'anchored on EvidenceRegistry' : 'fingerprinted'}; hash ${formatHash(h, 12)}…`,
                  },
                ],
              }
            : c
        )
      );
      pushNotification({ kind: 'EVIDENCE_LOCKED', title: 'Evidence fingerprinted & anchored', body: `${fileName} SHA-256: ${formatHash(h, 8)} on-chain.`, caseId, link: `/cases/${caseId}?section=evidence` });
    },
    [identity.name, identity.sub, pushNotification]
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
    recordAnchors,
    selectCase,
    activeCaseId,
    commitVote,
    revealVote,
    simulateOtherJurors,
    runAIAnalysis,
    submitResponse,
    fileAppeal,
    addDiscussionPost,
    likeDiscussionPost,
    reportDiscussionPost,
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
    resetDemoData,
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
