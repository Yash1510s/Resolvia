'use client';

import React, { useState } from 'react';
import {
  X,
  Scale,
  Shield,
  User,
  Check,
  Wallet,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '../types';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: (role: UserRole) => void;
  currentRole: UserRole;
}

const ROLES: { id: UserRole; label: string; name: string; roleType: string; desc: string }[] = [
  {
    id: 'CLAIMANT',
    label: 'Claimant',
    name: 'Yash (Claimant)',
    roleType: 'Dispute Party',
    desc: 'File claims, deposit escrow, and submit evidence documents.',
  },
  {
    id: 'RESPONDENT',
    label: 'Respondent',
    name: 'Marcus (Respondent)',
    roleType: 'Dispute Party',
    desc: 'Review counterclaims, submit rebuttals, and participate in hearings.',
  },
  {
    id: 'JUROR_1',
    label: 'Juror 1',
    name: 'Juror Carol',
    roleType: 'Panelist',
    desc: 'Cast commit-reveal votes, evaluate AI consistency reports, and earn DRA.',
  },
  {
    id: 'JUROR_2',
    label: 'Juror 2',
    name: 'Juror Dave',
    roleType: 'Panelist',
    desc: 'Independent panelist voting on consensus arbitration.',
  },
  {
    id: 'LEGAL_AUDITOR',
    label: 'BSA Auditor',
    name: 'Forensic Notary',
    roleType: 'Legal Examiner',
    desc: 'Export certified BSA 2023 Section 63 evidentiary records and verify hashes.',
  },
];

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  onSignIn,
  currentRole,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);

  if (!isOpen) return null;

  const handleConnectWallet = () => {
    setIsWalletConnecting(true);
    setTimeout(() => {
      setIsWalletConnecting(false);
      setWalletConnected(true);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="bg-[#0b132b] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Scale className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white">Sign In to Resolvia</h3>
              <p className="text-xs text-slate-400">Decentralized Dispute Arbitration Platform</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Select an account persona or connect your Web3 wallet to access the arbitration dashboard and smart contract ledger.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Persona Selection */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Demo Persona / Role
            </label>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {ROLES.map((r) => {
                const isSelected = selectedRole === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRole(r.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{r.name}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {r.roleType}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{r.desc}</p>
                    </div>

                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Web3 Wallet Quick Connect */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {walletConnected ? 'MetaMask Connected' : 'MetaMask / Web3 Wallet'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {walletConnected ? '0x742d...f44e (Sepolia)' : 'Simulate or connect on-chain wallet'}
                </p>
              </div>
            </div>

            <button
              onClick={handleConnectWallet}
              disabled={isWalletConnecting || walletConnected}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                walletConnected
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              }`}
            >
              {isWalletConnecting ? 'Connecting...' : walletConnected ? 'Connected ✓' : 'Connect'}
            </button>
          </div>

          {/* Submit Action */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSignIn(selectedRole);
                onClose();
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <span>Enter Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
