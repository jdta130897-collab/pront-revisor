/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Allow cross-origin dev requests from any origin (useful when accessing via IP like 172.30.80.1)
  allowedDevOrigins: ['*'],
};

export default nextConfig;