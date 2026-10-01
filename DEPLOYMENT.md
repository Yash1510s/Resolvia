# Resolvia 2.0 — Deployment & Operations Manual

This guide covers everything required to deploy, run, and test Resolvia 2.0 both on a **Local Devnet** and on the **Ethereum Sepolia Testnet** for real users.

---

## Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │          Next.js 16 Frontend           │
                      │  (Turbopack, Tailwind, Lucide, Ethers)  │
                      └──────────────┬───────────────────┬─────┘
                                     │                   │
                  REST / SSE / JSON  │                   │ JSON-RPC
                  Authorization: Bearer                 │
                                     ▼                   ▼
           ┌───────────────────────────────┐   ┌───────────────────────────────┐
           │      FastAPI Backend          │   │      Ethereum EVM Layer       │
           │  • Auth (JWT, OTP, Lockout)   │   │  (Sepolia / Hardhat 31337)    │
           │  • IPFS Pinata Service        │   │  • ResolviaToken (ERC-20)     │
           │  • Dual-Engine AI Pipeline    │   │  • CaseRegistry (Disputes)    │
           │    (Gemini 2.0 + XGBoost)     │   │  • VotingManager (Commit-Rev) │
           │                               │   │  • EvidenceRegistry (Roots)   │
           └───────────────────────────────┘   │  • ArbitrationHub (Escrow)    │
                                               └───────────────────────────────┘
```

---

## 1. Quick Start: Local Full-Stack Development

### Step 1: Start the Local Hardhat Node & Deploy Contracts
Open a terminal:
```bash
cd blockchain
npm install
npm run node
```
In a second terminal, deploy the 5 smart contracts to the local node:
```bash
cd blockchain
npm run deploy:local
```
*This compiles the contracts with Solidity `0.8.28` (viaIR enabled) and generates `blockchain/deployments/local.json`.*

### Step 2: Start the FastAPI Backend & AI Advisory
In a third terminal:
```bash
cd backend
pip install -r requirements.txt
pip install google-genai httpx slowapi
uvicorn server:app --reload --port 8000
```
*Healthcheck: Visit `http://localhost:8000/health` to verify status.*

### Step 3: Start the Next.js Frontend
In a fourth terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 2. Deploying to Ethereum Sepolia Testnet

