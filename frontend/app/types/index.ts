export type CaseStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'RESPONDENT_WINDOW'
  | 'EVIDENCE_LOCKED'
  | 'AI_ANALYSIS'
  | 'JURY_COMMIT'
  | 'JURY_REVEAL'
  | 'VERDICT'
  | 'APPEAL_WINDOW'
  | 'FINALIZED'
  | 'CLOSED';

export type DisputeCategory =
  | 'FINANCIAL_PAYMENT'
  | 'ECOMMERCE_MARKETPLACE'
  | 'CONTRACT_OBLIGATION'
  | 'BUSINESS_PEER'
  | 'PROPERTY_SERVICE'
  | 'DIGITAL_PLATFORM'
  | 'GENERAL_EVIDENCE'
  | 'FREELANCE_DEV'
  | 'MARKETPLACE'
  | 'DAO_GOVERNANCE'
  | 'IP_ACADEMIC'
  | 'SERVICE_SLA'
  | 'CAMPUS_LIFE'
  | 'ACADEMIC'
  | 'COMMUNITY';

export type UserRole =
  | 'CLAIMANT'
  | 'RESPONDENT'
  | 'JUROR_1'
  | 'JUROR_2'
  | 'LEGAL_AUDITOR'
  | 'ADMIN';

export type AccessTier = 'PUBLIC' | 'PARTY_ONLY' | 'AUTHORIZED' | 'RESTRICTED_PII';

export interface EvidenceItem {
  id: string;
  title: string;
  description: string;
  fileName: string;
  fileSize: string;
  mimeType: string;
  sha256Hash: string;
  ipfsCid: string;
  submittedBy: 'Claimant' | 'Respondent';
  submitterWallet: string;
  submittedAt: string;
  accessTier: AccessTier;
  encrypted: boolean;
  tamperDetected?: boolean;
  // Real on-chain anchoring (EvidenceRegistry.registerEvidence)
  onChainAnchored?: boolean;
  onChainTx?: string;
  onChainBlock?: number;
  onChainEvidenceId?: number;
}

export interface ClaimMapping {
  claimId: string;
  party: 'Claimant' | 'Respondent';
  assertion: string;
  evidenceIds: string[];
  credibilityScore: number; // 0-100
  aiObservation: string;
}

export interface TimelineEvent {
  time: string;
  event: string;
  sourceEvidenceId?: string;
  flagged?: boolean;
}

export interface Contradiction {
  id: string;
  severity: 'CRITICAL' | 'MODERATE' | 'LOW';
  title: string;
  description: string;
  evidenceRefs: string[];
}

export interface MLReason {
  feature: string;
  displayName: string;
  contribution: number;
  value: number;
}

export interface MLPrediction {
  predictedOutcome: string;
  favoredParty: 'Claimant' | 'Respondent' | 'Split Settlement' | string;
  confidence: number; // 0 - 100
  probabilityBreakdown: Record<string, number>;
  topReasons: MLReason[];
  modelInfo: {
    name: string;
    sha256: string;
    featureCount: number;
    trainingSamples?: number;
    testAccuracy?: number;
    testF1?: number;
  };
}

export interface ModelConsensus {
  consensusLevel: 'HIGH_CONSENSUS' | 'DIVERGENCE_DETECTED';
  consensusScore: number;
  llmFavoredParty: string;
  mlFavoredParty: string;
  llmConfidence: number;
  mlConfidence: number;
  summary: string;
}

export interface AIAnalysisReport {
  reportId: string;
  caseId: string;
  generatedAt: string;
  modelIdentifier: string;
  promptInjectionDefense: {
    status: 'SECURE_CLEARED' | 'SUSPICIOUS_PAYLOAD_ISOLATED';
    threatsDetected: number;
    notes: string;
  };
  claimMappings: ClaimMapping[];
  timeline: TimelineEvent[];
  contradictions: Contradiction[];
  advisoryRecommendation: {
    favoredParty: 'Claimant' | 'Respondent' | 'Split Settlement';
    confidence: number; // 0 - 100
    rationale: string;
    uncertaintyFactors: string[];
  };
  mlPrediction?: MLPrediction;
  modelConsensus?: ModelConsensus;
  advisoryDisclaimer: string;
  reportSha256: string;
}

export type VoteChoice = 'CLAIMANT_UPHELD' | 'RESPONDENT_UPHELD' | 'SPLIT_SETTLEMENT';

export type MyCaseRole = 'CLAIMANT' | 'RESPONDENT' | 'JUROR';

export type JuryAvailabilityState = 'AVAILABLE' | 'TEMPORARILY_UNAVAILABLE' | 'OPTED_OUT';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'REPLACED';

export interface JurorAssignment {
  jurorId: string;
  name: string;
  walletAddress: string;
  reputationScore: number; // e.g. 96
  stakedAmount: number; // RSLV tokens
  status: 'PENDING_COMMIT' | 'COMMITTED' | 'REVEALED';
  commitmentHash?: string;
  revealedVote?: VoteChoice;
  reasoning?: string;
  salt?: string;
  commitTimestamp?: string;
  revealTimestamp?: string;
}

export interface AuditEvent {
  eventId: string;
  eventNumber: string; // e.g. "EVENT 001"
  title: string;
  actor: string;
  actorRole: string;
  timestamp: string;
  txHash: string;
  blockNumber: number;
  metadataHash: string;
  details: string;
}

