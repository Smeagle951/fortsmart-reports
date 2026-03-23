import type { FeatureCollection, Point } from 'geojson';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const shpwrite = require('shp-write') as {
  zip: (geojson: FeatureCollection, options?: { folder?: string; types?: Record<string, string> }) => ArrayBuffer | Buffer;
};

/** Atributos para GIS — sem imagem / URL. */
export function toShpFeatureCollection(fc: FeatureCollection): FeatureCollection {
  const features = fc.features.map((f) => {
    const p = (f.properties ?? {}) as Record<string, unknown>;
    const coords =
      f.geometry?.type === 'Point' ? (f.geometry as Point).coordinates : [0, 0];
    const lng = coords[0] as number;
    const lat = coords[1] as number;
    const compac = p.compactacao != null ? Number(p.compactacao) : 0;
    return {
      type: 'Feature' as const,
      geometry: f.geometry,
      properties: {
        id: Number(p.numero) || 0,
        profund: String(p.profundidade ?? ''),
        compac,
        classe: String(p.classificacao ?? ''),
        lat,
        lng,
        obs: String(p.obs ?? ''),
      },
    };
  });
  return { type: 'FeatureCollection', features };
}

export function buildShpZipBuffer(fc: FeatureCollection): Buffer {
  const clean = toShpFeatureCollection(fc);
  const buf = shpwrite.zip(clean, {
    folder: 'fortsmart_amostragem',
    types: { point: 'pontos' },
  });
  if (Buffer.isBuffer(buf)) return buf;
  if (buf instanceof ArrayBuffer) return Buffer.from(buf);
  return Buffer.from(new Uint8Array(buf as ArrayBuffer));
}
