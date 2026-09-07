'use client';

import React from 'react';
import {
  Home as HomeIcon,
  LayoutDashboard,
  Scale,
  Plus,
  Cpu,
  CheckCircle,
  Award,
  BarChart3,
  Bell,
  Settings,
  Wallet,
  ChevronRight,
  User,
  Sparkles,
  LogOut,
} from 'lucide-react';

export type MainNavTab =
  | 'home'
  | 'cases'
  | 'my-cases'
  | 'ai-radar'
  | 'verifier'
  | 'legal-export'
  | 'analytics'
  | 'profile'
  | 'notifications';

interface SidebarProps {
  activeTab: MainNavTab;
  setActiveTab: (tab: MainNavTab) => void;
  onOpenDisputeWizard: () => void;
  rslvBalance: number;
  onFaucetClick?: () => void;
  onLogout?: () => void;
}

const NAV_SECTIONS = [
  {
    title: 'Main Navigation',
    items: [
      { id: 'home' as MainNavTab, label: 'Home Page', icon: HomeIcon },
      { id: 'cases' as MainNavTab, label: 'Overview', icon: LayoutDashboard },
      { id: 'my-cases' as MainNavTab, label: 'My Cases', icon: Scale, badge: '4' },
      { id: 'create' as any, label: 'Create Case', icon: Plus, isCta: true },
      { id: 'profile' as MainNavTab, label: 'My Profile', icon: User },
      { id: 'notifications' as MainNavTab, label: 'Notifications', icon: Bell, badge: '3' },
    ],
  },
  {
    title: 'Resolution Tools',
    items: [
      { id: 'ai-radar' as MainNavTab, label: 'AI Advisory', icon: Cpu },
      { id: 'verifier' as MainNavTab, label: 'Proof Verifier', icon: CheckCircle },
      { id: 'legal-export' as MainNavTab, label: 'BSA Dossier', icon: Award },
      { id: 'analytics' as MainNavTab, label: 'Case Studies', icon: BarChart3 },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenDisputeWizard,
  rslvBalance,
  onFaucetClick,
  onLogout,
}) => {
  return (
    <aside className="hidden lg:flex flex-col w-[240px] shrink-0 h-[calc(100vh-64px)] sticky top-[64px] border-r border-slate-200 bg-white select-none z-30 shadow-sm">
      {/* Navigation Items matching Reference Image */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5 scrollbar-none">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-2 px-2.5">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isItemActive = activeTab === item.id;

                if (item.isCta) {
                  return (
                    <button
                      key={item.label}
                      onClick={onOpenDisputeWizard}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50/70 hover:bg-blue-100 border border-blue-200/60 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Plus className="w-4 h-4 text-blue-600 stroke-[2.5]" />
                        <span>Create Case</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      isItemActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isItemActive ? 'text-blue-600' : 'text-slate-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          isItemActive
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* DRA / RSLV Token Card matching Reference Image */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/70 space-y-2">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                DRA Token
              </p>
              <p className="text-xs font-bold text-slate-900 font-mono">
                Balance: {rslvBalance.toLocaleString()} DRA
              </p>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 font-medium">
            Stake, vote, earn reputation
          </p>

          <button
            onClick={onFaucetClick}
            className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Buy / Faucet</span>
          </button>
        </div>

        {/* Sidebar Log Out Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full py-2 px-3 rounded-xl border border-rose-200/80 bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-500" />
            <span>Log Out of Session</span>
          </button>
        )}
      </div>
    </aside>
  );
};
