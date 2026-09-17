import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the sandbox preview host to load dev resources (HMR, fonts, etc.).
  // Preview URLs follow the pattern: {port}-{sandboxId}.e2b.app
  allowedDevOrigins: [
    "3000-i1ie2023w4zagaf97yvcn.e2b.app",
    "3000-ig56cyynhn77r9e0lehhb.e2b.app",
  ],
};

export default nextConfig;
