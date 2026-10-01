/**
 * Resolvia local deployment script.
 *
 * Deploys all 5 contracts to a running local Hardhat node (`npm run node`),
 * wires ArbitrationHub as the coordinator, and writes the addresses to
 * `deployments/local.json` — which the Next.js frontend reads to connect.
 *
 * Demo account mapping (well-known Hardhat default accounts, testnet only):
 *   account 0  -> Admin + Claimant (Alice)   (receives 10M RSLV at deploy)
 *   account 1  -> Juror A — the interactive "you" (frontend DEMO_ACCOUNTS.juror1)
 *   account 2  -> Respondent
 *   accounts 3,4,5,6 -> Jurors B..E
 *
 * NOTE: keep this in sync with frontend/app/lib/chain.ts DEMO_ACCOUNTS.
 */
const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [admin, j1, respondent, j2, j3, j4, j5] = await ethers.getSigners();
  console.log("Deployer (admin + claimant):", admin.address);

  const token = await (await ethers.getContractFactory("ResolviaToken")).deploy();
  await token.waitForDeployment();
  console.log("ResolviaToken:", await token.getAddress());

  const evidence = await (await ethers.getContractFactory("EvidenceRegistry")).deploy();
  await evidence.waitForDeployment();
  console.log("EvidenceRegistry:", await evidence.getAddress());

  const caseRegistry = await (await ethers.getContractFactory("CaseRegistry")).deploy();
  await caseRegistry.waitForDeployment();
  console.log("CaseRegistry:", await caseRegistry.getAddress());

  const votingManager = await (await ethers.getContractFactory("VotingManager")).deploy();
  await votingManager.waitForDeployment();
  console.log("VotingManager:", await votingManager.getAddress());

  const hub = await (await ethers.getContractFactory("ArbitrationHub")).deploy(
    await token.getAddress(),
    await caseRegistry.getAddress(),
    await votingManager.getAddress(),
    await evidence.getAddress()
  );
  await hub.waitForDeployment();
  console.log("ArbitrationHub:", await hub.getAddress());

  // Each sub-contract sets `arbitrationHub = msg.sender` (deployer) in its
  // constructor; transfer coordination to the hub.
  await (await caseRegistry.setArbitrationHub(await hub.getAddress())).wait();
  await (await votingManager.setArbitrationHub(await hub.getAddress())).wait();
  await (await evidence.setCaseRegistry(await caseRegistry.getAddress())).wait();
  await (await evidence.setArbitrationHub(await hub.getAddress())).wait();
  console.log("Coordinator wired: hub -> CaseRegistry + VotingManager + EvidenceRegistry");

  const deployment = {
    network: network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployedAt: new Date().toISOString(),
    contracts: {
      ResolviaToken: await token.getAddress(),
      EvidenceRegistry: await evidence.getAddress(),
      CaseRegistry: await caseRegistry.getAddress(),
      VotingManager: await votingManager.getAddress(),
      ArbitrationHub: await hub.getAddress(),
    },
    demoAccounts: {
      admin: admin.address,
      claimant: admin.address,
      respondent: respondent.address,
      jurors: [j1.address, j2.address, j3.address, j4.address, j5.address],
      interactiveJuror: j1.address,
    },
  };

  const outDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "local.json");
  fs.writeFileSync(outFile, JSON.stringify(deployment, null, 2));
  console.log("\nDeployment manifest written to:", outFile);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
