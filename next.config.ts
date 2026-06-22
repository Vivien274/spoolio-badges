import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Ensure service_role key never leaks to the client bundle
  serverExternalPackages: ['bcryptjs'],
  experimental: {
    serverActions: {
      bodySizeLimit: '8mb',
    },
  },
}

export default nextConfig
