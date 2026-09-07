import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import path from "path";

/**
 * Serves the local deployment manifest (blockchain/deployments/local.json),
 * written by `cd blockchain && npm run deploy:local`.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const file = path.join(process.cwd(), "..", "blockchain", "deployments", "local.json");
  if (!existsSync(file)) {
    return NextResponse.json(
      { status: "NO_DEPLOYMENT", hint: "Run: cd blockchain && npm run node && npm run deploy:local" },
      { status: 404 }
    );
  }
  try {
    const json = JSON.parse(readFileSync(file, "utf8"));
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ status: "INVALID_MANIFEST" }, { status: 500 });
  }
}
