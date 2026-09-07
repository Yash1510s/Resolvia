import { CaseStatus, DisputeCase } from '../types';

export interface LifecycleStep {
  key: string;
  label: string;
  statuses: CaseStatus[];
}

/** Ordered lifecycle. A step is "current" when the case's status maps to it. */
export const LIFECYCLE: LifecycleStep[] = [
  { key: 'draft', label: 'Draft', statuses: ['DRAFT'] },
  { key: 'submitted', label: 'Submitted', statuses: ['SUBMITTED'] },
  { key: 'response', label: 'Respondent Response', statuses: ['RESPONDENT_WINDOW'] },
  { key: 'evidence', label: 'Evidence Locked', statuses: ['EVIDENCE_LOCKED'] },
  { key: 'ai', label: 'AI Analysis', statuses: ['AI_ANALYSIS'] },
  { key: 'jury', label: 'Jury · Commit', statuses: ['JURY_COMMIT'] },
  { key: 'reveal', label: 'Jury · Reveal', statuses: ['JURY_REVEAL'] },
  { key: 'verdict', label: 'Verdict', statuses: ['VERDICT'] },
  { key: 'appeal', label: 'Appeal Window', statuses: ['APPEAL_WINDOW'] },
  { key: 'finalized', label: 'Finalized', statuses: ['FINALIZED'] },
  { key: 'closed', label: 'Closed', statuses: ['CLOSED'] },
];

const ORDER: CaseStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'RESPONDENT_WINDOW',
  'EVIDENCE_LOCKED',
  'AI_ANALYSIS',
  'JURY_COMMIT',
  'JURY_REVEAL',
  'VERDICT',
  'APPEAL_WINDOW',
  'FINALIZED',
  'CLOSED',
];

export function statusIndex(status: CaseStatus): number {
  return ORDER.indexOf(status);
}

export function stepIndexForStatus(status: CaseStatus): number {
  const idx = statusIndex(status);
  for (let i = LIFECYCLE.length - 1; i >= 0; i--) {
    if (LIFECYCLE[i].statuses.includes(ORDER[Math.min(idx, ORDER.length - 1)])) return i;
  }
  // Fallback: match by ordering of the current status
  return LIFECYCLE.findIndex((s) => s.statuses.includes(status));
}

export interface CaseSection {
  id: string;
  label: string;
  visible: boolean;
  /** true = this is where the case currently is */
  active?: boolean;
}

/** Which Case Details sections are visible for a given status. */
export function visibleSections(status: CaseStatus): CaseSection[] {
  const i = statusIndex(status);
  const has = (s: CaseStatus) => i >= statusIndex(s);
  const secs: CaseSection[] = [
    { id: 'overview', label: 'Overview', visible: true },
    { id: 'response', label: 'Response', visible: has('RESPONDENT_WINDOW') },
    { id: 'evidence', label: 'Evidence', visible: true },
    { id: 'ai', label: 'AI Advisory', visible: has('AI_ANALYSIS') },
    { id: 'jury', label: 'Jury', visible: has('EVIDENCE_LOCKED') },
    { id: 'voting', label: 'Voting', visible: has('JURY_COMMIT') },
    { id: 'verdict', label: 'Verdict', visible: has('VERDICT') },
    { id: 'appeal', label: 'Appeal', visible: has('VERDICT') },
    { id: 'timeline', label: 'Timeline & Audit', visible: true },
    { id: 'record', label: 'Case Record', visible: has('VERDICT') },
    { id: 'discussion', label: 'Community Discussion', visible: status === 'CLOSED' },
  ];
  return secs.filter((s) => s.visible);
}

export interface StatusStyle {
  label: string;
  tone: 'slate' | 'blue' | 'amber' | 'violet' | 'emerald' | 'rose';
}

export function statusStyle(status: CaseStatus): StatusStyle {
  switch (status) {
    case 'DRAFT':
      return { label: 'Draft', tone: 'slate' };
    case 'SUBMITTED':
      return { label: 'Submitted', tone: 'blue' };
    case 'RESPONDENT_WINDOW':
      return { label: 'Awaiting Response', tone: 'amber' };
    case 'EVIDENCE_LOCKED':
      return { label: 'Evidence Locked', tone: 'violet' };
    case 'AI_ANALYSIS':
      return { label: 'AI Analysis', tone: 'violet' };
    case 'JURY_COMMIT':
      return { label: 'Jury · Commit', tone: 'blue' };
    case 'JURY_REVEAL':
      return { label: 'Jury · Reveal', tone: 'blue' };
    case 'VERDICT':
      return { label: 'Verdict Rendered', tone: 'amber' };
    case 'APPEAL_WINDOW':
      return { label: 'Appeal Window', tone: 'amber' };
    case 'FINALIZED':
      return { label: 'Finalized', tone: 'emerald' };
    case 'CLOSED':
      return { label: 'Closed', tone: 'emerald' };
    default:
      return { label: status, tone: 'slate' };
  }
}

export function isClosed(c: DisputeCase): boolean {
  return c.status === 'FINALIZED' || c.status === 'CLOSED';
}

export function appealAvailable(c: DisputeCase): boolean {
  return c.status === 'VERDICT' || (c.status === 'APPEAL_WINDOW' && !c.appeal?.filed);
}

export function canDiscuss(c: DisputeCase): boolean {
  return c.status === 'CLOSED';
}
