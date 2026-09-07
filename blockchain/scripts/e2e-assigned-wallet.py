"""
Live E2E: platform-assigned wallet interacting with the chain.
Flow: fresh user signs up via email OTP → backend assigns wallet →
that wallet is appointed juror → it commits + reveals votes via
backend-signed transactions → case settles with escrow payout.
"""
import hashlib
import json
import os
import secrets
import struct
import time

import requests
from eth_account import Account
from eth_utils import keccak

RPC = "http://127.0.0.1:8545"
API = "http://localhost:8000"
MANIFEST = json.load(open(os.path.join(os.path.dirname(__file__), "..", "deployments", "local.json")))

HUB = MANIFEST["contracts"]["ArbitrationHub"]
VM = MANIFEST["contracts"]["VotingManager"]
TOKEN = MANIFEST["contracts"]["ResolviaToken"]

# demo account keys (same as scripts/deploy.js)
KEYS = {
    "admin": "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    "claimant": "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    "juror1": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    "respondent": "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
    "juror3": "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
    "juror4": "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
    "juror5": "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
    "juror6": "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e",
}
CH = {k: Account.from_key("0x" + v).address if not v.startswith("0x") else Account.from_key(v).address for k, v in KEYS.items()}

STAKE = 500 * 10**18
NONCES = {}


def rpc(method, params):
    r = requests.post(RPC, json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params}, timeout=20)
    d = r.json()
    assert "error" not in d, d.get("error")
    return d.get("result")


def sel(sig):
    return keccak(text=sig)[:4]


def pad32(x):
    return int(x).to_bytes(32, "big")


def enc_str(s):
    b = s.encode()
    n = (len(b) + 31) // 32 * 32
    return pad32(len(b)) + b.ljust(n, b"\0")


def addr_b(a):
    return bytes.fromhex(a[2:].lower())


def pad_addr(a):
    return b"\0" * 12 + addr_b(a)


def send(acct_key, to, data, value=0):
    addr = Account.from_key(acct_key).address
    if os.environ.get("DRY_RUN"):
        r = rpc("eth_call", [{"to": to, "from": addr, "data": "0x" + data.hex()}, "latest"])
        print(f"   [dry-run] {addr[:8]}… → {to[:8]}… ok (call returned {r})")
        return "0xdryrun", {"logs": []}
    if addr not in NONCES:
        NONCES[addr] = int(rpc("eth_getTransactionCount", [addr, "pending"]), 16)
    nonce = NONCES[addr]
    NONCES[addr] += 1
    # estimate gas — hardcoded limits cause child-call OOG (silent 0x revert)
    try:
        gas = int(rpc("eth_estimateGas", [{"to": to, "from": addr, "data": "0x" + data.hex(), "value": hex(value)}]), 16)
    except Exception:
        gas = 300_000
    gas = int(gas * 1.3) + 50_000
    tx = {
        "to": to,
        "value": value,
        "gas": gas,
        "gasPrice": int(rpc("eth_gasPrice", []), 16),
        "nonce": nonce,
        "chainId": 31337,
        "data": data,
    }
    signed = Account.sign_transaction(tx, acct_key)
    txh = rpc("eth_sendRawTransaction", [signed.raw_transaction.hex()])
    for _ in range(30):
        rcpt = rpc("eth_getTransactionReceipt", [txh])
        if rcpt:
            if rcpt["status"] != "0x1":
                raise RuntimeError(f"tx reverted: {txh}")
            return txh, rcpt
        time.sleep(0.4)
    raise RuntimeError(f"tx pending too long: {txh}")


def case_id_from(receipt):
    topic0 = keccak(text="DisputeInitiated(uint256,string,address,address)").hex()
    for log in receipt["logs"]:
        if log["topics"] and log["topics"][0] == "0x" + topic0:
            return int(log["topics"][1], 16)
    raise RuntimeError("DisputeInitiated event not found")


def eth_call(to, data):
    return rpc("eth_call", [{"to": to, "data": data}, "latest"])


def bal(a):
    return int(eth_call(TOKEN, "0x70a08231" + pad_addr(a).hex()), 16)


def commit_reveal_demo(name, case_id, vote, salt):
    k = KEYS[name]
    addr = CH[name]
    commitment = keccak(b"\x01"[:0] + bytes([vote]) + salt + pad32(case_id) + addr_b(addr)).hex()
    send(k, VM, sel("commitVote(uint256,bytes32)") + pad32(case_id) + bytes.fromhex(commitment))
    send(k, VM, sel("revealVote(uint256,uint8,bytes32)") + pad32(case_id) + pad32(vote) + salt)
    print(f"   {name}: commit+reveal done (vote {vote})")


