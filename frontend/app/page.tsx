'use client';

import React, { useState, useEffect } from 'react';
import {
  Scale,
  Shield,
  Coins,
  Cpu,
  CheckCircle,
  FileText,
  Clock,
  ChevronRight,
  Sparkles,
  Award,
  BarChart3,
  ExternalLink,
  Lock,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  Plus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Activity,
  Zap,
  User,
  Bell,
  ArrowLeft,
  Filter,
  Check,
  Trophy,
  Download,
  Gavel,
  BookOpen,
} from 'lucide-react';
import { DisputeCase, UserRole, VoteChoice } from './types';
import { INITIAL_CASES } from './lib/mockData';
import { Navbar } from './components/Navbar';
import { Sidebar, MainNavTab } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { RoleSwitcher } from './components/RoleSwitcher';
import { CaseCard } from './components/CaseCard';
import { EvidenceLocker } from './components/EvidenceLocker';
import { AIAnalysisPanel } from './components/AIAnalysisPanel';
import { CommitRevealVoting } from './components/CommitRevealVoting';
import { DisputeWizard } from './components/DisputeWizard';
import { LegalExportModal } from './components/LegalExportModal';
import { VerificationPortal } from './components/VerificationPortal';
import { AuditTrailView } from './components/AuditTrailView';
import { formatAddress, formatHash } from './lib/crypto';

