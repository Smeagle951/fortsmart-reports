/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: '*.arcgisonline.com' },
      { protocol: 'https', hostname: '*.esri.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  transpilePackages: ['leaflet'],
};

module.exports = nextConfig;
