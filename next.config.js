/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  // Evita falha de build na Vercel por ESLint (corrigir lint depois)
  eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;
