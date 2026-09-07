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
    for (let i = 0; i < votes.length; i++) {
      const juror = fx.panel[i];
      const salt = ethers.hexlify(ethers.randomBytes(32));
      await (await fx.votingManager.connect(juror).commitVote(caseId, commit(votes[i], salt, caseId, juror.address))).wait();
      await (await fx.votingManager.connect(juror).revealVote(caseId, votes[i], salt)).wait();
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

  it("rejects settle before quorum (only 2 votes)", async () => {
    const fx = await deployFull();
    const caseId = await openCase(fx);
    await voteAll(fx, caseId, [1, 1]);
    await expect(fx.hub.settleCase(caseId)).to.be.revertedWith("Quorum not reached");
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
});
