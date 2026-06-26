import type { MetadataRoute } from 'next';

/**
 * Bloqueia indexação de todo o portal (relatórios privados por token).
 * Importante: NÃO listar /admin, /api etc. em Disallow — isso só ajuda atacantes
 * a descobrir caminhos. Um único Disallow: / é suficiente.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: '/',
    },
  };
}
