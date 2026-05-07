import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable static optimization for pages that use cookies
  // This ensures API routes work on serverless platforms
  serverExternalPackages: [],
};

export default nextConfig;
