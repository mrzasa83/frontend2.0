/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable CORS for API routes
  async headers() {
    return [
      {
        // Apply to all API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ]
  },
  
  // Suppress specific warnings
  typescript: {
    // Allow production builds to succeed even with type errors (for development)
    ignoreBuildErrors: false,
  },
  
  eslint: {
    // Allow production builds to succeed even with ESLint errors
    ignoreDuringBuilds: false,
  },
  
  // Experimental features
  experimental: {
    // Improve performance
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
}

module.exports = nextConfig
