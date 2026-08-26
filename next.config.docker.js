/** @type {import('next').NextConfig} */
// basePath must match the nginx location this instance is served under.
// Hardcoding it means a second instance (e.g. /fe2dev) serves its assets from
// /frontend2.0 and 404s everything, so it comes from the build environment.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/frontend2.0'

const nextConfig = {
  basePath,
  output: 'standalone',
  async headers() {
    return [
      {
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
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  // Keep child_process as a real Node.js require (not stubbed by webpack)
  serverExternalPackages: ['child_process', 'ssh2'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || []
      if (Array.isArray(config.externals)) {
        config.externals.push('child_process', 'ssh2')
      }
    }
    return config
  },
}
module.exports = nextConfig