export interface LegalPackage {
  packageId: string;
  caseId: string;
  certificateId: string;
  generatedAt: string;
  statutoryStandard: string; // e.g. "Bharatiya Sakshya Adhiniyam, 2023 (Sec 63/65B) & ISO/IEC 27037"
  canonicalRecordHash: string;
  ipfsManifestCid: string;
  anchoredTxHash: string;
  chainOfCustodySigners: string[];
  integrityStatus: 'VALID_VERIFIED' | 'TAMPER_ALERT';
}

export interface DisputeCase {
  id: string;
  caseNumber: string;
  title: string;
  category: DisputeCategory;
  status: CaseStatus;
  claimant: {
    name: string;
    wallet: string;
    stake: number;
  };
  respondent: {
    name: string;
    wallet: string;
    stake: number;
    responded: boolean;
  };
  claimSummary: string;
  reliefSought: string;
  counterClaimSummary?: string;
  disputeAmount: string;
  createdAt: string;
  responseDeadline: string;
  votingDeadline: string;
  evidence: EvidenceItem[];
  aiAnalysis?: AIAnalysisReport;
  jurors: JurorAssignment[];
  verdictOutcome?: {
    winner: 'Claimant' | 'Respondent' | 'Split Settlement';
    voteCount: { claimant: number; respondent: number; split: number };
    totalJurors: number;
    finalizedAt: string;
    verdictHash: string;
  };
  auditTrail: AuditEvent[];
  legalPackage?: LegalPackage;

  // ── Role / lifecycle extensions ──────────────────────────────
  /** The demo identity's role in this case (drives My Cases tabs). */
  myRole?: MyCaseRole;
  /** Appeal window state. Present once a verdict is rendered. */
  appeal?: {
    windowClosesAt: string;
    filed: boolean;
    filedBy?: 'Claimant' | 'Respondent';
    grounds?: string;
    outcome?: 'UPHELD' | 'REVERSED' | 'RECONVENED';
    outcomeNote?: string;
  };
  /** Post-closure community discussion. Only populated when CLOSED. */
  discussion?: CommunityPost[];
  /** Private, anonymous Jury Deliberation channel — only for in-progress (pre-verdict) cases. */
  deliberation?: CommunityPost[];
  /** Public case-study metadata (set when the case reaches CLOSED). */
  caseStudy?: {
    closedAt: string;
    disclosureNote: string;
    aiAgreement: number; // 0-100
    appealFiled: boolean;
    public: boolean;
  };
}

export interface CommunityPost {
  id: string;
  author: string;
  authorRole: 'Party' | 'Juror (anonymous)' | 'Community';
  authorBadge?: string; // e.g. "Juror #A7F2" when anonymous
  body: string;
  createdAt: string;
  likes: number;
  reports: number;
  replies?: CommunityPost[];
}

export interface JuryInvitation {
  id: string;
  caseId: string;
  caseNumber: string;
  category: string;
  estimatedEffortMin: number;
  stakeRequired: number;
  inviteSentAt: string;
  expiresAt: string;
  status: InvitationStatus;
  declineReason?: 'BUSY' | 'CONFLICT' | 'OTHER';
  replacementPicked?: boolean;
}

export interface JuryAvailability {
  inPool: boolean;
  state: JuryAvailabilityState;
  returnDate?: string;
  maxConcurrent: number;
}

export type RoleType = 'INDIVIDUAL' | 'STUDENT' | 'PROFESSIONAL' | 'INSTITUTION';

export interface ProfilePrefs {
  headline: string;
  roleType?: RoleType;
  email: string;
  bio: string;
  interests: string[];
  location: string;
  institution: string;
  joinedDate: string;
  notifications: {
    email: boolean;
    inApp: boolean;
    juryInvitations: boolean;
    caseUpdates: boolean;
    security: boolean;
    marketing: boolean;
  };
  privacy: {
    publicProfile: boolean;
    showReputation: boolean;
    showHistory: boolean;
    anonymizeCaseStudy: boolean;
    doNotIndex: boolean;
  };
  blockchain: {
    showWallet: boolean;
    autoApprove: boolean;
    defaultNetwork: string;
  };
  accessibility: {
    reducedMotion: boolean;
    largeText: boolean;
    highContrast: boolean;
    announcements: boolean;
  };
}

export interface JurorHistoryItem {
  caseId: string;
  caseNumber: string;
  category: string;
  completedAt: string;
  voteChoice: VoteChoice;
  alignedWithOutcome: boolean; // informational, NOT a reliability score
  reputationDelta: number;
  onTime: boolean;
}

export type NotificationKind =
  | 'CASE_SUBMITTED'
  | 'RESPONDENT_NOTIFIED'
  | 'RESPONSE_RECEIVED'
  | 'EVIDENCE_DEADLINE'
  | 'EVIDENCE_LOCKED'
  | 'AI_COMPLETED'
  | 'JURY_INVITATION'
  | 'JURY_INVITATION_EXPIRING'
  | 'JURY_REPLACEMENT'
  | 'COMMIT_DEADLINE'
  | 'REVEAL_DEADLINE'
  | 'VERDICT'
  | 'APPEAL_WINDOW'
  | 'FINALIZED'
  | 'CASE_STUDY';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  caseId?: string;
  createdAt: string;
  read: boolean;
  link?: string;
}
