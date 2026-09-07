# database/

Placeholder. The original design report referenced a PostgreSQL schema for off-chain
case metadata, but no migration files or ORM code were included in the repository.
In the current implementation all state lives in browser memory (`frontend/app/lib/mockData.ts`).

Intended (not yet built) schema:

| table | purpose |
|---|---|
| `cases` | case number, parties, category, status, stakes |
| `evidence` | sha256 hash, ipfs cid, block number, tx hash |
| `audit_events` | on-chain event log mirror |
| `jurors` | reputation, wallet, panel assignments |
