import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import path from "path";

/**
 * Serves the deployment manifest (blockchain/deployments/local.json or sepolia.json).
 * Supports dynamic selection via query param (?network=sepolia) or NEXT_PUBLIC_NETWORK / DEPLOYMENT_NETWORK.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedNetwork = (
    searchParams.get("network") ||
    process.env.NEXT_PUBLIC_NETWORK ||
    process.env.DEPLOYMENT_NETWORK ||
    ""
  ).toLowerCase();

  const isSepolia = requestedNetwork.includes("sepolia") || requestedNetwork === "11155111";
  const primaryManifest = isSepolia ? "sepolia.json" : "local.json";
  const fallbackManifest = isSepolia ? "local.json" : "sepolia.json";

  const getCandidates = (manifestName: string) => [
    path.join(process.cwd(), "..", "blockchain", "deployments", manifestName),
    path.join(process.cwd(), "blockchain", "deployments", manifestName),
    path.join(process.cwd(), "public", "deployments", manifestName),
  ];

  let file = getCandidates(primaryManifest).find((f) => existsSync(f));
  if (!file) {
    file = getCandidates(fallbackManifest).find((f) => existsSync(f));
  }

  if (!file) {
    return NextResponse.json(
      {
        status: "NO_DEPLOYMENT",
        hint: isSepolia
          ? "Sepolia deployment manifest not found. Run: cd blockchain && npx hardhat run scripts/deploy-sepolia.js --network sepolia"
          : "Local deployment manifest not found. Run: cd blockchain && npm run node && npm run deploy:local",
      },
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
