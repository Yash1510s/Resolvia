/* Live E2E: full escrow settlement on the redeployed local chain (8545). */
const { ethers } = require("ethers");
const fs = require("fs");

const RPC = "http://127.0.0.1:8545";
const MANIFEST = JSON.parse(fs.readFileSync("/home/user/Resolvia/blockchain/deployments/local.json", "utf8"));

const P = {
  admin:    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  claimant: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  juror1:   "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  juror2:   "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  juror3:   "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
  juror4:   "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
  juror5:   "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
  juror6:   "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e",
};

const TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function transfer(address,uint256) returns (bool)",
];
const HUB_ABI = [
  "function initiateDispute(string,address) returns (uint256)",
  "function counterStake(uint256)",
  "function appointJurorPanel(uint256,address[])",
  "function settleCase(uint256)",
  "function REQUIRED_STAKE() view returns (uint256)",
  "event DisputeInitiated(uint256 indexed caseId,string caseNumber,address indexed claimant,address indexed respondent)",
  "event StakeSettled(uint256 indexed caseId,address winner,uint256 payoutAmount)",
  "event JurorRewarded(uint256 indexed caseId,address indexed juror,uint256 reward)",
];
const VM_ABI = [
  "function commitVote(uint256,bytes32)",
  "function revealVote(uint256,uint8,bytes32)",
  "function getTally(uint256) view returns (uint256,uint256,uint256,uint256)",
];
const CR_ABI = [
  "function cases(uint256) view returns (uint256,string,address,address,uint256,uint8,bytes32,bytes32,uint256,uint256,uint256,uint8)",
];

const provider = new ethers.JsonRpcProvider(RPC);
const wallets = {};
for (const [k, pk] of Object.entries(P)) wallets[k] = new ethers.Wallet(pk, provider);

const _n = {};
function nextNonce(addr) {
  const k = addr.toLowerCase();
  if (_n[k] == null) return provider.getTransactionCount(addr, "pending").then((x) => { _n[k] = x + 1; return x; });
  const x = _n[k]; _n[k] = x + 1; return Promise.resolve(x);
}

function pack(vote, salt, caseId, juror) {
  return ethers.concat([
    ethers.toBeHex(vote, 1),
    salt,
    ethers.toBeHex(BigInt(caseId), 32),
    juror,
  ]);
}
const commitHash = (vote, salt, caseId, juror) => ethers.keccak256(pack(vote, salt, caseId, juror));

const hubIface = new ethers.Interface(HUB_ABI);
const DISPUTE = new ethers.Interface(["event DisputeInitiated(uint256 indexed caseId,string caseNumber,address indexed claimant,address indexed respondent)"]);

const c = {
  token: new ethers.Contract(MANIFEST.contracts.ResolviaToken, TOKEN_ABI, wallets.admin),
  hub: new ethers.Contract(MANIFEST.contracts.ArbitrationHub, HUB_ABI, wallets.admin),
  vm: new ethers.Contract(MANIFEST.contracts.VotingManager, VM_ABI, wallets.admin),
  cr: new ethers.Contract(MANIFEST.contracts.CaseRegistry, CR_ABI, wallets.admin),
};

function short(x) { return typeof x === "string" && x.startsWith("0x") ? x.slice(0, 10) + "…" : x; }
function fmt(v) { return Number(v / 10n ** 18n).toLocaleString(); }

