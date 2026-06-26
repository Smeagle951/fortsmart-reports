import type { MetadataRoute } from 'next';

/** Não publicar mapa de URLs — evita que buscadores/atacantes descubram rotas. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [];
}
