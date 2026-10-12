const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Browser memanggil /api/* di Next.js, lalu diteruskan ke backend Express
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${BACKEND_URL}/:path*` }]
  },
}

export default nextConfig
