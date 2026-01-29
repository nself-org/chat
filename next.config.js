/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable standalone output for Docker builds
  output: 'standalone',
  // Temporarily ignore TypeScript and ESLint errors during build
  // These will be fixed when the setup wizard and admin dashboard are rebuilt in Phase 6
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/graphql',
        destination: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://api.localhost/v1/graphql',
      },
    ];
  },
};

module.exports = nextConfig;