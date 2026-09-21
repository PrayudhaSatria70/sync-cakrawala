const railwayUrl = process.env.RAILWAY_STATIC_URL
  ? (process.env.RAILWAY_STATIC_URL.startsWith('http')
      ? process.env.RAILWAY_STATIC_URL
      : `https://${process.env.RAILWAY_STATIC_URL}`)
  : null;

const publicApiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  railwayUrl ||
  'http://localhost:4000';

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@sync/shared'],
  env: {
    NEXT_PUBLIC_API_URL: publicApiUrl.replace(/\/+$/, ''),
  },
  async rewrites() {
    return [
      {
        source: '/api-proxy/:path*',
        destination: `${publicApiUrl.replace(/\/+$/, '')}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
