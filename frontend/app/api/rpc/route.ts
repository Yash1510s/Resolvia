import { NextRequest, NextResponse } from "next/server";

/**
 * JSON-RPC reverse proxy: browser -> /api/rpc -> Hardhat node (127.0.0.1:8545).
 *
 * The browser can never call localhost inside the sandbox, so every ethers
 * request is forwarded here server-side.
 */
const RPC_URL = process.env.HARDHAT_RPC_URL || "http://127.0.0.1:8545";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  try {
    const upstream = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32603,
          message: `Hardhat node unreachable (${String(err)}). Run: cd blockchain && npm run node`,
        },
      },
      { status: 502 }
    );
  }
}
