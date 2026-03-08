/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silence Prisma edge runtime warnings in Next.js build output
  serverExternalPackages: ["@prisma/client", "prisma"],
  // Produce a standalone server bundle for the Docker image
  output: "standalone",
};

export default nextConfig;
