const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

/**
 * EXACT commitment encoding used by BOTH the contract (VotingManager.revealVote)
 * and the frontend (frontend/app/lib/commitment.ts):
 *
 *   keccak256( abi.encodePacked(uint8 voteChoice, bytes32 salt, uint256 caseId, address juror) )
 *
 * If these tests pass, the frontend can commit from the browser and the chain
 * will accept the reveal.
 */
function packCommitment(vote, salt, caseId, juror) {
  return ethers.keccak256(
    ethers.concat([
      ethers.toBeHex(vote, 1), // uint8 -> 1 byte
      salt, // bytes32 -> 32 bytes
      ethers.toBeHex(BigInt(caseId), 32), // uint256 -> 32 bytes
      juror, // address -> 20 bytes
    ])
  );
}

describe("VotingManager — commit-reveal (real hash math)", function () {
  async function deployFixture() {
    const [admin, , j1, j2, j3, j4, j5] = await ethers.getSigners();
    const vm = await (await ethers.getContractFactory("VotingManager")).deploy();
    const panel = [j1, j2, j3, j4, j5];
    const deadline = (await time.latest()) + 7 * 24 * 3600;
    await vm.assignJurorPanel(1, panel.map((j) => j.address), deadline);
    return { vm, admin, panel, deadline };
  }

  it("reverts early reveal while commit window is still open", async () => {
    const { vm, panel } = await deployFixture();
    const juror = panel[0];
    const salt = ethers.hexlify(ethers.randomBytes(32));
    const commitment = packCommitment(1, salt, 1n, juror.address);

    await vm.connect(juror).commitVote(1, commitment);
    // Attempt to reveal immediately without time advance
    await expect(vm.connect(juror).revealVote(1, 1, salt)).to.be.revertedWith(
      "Commit window still open"
    );
  });

  it("accepts a valid commitment and reveal, updates tally", async () => {
    const { vm, panel, deadline } = await deployFixture();
    const juror = panel[0];
    const salt = ethers.hexlify(ethers.randomBytes(32));
    const commitment = packCommitment(1, salt, 1n, juror.address);

    await vm.connect(juror).commitVote(1, commitment);
    const mid = await vm.jurorVotes(1, juror.address);
    expect(mid.committed).to.equal(true);
    expect(mid.revealed).to.equal(false);

    // Advance time past commit deadline into reveal grace window
    await time.increaseTo(deadline + 1);

    await vm.connect(juror).revealVote(1, 1, salt);
    const [claimant, respondent, split, total] = await vm.getTally(1);
    expect(total).to.equal(1n);
    expect(claimant).to.equal(1n);
    expect(respondent).to.equal(0n);
    expect(split).to.equal(0n);
  });

  it("rejects a reveal with the wrong salt", async () => {
    const { vm, panel, deadline } = await deployFixture();
    const juror = panel[1];
    const salt = ethers.hexlify(ethers.randomBytes(32));
    const wrongSalt = ethers.hexlify(ethers.randomBytes(32));
    const commitment = packCommitment(2, salt, 1n, juror.address);

    await vm.connect(juror).commitVote(1, commitment);
    await time.increaseTo(deadline + 1);
    await expect(vm.connect(juror).revealVote(1, 2, wrongSalt)).to.be.revertedWith(
      "Cryptographic commitment mismatch"
    );
  });

  it("rejects a reveal with the wrong vote choice", async () => {
    const { vm, panel, deadline } = await deployFixture();
    const juror = panel[2];
    const salt = ethers.hexlify(ethers.randomBytes(32));
    const commitment = packCommitment(1, salt, 1n, juror.address);

    await vm.connect(juror).commitVote(1, commitment);
    await time.increaseTo(deadline + 1);
    await expect(vm.connect(juror).revealVote(1, 2, salt)).to.be.revertedWith(
      "Cryptographic commitment mismatch"
    );
  });

  it("rejects cross-case replay (commitment is bound to caseId)", async () => {
    const { vm, panel, deadline } = await deployFixture();
    const juror = panel[3];
    // Juror is also on panel for case 2
    await vm.assignJurorPanel(2, [juror.address], deadline);

    const salt = ethers.hexlify(ethers.randomBytes(32));
    // Commitment was honestly computed for CASE 1…
    const commitment = packCommitment(1, salt, 1n, juror.address);
    await vm.connect(juror).commitVote(2, commitment);
    // Advance past deadline into reveal window
    await time.increaseTo(deadline + 1);
    // …but revealing it in case 2 must fail: hash doesn't bind to case 2.
    await expect(vm.connect(juror).revealVote(2, 1, salt)).to.be.revertedWith(
      "Cryptographic commitment mismatch"
    );
  });

  it("rejects a juror who is not on the panel", async () => {
    const { vm, admin } = await deployFixture();
    await expect(
      vm.connect(admin).commitVote(1, "0x" + "11".repeat(32))
    ).to.be.revertedWith("Not an assigned juror");
  });

  it("rejects double-commit and double-reveal", async () => {
    const { vm, panel, deadline } = await deployFixture();
    const juror = panel[4];
    const salt = ethers.hexlify(ethers.randomBytes(32));
    const commitment = packCommitment(3, salt, 1n, juror.address);

    await vm.connect(juror).commitVote(1, commitment);
    await expect(vm.connect(juror).commitVote(1, commitment)).to.be.revertedWith(
      "Already committed"
    );
    await time.increaseTo(deadline + 1);
    await vm.connect(juror).revealVote(1, 3, salt);
    await expect(vm.connect(juror).revealVote(1, 3, salt)).to.be.revertedWith(
      "Already revealed"
    );
  });
});
