import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Puppeteer and libsql must not be bundled by Next.js — they use native modules
  serverExternalPackages: ["puppeteer", "@libsql/client"],
};

export default nextConfig;
