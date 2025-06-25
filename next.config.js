/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/supabase/:path*',
        destination: 'http://localhost:8080/:path*', // 你的代理服务器地址
      },
    ]
  },
}

module.exports = nextConfig 