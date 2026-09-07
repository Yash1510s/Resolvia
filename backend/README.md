# backend/ — Resolvia FastAPI Service

AI analysis bridge **+ Auth & custodial wallet service**.

## Run

```bash
pip install -r requirements.txt
APP_ENV=dev python3 -m uvicorn server:app --host 0.0.0.0 --port 8000
```

- `APP_ENV=dev` → OTP codes are printed to the console **and** returned as
  `devCode` in the response (so demos work without an email server).
- `RESOLVIA_RPC` (default `http://127.0.0.1:8545`) — local Hardhat node.
- `RESOLVIA_CHAIN_ID` (default `31337`).

## API

### AI
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/ai/analyze` | Evidence analysis pipeline (ai-engine) |

### Auth — Web2 sign-in → platform-assigned wallet
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/otp/request` | `{email}` → 6-digit OTP (5-min TTL, 60s cooldown, 3 attempts, stored as SHA-256) |
| POST | `/api/auth/otp/verify` | `{email, code}` → creates user + **assigns wallet** + JWT (7 days) |
| POST | `/api/auth/google` | `{credential}` (Google ID token) → same (needs `GOOGLE_CLIENT_ID`) |
| GET | `/api/auth/me` | Bearer JWT → user + assigned wallet |

### Wallet-signed on-chain actions (custodial)
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/wallet/vote/commit` | `{caseId, commitment}` → backend signs `commitVote` with the user's key |
| POST | `/api/wallet/vote/reveal` | `{caseId, vote, salt}` → backend signs `revealVote` |

## How the "no MetaMask" wallet works

1. Signup (email OTP / Google) → backend generates an EVM keypair.
2. Private key is **AES-256-GCM encrypted** with a master key (`backend/secret/keys.json`,
   gitignored) and stored in SQLite (`resolvia_auth.db`, gitignored). It never
   leaves the server.
3. The user's address is their on-chain identity; their **login is their
   recovery mechanism** (no seed phrases).
4. New wallets are auto-funded with 0.5 ETH from the operator account
   (`RESOLVIA_OPERATOR_KEY`) to pay gas — the local demo faucet. **Production
   equivalent: ERC-4337 paymaster (gasless).**
5. Sensitive actions (votes) are signed server-side per authenticated request.

## Google OAuth setup

1. Google Cloud Console → APIs & Services → Credentials → **OAuth client ID**
   (type: Web application).
2. Authorized JavaScript origins: `http://localhost:3000` (+ your deploy URL).
3. Set on **both** sides:
   - backend: `GOOGLE_CLIENT_ID=<client-id>` (server-side token verification)
   - frontend: `NEXT_PUBLIC_GOOGLE_CLIENT_ID=<client-id>` (render the button)

## Security notes (production checklist)

- Move master key to KMS / secret manager; rotate.
- Real email delivery for OTPs (remove `devCode` from responses in prod).
- Add step-up OTP / passkey confirmation for high-value actions.
- Consider MPC custody or ERC-4337 smart accounts + passkey session keys
  instead of server-held keys when moving beyond the demo.
- Rate-limit auth endpoints; the 60s OTP cooldown is the first line.
