'use client';

import React, { useState } from 'react';
import {
  Scale,
  Bell,
  Search,
  Wallet,
  Sparkles,
  ChevronDown,
  User,
  Shield,
  Award,
  Menu,
  X,
  Check,
  LogOut,
} from 'lucide-react';
import { UserRole } from '../types';
import { MainNavTab } from './Sidebar';

interface NavbarProps {
  activeTab: MainNavTab;
  setActiveTab: (tab: MainNavTab) => void;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  onOpenDisputeWizard: () => void;
  rslvBalance: number;
  onFaucetClick?: () => void;
  onLogout?: () => void;
}

const ROLES: { id: UserRole; label: string; name: string; roleType: string }[] = [
  { id: 'CLAIMANT', label: 'Claimant', name: 'Yash (Claimant)', roleType: 'Dispute Party' },
  { id: 'RESPONDENT', label: 'Respondent', name: 'Marcus (Respondent)', roleType: 'Dispute Party' },
  { id: 'JUROR_1', label: 'Juror 1', name: 'Juror Carol', roleType: 'Panelist' },
  { id: 'JUROR_2', label: 'Juror 2', name: 'Juror Dave', roleType: 'Panelist' },
  { id: 'LEGAL_AUDITOR', label: 'BSA Auditor', name: 'Forensic Notary', roleType: 'Legal Examiner' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeRole,
  setActiveRole,
  rslvBalance,
  onFaucetClick,
  onLogout,
}) => {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentRole = ROLES.find((r) => r.id === activeRole) || ROLES[0];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0b132b] text-white border-b border-[#1e293b] shadow-md">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-[64px] flex items-center justify-between gap-4">
        {/* Brand Section */}
        <div className="flex items-center gap-6 shrink-0">
          <div
            className="flex items-center gap-2.5 cursor-pointer group select-none"
            onClick={() => setActiveTab('home')}
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] group-hover:bg-blue-500 transition-colors">
              <Scale className="w-5 h-5 stroke-[2.4]" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white font-sans">
                RESOLVIA
              </span>
            </div>
          </div>

          {/* Nav Quick Links */}
          <nav className="hidden md:flex items-center gap-1 pl-4">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'home'
                  ? 'text-white bg-blue-600/25 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('cases')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'cases'
                  ? 'text-white bg-blue-600/25 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('my-cases')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'my-cases'
                  ? 'text-white bg-blue-600/25 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              My Cases
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'analytics'
                  ? 'text-white bg-blue-600/25 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Case Studies
            </button>
            <button
              onClick={() => setActiveTab('verifier')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'verifier'
                  ? 'text-white bg-blue-600/25 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Proof Verifier
            </button>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Balance Faucet Pill */}
          <button
            onClick={onFaucetClick}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 transition-all cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono font-semibold">{rslvBalance.toLocaleString()} DRA</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold">
              +Faucet
            </span>
          </button>

          {/* Role Persona Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 transition-all cursor-pointer"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="font-semibold text-xs">{currentRole.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0f172a] border border-slate-700 shadow-2xl py-2 z-50">
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-800 mb-1">
                  Switch Persona / Role
                </div>
                {ROLES.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => {
                      setActiveRole(role.id);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                      activeRole === role.id
                        ? 'bg-blue-600/20 text-blue-300 font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{role.name}</div>
                      <div className="text-[10px] text-slate-400">{role.roleType}</div>
                    </div>
                    {activeRole === role.id && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <button
            onClick={() => setActiveTab('notifications')}
            className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
              3
            </span>
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-bold flex items-center justify-center text-xs shadow-sm">
              Y
            </div>
            <span className="text-xs font-semibold text-slate-200 hidden sm:block">
              Yash
            </span>
          </button>

          {/* Explicit Log Out Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Log Out of Resolvia"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 hover:border-rose-500/50 text-rose-300 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 py-3 bg-[#080d1a] border-b border-slate-800 space-y-2">
          <button
            onClick={() => {
              setActiveTab('home');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-white hover:bg-slate-800"
          >
            Home
          </button>
          <button
            onClick={() => {
              setActiveTab('cases');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-white hover:bg-slate-800"
          >
            Dashboard
          </button>
          <button
            onClick={() => {
              setActiveTab('my-cases');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-white hover:bg-slate-800"
          >
            My Cases
          </button>
          <button
            onClick={() => {
              setActiveTab('ai-radar');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-white hover:bg-slate-800"
          >
            AI Advisory
          </button>
          <button
            onClick={() => {
              setActiveTab('verifier');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-white hover:bg-slate-800"
          >
            Proof Verifier
          </button>
          <button
            onClick={() => {
              setActiveTab('profile');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-white hover:bg-slate-800"
          >
            My Profile
          </button>
          {onLogout && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 border-t border-slate-800 pt-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
