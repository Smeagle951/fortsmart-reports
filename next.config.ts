import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * Quando o app móvel usa a URL do site Next (Vercel) como base da API FortSmart,
   * encaminha `/sync/*` para o `fortsmart-cloud-api` real (Render).
   * Defina `FORTSMART_CLOUD_API_PROXY_TARGET` na Vercel (ex.: `https://api.fortsmart-agro.com.br`).
   */
  async rewrites() {
    const raw = process.env.FORTSMART_CLOUD_API_PROXY_TARGET?.trim();
    if (!raw) return [];
    let base = raw.replace(/\/$/, '');
    if (!base.startsWith('http://') && !base.startsWith('https://')) {
      base = `https://${base}`;
    }
    return [
      {
        source: '/sync/:path*',
        destination: `${base}/sync/:path*`,
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
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
