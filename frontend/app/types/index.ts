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
  | 'FREELANCE_DEV'
  | 'MARKETPLACE'
  | 'DAO_GOVERNANCE'
  | 'IP_ACADEMIC'
  | 'SERVICE_SLA';

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
  advisoryDisclaimer: string;
  reportSha256: string;
}

export type VoteChoice = 'CLAIMANT_UPHELD' | 'RESPONDENT_UPHELD' | 'SPLIT_SETTLEMENT';

export interface JurorAssignment {
  jurorId: string;
  name: string;
  walletAddress: string;
  reputationScore: number; // e.g. 96
  stakedAmount: number; // RSLV tokens
  status: 'PENDING_COMMIT' | 'COMMITTED' | 'REVEALED';
  commitmentHash?: string;
  revealedVote?: VoteChoice;
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
}