### Prerequisites
1. **Sepolia ETH:** You need ~0.05 Sepolia ETH on your deployer wallet to cover contract creation gas (ArbitrationHub uses viaIR and is ~2.8M gas).
   - Get Sepolia ETH from:
     - [Google Cloud Web3 Sepolia Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
     - [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
     - [Tenderly Sepolia Faucet](https://sepia.tenderly.co/)
2. **Sepolia RPC:** A reliable JSON-RPC URL:
   - Alchemy: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`
   - Infura: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`
   - Public RPC: `https://ethereum-sepolia-rpc.publicnode.com`
3. **Etherscan API Key:** Optional, for verifying contracts at [etherscan.io](https://etherscan.io).

### Step 1: Configure Environment Variables
In `blockchain/.env`:
```env
SEPOLIA_PRIVATE_KEY=0xYOUR_64_HEX_CHAR_PRIVATE_KEY
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
```

In `backend/.env`:
```env
APP_ENV=prod
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-domain.com
RESOLVIA_RPC=https://ethereum-sepolia-rpc.publicnode.com
RESOLVIA_CHAIN_ID=11155111
GEMINI_API_KEY=AIzaSy...
PINATA_JWT=your_pinata_jwt_token
PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/
```

In `frontend/.env.local`:
```env
NEXT_PUBLIC_NETWORK=sepolia
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
RESOLVIA_BACKEND_URL=http://localhost:8000
```

### Step 2: Run Sepolia Deployment Script
```bash
cd blockchain
npx hardhat run scripts/deploy-sepolia.js --network sepolia
```

**Output:**
```
Deployer: 0x...
Sepolia ETH balance: 0.12 ETH

Deploying ResolviaToken…
ResolviaToken: 0x9A...
Deploying EvidenceRegistry…
EvidenceRegistry: 0x8B...
Deploying CaseRegistry…
CaseRegistry: 0x7C...
Deploying VotingManager…
VotingManager: 0x6D...
Deploying ArbitrationHub (viaIR)…
ArbitrationHub: 0x5E...
Wiring coordinator…
Sanity OK — REQUIRED_STAKE: 500.0 RSLV · token supply: 100000000.0
Deployment manifest written to: blockchain/deployments/sepolia.json
```

### Step 3: Verify Contracts on Etherscan
```bash
npx hardhat verify --network sepolia <TOKEN_ADDRESS>
npx hardhat verify --network sepolia <EVIDENCE_REGISTRY_ADDRESS>
npx hardhat verify --network sepolia <CASE_REGISTRY_ADDRESS>
npx hardhat verify --network sepolia <VOTING_MANAGER_ADDRESS>
npx hardhat verify --network sepolia <ARBITRATION_HUB_ADDRESS> <TOKEN_ADDRESS> <CASE_REGISTRY_ADDRESS> <VOTING_MANAGER_ADDRESS> <EVIDENCE_REGISTRY_ADDRESS>
```

---

## 3. Real User Onboarding & Testing Flow

### Step 1: User Signs In
- User accesses `http://localhost:3000` (or production URL).
- Clicks **Connect Wallet** (MetaMask, Rabby, Coinbase Wallet) OR enters their email for passwordless OTP sign-in.
- Non-wallet users are automatically provisioned with a secure cryptographic keypair by the backend.

### Step 2: Claim Free Testnet RSLV Tokens
- Real users can claim `1,000 RSLV` directly from the token contract faucet once every 24 hours.
- Method: `ResolviaToken.claimTestnetTokens()`.
- Tokens are automatically credited to the caller's address.

### Step 3: Dispute Creation & Anti-Spam Escrow
- Claimant navigates to `/create`.
- Fills dispute details (category, claim summary, relief sought).
- Uploads evidence files (PDFs, images, logs):
  - Files are hashed client-side with SHA-256.
  - Pinata IPFS pins the file and returns a CIDv1 (`bafkrei...`).
  - An optional dual-engine AI advisory analysis is generated.
- Claimant approves and locks 500 RSLV anti-spam stake into `ArbitrationHub`.

### Step 4: Respondent Counter-Stake
- Respondent receives dispute notification and counter-stakes 500 RSLV.
- Total escrow in `ArbitrationHub` is now 1,000 RSLV (500 + 500).

### Step 5: Blind Juror Deliberation (Commit-Reveal)
- Admin/Hub appoints a 5-juror panel with a 7-day voting window.
- **Commit Phase:** Jurors evaluate evidence and commit a blind hash:
  `keccak256(abi.encodePacked(voteChoice, salt, caseId, jurorAddress))`
- **Reveal Phase:** Once the commit window closes, jurors submit their clear vote + salt. The smart contract validates the hash.

### Step 6: Settle Case & Escrow Payout
- Anyone calls `ArbitrationHub.settleCase(caseId)`:
  - If Claimant wins: 900 RSLV paid to Claimant, 100 RSLV distributed equally among revealing jurors (20 RSLV each).
  - If Respondent wins: 900 RSLV paid to Respondent, 100 RSLV distributed among revealing jurors.
  - If Split: 500 RSLV refunded to Claimant, 500 RSLV refunded to Respondent.

---

## 4. Docker Deployment

### Multi-Service Production Deployment:
```bash
docker compose up -d --build
```
This builds and orchestrates:
- `resolvia-blockchain`: Local Hardhat node with exposed RPC on port 8545.
- `resolvia-backend`: Non-root FastAPI container with healthcheck on port 8000.
- `resolvia-frontend`: Node.js container serving Next.js on port 3000.

Check service health:
```bash
docker compose ps
curl http://localhost:8000/health
```

---

## 5. Troubleshooting & FAQ

| Problem | Cause | Solution |
|---|---|---|
| `Gas estimate failed / out of gas` | Sepolia gas spike or viaIR ArbitrationHub contract size. | Top up deployer wallet with at least 0.05 Sepolia ETH. |
| `Nonce has already been used` | Multiple transactions sent concurrently without waiting for mining. | Wait for the pending transaction receipt or clear browser wallet activity data. |
| `429 Too Many Requests on AI Analyze` | SlowAPI rate limiter exceeded (10 calls/min). | Wait 60 seconds; ensure requests carry a valid JWT token. |
| `Pinata IPFS 401 Unauthorized` | Invalid `PINATA_JWT`. | Regenerate API JWT token in Pinata Dashboard with `pinFileToIPFS` permissions. |
| `Gemini API 404 / Resource Not Found` | Outdated model name. | Ensure `GEMINI_MODEL=gemini-2.0-flash` is set in `backend/.env`. |
