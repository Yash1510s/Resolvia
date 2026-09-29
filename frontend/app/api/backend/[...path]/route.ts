import { NextRequest, NextResponse } from "next/server";

/**
 * Reverse proxy: browser -> /api/backend/<path> -> FastAPI backend (127.0.0.1:8000).
 * Auth (email OTP / Google) + custodial wallet + wallet-signed voting.
 */
const BACKEND_URL = process.env.RESOLVIA_BACKEND_URL || "http://127.0.0.1:8000";

export const dynamic = "force-dynamic";

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const qs = req.nextUrl.searchParams.toString();
  const url = `${BACKEND_URL}/api/${path.join("/")}${qs ? `?${qs}` : ""}`;

  const headers: Record<string, string> = {};
  const ct = req.headers.get("content-type");
  if (ct) headers["content-type"] = ct;
  const auth = req.headers.get("authorization");
  if (auth) headers["authorization"] = auth;

  const body = req.method === "GET" || req.method === "HEAD" ? undefined : await req.text();

  try {
    const upstream = await fetch(url, { method: req.method, headers, body, cache: "no-store" });
    const contentType = upstream.headers.get("content-type") || "application/json";

    // Direct SSE streaming without buffering into text
    if (contentType.includes("text/event-stream") && upstream.body) {
      return new NextResponse(upstream.body, {
        status: upstream.status,
        headers: {
          "content-type": "text/event-stream; charset=utf-8",
          "cache-control": "no-cache, no-transform",
          "connection": "keep-alive",
          "x-accel-buffering": "no",
        },
      });
    }

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { "content-type": contentType },
    });
  } catch (err) {
    return NextResponse.json(
      { detail: `Backend unreachable (${(err as Error).message}) — is the FastAPI server running on :8000?` },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
