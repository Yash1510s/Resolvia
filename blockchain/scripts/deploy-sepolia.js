/**
 * Resolvia — Sepolia testnet deployment.
 *
 * Deploys all 5 contracts to Ethereum Sepolia (chainId 11155111) from a
 * single deployer key, wires ArbitrationHub as the coordinator, sanity-checks
 * the wiring, and writes `deployments/sepolia.json` (same manifest shape as
 * the local deployment, so the frontend can point at it).
 *
 * Usage:
 *   export SEPOLIA_PRIVATE_KEY=0x...          # required — deployer key
 *   export SEPOLIA_RPC_URL=https://...        # optional — default: public Sepolia RPC
 *   npx hardhat run scripts/deploy-sepolia.js --network sepolia
 *
 * Requirements:
 *   - Sepolia ETH on the deployer for gas (ArbitrationHub viaIR deploy is
 *     the expensive one; budget ~0.02–0.05 ETH total to be safe).
 *   - A public or private RPC that allows contract deployment.
 *
 * NOTE: This is a TESTNET deployment of a PROTOTYPE. No mainnet claim.
 */
const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

const SEPOLIA_CHAIN_ID = "11155111";
const DEFAULT_RPC = "https://ethereum-sepolia-rpc.publicnode.com";

async function main() {
  const pk = process.env.SEPOLIA_PRIVATE_KEY;
  if (!pk || !/^0x[0-9a-fA-F]{64}$/.test(pk)) {
    throw new Error(
      "SEPOLIA_PRIVATE_KEY is not set (expected 0x + 64 hex chars). " +
        "Get Sepolia ETH from https://sepia.tenderly.co and try again."
    );
  }
  const rpc = process.env.SEPOLIA_RPC_URL || DEFAULT_RPC;
  const provider = new ethers.JsonRpcProvider(rpc);
  const net = await provider.getNetwork();
  if (net.chainId.toString() !== SEPOLIA_CHAIN_ID) {
    throw new Error(`Expected Sepolia (chainId ${SEPOLIA_CHAIN_ID}), RPC says ${net.chainId}`);
  }

  const deployer = new ethers.Wallet(pk, provider);
  const balance = ethers.formatEther(await provider.getBalance(deployer.address));
  console.log("Deployer:", deployer.address);
  console.log("Sepolia ETH balance:", balance);
  if (Number(balance) < 0.05) {
    console.warn("WARNING: less than 0.05 ETH — the viaIR ArbitrationHub deploy may not fit. Top up and retry.");
  }

  const existing = path.join(__dirname, "..", "deployments", "sepolia.json");
  if (fs.existsSync(existing)) {
    console.warn("deployments/sepolia.json already exists — this run deploys a FRESH set (old addresses stay in git history).");
  }

  console.log("\nDeploying ResolviaToken…");
  const token = await (await ethers.getContractFactory("ResolviaToken", deployer)).deploy();
  await token.waitForDeployment();
  console.log("ResolviaToken:", await token.getAddress());

  console.log("Deploying EvidenceRegistry…");
  const evidence = await (await ethers.getContractFactory("EvidenceRegistry", deployer)).deploy();
  await evidence.waitForDeployment();
  console.log("EvidenceRegistry:", await evidence.getAddress());

  console.log("Deploying CaseRegistry…");
  const caseRegistry = await (await ethers.getContractFactory("CaseRegistry", deployer)).deploy();
  await caseRegistry.waitForDeployment();
  console.log("CaseRegistry:", await caseRegistry.getAddress());

  console.log("Deploying VotingManager…");
  const votingManager = await (await ethers.getContractFactory("VotingManager", deployer)).deploy();
  await votingManager.waitForDeployment();
  console.log("VotingManager:", await votingManager.getAddress());

  console.log("Deploying ArbitrationHub (viaIR — largest artifact)…");
  const hub = await (await ethers.getContractFactory("ArbitrationHub", deployer)).deploy(
    await token.getAddress(),
    await caseRegistry.getAddress(),
    await votingManager.getAddress(),
    await evidence.getAddress()
  );
  await hub.waitForDeployment();
  console.log("ArbitrationHub:", await hub.getAddress());

  console.log("Wiring coordinator (hub -> CaseRegistry + VotingManager + EvidenceRegistry)…");
  await (await caseRegistry.setArbitrationHub(await hub.getAddress())).wait();
  await (await votingManager.setArbitrationHub(await hub.getAddress())).wait();
  await (await evidence.setCaseRegistry(await caseRegistry.getAddress())).wait();
  await (await evidence.setArbitrationHub(await hub.getAddress())).wait();

  // Sanity: read back the wiring and core constants.
  const hubOnRegistry = await caseRegistry.arbitrationHub();
  const hubOnVoting = await votingManager.arbitrationHub();
  const stake = ethers.formatEther(await hub.REQUIRED_STAKE());
  const supply = ethers.formatEther(await token.totalSupply());
  if (hubOnRegistry.toLowerCase() !== (await hub.getAddress()).toLowerCase()) throw new Error("CaseRegistry wiring mismatch");
  if (hubOnVoting.toLowerCase() !== (await hub.getAddress()).toLowerCase()) throw new Error("VotingManager wiring mismatch");
  console.log("\nSanity OK — REQUIRED_STAKE:", stake, "RSLV · token supply:", supply);

  const deployment = {
    network: "sepolia",
    chainId: SEPOLIA_CHAIN_ID,
    rpc: rpc,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    prototype: true,
    testnet: true,
    contracts: {
      ResolviaToken: await token.getAddress(),
      EvidenceRegistry: await evidence.getAddress(),
      CaseRegistry: await caseRegistry.getAddress(),
      VotingManager: await votingManager.getAddress(),
      ArbitrationHub: await hub.getAddress(),
    },
    demoAccounts: {
      admin: deployer.address,
      claimant: deployer.address,
      respondent: deployer.address,
      jurors: [
        deployer.address,
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
        "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
      ],
      interactiveJuror: deployer.address,
    },
    explorer: {
      token: `https://sepolia.etherscan.io/address/${await token.getAddress()}`,
      evidence: `https://sepolia.etherscan.io/address/${await evidence.getAddress()}`,
      cases: `https://sepolia.etherscan.io/address/${await caseRegistry.getAddress()}`,
      voting: `https://sepolia.etherscan.io/address/${await votingManager.getAddress()}`,
      hub: `https://sepolia.etherscan.io/address/${await hub.getAddress()}`,
    },
  };

  const outDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(existing, JSON.stringify(deployment, null, 2));
  console.log("\nDeployment manifest written to:", existing);
  console.log("Explorer:", deployment.explorer.hub);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