def main():
    email = f"juror-{secrets.token_hex(3)}@test.in"
    print("═ E2E: ASSIGNED-WALLET JUROR ═")

    # ── 1. sign up a brand-new juror via email OTP ──
    r = requests.post(API + "/api/auth/otp/request", json={"email": email}).json()
    r = requests.post(API + "/api/auth/otp/verify", json={"email": email, "code": r["devCode"]}).json()
    alice = r["user"]
    auth = {"Authorization": f"Bearer {r['token']}"}
    alice_addr = alice["wallet"]
    print(f"1. new user '{alice['name']}' ({email}) → assigned wallet {alice_addr}")

    # ── 2. open a case ──
    admin_k, claim_k, resp_k = KEYS["admin"], KEYS["claimant"], KEYS["respondent"]
    if bal(CH["respondent"]) < STAKE:
        send(admin_k, TOKEN, sel("transfer(address,uint256)") + pad_addr(CH["respondent"]) + pad32(1000 * 10**18))
        print("2a. funded respondent (1,000 RSLV)")
    allow = int(eth_call(TOKEN, "0xdd62ed3e" + pad_addr(CH["claimant"]).hex() + pad_addr(HUB).hex()), 16)
    if allow < STAKE:
        send(claim_k, TOKEN, sel("approve(address,uint256)") + pad_addr(HUB) + pad32(STAKE))
    _, rcpt = send(claim_k, HUB,
                   sel("initiateDispute(string,address)") + pad32(0x40) + pad_addr(CH["respondent"]) + enc_str("RSLV-2026-AUTH-E2E"))
    case_id = case_id_from(rcpt)
    print(f"2b. case #{case_id} opened (claimant staked 500)")
    rallow = int(eth_call(TOKEN, "0xdd62ed3e" + pad_addr(CH["respondent"]).hex() + pad_addr(HUB).hex()), 16)
    if rallow < STAKE:
        send(resp_k, TOKEN, sel("approve(address,uint256)") + pad_addr(HUB) + pad32(STAKE))
    send(resp_k, HUB, sel("counterStake(uint256)") + pad32(case_id))
    print("2c. respondent counter-staked (escrow = 1,000 RSLV)")

    # ── 3. panel: ALICE is juror A ──
    panel = [alice_addr, CH["juror3"], CH["juror4"], CH["juror5"], CH["juror6"]]
    data = sel("appointJurorPanel(uint256,address[])") + pad32(case_id) + pad32(0x40) + pad32(5) + b"".join(pad_addr(a) for a in panel)
    send(admin_k, HUB, data)
    print(f"3. panel appointed — {alice_addr[:8]}… is juror A (assigned wallet!)")

    before = {a: bal(a) for a in [CH["claimant"], CH["respondent"], alice_addr, CH["juror3"], CH["juror4"], CH["juror5"], CH["juror6"]]}

    # ── 4. ALICE votes through the backend (her wallet, backend-signed) ──
    salt = secrets.token_bytes(32)
    commitment = keccak(bytes([1]) + salt + pad32(case_id) + addr_b(alice_addr)).hex()
    r = requests.post(API + "/api/wallet/vote/commit", json={"caseId": case_id, "commitment": "0x" + commitment}, headers=auth).json()
    assert r["status"] == "SUCCESS", r
    print(f"4a. ALICE commitVote via backend → {r['txHash'][:18]}…")
    r = requests.post(API + "/api/wallet/vote/reveal", json={"caseId": case_id, "vote": 1, "salt": "0x" + salt.hex()}, headers=auth).json()
    assert r["status"] == "SUCCESS", r
    print(f"4b. ALICE revealVote via backend → {r['txHash'][:18]}…")

    # ── 5. other 4 demo jurors ──
    for name, vote in [("juror3", 1), ("juror4", 1), ("juror5", 1), ("juror6", 2)]:
        commit_reveal_demo(name, case_id, vote, secrets.token_bytes(32))

    # ── 6. settle ──
    send(admin_k, HUB, sel("settleCase(uint256)") + pad32(case_id))
    print("6. settleCase mined")

    # ── 7. assertions ──
    ok = True
    def check(label, got, want):
        nonlocal ok
        good = got == want
        ok = ok and good
        print(f"   {'✓' if good else '✗'} {label}: {got/10**18:.0f}")

    W20 = 20 * 10**18
    check("claimant +900", bal(CH["claimant"]) - before[CH["claimant"]], 900 * 10**18)
    check("respondent +0", bal(CH["respondent"]) - before[CH["respondent"]], 0)
    check("ALICE (assigned wallet) +20 reward", bal(alice_addr) - before[alice_addr], W20)
    for n in ["juror3", "juror4", "juror5", "juror6"]:
        check(f"{n} +20 reward", bal(CH[n]) - before[CH[n]], W20)
    print("═ " + ("ALL CHECKS PASSED — assigned wallet voted on-chain" if ok else "FAILURE") + " ═")
    return ok


if __name__ == "__main__":
    raise SystemExit(0 if main() else 1)
