'use client';

import React from 'react';
import { User, Shield, Scale, FileText, Settings, Award, Check, ChevronRight } from 'lucide-react';
import { UserRole } from '../types';

interface RoleSwitcherProps {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
}

interface RoleConfig {
  id: UserRole;
  label: string;
  name: string;
  roleType: string;
  icon: React.ElementType;
}

const ROLES: RoleConfig[] = [
  {
    id: 'CLAIMANT',
    label: 'Claimant',
    name: 'Yash (Claimant)',
    roleType: 'Dispute Party',
    icon: User,
  },
  {
    id: 'RESPONDENT',
    label: 'Respondent',
    name: 'Marcus (Respondent)',
    roleType: 'Dispute Party',
    icon: Shield,
  },
  {
    id: 'JUROR_1',
    label: 'Juror Carol',
    name: 'Contract Auditor',
    roleType: 'Panelist',
    icon: Scale,
  },
  {
    id: 'JUROR_2',
    label: 'Juror Dave',
    name: 'LegalTech Specialist',
    roleType: 'Panelist',
    icon: Award,
  },
  {
    id: 'LEGAL_AUDITOR',
    label: 'BSA Auditor',
    name: 'Forensic Notary',
    roleType: 'Legal Examiner',
    icon: FileText,
  },
];

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  CLAIMANT: 'File claims, inspect responses & upload encrypted evidence',
  RESPONDENT: 'Submit defense arguments & counter-evidence',
  JUROR_1: 'Assigned panelist — submit blind commit-reveal ballot',
  JUROR_2: 'Assigned panelist — vote revealed and verified on-chain',
  LEGAL_AUDITOR: 'Export court-admissible BSA 2023 certified evidence bundle',
  ADMIN: 'Emergency Guardian controls and dispute pause registry',
};

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ activeRole, setActiveRole }) => {
  const current = ROLES.find(r => r.id === activeRole) || ROLES[0];

  return (
    <div className="w-full bg-[#0d152b] border-b border-slate-800/80 py-2 px-4 sm:px-6">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
        {/* Role Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mr-2 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            <span>Simulate Role:</span>
          </div>

          {ROLES.map(role => {
            const Icon = role.icon;
            const isSelected = activeRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setActiveRole(role.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all shrink-0 border cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                <span>{role.label}</span>
                {isSelected && <Check className="w-3 h-3 text-white ml-0.5" />}
              </button>
            );
          })}
        </div>

        {/* Active Perspective */}
        <div className="flex items-center gap-2 text-xs text-slate-300 shrink-0 px-3 py-1 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-bold text-white">{current.name}</span>
          <ChevronRight className="w-3 h-3 text-slate-500" />
          <span className="text-slate-400 max-w-[320px] truncate hidden sm:inline text-[11px]">
            {ROLE_DESCRIPTIONS[activeRole]}
          </span>
        </div>
      </div>
    </div>
  );
};
