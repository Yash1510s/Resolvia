import type { NextConfig } from "next";

const devOrigins = (process.env.ALLOWED_DEV_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  // Allow local development and optional container/cloud preview origins
  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
    ...devOrigins,
  ],
};

export default nextConfig;
