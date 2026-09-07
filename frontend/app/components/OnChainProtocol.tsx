'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Interface } from 'ethers';
import {
  Rocket,
  Lock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Gavel,
  Activity,
  User,
  Users,
  Landmark,
} from 'lucide-react';
import {
  DEMO_ACCOUNTS,
  Deployment,
  getContracts,
  getManagedNonce,
  getProvider,
  getWallet,
  fetchDeployment,
  shortAddr,
  shortHash,
  VOTING_ABI,
  HUB_ABI,
} from '../lib/chain';
import {
  computeCommitment,
  generateSalt32,
  OnChainVoteChoice,
  VOTE_CHOICE_LABELS,
} from '../lib/commitment';
import { useAuth } from '../lib/auth-context';
import { DisputeCase } from '../types';

interface OnChainProtocolProps {
  dispute: DisputeCase;
}

type Phase = 'idle' | 'launching' | 'voting' | 'settled';

interface PanelJuror {
  label: string;
  address: string;
  isYou: boolean;
  committed: boolean;
  revealed: boolean;
  commitmentHash: string;
  revealedChoice: number;
}

interface TxLogEntry {
  action: string;
  hash: string;
  block: number;
}

const LAUNCH_STEPS = [
  'Connect to local chain + load deployment manifest',
  'Claimant approves + locks 500 RSLV anti-spam stake → initiateDispute()',
  'Respondent counter-stakes 500 RSLV → counterStake() (escrow = 1,000 RSLV)',
  'Admin appoints 5-juror panel → appointJurorPanel()',
  'Jury commits blind hashes → reveals → settleCase() moves the escrow',
];

