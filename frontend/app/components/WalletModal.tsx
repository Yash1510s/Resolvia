'use client';

import React, { useState } from 'react';
import {
  X,
  Wallet,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Unlink,
  Sparkles,
  RefreshCw,
  Coins,
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { useApp } from '../lib/app-context';

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
}

export function WalletModal({ open, onClose }: WalletModalProps) {
  const { user, linkWallet, unlinkWallet } = useAuth();
  const { rslvBalance, claimFaucet } = useApp();
  const [copied, setCopied] = useState(false);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!open) return null;

  const isMetaMaskLinked = Boolean(user?.metamaskAddress);
  const activeAddress = user?.metamaskAddress || user?.wallet || '0x...';

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && activeAddress) {
      navigator.clipboard.writeText(activeAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnectMetaMask = async () => {
    setLinking(true);
    setError(null);
    setSuccess(null);
    try {
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        setError('MetaMask or Web3 wallet extension not detected in this browser.');
        setLinking(false);
        return;
      }
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || !accounts[0]) {
        setError('No accounts returned from MetaMask.');
        setLinking(false);
        return;
      }
      const chosenAddr = accounts[0];
      const res = await linkWallet(chosenAddr);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(`Successfully linked wallet ${chosenAddr.slice(0, 6)}...${chosenAddr.slice(-4)} to your account!`);
      }
    } catch (err: any) {
      if (err.code === 4001 || err.message?.includes('User rejected')) {
        setError('Connection request was rejected in MetaMask.');
      } else {
        setError(err.message || 'Failed to connect MetaMask.');
      }
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async () => {
    if (!window.confirm('Are you sure you want to unlink your personal MetaMask wallet? Your account will revert to the platform custodial key.')) {
      return;
    }
    setError(null);
    setSuccess(null);
    const res = await unlinkWallet();
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess('Personal Web3 wallet unlinked. Reverted to custodial key.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-violet-500/10 via-indigo-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                On-Chain Wallet Identity
              </h2>
              <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                Manage your connected Web3 address and on-chain voting keys
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-[12px] text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2.5 text-[12px] text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Active Wallet Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {isMetaMaskLinked ? 'Linked Personal MetaMask' : 'Platform Custodial Key'}
                </span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                Active on Chain
              </span>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Public Address (EVM / Ethereum)</p>
              <div className="flex items-center justify-between gap-2 mt-1 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="font-mono text-[12.5px] font-bold text-slate-800 dark:text-slate-200 truncate">
                  {activeAddress}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy address"
                  className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-[11px] text-emerald-600 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Token Balances */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">RSLV Token Balance</p>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[14px] font-black text-violet-600 dark:text-violet-400">{rslvBalance} RSLV</span>
                  <button
                    onClick={claimFaucet}
                    title="Claim 50 free RSLV testnet tokens"
                    className="text-[10px] font-bold text-violet-700 dark:text-violet-300 hover:underline cursor-pointer"
                  >
                    +50 Faucet
                  </button>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Testnet Gas (ETH)</p>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[14px] font-black text-slate-800 dark:text-slate-200">0.50 ETH</span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Gas Seeded</span>
                </div>
              </div>
            </div>
          </div>

          {/* Link Web3 Wallet Box */}
          {!isMetaMaskLinked ? (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-[13px] font-black text-slate-900 dark:text-white">
                    Link Your Personal MetaMask Wallet
                  </h4>
                  <p className="text-[11.5px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Logged in via Google or Email? You can link your actual Web3 wallet (MetaMask) so your personal address is recognized across all dispute filings and jury verdicts.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConnectMetaMask}
                disabled={linking}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {linking ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting to MetaMask…</span>
                  </>
                ) : (
                  <>
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Connect &amp; Link MetaMask</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                  Personal Web3 wallet is actively linked to this account.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleConnectMetaMask}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                >
                  Switch
                </button>
                <button
                  type="button"
                  onClick={handleUnlink}
                  className="px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-bold text-rose-600 dark:text-rose-400 cursor-pointer transition-colors flex items-center gap-1"
                >
                  <Unlink className="w-3 h-3" /> Unlink
                </button>
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
            <span>
              Network: <strong>Local Hardhat Testnet (Chain ID 31337)</strong>. Sensitive commit-reveal votes and evidence anchors are verified against smart contracts automatically.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
