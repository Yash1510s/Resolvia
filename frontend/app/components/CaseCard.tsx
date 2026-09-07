'use client';

import React from 'react';
import {
  Scale,
  Clock,
  ChevronRight,
  Shield,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  User,
} from 'lucide-react';
import { DisputeCase, CaseStatus } from '../types';

interface CaseCardProps {
  dispute: DisputeCase;
  onSelect: (dispute: DisputeCase) => void;
  isSelected: boolean;
}

export const CaseCard: React.FC<CaseCardProps> = ({ dispute, onSelect, isSelected }) => {
  const getStatusBadge = (status: CaseStatus) => {
    switch (status) {
      case 'JURY_COMMIT':
        return {
          label: 'Under Jury Review',
          style: 'bg-purple-50 text-purple-700 border-purple-200',
          dot: 'bg-purple-500',
        };
      case 'JURY_REVEAL':
        return {
          label: 'Jury Reveal Phase',
          style: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
        };
      case 'AI_ANALYSIS':
        return {
          label: 'AI Evidence Analysis',
          style: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
        };
      case 'APPEAL_WINDOW':
        return {
          label: 'Appeal Window',
          style: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
        };
      case 'FINALIZED':
      case 'CLOSED':
        return {
          label: 'Closed (Won)',
          style: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
        };
      default:
        return {
          label: 'Active',
          style: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
        };
    }
  };

  const statusInfo = getStatusBadge(dispute.status);

  return (
    <div
      onClick={() => onSelect(dispute)}
      className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'bg-white border-blue-500 ring-2 ring-blue-100 shadow-md'
          : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
            {dispute.caseNumber}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {dispute.category.replace('_', ' ')}
          </span>
        </div>
        <span
          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${statusInfo.style}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>
          {statusInfo.label}
        </span>
      </div>

      <h3 className="font-bold text-sm text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
        {dispute.title}
      </h3>

      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
        <span>vs <strong className="text-slate-700">{dispute.respondent.name.split('(')[0].trim()}</strong></span>
        <span>•</span>
        <span>Dispute Escrow: <strong className="text-slate-700">{dispute.disputeAmount}</strong></span>
      </div>

      <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
        {dispute.claimSummary}
      </p>

      {/* Footer */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
          <span>Claimant:</span>
          <span className="font-semibold text-slate-800">
            {dispute.claimant.name.split('(')[0].trim()}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
          <span>View Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