export default function Home() {
  const [cases, setCases] = useState<DisputeCase[]>(INITIAL_CASES);
  const [activeCaseId, setActiveCaseId] = useState<string>('case-084');
  const [activeRole, setActiveRole] = useState<UserRole>('CLAIMANT');
  const [activeTab, setActiveTab] = useState<MainNavTab>('home');
  const [isViewingCaseDetails, setIsViewingCaseDetails] = useState<boolean>(false);
  const [caseSubTab, setCaseSubTab] = useState<
    'overview' | 'timeline' | 'evidence' | 'ai-analysis' | 'jury-voting' | 'verdict'
  >('overview');
  const [isDisputeWizardOpen, setIsDisputeWizardOpen] = useState<boolean>(false);
  const [isLegalExportModalOpen, setIsLegalExportModalOpen] = useState<boolean>(false);
  const [rslvBalance, setRslvBalance] = useState<number>(150);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [notificationTab, setNotificationTab] = useState<'all' | 'cases' | 'system'>('all');
  const [mounted, setMounted] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = (role?: UserRole) => {
    if (role) setActiveRole(role);
    setIsLoggedIn(true);
    setActiveTab('cases');
    setIsViewingCaseDetails(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveTab('home');
    setIsViewingCaseDetails(false);
  };

  const activeCase = cases.find(c => c.id === activeCaseId) || cases[0];

  const getRoleJurorId = (): string => {
    if (activeRole === 'JUROR_1') return 'juror-01';
    if (activeRole === 'JUROR_2') return 'juror-02';
    return 'juror-01';
  };

  const handleCommitVote = (
    jurorId: string,
    commitmentHash: string,
    vote: VoteChoice,
    salt: string
  ) => {
    setCases(prevCases =>
      prevCases.map(c => {
        if (c.id !== activeCase.id) return c;
        const updatedJurors = c.jurors.map(j => {
          if (j.jurorId === jurorId) {
            return {
              ...j,
              status: 'COMMITTED' as const,
              commitmentHash,
              revealedVote: vote,
              salt,
              commitTimestamp: new Date().toISOString(),
            };
          }
          return j;
        });

        const updatedAudit = [
          ...c.auditTrail,
          {
            eventId: `evt-commit-${Date.now()}`,
            eventNumber: 'EVENT 009',
            title: `Vote Commitment Submitted by ${jurorId}`,
            actor: jurorId,
            actorRole: 'Juror',
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
            txHash: '0x' + Math.random().toString(16).substring(2, 66),
            blockNumber: 6286120 + Math.floor(Math.random() * 50),
            metadataHash: commitmentHash,
            details: `Blind cryptographic commitment ${formatHash(commitmentHash, 8)} recorded on ledger.`,
          },
        ];

        return { ...c, jurors: updatedJurors, auditTrail: updatedAudit };
      })
    );
  };

  const handleRevealVote = (jurorId: string, vote: VoteChoice, salt: string) => {
    setCases(prevCases =>
      prevCases.map(c => {
        if (c.id !== activeCase.id) return c;
        const updatedJurors = c.jurors.map(j => {
          if (j.jurorId === jurorId) {
            return {
              ...j,
              status: 'REVEALED' as const,
              revealedVote: vote,
              salt,
              revealTimestamp: new Date().toISOString(),
            };
          }
          return j;
        });

        const updatedAudit = [
          ...c.auditTrail,
          {
            eventId: `evt-reveal-${Date.now()}`,
            eventNumber: 'EVENT 010',
            title: `Vote Revealed & Verified for ${jurorId}`,
            actor: jurorId,
            actorRole: 'Juror',
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
            txHash: '0x' + Math.random().toString(16).substring(2, 66),
            blockNumber: 6286200 + Math.floor(Math.random() * 50),
            metadataHash: '0x' + Math.random().toString(16).substring(2, 66),
            details: `Salt matched commitment. Vote Choice: ${vote.replace('_', ' ')} tallied.`,
          },
        ];

        return { ...c, jurors: updatedJurors, auditTrail: updatedAudit };
      })
    );
  };

  const handleCaseCreated = (newCase: DisputeCase) => {
    setCases(prev => [newCase, ...prev]);
    setActiveCaseId(newCase.id);
    setRslvBalance(prev => Math.max(0, prev - 10));
    setActiveTab('cases');
    setIsViewingCaseDetails(true);
    setCaseSubTab('overview');
  };

  const handleRunAIAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setCases(prevCases =>
        prevCases.map(c => {
          if (c.id !== activeCase.id) return c;
          return {
            ...c,
            status: 'JURY_COMMIT',
            aiAnalysis: {
              reportId: `AIR-${c.caseNumber}-AUTO`,
              caseId: c.id,
              generatedAt: new Date().toISOString(),
              modelIdentifier: 'Resolvia-LegalNLP-v2.4 (Transformer & Hybrid Verifier)',
              promptInjectionDefense: {
                status: 'SECURE_CLEARED',
                threatsDetected: 0,
                notes: 'All evidence payloads scanned. Zero prompt overrides identified.',
              },
              claimMappings: [
                {
                  claimId: 'CLM-01',
                  party: 'Claimant',
                  assertion: 'Evidence substantiates deliverable completion prior to deadline.',
                  evidenceIds: ['ev-01'],
                  credibilityScore: 94,
                  aiObservation: 'Cryptographic commit logs verify completion on Aug 15.',
                },
                {
                  claimId: 'CLM-02',
                  party: 'Respondent',
                  assertion: 'External reentrancy audit required staging diagnostic remediation.',
                  evidenceIds: ['ev-03'],
                  credibilityScore: 78,
                  aiObservation: 'Staging integration occurred without prompt formal objection notice.',
                },
              ],
              timeline: [
                { time: '2026-08-15 14:00', event: 'Solidity contracts committed to GitHub' },
                { time: '2026-08-20 11:30', event: 'Respondent deployed contracts to Sepolia staging' },
                { time: '2026-08-28 10:14', event: 'Claimant filed milestone dispute on Resolvia' },
              ],
              contradictions: [
                {
                  id: 'CONTRA-01',
                  severity: 'MODERATE',
                  title: 'Staging Integration vs. Non-Acceptance Claim',
                  description: 'Respondent claims non-acceptance while live staging contracts actively use code.',
                  evidenceRefs: ['ev-01', 'ev-03'],
                },
              ],
              advisoryRecommendation: {
                favoredParty: 'Claimant',
                confidence: 82,
                rationale: 'Substantial contract fulfillment established; staging deployment constitutes partial constructive acceptance under customary freelance norms.',
                uncertaintyFactors: [
                  'Third-party audit remediation costs are still disputed by parties.',
                ],
              },
              advisoryDisclaimer:
                'IMPORTANT: This AI synthesis is non-binding and advisory only. Authoritative verdict rests solely with the elected human jury.',
              reportSha256: '38f9021948b201938c8210349b1837c4091a829103c81093c819301938a9911f',
            },
          };
        })
      );
      setIsAnalyzing(false);
      setCaseSubTab('ai-analysis');
    }, 800);
  };

  const handleClaimFaucet = () => {
    setRslvBalance(prev => prev + 50);
  };

  const selectCaseAndOpenDetails = (c: DisputeCase) => {
    setActiveCaseId(c.id);
    setIsViewingCaseDetails(true);
    setCaseSubTab('overview');
  };

  if (activeTab === 'home') {
    return (
      <div className="min-h-screen bg-[#070d1d] text-white flex flex-col font-sans antialiased">
        <LandingPage
          onGetStarted={() => handleLogin()}
          onOpenDashboard={() => handleLogin()}
          onOpenWizard={() => {
            setIsDisputeWizardOpen(true);
          }}
          onSignInRole={(role) => handleLogin(role)}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
        />

        <DisputeWizard
          isOpen={isDisputeWizardOpen}
          onClose={() => setIsDisputeWizardOpen(false)}
          onCaseCreated={handleCaseCreated}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navbar matching Reference Image (Midnight Navy #0b132b) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'cases') setIsViewingCaseDetails(false);
        }}
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        onOpenDisputeWizard={() => setIsDisputeWizardOpen(true)}
        rslvBalance={rslvBalance}
        onFaucetClick={handleClaimFaucet}
        onLogout={handleLogout}
      />

      {/* Role Persona Sub-Bar */}
      <RoleSwitcher activeRole={activeRole} setActiveRole={setActiveRole} />

      {/* Main Layout Container with Sidebar & Content */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Left Sidebar matching Reference Image (Crisp White + Blue Active Tab) */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'cases') setIsViewingCaseDetails(false);
          }}
          onOpenDisputeWizard={() => setIsDisputeWizardOpen(true)}
          rslvBalance={rslvBalance}
          onFaucetClick={handleClaimFaucet}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {/* ═══════════ VIEW 1: DASHBOARD OVERVIEW (Panel 5 in Reference) ═══════════ */}
          {activeTab === 'cases' && !isViewingCaseDetails && (
            <div className="space-y-6 animate-fade-in">
              {/* Greeting Banner matching Reference Image */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Welcome back, Yash! 👋
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Justice is a conversation.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsDisputeWizardOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Create New Case</span>
                  </button>
                </div>
              </div>

              {/* 4 Stat KPI Cards matching Reference Image Panel 5 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                    <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    <span>Active Cases</span>
                  </div>
                  <p className="text-3xl font-black text-slate-900">3</p>
                  <p className="text-[11px] text-emerald-600 font-semibold">+1 in deliberation</p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                    <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Scale className="w-3.5 h-3.5" />
                    </div>
                    <span>Total Cases</span>
                  </div>
                  <p className="text-3xl font-black text-slate-900">{cases.length}</p>
                  <p className="text-[11px] text-slate-500 font-medium">On-chain dockets</p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                    <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Award className="w-3.5 h-3.5" />
                    </div>
                    <span>Reputation Points</span>
                  </div>
                  <p className="text-3xl font-black text-amber-600">820</p>
                  <p className="text-[11px] text-amber-700 font-semibold">Top 5% Juror Rank</p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                    <span>Juror Participations</span>
                  </div>
                  <p className="text-3xl font-black text-emerald-600">12</p>
                  <p className="text-[11px] text-emerald-700 font-semibold">100% Consensus Accuracy</p>
                </div>
              </div>

              {/* 2-Column Dashboard Layout: Recent Cases (col 8) + Quick Actions (col 4) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Recent Cases Column matching Reference Image */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                      Recent Cases
                    </h3>
                    <button
                      onClick={() => setActiveTab('my-cases')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      View All →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {cases.map((dispute) => (
                      <CaseCard
                        key={dispute.id}
                        dispute={dispute}
                        isSelected={dispute.id === activeCaseId}
                        onSelect={(d) => selectCaseAndOpenDetails(d)}
                      />
                    ))}
                  </div>
                </div>

                {/* Quick Actions Column matching Reference Image Panel 5 */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Quick Actions
                    </h4>

                    <div className="space-y-2">
                      <button
                        onClick={() => setIsDisputeWizardOpen(true)}
                        className="w-full p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-200 text-xs font-semibold text-slate-800 flex items-center justify-between group transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Plus className="w-4 h-4 text-blue-600" />
                          <span>Create New Case</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                      </button>

                      <button
                        onClick={() => setActiveTab('analytics')}
                        className="w-full p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-200 text-xs font-semibold text-slate-800 flex items-center justify-between group transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <BarChart3 className="w-4 h-4 text-blue-600" />
                          <span>Browse Case Studies</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                      </button>

                      <button
                        onClick={() => {
                          setActiveRole('JUROR_1');
                          setIsViewingCaseDetails(true);
                          setCaseSubTab('jury-voting');
                        }}
                        className="w-full p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-200 text-xs font-semibold text-slate-800 flex items-center justify-between group transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Scale className="w-4 h-4 text-blue-600" />
                          <span>Become a Juror</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                      </button>

                      <button
                        onClick={() => setActiveTab('verifier')}
                        className="w-full p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-200 text-xs font-semibold text-slate-800 flex items-center justify-between group transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>Read Guidelines</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    </div>
                  </div>

                  {/* Dark Navy Quote Card matching Reference Image */}
                  <div className="p-6 rounded-2xl bg-[#0b132b] text-white shadow-md text-center space-y-2">
                    <p className="text-sm font-semibold italic text-slate-200 leading-relaxed">
                      "Fair processes build stronger communities."
                    </p>
                    <p className="text-[10px] text-blue-400 uppercase tracking-widest font-bold">
                      Resolvia Protocol Foundation
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ VIEW 2: DETAILED CASE INVESTIGATION (Panels 3, 6, 7, 9) ═══════════ */}
          {activeTab === 'cases' && isViewingCaseDetails && (
            <div className="space-y-6 animate-fade-in">
              {/* Back to Dashboard Button */}
              <button
                onClick={() => setIsViewingCaseDetails(false)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>

              {/* Case Header Card matching Reference Image */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
                        {activeCase.caseNumber}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {activeCase.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                        {activeCase.category.replace('_', ' ')}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                      {activeCase.title}
                    </h2>

                    <p className="text-xs text-slate-500 mt-1">
                      Claimant: <strong className="text-slate-700">{activeCase.claimant.name}</strong> vs Respondent: <strong className="text-slate-700">{activeCase.respondent.name}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsLegalExportModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                      <span>Legal Dossier</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('verifier');
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Verify Proof</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Tabs Bar matching Reference Image (Overview, Timeline, Evidence, AI Analysis, Jury, Verdict) */}
                <div className="flex items-center gap-2 border-t border-slate-100 pt-4 overflow-x-auto scrollbar-none">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'timeline', label: 'Timeline' },
                    { id: 'evidence', label: `Evidence (${activeCase.evidence.length})` },
                    { id: 'ai-analysis', label: 'AI Advisory' },
                    { id: 'jury-voting', label: 'Jury Deliberation' },
                    { id: 'verdict', label: 'Final Verdict & Dossier' },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setCaseSubTab(sub.id as any)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        caseSubTab === sub.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-Tab 1: Overview */}
              {caseSubTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
                  <div className="lg:col-span-8 space-y-4">
                    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Case Background & Claim Summary
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {activeCase.claimSummary}
                      </p>

                      {activeCase.counterClaimSummary && (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                            Respondent Counter-Statement
                          </span>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {activeCase.counterClaimSummary}
                          </p>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Specific Relief Sought
                        </span>
                        <p className="text-xs font-bold text-slate-900">
                          {activeCase.reliefSought}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 space-y-4">
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 text-xs">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Financial Stakes & Escrow
                      </h4>

                      <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500">Dispute Value:</span>
                        <span className="font-mono font-bold text-emerald-600">{activeCase.disputeAmount}</span>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500">Claimant Stake:</span>
                        <span className="font-mono font-bold text-slate-800">{activeCase.claimant.stake} DRA</span>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <span className="text-slate-500">Respondent Stake:</span>
                        <span className="font-mono font-bold text-slate-800">{activeCase.respondent.stake} DRA</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Tab 2: Timeline matching Reference Image Panel 3 */}
              {caseSubTab === 'timeline' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                      Chronological Dispute Progression
                    </h4>
                    <AuditTrailView events={activeCase.auditTrail} />
                  </div>
                </div>
              )}

              {/* Sub-Tab 3: Evidence Locker */}
              {caseSubTab === 'evidence' && (
                <div className="animate-fade-in">
                  <EvidenceLocker
                    evidence={activeCase.evidence}
                    caseId={activeCase.id}
                    onAddEvidenceClick={() => setIsDisputeWizardOpen(true)}
                  />
                </div>
              )}

              {/* Sub-Tab 4: AI Advisory */}
              {caseSubTab === 'ai-analysis' && (
                <div className="animate-fade-in">
                  <AIAnalysisPanel
                    report={activeCase.aiAnalysis}
                    onRunAnalysis={handleRunAIAnalysis}
                    isAnalyzing={isAnalyzing}
                  />
                </div>
              )}

              {/* Sub-Tab 5: Jury Deliberation */}
              {caseSubTab === 'jury-voting' && (
                <div className="animate-fade-in">
                  <CommitRevealVoting
                    jurors={activeCase.jurors}
                    currentJurorId={getRoleJurorId()}
                    onCommitVote={handleCommitVote}
                    onRevealVote={handleRevealVote}
                    votingDeadline={activeCase.votingDeadline}
                  />
                </div>
              )}

              {/* Sub-Tab 6: Final Verdict & Closure Dossier matching Reference Image Panel 7 & 8 */}
              {caseSubTab === 'verdict' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-4 shadow-sm">
                    <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center shadow-sm">
                      <Trophy className="w-8 h-8" />
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
                        Final Binding Resolution
                      </span>
                      <h3 className="text-2xl font-bold text-slate-900 mt-2">
                        Verdict: In Favour of Claimant
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Supermajority consensus established across independent human jury panel
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-8 py-3">
                      <div className="text-center">
                        <span className="text-3xl font-black text-emerald-600 font-mono">3</span>
                        <p className="text-[11px] text-slate-600 font-bold uppercase mt-0.5">Claimant Votes</p>
                      </div>
                      <div className="w-[1px] h-10 bg-slate-200"></div>
                      <div className="text-center">
                        <span className="text-3xl font-black text-rose-600 font-mono">2</span>
                        <p className="text-[11px] text-slate-600 font-bold uppercase mt-0.5">Respondent Votes</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => setIsLegalExportModalOpen(true)}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download BSA 2023 Package</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('verifier')}
                        className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Verify On Blockchain</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════ VIEW 3: MY CASES LIST ═══════════ */}
          {activeTab === 'my-cases' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">My Cases</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cases where you are participating as Claimant, Respondent, or Assigned Juror
                  </p>
                </div>
                <button
                  onClick={() => setIsDisputeWizardOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Case</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cases.map((dispute) => (
                  <CaseCard
                    key={dispute.id}
                    dispute={dispute}
                    isSelected={dispute.id === activeCaseId}
                    onSelect={(d) => {
                      setActiveTab('cases');
                      selectCaseAndOpenDetails(d);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ═══════════ VIEW 4: AI ADVISORY RADAR ═══════════ */}
          {activeTab === 'ai-radar' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-600" />
                  <span>Neural Advisory Radar ({activeCase.caseNumber})</span>
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Off-chain evidentiary analysis, timeline synchronization, and prompt-injection defense
                </p>
              </div>

              <AIAnalysisPanel
                report={activeCase.aiAnalysis}
                onRunAnalysis={handleRunAIAnalysis}
                isAnalyzing={isAnalyzing}
              />
            </div>
          )}

          {/* ═══════════ VIEW 5: PROOF VERIFIER ═══════════ */}
          {activeTab === 'verifier' && (
            <div className="animate-fade-in">
              <VerificationPortal cases={cases} />
            </div>
          )}

          {/* ═══════════ VIEW 6: LEGAL EXPORT / BSA DOSSIER ═══════════ */}
          {activeTab === 'legal-export' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Award className="w-5 h-5 text-blue-600" />
                      <span>Bharatiya Sakshya Adhiniyam (BSA) 2023 Dossier Generator</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Generates court-admissible electronic evidence certificates under Section 63/65B
                    </p>
                  </div>
                  <button
                    onClick={() => setIsLegalExportModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer flex items-center gap-2 shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    <span>View & Export Dossier</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ VIEW 7: CASE STUDIES (Panel 7 in Reference) ═══════════ */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <h2 className="text-xl font-bold text-slate-900">Public Case Studies</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Transparent review of finalized arbitrations, juror consensus patterns, and AI fidelity
                </p>
              </div>

              {/* Case Study Card matching Reference Image Panel 7 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                      Case #1024
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Closed
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">15 Mar 2025 • 3 Evidence Items • Public</span>
                </div>

                <h3 className="text-base font-bold text-slate-900">Attendance Dispute</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The claimant alleged that the respondent was marked absent despite attending classes. Evidence included class attendance screenshots and email communications. The jury found in favour of the claimant.
                </p>

                {/* Key Highlights Grid matching Reference Image */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                    <p className="font-mono font-black text-slate-900 text-base">3 - 2</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Jury Vote</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-center">
                    <p className="font-mono font-black text-blue-700 text-base">82%</p>
                    <p className="text-[11px] text-blue-600 mt-0.5 font-medium">AI Agreed Confidence</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                    <p className="font-mono font-black text-slate-900 text-base">No Appeal</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Filed</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-center">
                    <p className="font-mono font-black text-emerald-700 text-base">Verified</p>
                    <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">On Blockchain</p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      selectCaseAndOpenDetails(cases[0]);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Read Full Case Study →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ VIEW 8: USER PROFILE (Panel 8 in Reference) ═══════════ */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-black text-2xl flex items-center justify-center shadow-md">
                    Y
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Yash Vijay Singh</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Student, Xavier Institute of Engineering • Joined Jan 2025
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-center">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <p className="text-2xl font-black text-amber-600 font-mono">820</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Reputation</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <p className="text-2xl font-black text-blue-600 font-mono">12</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Cases Participated</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity Feed matching Reference Image Panel 8 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Recent Activity
                </h3>

                <div className="space-y-2.5">
                  {[
                    { title: 'Case #1024 closed (Won)', date: '15 Mar 2025', points: '+50 points' },
                    { title: 'Participated as Juror (Case #0987)', date: '12 Mar 2025', points: '+20 points' },
                    { title: 'Case #0765 closed (Won)', date: '01 Mar 2025', points: '+50 points' },
                    { title: 'Profile verified (College Email / DID)', date: '25 Jan 2025', points: '+100 points' },
                  ].map((act, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{act.title}</span>
                        <span className="text-slate-400 ml-3 text-[11px]">{act.date}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        {act.points}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ VIEW 9: NOTIFICATIONS (Panel 9 in Reference) ═══════════ */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Notifications</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Stay updated on your cases and juror calls</p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  {['all', 'cases', 'system'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setNotificationTab(t as any)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                        notificationTab === t
                          ? 'bg-white text-blue-600 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: 'Your vote has been recorded',
                    sub: 'Case #1024 - Cryptographic commitment anchored on-chain',
                    time: '14 Mar, 04:02 PM',
                  },
                  {
                    title: 'New evidence submitted',
                    sub: 'Case #0987 - Claimant added foundry_test_report.log',
                    time: '08 Mar, 11:20 AM',
                  },
                  {
                    title: 'Case #0765 has been closed',
                    sub: 'You won the case. 4,500 USDC released from escrow.',
                    time: '01 Mar, 04:25 PM',
                  },
                  {
                    title: 'You have been selected as a Juror',
                    sub: 'Case #1835 - Weighted PRNG selection verified conflict-free.',
                    time: '25 Feb, 10:14 AM',
                  },
                ].map((notif, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 transition-all flex items-start justify-between gap-4 shadow-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1.5 shrink-0"></div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{notif.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{notif.sub}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono shrink-0">{notif.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <DisputeWizard
        isOpen={isDisputeWizardOpen}
        onClose={() => setIsDisputeWizardOpen(false)}
        onCaseCreated={handleCaseCreated}
      />

      <LegalExportModal
        isOpen={isLegalExportModalOpen}
        onClose={() => setIsLegalExportModalOpen(false)}
        dispute={activeCase}
      />
    </div>
  );
}
