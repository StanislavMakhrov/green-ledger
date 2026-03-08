
const nextConfig = {
  // Output standalone bundle for Docker deployment
  output: 'standalone',
  // Disable ESLint during build (we run it separately in CI)
  eslint: {
    ignoreDuringBuilds: false,
  },
}

export default nextConfig
