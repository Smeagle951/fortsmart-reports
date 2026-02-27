import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: '*.arcgisonline.com' },
      { protocol: 'https', hostname: '*.esri.com' },
    ],
  },
  transpilePackages: ['leaflet'],
  outputFileTracingIncludes: {
    '/api/**/*': ['./data/**/*'],
  },

  // ✅ better-sqlite3 é uma dependência nativa Node.js — deve ser tratada
  // como externa para não ser empacotada pelo webpack (funciona em modo local).
  // Na Vercel (serverless) o banco não é acessível; o fallback mock é usado.
  serverExternalPackages: ['better-sqlite3'],

  webpack(config, { isServer }) {
    // Permite importar módulos .node nativos
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals ?? []]),
        'better-sqlite3',
      ];
    }
    return config;
  },
};

export default nextConfig;
