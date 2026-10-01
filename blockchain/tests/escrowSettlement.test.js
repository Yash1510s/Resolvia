const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const STAKE = 500n * 10n ** 18n;

// Same commitment encoding as VotingManager / frontend lib/commitment.ts
function packCommitment(vote, salt, caseId, juror) {
  return ethers.concat([
    ethers.toBeHex(vote, 1),
    salt,
    ethers.toBeHex(BigInt(caseId), 32),
    juror,
  ]);
}
const commit = (vote, salt, caseId, juror) => ethers.keccak256(packCommitment(vote, salt, caseId, juror));

const DISPUTE_IFACE = new ethers.Interface([
  "event DisputeInitiated(uint256 indexed caseId, string caseNumber, address indexed claimant, address indexed respondent)",
]);

function caseIdFrom(rcpt) {
  const ev = rcpt.logs
    .map((l) => {
      try {
        return DISPUTE_IFACE.parseLog(l);
      } catch {
        return null;
      }
    })
    .find((p) => p);
  return ev.args.caseId;
}

describe("ArbitrationHub — escrow settlement (Phase A)", function () {
  async function deployFull() {
    // Same account mapping as scripts/deploy.js + frontend chain.ts
    const [deployer, j1, respondent, j2, j3, j4, j5] = await ethers.getSigners();
    const token = await (await ethers.getContractFactory("ResolviaToken")).deploy();
    const evidence = await (await ethers.getContractFactory("EvidenceRegistry")).deploy();
    const caseRegistry = await (await ethers.getContractFactory("CaseRegistry")).deploy();
    const votingManager = await (await ethers.getContractFactory("VotingManager")).deploy();
    const hub = await (await ethers.getContractFactory("ArbitrationHub")).deploy(
      await token.getAddress(),
      await caseRegistry.getAddress(),
      await votingManager.getAddress(),
      await evidence.getAddress()
    );
    await caseRegistry.setArbitrationHub(await hub.getAddress());
    await votingManager.setArbitrationHub(await hub.getAddress());
    await evidence.setCaseRegistry(await caseRegistry.getAddress());
    await evidence.setArbitrationHub(await hub.getAddress());
    // Fund the respondent so it can counter-stake (deployer is token owner)
    await (await token.mint(respondent.address, 1000n * 10n ** 18n)).wait();
    const panel = [j1, j2, j3, j4, j5];
    return { deployer, j1, respondent, panel, token, evidence, caseRegistry, votingManager, hub };
  }

  /** Initiate + counter-stake + appoint panel. Returns caseId. */
  async function openCase(fx, caseNumber = "TEST-CASE") {
    await fx.token.connect(fx.deployer).approve(fx.hub.target, 1000n * 10n ** 18n);
    const tx = await fx.hub.connect(fx.deployer).initiateDispute(caseNumber, fx.respondent.address);
    const rcpt = await tx.wait();
    const caseId = caseIdFrom(rcpt);

    // Respondent must approve the hub before counter-staking (ERC20 allowance)
    await (await fx.token.connect(fx.respondent).approve(fx.hub.target, 1000n * 10n ** 18n)).wait();
    await (await fx.hub.connect(fx.respondent).counterStake(caseId)).wait();
    await (await fx.hub.appointJurorPanel(caseId, fx.panel.map((j) => j.address))).wait();
    return caseId;
  }

  async function voteAll(fx, caseId, votes) {
    const salts = [];
    for (let i = 0; i < votes.length; i++) {
      const juror = fx.panel[i];
      const salt = ethers.hexlify(ethers.randomBytes(32));
      salts.push(salt);
      await (await fx.votingManager.connect(juror).commitVote(caseId, commit(votes[i], salt, caseId, juror.address))).wait();
    }
    const rec = await fx.caseRegistry.cases(caseId);
    await time.increaseTo(rec.votingDeadline + 1n);
    for (let i = 0; i < votes.length; i++) {
      const juror = fx.panel[i];
      await (await fx.votingManager.connect(juror).revealVote(caseId, votes[i], salts[i])).wait();
    }
  }

  it("claimant win: winner gets 900, loser 0, each juror +20, event emitted", async () => {
    const fx = await deployFull();
    const caseId = await openCase(fx);

    const cBal = await fx.token.balanceOf(fx.deployer.address);
    const rBal = await fx.token.balanceOf(fx.respondent.address);
    const jBals = await Promise.all(fx.panel.map((j) => fx.token.balanceOf(j.address)));

    await voteAll(fx, caseId, [1, 1, 1, 2, 1]);
    const settleTx = await fx.hub.settleCase(caseId);
    const rcpt = await settleTx.wait();

    expect(await fx.token.balanceOf(fx.deployer.address)).to.equal(cBal + 900n * 10n ** 18n);
    expect(await fx.token.balanceOf(fx.respondent.address)).to.equal(rBal);
    for (let i = 0; i < 5; i++) {
      expect(await fx.token.balanceOf(fx.panel[i].address)).to.equal(jBals[i] + 20n * 10n ** 18n);
    }

    const rec = await fx.caseRegistry.cases(caseId);
    expect(rec.state).to.equal(9n); // FINALIZED
    expect(rec.winningOutcome).to.equal(1n);
    expect(await fx.hub.isSettled(caseId)).to.equal(true);

    // StakeSettled emitted with winner + payout
    const evs = rcpt.logs
      .map((l) => {
        try {
          return fx.hub.interface.parseLog(l);
        } catch {
          return null;
        }
      })
      .filter((p) => p);
    const settled = evs.find((p) => p.name === "StakeSettled");
    expect(settled, "StakeSettled must be emitted").to.not.be.undefined;
    expect(settled.args.winner).to.equal(fx.deployer.address);
    expect(settled.args.payoutAmount).to.equal(900n * 10n ** 18n);
    const rewards = evs.filter((p) => p.name === "JurorRewarded");
    expect(rewards.length).to.equal(5);
  });

  it("respondent win: symmetric payout", async () => {
    const fx = await deployFull();
    const caseId = await openCase(fx);
    const rBal = await fx.token.balanceOf(fx.respondent.address);
    const cBal = await fx.token.balanceOf(fx.deployer.address);

    await voteAll(fx, caseId, [2, 2, 2, 1, 1]);
    await (await fx.hub.settleCase(caseId)).wait();

    expect(await fx.token.balanceOf(fx.respondent.address)).to.equal(rBal + 900n * 10n ** 18n);
    expect(await fx.token.balanceOf(fx.deployer.address)).to.equal(cBal);

    const rec = await fx.caseRegistry.cases(caseId);
    expect(rec.winningOutcome).to.equal(2n);
  });

  it("split verdict: both stakes refunded, no juror rewards", async () => {
    const fx = await deployFull();
    const caseId = await openCase(fx);
    const cBal = await fx.token.balanceOf(fx.deployer.address);
    const rBal = await fx.token.balanceOf(fx.respondent.address);

    await voteAll(fx, caseId, [1, 2, 3, 3, 1]); // cl=2, re=1, sp=2 → split
    const settleTx = await fx.hub.settleCase(caseId);
    const rcpt = await settleTx.wait();

    expect(await fx.token.balanceOf(fx.deployer.address)).to.equal(cBal + STAKE);
    expect(await fx.token.balanceOf(fx.respondent.address)).to.equal(rBal + STAKE);
    for (const j of fx.panel) {
      expect(await fx.token.balanceOf(j.address)).to.equal(0n);
    }
    const evs = rcpt.logs
      .map((l) => {
        try {
          return fx.hub.interface.parseLog(l);
        } catch {
          return null;
        }
      })
      .filter((p) => p);
    expect(evs.find((p) => p.name === "JurorRewarded"), "no rewards on split").to.be.undefined;
    expect(await fx.caseRegistry.cases(caseId).then((c) => c.winningOutcome)).to.equal(3n);
  });

  it("rejects settle before reveal window closes when fewer than 5 have revealed", async () => {
    const fx = await deployFull();
    const caseId = await openCase(fx);
    // 3 jurors commit and reveal
    await voteAll(fx, caseId, [1, 1, 1]);
    // Reveal window is still open (time is at votingDeadline + 1s, reveal grace is 1 day)
    await expect(fx.hub.settleCase(caseId)).to.be.revertedWith(
      "Premature settlement: reveal window still active"
    );
  });

  it("unrevealed jurors do not receive reward; revealed jurors share pool with rounding dust", async () => {
    const fx = await deployFull();
    const caseId = await openCase(fx);

    const cBalBefore = await fx.token.balanceOf(fx.deployer.address);
    const jBalsBefore = await Promise.all(fx.panel.map((j) => fx.token.balanceOf(j.address)));

    // Jurors 0, 1, 2 commit and reveal; Jurors 3, 4 commit but DO NOT reveal
    const salts = [];
    for (let i = 0; i < 5; i++) {
      const salt = ethers.hexlify(ethers.randomBytes(32));
      salts.push(salt);
      await (await fx.votingManager.connect(fx.panel[i]).commitVote(caseId, commit(1, salt, caseId, fx.panel[i].address))).wait();
    }
    const rec = await fx.caseRegistry.cases(caseId);
    await time.increaseTo(rec.votingDeadline + 1n);

    // Only 3 jurors reveal
    for (let i = 0; i < 3; i++) {
      await (await fx.votingManager.connect(fx.panel[i]).revealVote(caseId, 1, salts[i])).wait();
    }

    // Advance time past the reveal window so settlement is allowed
    await time.increase(24 * 3600 + 60);

    const settleTx = await fx.hub.settleCase(caseId);
    const rcpt = await settleTx.wait();

    // Reward pool = 20% of 500 = 100 RSLV = 100 * 10^18.
    // Divided across 3 revealed jurors = 33.333... * 10^18.
    // Dust = 100 * 10^18 % 3 = 1 wei.
    const rewardPool = 100n * 10n ** 18n;
    const perJuror = rewardPool / 3n;
    const dust = rewardPool % 3n;

    // Revealed jurors get perJuror
    for (let i = 0; i < 3; i++) {
      expect(await fx.token.balanceOf(fx.panel[i].address)).to.equal(jBalsBefore[i] + perJuror);
    }
    // Unrevealed jurors (indices 3 and 4) get ZERO
    expect(await fx.token.balanceOf(fx.panel[3].address)).to.equal(jBalsBefore[3]);
    expect(await fx.token.balanceOf(fx.panel[4].address)).to.equal(jBalsBefore[4]);

    // Winner gets own stake (500) + 80% loser stake (400) + dust (1 wei)
    const expectedWinnerPayout = 500n * 10n ** 18n + 400n * 10n ** 18n + dust;
    expect(await fx.token.balanceOf(fx.deployer.address)).to.equal(cBalBefore + expectedWinnerPayout);
  });

  it("rejects double settle", async () => {
    const fx = await deployFull();
    const caseId = await openCase(fx);
    await voteAll(fx, caseId, [1, 1, 1, 2, 1]);
    await (await fx.hub.settleCase(caseId)).wait();
    await expect(fx.hub.settleCase(caseId)).to.be.revertedWith("Already settled");
  });

  it("rejects counterStake by non-respondent", async () => {
    const fx = await deployFull();
    await fx.token.connect(fx.deployer).approve(fx.hub.target, STAKE);
    await fx.token.connect(fx.j1).approve(fx.hub.target, STAKE);
    const tx = await fx.hub.connect(fx.deployer).initiateDispute("NO-RESP", fx.respondent.address);
    const rcpt = await tx.wait();
    const caseId = caseIdFrom(rcpt);
    await expect(fx.hub.connect(fx.j1).counterStake(caseId)).to.be.revertedWith("Only respondent");
  });

  it("rejects panel appointment before respondent stake", async () => {
    const fx = await deployFull();
    await fx.token.connect(fx.deployer).approve(fx.hub.target, STAKE);
    const tx = await fx.hub.connect(fx.deployer).initiateDispute("NO-STAKE", fx.respondent.address);
    const rcpt = await tx.wait();
    const caseId = caseIdFrom(rcpt);
    await expect(
      fx.hub.appointJurorPanel(caseId, fx.panel.map((j) => j.address))
    ).to.be.revertedWith("Respondent has not staked");
  });

  it("rescueStake: claimant reclaims after respondent ignores (2-day window)", async () => {
    const fx = await deployFull();
    await fx.token.connect(fx.deployer).approve(fx.hub.target, STAKE);
    const tx = await fx.hub.connect(fx.deployer).initiateDispute("IGNORED", fx.respondent.address);
    const rcpt = await tx.wait();
    const caseId = caseIdFrom(rcpt);
    const balBefore = await fx.token.balanceOf(fx.deployer.address);

    // Window still open → rejected
    await expect(fx.hub.connect(fx.deployer).rescueStake(caseId)).to.be.revertedWith(
      "Response window still open"
    );

    await time.increase(2 * 24 * 3600 + 60); // 2 days + 1 min
    await (await fx.hub.connect(fx.deployer).rescueStake(caseId)).wait();
    expect(await fx.token.balanceOf(fx.deployer.address)).to.equal(balBefore + STAKE);
    const rec = await fx.caseRegistry.cases(caseId);
    expect(rec.state).to.equal(10n); // CLOSED
  });

  it("commit after voting deadline (7 days) reverts", async () => {
    const fx = await deployFull();
    const caseId = await openCase(fx);
    await time.increase(7 * 24 * 3600 + 60);
    const salt = ethers.hexlify(ethers.randomBytes(32));
    await expect(
      fx.votingManager.connect(fx.panel[0]).commitVote(caseId, commit(1, salt, caseId, fx.panel[0].address))
    ).to.be.revertedWith("Commit window closed");
  });

  it("reveal after deadline + 1-day grace reverts", async () => {
    const fx = await deployFull();
    const caseId = await openCase(fx);
    const juror = fx.panel[0];
    const salt = ethers.hexlify(ethers.randomBytes(32));
    await (await fx.votingManager.connect(juror).commitVote(caseId, commit(1, salt, caseId, juror.address))).wait();
    await time.increase(7 * 24 * 3600 + 24 * 3600 + 60); // deadline + grace + 1 min
    await expect(fx.votingManager.connect(juror).revealVote(caseId, 1, salt)).to.be.revertedWith(
      "Reveal window closed"
    );
  });

  it("finalizeVerdict guard: cannot settle from a non-voting state", async () => {
    const fx = await deployFull();
    await fx.token.connect(fx.deployer).approve(fx.hub.target, STAKE);
    const tx = await fx.hub.connect(fx.deployer).initiateDispute("GUARD", fx.respondent.address);
    const rcpt = await tx.wait();
    const caseId = caseIdFrom(rcpt);
    // Case is SUBMITTED — settle must refuse (finalizeVerdict also guards state)
    await expect(fx.hub.settleCase(caseId)).to.be.revertedWith("Not in voting phase");
  });

  it("anchorEvidenceBundle & anchorAIReportHash: allows claimant/admin and sets roots in CaseRegistry", async () => {
    const fx = await deployFull();
    await fx.token.connect(fx.deployer).approve(fx.hub.target, STAKE);
    const tx = await fx.hub.connect(fx.deployer).initiateDispute("ROOTS-01", fx.respondent.address);
    const rcpt = await tx.wait();
    const caseId = caseIdFrom(rcpt);

    const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes("evidence-bundle-root"));
    const reportHash = ethers.keccak256(ethers.toUtf8Bytes("ai-advisory-report"));

    // Claimant can anchor evidence bundle
    await fx.hub.connect(fx.deployer).anchorEvidenceBundle(caseId, merkleRoot);
    // Admin can anchor AI report
    await fx.hub.connect(fx.deployer).anchorAIReportHash(caseId, reportHash);

    const record = await fx.caseRegistry.cases(caseId);
    expect(record.evidenceMerkleRoot).to.equal(merkleRoot);
    expect(record.aiReportHash).to.equal(reportHash);

    // Unauthorized party cannot anchor
    const unauthorized = fx.panel[0];
    await expect(
      fx.hub.connect(unauthorized).anchorEvidenceBundle(caseId, merkleRoot)
    ).to.be.revertedWith("Unauthorized");
    await expect(
      fx.hub.connect(unauthorized).anchorAIReportHash(caseId, reportHash)
    ).to.be.revertedWith("Only admin");
  });

  it("unauthorized evidence registration reverts; parties allowed only during active evidence window", async () => {
    const fx = await deployFull();
    await fx.token.connect(fx.deployer).approve(fx.hub.target, STAKE);
    const tx = await fx.hub.connect(fx.deployer).initiateDispute("EVID-TEST", fx.respondent.address);
    const rcpt = await tx.wait();
    const caseId = caseIdFrom(rcpt);

    const dummySha = ethers.keccak256(ethers.toUtf8Bytes("content-file-1"));
    const stranger = fx.panel[0];

    // Stranger tries to register evidence for caseId -> reverts
    await expect(
      fx.evidence.connect(stranger).registerEvidence(caseId, dummySha, "bafybeihash1", 0)
    ).to.be.revertedWith("Unauthorized: only case parties or hub");

    // Claimant can register evidence during SUBMITTED state
    await expect(
      fx.evidence.connect(fx.deployer).registerEvidence(caseId, dummySha, "bafybeihash1", 0)
    ).to.not.be.reverted;

    // After response window expires, claimant rescues stake (case moves to CLOSED)
    await time.increase(2 * 24 * 3600 + 60);
    await fx.hub.connect(fx.deployer).rescueStake(caseId);

    // Now evidence registration for closed case reverts
    await expect(
      fx.evidence.connect(fx.deployer).registerEvidence(caseId, dummySha, "bafybeihash2", 0)
    ).to.be.revertedWith("Evidence window closed for this case");
  });

  it("late panel appointment sets future deadline from appointment date, avoiding case bricking", async () => {
    const fx = await deployFull();
    await fx.token.connect(fx.deployer).approve(fx.hub.target, STAKE);
    const tx = await fx.hub.connect(fx.deployer).initiateDispute("LATE-PANEL", fx.respondent.address);
    const rcpt = await tx.wait();
    const caseId = caseIdFrom(rcpt);

    await fx.token.connect(fx.respondent).approve(fx.hub.target, STAKE);
    await fx.hub.connect(fx.respondent).counterStake(caseId);

    // 10 days pass before admin appoints the jury panel
    await time.increase(10 * 24 * 3600);

    // Admin appoints panel
    await fx.hub.appointJurorPanel(caseId, fx.panel.map((j) => j.address));

    const rec = await fx.caseRegistry.cases(caseId);
    const now = await time.latest();
    // Deadline must be 7 days in the future from appointment, NOT expired
    expect(rec.votingDeadline).to.be.greaterThan(BigInt(now));

    // Juror can commit successfully
    const salt = ethers.hexlify(ethers.randomBytes(32));
    await expect(
      fx.votingManager.connect(fx.panel[0]).commitVote(caseId, commit(1, salt, caseId, fx.panel[0].address))
    ).to.not.be.reverted;
  });

  it("0 reveals scenario: after reveal window closes, permissionless settlement refunds both parties", async () => {
    const fx = await deployFull();
    const caseId = await openCase(fx);
    const cBal = await fx.token.balanceOf(fx.deployer.address);
    const rBal = await fx.token.balanceOf(fx.respondent.address);

    // 0 jurors reveal. Wait past votingDeadline (7d) + REVEAL_GRACE (1d) + 1m
    await time.increase(8 * 24 * 3600 + 60);

    // Any caller can permissionlessly trigger settlement
    const stranger = fx.panel[4];
    await fx.hub.connect(stranger).settleCase(caseId);

    // Both parties are refunded their full stakes
    expect(await fx.token.balanceOf(fx.deployer.address)).to.equal(cBal + STAKE);
    expect(await fx.token.balanceOf(fx.respondent.address)).to.equal(rBal + STAKE);

    const rec = await fx.caseRegistry.cases(caseId);
    expect(rec.winningOutcome).to.equal(3n); // Split / refund
  });

  it("tie scenario (2 claimant, 2 respondent, 1 split) produces automatic Split outcome", async () => {
    const fx = await deployFull();
    const caseId = await openCase(fx);
    const cBal = await fx.token.balanceOf(fx.deployer.address);
    const rBal = await fx.token.balanceOf(fx.respondent.address);

    // Votes: 2 claimant (1), 2 respondent (2), 1 split (3) -> tie plurality
    await voteAll(fx, caseId, [1, 1, 2, 2, 3]);
    await fx.hub.settleCase(caseId);

    expect(await fx.token.balanceOf(fx.deployer.address)).to.equal(cBal + STAKE);
    expect(await fx.token.balanceOf(fx.respondent.address)).to.equal(rBal + STAKE);

    const rec = await fx.caseRegistry.cases(caseId);
    expect(rec.winningOutcome).to.equal(3n);
  });

  it("testnet token faucet allows self-service RSLV claims with 24-hour cooldown", async () => {
    const fx = await deployFull();
    const user = fx.panel[0];

    const initialBal = await fx.token.balanceOf(user.address);
    // Claim 1,000 RSLV
    await fx.token.connect(user).claimTestnetTokens();
    expect(await fx.token.balanceOf(user.address)).to.equal(initialBal + 1000n * 10n ** 18n);

    // Immediate second claim reverts due to cooldown
    await expect(fx.token.connect(user).claimTestnetTokens()).to.be.revertedWith(
      "Faucet cooldown active: wait 24 hours"
    );

    // After 24 hours + 10 seconds, claim succeeds again
    await time.increase(24 * 3600 + 10);
    await fx.token.connect(user).claimTestnetTokens();
    expect(await fx.token.balanceOf(user.address)).to.equal(initialBal + 2000n * 10n ** 18n);
  });
});

