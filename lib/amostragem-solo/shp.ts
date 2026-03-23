import type { FeatureCollection, Point } from 'geojson';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const shpwrite = require('shp-write') as {
  zip: (geojson: FeatureCollection, options?: { folder?: string; types?: Record<string, string> }) => ArrayBuffer | Buffer;
};

/** Limita texto para atributos DBF (evita registros excessivos). */
function trunc(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : t.slice(0, max - 1) + '…';
}

/**
 * Atributos para GIS — sem URL de imagem.
 * Nomes de campo ≤ 10 caracteres (shapefile/DBF).
 */
export function toShpFeatureCollection(fc: FeatureCollection): FeatureCollection {
  const features = fc.features.map((f) => {
    const p = (f.properties ?? {}) as Record<string, unknown>;
    const coords =
      f.geometry?.type === 'Point' ? (f.geometry as Point).coordinates : [0, 0];
    const lng = coords[0] as number;
    const lat = coords[1] as number;
    const compac = p.compactacao != null ? Number(p.compactacao) : 0;
    const profund = String(p.profundidade ?? '');
    const ptName = p.point_name != null ? String(p.point_name) : '';
    const talNm = p.talhao_nome != null ? String(p.talhao_nome) : '';
    const talId = p.talhao_id != null ? String(p.talhao_id) : '';
    const smp = p.sample_code != null ? String(p.sample_code) : '';
    const moist = p.moisture_percent != null ? Number(p.moisture_percent) : null;
    const bulk = p.bulk_density != null ? Number(p.bulk_density) : null;
    const top = p.depth_top_cm != null ? Number(p.depth_top_cm) : null;
    const bot = p.depth_bottom_cm != null ? Number(p.depth_bottom_cm) : null;

    return {
      type: 'Feature' as const,
      geometry: f.geometry,
      properties: {
        NUM_PT: Number(p.numero) || 0,
        PROF_CAM: trunc(profund, 80),
        IC_MPA: compac,
        REST_FIS: trunc(String(p.classificacao ?? ''), 40),
        LAT_DD: lat,
        LNG_DD: lng,
        OBSERV: trunc(String(p.obs ?? ''), 254),
        TAL_ID: trunc(talId, 36),
        TAL_NM: trunc(talNm, 120),
        PT_NM: trunc(ptName, 80),
        SMPCOD: trunc(smp, 40),
        H2O_PC: moist != null && Number.isFinite(moist) ? moist : null,
        DNS_AP: bulk != null && Number.isFinite(bulk) ? bulk : null,
        TOP_CM: top != null && Number.isFinite(top) ? top : null,
        BOT_CM: bot != null && Number.isFinite(bot) ? bot : null,
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