export function OnChainProtocol({ dispute }: OnChainProtocolProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [launchStep, setLaunchStep] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [chainId, setChainId] = useState<string>('');
  const [caseId, setCaseId] = useState<bigint | null>(null);
  const [panel, setPanel] = useState<PanelJuror[]>([]);
  const [panelAddrs, setPanelAddrs] = useState<string[]>([]);
  const [txLog, setTxLog] = useState<TxLogEntry[]>([]);
  const [tally, setTally] = useState({ claimant: 0, respondent: 0, split: 0, total: 0 });

  const { user: authUser } = useAuth();

  // My console
  const [myVote, setMyVote] = useState<OnChainVoteChoice>(1);
  const [mySalt, setMySalt] = useState<string>('');
  const [myCommitted, setMyCommitted] = useState(false);
  const [myRevealed, setMyRevealed] = useState(false);
  const [storedCommitment, setStoredCommitment] = useState<string>('');

  // Verdict + escrow settlement
  const [verdict, setVerdict] = useState<{
    outcome: number;
    state: number;
    hash: string;
    settlement: {
      winner: string | null;
      payout: bigint;
      rewards: { juror: string; reward: bigint }[];
    };
  } | null>(null);

  const me = DEMO_ACCOUNTS.juror1;
  // Logged-in users vote with their platform-assigned wallet (backend-signed);
  // anonymous visitors use the demo "Juror A" account.
  const votingAddr = authUser ? authUser.wallet : me.address;
  const hubIface = new Interface(HUB_ABI);
  const votingIface = new Interface(VOTING_ABI);

  const logTx = useCallback((action: string, receipt: { hash: string; blockNumber: bigint }) => {
    setTxLog((prev) => [{ action, hash: receipt.hash, block: Number(receipt.blockNumber) }, ...prev].slice(0, 8));
  }, []);

  const refreshPanel = useCallback(async (dep: Deployment) => {
    if (caseId === null) return;
    const { votingManager } = getContracts(dep);
    const jurors = panelAddrs.length > 0 ? panelAddrs : dep.demoAccounts.jurors;
    const rows: PanelJuror[] = [];
    for (let i = 0; i < jurors.length; i++) {
      const addr = jurors[i];
      const v: any = await votingManager.jurorVotes(caseId, addr);
      rows.push({
        label: i === 0 ? (authUser ? 'Juror A — You (your wallet)' : 'Juror A — You') : `Juror ${String.fromCharCode(65 + i)}`,
        address: addr,
        isYou: addr.toLowerCase() === votingAddr.toLowerCase(),
        committed: v.committed,
        revealed: v.revealed,
        commitmentHash: v.commitmentHash,
        revealedChoice: Number(v.revealedChoice),
      });
    }
    setPanel(rows);
    const t: any = await votingManager.getTally(caseId);
    setTally({ claimant: Number(t.claimant), respondent: Number(t.respondent), split: Number(t.split), total: Number(t.total) });

    const mine = rows.find((r) => r.isYou);
    if (mine) {
      setMyCommitted(mine.committed);
      setMyRevealed(mine.revealed);
      setStoredCommitment(mine.commitmentHash);
    }
  }, [caseId, votingAddr, panelAddrs, authUser]);

  const handleLaunch = async () => {
    setError(null);
    setPhase('launching');
    try {
      // Step 1: deployment manifest
      setLaunchStep(0);
      const dep = await fetchDeployment();
      if (!dep) throw new Error('No deployment found. Run: cd blockchain && npm run node && npm run deploy:local');
      const net = await getProvider().getNetwork();
      setChainId(net.chainId.toString());

      const { token, hub } = getContracts(dep);
      const claimant = getWallet(DEMO_ACCOUNTS.claimant);
      const admin = getWallet(DEMO_ACCOUNTS.admin);
      const respondent = getWallet(DEMO_ACCOUNTS.respondent);

      // Step 2: stake + initiate
      setLaunchStep(1);
      const stake = BigInt(await hub.REQUIRED_STAKE());
      const allowance = await token.allowance(claimant.address, hub.target);
      if (BigInt(allowance as bigint) < stake) {
        const apNonce = await getManagedNonce(claimant.address);
        const apTx = await token.connect(claimant).approve(hub.target, stake, { nonce: apNonce });
        const apReceipt = await apTx.wait();
        logTx('Token approve (500 RSLV)', apReceipt);
      }
      const initNonce = await getManagedNonce(claimant.address);
      const initTx = await hub.connect(claimant).initiateDispute(dispute.caseNumber, DEMO_ACCOUNTS.respondent.address, { nonce: initNonce });
      const initReceipt = await initTx.wait();
      logTx('initiateDispute (500 RSLV escrowed)', initReceipt);

      const parsed = initReceipt.logs
        .map((l: any) => {
          try {
            return hubIface.parseLog(l);
          } catch {
            return null;
          }
        })
        .find((p: any) => p?.name === 'DisputeInitiated');
      if (!parsed) throw new Error('DisputeInitiated event not found in receipt');
      const cid = parsed.args.caseId as bigint;
      setCaseId(cid);

      // Step 3: respondent counter-stake (escrow complete → EVIDENCE_LOCKED)
      setLaunchStep(2);
      // Demo chain: token mints to the deployer, so fund the respondent account if needed
      const rBal = await token.balanceOf(respondent.address);
      if (BigInt(rBal as bigint) < stake) {
        const fundNonce = await getManagedNonce(admin.address);
        const fundTx = await token.connect(admin).transfer(respondent.address, BigInt(1000) * BigInt(10) ** BigInt(18), { nonce: fundNonce });
        const fundReceipt = await fundTx.wait();
        logTx('Fund respondent demo account (1,000 RSLV)', fundReceipt);
      }
      const rAllowance = await token.allowance(respondent.address, hub.target);
      if (BigInt(rAllowance as bigint) < stake) {
        const raNonce = await getManagedNonce(respondent.address);
        const raTx = await token.connect(respondent).approve(hub.target, stake, { nonce: raNonce });
        const raReceipt = await raTx.wait();
        logTx('Respondent approve (500 RSLV)', raReceipt);
      }
      const csNonce = await getManagedNonce(respondent.address);
      const csTx = await hub.connect(respondent).counterStake(cid, { nonce: csNonce });
      const csReceipt = await csTx.wait();
      logTx('counterStake (escrow now 1,000 RSLV)', csReceipt);

      // Step 4: appoint panel — hub reads the case's voting deadline on-chain.
      // A signed-in user's assigned wallet joins as Juror A.
      setLaunchStep(3);
      const launchPanel = authUser ? [authUser.wallet, ...dep.demoAccounts.jurors.slice(1)] : dep.demoAccounts.jurors;
      setPanelAddrs(launchPanel);
      const panelNonce = await getManagedNonce(admin.address);
      const panelTx = await hub.connect(admin).appointJurorPanel(cid, launchPanel, { nonce: panelNonce });
      const panelReceipt = await panelTx.wait();
      logTx('appointJurorPanel (5 jurors)', panelReceipt);

      // Step 5: ready
      setLaunchStep(4);
      setMySalt(generateSalt32());
      setPhase('voting');
      await refreshPanel(dep);
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || String(e));
      setPhase('idle');
    }
  };

  // Backend-signed vote (assigned-wallet users): the backend decrypts the
  // user's key, signs, and submits to the local chain.
  const backendVote = async (action: 'commit' | 'reveal', payload: Record<string, unknown>) => {
    const token = localStorage.getItem('resolvia_token');
    const res = await fetch(`/api/backend/wallet/vote/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.detail || `vote ${action} failed (${res.status})`);
    return { hash: data.txHash as string, blockNumber: BigInt(data.blockNumber ?? 0) };
  };

  const handleMyCommit = async () => {
    if (caseId === null) return;
    setBusy('commit');
    setError(null);
    try {
      const dep = await fetchDeployment();
      if (!dep) throw new Error('Deployment manifest missing');
      const { votingManager } = getContracts(dep);
      const commitment = computeCommitment(myVote, mySalt, caseId, votingAddr);
      if (authUser) {
        const r = await backendVote('commit', { caseId: Number(caseId), commitment });
        logTx('commitVote (your wallet · backend-signed)', r);
      } else {
        const wallet = getWallet(me);
        const nonce = await getManagedNonce(wallet.address);
        const tx = await votingManager.connect(wallet).commitVote(caseId, commitment, { nonce });
        const receipt = await tx.wait();
        logTx('commitVote (you)', receipt);
      }
      await refreshPanel(dep);
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || String(e));
    } finally {
      setBusy(null);
    }
  };

  const handleMyReveal = async () => {
    if (caseId === null) return;
    setBusy('reveal');
    setError(null);
    try {
      const dep = await fetchDeployment();
      if (!dep) throw new Error('Deployment manifest missing');
      const { votingManager } = getContracts(dep);
      if (authUser) {
        const r = await backendVote('reveal', { caseId: Number(caseId), vote: myVote, salt: mySalt });
        logTx('revealVote (your wallet · salt verified on-chain)', r);
      } else {
        const wallet = getWallet(me);
        const nonce = await getManagedNonce(wallet.address);
        const tx = await votingManager.connect(wallet).revealVote(caseId, myVote, mySalt, { nonce });
        const receipt = await tx.wait();
        logTx('revealVote (you) — salt verified on-chain', receipt);
      }
      await refreshPanel(dep);
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || String(e));
    } finally {
      setBusy(null);
    }
  };

  const handleSimulateOthers = async () => {
    setBusy('simulate');
    setError(null);
    try {
      const dep = await fetchDeployment();
      if (!dep || caseId === null) throw new Error('Not launched yet');
      const { votingManager } = getContracts(dep);
      // Deterministic demo votes: B, C, D → claimant; E → respondent.
      const othersVotes: OnChainVoteChoice[] = [1, 1, 1, 2];
      for (let i = 1; i < dep.demoAccounts.jurors.length; i++) {
        const acc = [DEMO_ACCOUNTS.juror2, DEMO_ACCOUNTS.juror3, DEMO_ACCOUNTS.juror4, DEMO_ACCOUNTS.juror5][i - 1];
        const salt = generateSalt32();
        const vote = othersVotes[i - 1];
        const commitment = computeCommitment(vote, salt, caseId, acc.address);
        const wallet = getWallet(acc);
        const cNonce = await getManagedNonce(wallet.address);
        const cTx = await votingManager.connect(wallet).commitVote(caseId, commitment, { nonce: cNonce });
        await cTx.wait();
        const rNonce = await getManagedNonce(wallet.address);
        const rTx = await votingManager.connect(wallet).revealVote(caseId, vote, salt, { nonce: rNonce });
        const rReceipt = await rTx.wait();
        logTx(`commit+reveal (${acc.label})`, rReceipt);
      }
      await refreshPanel(dep);
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || String(e));
    } finally {
      setBusy(null);
    }
  };

  const handleSettle = async () => {
    setBusy('settle');
    setError(null);
    try {
      const dep = await fetchDeployment();
      if (!dep || caseId === null) throw new Error('Not launched yet');
      const { hub, caseRegistry } = getContracts(dep);
      const admin = getWallet(DEMO_ACCOUNTS.admin);
      const nonce = await getManagedNonce(admin.address);
      const tx = await hub.connect(admin).settleCase(caseId, { nonce });
      const receipt = await tx.wait();
      logTx('settleCase → finalizeVerdict', receipt);

      const rec: any = await caseRegistry.cases(caseId);
      const allParsed = receipt.logs
        .map((l: any) => {
          try {
            return hubIface.parseLog(l);
          } catch {
            return null;
          }
        })
        .filter((p: any) => p);
      const verdictEv = receipt.logs
        .map((l: any) => {
          try {
            return new Interface(['event VerdictFinalized(uint256 indexed caseId, uint8 winningOutcome)']).parseLog(l);
          } catch {
            return null;
          }
        })
        .find((p: any) => p?.name === 'VerdictFinalized');
      const stakeEv = allParsed.find((p: any) => p.name === 'StakeSettled');
      const rewardEvs = allParsed.filter((p: any) => p.name === 'JurorRewarded');
      setVerdict({
        outcome: Number(verdictEv?.args.winningOutcome ?? rec.winningOutcome),
        state: Number(rec.state),
        hash: receipt.transactionHash,
        settlement: {
          winner: stakeEv ? (stakeEv.args.winner as string) : null,
          payout: stakeEv ? (stakeEv.args.payoutAmount as bigint) : BigInt(0),
          rewards: rewardEvs.map((p: any) => ({ juror: p.args.juror as string, reward: p.args.reward as bigint })),
        },
      });
      setPhase('settled');
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || String(e));
    } finally {
      setBusy(null);
    }
  };

  const myCommitment = caseId !== null && mySalt ? computeCommitment(myVote, mySalt, caseId, me.address) : '';
  const commitmentMatches = storedCommitment !== '' && myCommitment !== '' && storedCommitment.toLowerCase() === myCommitment.toLowerCase();
  const quorumMet = tally.total >= 3;

  const outcomeLabel = (o: number) =>
    o === 1 ? 'Claimant Upheld' : o === 2 ? 'Respondent Upheld' : 'Split Settlement';

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-[#0b132b] text-white shadow-md flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black">
              Live On-Chain Protocol <span className="text-blue-400">— Real Transactions</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed max-w-2xl">
              Every commitment, reveal, and settlement below is a{' '}
              <strong className="text-slate-300">real transaction on a local Hardhat chain</strong>. Both parties
              stake 500 RSLV into escrow; the chain verifies{' '}
              <span className="font-mono text-blue-300">keccak256(vote ‖ salt ‖ caseId  juror)</span> — a wrong salt,
              wrong vote, or cross-case replay reverts. On settlement the winner takes the loser's stake (minus 20%
              juror rewards). (Offline mock flow below is separate.)
            </p>
          </div>
        </div>
        {chainId && (
          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-400/20 px-2.5 py-1 rounded-full shrink-0">
            chainId {chainId}
          </span>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-mono break-all">{error}</span>
        </div>
      )}

      {/* ── IDLE: launch card ── */}
      {phase === 'idle' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Launch case <span className="font-mono text-blue-700">{dispute.caseNumber}</span> on-chain</h4>
              <p className="text-xs text-slate-500 mt-1">Claimant: {shortAddr(DEMO_ACCOUNTS.claimant.address)} (Alice) • Respondent: {shortAddr(DEMO_ACCOUNTS.respondent.address)} (DeCrypto)</p>
            </div>
            <button
              onClick={handleLaunch}
              disabled={busy !== null}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              <Rocket className="w-4 h-4" />
              <span>Deploy Case On-Chain</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2">
            {LAUNCH_STEPS.map((s, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-black font-mono text-blue-600">STEP {i + 1}</span>
                <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LAUNCHING ── */}
      {phase === 'launching' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          {LAUNCH_STEPS.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 text-xs font-semibold ${i <= launchStep ? 'text-slate-800' : 'text-slate-300'}`}>
              {i < launchStep ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : i === launchStep ? (
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-slate-200 shrink-0" />
              )}
              <span>{s}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── VOTING / SETTLED: main board ── */}
      {(phase === 'voting' || phase === 'settled') && caseId !== null && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: case info + panel */}
          <div className="lg:col-span-7 space-y-4">
            {/* Case card */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                    on-chain caseId #{caseId.toString()}
                  </span>
                  <span className="font-mono text-[11px] text-slate-600">{dispute.caseNumber}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    1,000 RSLV ESCROWED (500 + 500)
                  </span>
                </div>
                {phase === 'voting' && quorumMet && (
                  <button
                    onClick={handleSettle}
                    disabled={busy !== null}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black transition-all cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Gavel className="w-3.5 h-3.5" />
                    <span>{busy === 'settle' ? 'Settling…' : 'Settle Case (Admin)'}</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <p className="text-[9px] font-bold uppercase text-slate-400">Claimant</p>
                  <p className="font-mono font-bold text-slate-800 mt-0.5">{shortAddr(DEMO_ACCOUNTS.claimant.address)}</p>
                  <p className="text-[10px] text-slate-500">Alice Vance</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <p className="text-[9px] font-bold uppercase text-slate-400">Respondent</p>
                  <p className="font-mono font-bold text-slate-800 mt-0.5">{shortAddr(DEMO_ACCOUNTS.respondent.address)}</p>
                  <p className="text-[10px] text-slate-500">DeCrypto Labs</p>
                </div>
              </div>
            </div>

            {/* Panel grid */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Jury Panel (on-chain state)
                </h4>
                <button
                  onClick={handleSimulateOthers}
                  disabled={busy !== null || phase === 'settled'}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Activity className="w-3 h-3" />
                  <span>{busy === 'simulate' ? 'Simulating…' : 'Simulate other 4 jurors'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {panel.map((j) => (
                  <div
                    key={j.address}
                    className={`p-3.5 rounded-xl border ${
                      j.isYou ? 'border-blue-300 bg-blue-50/40' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-900">{j.label}</p>
                          <p className="text-[9px] font-mono text-slate-400">{shortAddr(j.address)}</p>
                        </div>
                      </div>
                      <span
                        className={`text-[8px] font-black px-2 py-0.5 rounded-full ${
                          j.revealed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : j.committed
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {j.revealed ? `VOTED ${j.revealedChoice}` : j.committed ? 'COMMITTED' : 'PENDING'}
                      </span>
                    </div>
                    {j.committed && (
                      <p className="text-[9px] font-mono text-slate-500 mt-2 truncate" title={j.commitmentHash}>
                        {shortHash(j.commitmentHash, 8)}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Tally */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center gap-4 text-[11px] font-bold">
                  <span className="text-slate-500 uppercase text-[9px] tracking-wider">Live tally</span>
                  <span className="text-emerald-600 font-mono">{tally.claimant} Claimant</span>
                  <span className="text-rose-600 font-mono">{tally.respondent} Respondent</span>
                  <span className="text-amber-600 font-mono">{tally.split} Split</span>
                  <span className="text-slate-400 font-mono ml-auto">{tally.total}/5 revealed</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-2 flex">
                  <div className="h-full bg-emerald-500" style={{ width: `${(tally.claimant / 5) * 100}%` }}></div>
                  <div className="h-full bg-rose-500" style={{ width: `${(tally.respondent / 5) * 100}%` }}></div>
                  <div className="h-full bg-amber-400" style={{ width: `${(tally.split / 5) * 100}%` }}></div>
                </div>
              </div>
            </div>

            {/* Tx log */}
            {txLog.length > 0 && (
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Confirmed Transactions</h4>
                <div className="space-y-1.5">
                  {txLog.map((t, i) => (
                    <div key={i} className="flex items-center gap-3 text-[10px] font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-slate-700 font-semibold shrink-0">{t.action}</span>
                      <span className="text-blue-600 truncate">{shortHash(t.hash, 8)}</span>
                      <span className="text-slate-400 ml-auto shrink-0">block {t.block.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: my console / verdict */}
          <div className="lg:col-span-5">
            {phase === 'settled' && verdict ? (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-4 shadow-sm sticky top-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center">
                  <Gavel className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
                    Finalized On-Chain
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-3">{outcomeLabel(verdict.outcome)}</h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    CaseRegistry state: {verdict.state === 9 ? 'FINALIZED' : `state ${verdict.state}`} • tally {tally.claimant}-{tally.respondent}-{tally.split}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left text-[10px] font-mono">
                  <p className="text-slate-400">verdict tx</p>
                  <p className="text-blue-600 font-bold">{shortHash(verdict.hash, 14)}</p>
                </div>
                {verdict.settlement.winner ? (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-left">
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700 mb-2">
                      Escrow settled — real fund movement
                    </p>
                    <div className="font-mono text-[10px] space-y-1 text-emerald-900">
                      <p className="flex justify-between gap-2">
                        <span className="text-emerald-700">winner</span>
                        <span className="font-bold">{shortAddr(verdict.settlement.winner)}</span>
                      </p>
                      <p className="flex justify-between gap-2">
                        <span className="text-emerald-700">payout</span>
                        <span className="font-bold">{(Number(verdict.settlement.payout) / 1e18).toLocaleString()} RSLV</span>
                      </p>
                      {verdict.settlement.rewards.map((r, i) => (
                        <p key={i} className="flex justify-between gap-2 text-emerald-700">
                          <span>{shortAddr(r.juror)} (juror)</span>
                          <span>+{(Number(r.reward) / 1e18).toLocaleString()} RSLV</span>
                        </p>
                      ))}
                      <p className="pt-1.5 mt-1 border-t border-emerald-200 text-emerald-600">
                        <code className="font-mono">StakeSettled</code> + {verdict.settlement.rewards.length}×{' '}
                        <code className="font-mono">JurorRewarded</code> emitted
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-left">
                    <p className="text-[10px] text-amber-800 leading-relaxed">
                      <strong>Split settlement:</strong> both parties recovered their 500 RSLV stakes; no juror
                      rewards. <code className="font-mono">StakeSettled</code> emitted with zero payout.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 sticky top-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Your Voting Console</h4>
                  <span
                    className={`text-[9px] font-black px-2 py-1 rounded-full ${
                      !myCommitted ? 'bg-blue-50 text-blue-700' : !myRevealed ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {!myCommitted ? 'PHASE 1: COMMIT' : !myRevealed ? 'PHASE 2: REVEAL' : 'COMPLETED'}
                  </span>
                </div>

                <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5 flex-wrap">
                  <User className="w-3 h-3" />
                  signing as: <span className="text-slate-700 font-bold">{shortAddr(votingAddr)}</span>
                  {authUser ? (
                    <span className="text-emerald-600 font-bold">· your assigned wallet (backend-signed, no MetaMask)</span>
                  ) : (
                    <span className="text-slate-400">· demo account (sign in to use your own wallet)</span>
                  )}
                </div>

                {/* Vote choice */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Your verdict</label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {([1, 2, 3] as OnChainVoteChoice[]).map((v) => (
                      <button
                        key={v}
                        onClick={() => !myCommitted && setMyVote(v)}
                        disabled={myCommitted}
                        className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer text-left text-[11px] font-black disabled:cursor-not-allowed ${
                          myVote === v
                            ? v === 1
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                              : v === 2
                              ? 'border-rose-500 bg-rose-50 text-rose-900'
                              : 'border-amber-500 bg-amber-50 text-amber-900'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {v}. {VOTE_CHOICE_LABELS[v]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Salt + commitment */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Secret salt (32 bytes)</label>
                    {!myCommitted && (
                      <button
                        onClick={() => setMySalt(generateSalt32())}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" /> regenerate
                      </button>
                    )}
                  </div>
                  <p className="text-[9px] font-mono text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 break-all leading-relaxed">
                    {mySalt}
                  </p>

                  <div className="p-3 rounded-xl bg-slate-900 text-slate-100">
                    <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                      Commitment = keccak256(vote ‖ salt ‖ caseId ‖ juror)
                    </p>
                    <p className="text-[10px] font-mono break-all leading-relaxed text-blue-300">
                      {myCommitment || '…'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {!myCommitted ? (
                  <button
                    onClick={handleMyCommit}
                    disabled={busy !== null}
                    className="w-full p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {busy === 'commit' ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Broadcasting commitVote…</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Commit Vote On-Chain</span>
                      </>
                    )}
                  </button>
                ) : !myRevealed ? (
                  <div className="space-y-3">
                    <div
                      className={`p-3 rounded-xl border text-[10px] leading-relaxed ${
                        commitmentMatches
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      {commitmentMatches ? (
                        <span className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>
                            Local re-computation matches the <strong>stored on-chain commitment</strong> — your salt
                            will verify.
                          </span>
                        </span>
                      ) : (
                        <span>Waiting for stored commitment…</span>
                      )}
                    </div>
                    <button
                      onClick={handleMyReveal}
                      disabled={busy !== null}
                      className="w-full p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {busy === 'reveal' ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Broadcasting revealVote…</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          <span>Reveal Vote (submit salt)</span>
                        </>
                      )}
                    </button>
                    <p className="text-[9px] text-slate-400 text-center">
                      The chain re-computes keccak256 and reverts on any mismatch — try a wrong salt in a private
                      tab to see it fail.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                    <p className="text-xs font-black text-emerald-800">Vote verified on-chain</p>
                    <p className="text-[10px] text-emerald-700">
                      Salt accepted, {VOTE_CHOICE_LABELS[myVote]} counted. Quorum at 3/5 revealed.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