async function run() {
  const { admin, claimant, juror1, juror2, juror3, juror4, juror5, juror6 } = wallets;
  const respondent = juror2; // account #2 is the designated respondent

  console.log("═ LIVE E2E: ESCROW SETTLEMENT ═");
  console.log("hub:", short(MANIFEST.contracts.ArbitrationHub));

  // 0) fund respondent from admin (token owner)
  const rBal0 = await c.token.balanceOf(respondent.address);
  if (rBal0 < 500n * 10n ** 18n) {
    const tx = await c.token.connect(admin).transfer(respondent.address, 1000n * 10n ** 18n, { nonce: await nextNonce(admin.address) });
    await tx.wait();
    console.log("0. funded respondent with 1,000 RSLV");
  }

  // 1) claimant: approve + initiate
  const stake = await c.hub.REQUIRED_STAKE();
  const allow = await c.token.allowance(claimant.address, c.hub.target);
  if (allow < stake) {
    const t = await c.token.connect(claimant).approve(c.hub.target, stake, { nonce: await nextNonce(claimant.address) });
    await t.wait();
  }
  const initTx = await c.hub.connect(claimant).initiateDispute("RSLV-2026-E2E-ESCROW", respondent.address, { nonce: await nextNonce(claimant.address) });
  const initRc = await initTx.wait();
  const caseEv = initRc.logs.map(l => { try { return DISPUTE.parseLog(l); } catch { return null; } }).find(p => p);
  const caseId = caseEv.args.caseId;
  console.log("1. caseId =", caseId, "(claimant staked", fmt(stake), "RSLV)");

  // 2) respondent: approve + counterStake
  const rAllow = await c.token.allowance(respondent.address, c.hub.target);
  if (rAllow < stake) {
    const t = await c.token.connect(respondent).approve(c.hub.target, stake, { nonce: await nextNonce(respondent.address) });
    await t.wait();
  }
  const csTx = await c.hub.connect(respondent).counterStake(caseId, { nonce: await nextNonce(respondent.address) });
  const csRc = await csTx.wait();
  console.log("2. counterStake mined (escrow now 1,000 RSLV)");

  // 3) admin: appoint panel (hub reads the case's voting deadline itself)
  const panel = [juror1, juror3, juror4, juror5, juror6];
  const pTx = await c.hub.appointJurorPanel(caseId, panel.map(j => j.address), { nonce: await nextNonce(admin.address) });
  await pTx.wait();
  const rec = await c.cr.cases(caseId);
  console.log("3. panel appointed; state =", rec[5], "(JURY_COMMIT); votingDeadline =", rec[10]);

  // 4) balances before settlement
  const before = {};
  for (const [k, w] of Object.entries({ claimant, respondent, j1: juror1, j2: juror3, j3: juror4, j4: juror5, j5: juror6 })) {
    before[k] = await c.token.balanceOf(w.address);
  }

  // 5) all 5 jurors commit + reveal: (1,1,1,2,1) → claimant wins 4-1
  const votes = [1, 1, 1, 2, 1];
  for (let i = 0; i < 5; i++) {
    const juror = panel[i];
    const salt = ethers.hexlify(ethers.randomBytes(32));
    const ch = commitHash(votes[i], salt, caseId, juror.address);
    const cTx = await c.vm.connect(juror).commitVote(caseId, ch, { nonce: await nextNonce(juror.address) });
    await cTx.wait();
    const rTx = await c.vm.connect(juror).revealVote(caseId, votes[i], salt, { nonce: await nextNonce(juror.address) });
    await rTx.wait();
  }
  const tally = await c.vm.getTally(caseId);
  console.log("5. votes revealed:", [tally[0], tally[1], tally[2], tally[3]]);

  // 6) admin: settleCase
  const sTx = await c.hub.settleCase(caseId, { nonce: await nextNonce(admin.address) });
  const sRc = await sTx.wait();
  const settled = sRc.logs.map(l => { try { return hubIface.parseLog(l); } catch { return null; } })
    .filter(p => p).find(p => p.name === "StakeSettled");
  const rewards = sRc.logs.map(l => { try { return hubIface.parseLog(l); } catch { return null; } })
    .filter(p => p && p.name === "JurorRewarded");
  console.log("6. StakeSettled: winner =", short(settled.args.winner), "payout =", fmt(settled.args.payoutAmount), "RSLV; juror rewards:", rewards.length);

  // 7) assertions
  const after = {};
  for (const [k, w] of Object.entries({ claimant, respondent, j1: juror1, j2: juror3, j3: juror4, j4: juror5, j5: juror6 })) {
    after[k] = await c.token.balanceOf(w.address);
  }
  const win = 900n * 10n ** 18n, rw = 20n * 10n ** 18n;
  const checks = [
    ["claimant +900", after.claimant - before.claimant, win],
    ["respondent +0", after.respondent - before.respondent, 0n],
    ["j1 +20", after.j1 - before.j1, rw],
    ["j2 +20", after.j2 - before.j2, rw],
    ["j3 +20", after.j3 - before.j3, rw],
    ["j4 +20", after.j4 - before.j4, rw],
    ["j5 +20", after.j5 - before.j5, rw],
  ];
  let ok = true;
  for (const [label, got, want] of checks) {
    const pass = got === want;
    ok = ok && pass;
    console.log(`   ${pass ? "✓" : "✗"} ${label}: ${fmt(got)}`);
  }
  const finalRec = await c.cr.cases(caseId);
  console.log(`   ${finalRec[5] === BigInt(9) ? "✓" : "✗"} state FINALIZED (=${finalRec[5]}); ${finalRec[11] === BigInt(1) ? "✓" : "✗"} winningOutcome=1 (claimant)`);
  console.log(ok && finalRec[5] === BigInt(9) && finalRec[11] === BigInt(1) ? "═══ E2E: ALL CHECKS PASSED ═══" : "═══ E2E: FAILURE ═══");
}

run().catch((e) => { console.error("E2E FAILED:", e.shortMessage || e.message); process.exit(1); });
