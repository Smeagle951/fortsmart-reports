/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  eslint: { ignoreDuringBuilds: true }
};

module.exports = nextConfig;
