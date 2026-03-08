/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silence Prisma edge runtime warnings in Next.js build output
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
