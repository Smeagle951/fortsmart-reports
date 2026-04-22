import type { Feature, FeatureCollection, GeoJsonObject } from 'geojson';

function base64UrlToUtf8(b64: string): string {
  const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
  const s = b64.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const binary = atob(s);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}

export function decodeGeoJsonFromQuery(d: string | null | undefined): FeatureCollection | null {
  if (d == null || d === '') return null;
  try {
    const json = base64UrlToUtf8(d);
    const o = JSON.parse(json) as unknown;
    if (isFeatureCollection(o)) return o;
    return null;
  } catch {
    return null;
  }
}

function isFeatureCollection(x: unknown): x is FeatureCollection {
  return (
    x !== null &&
    typeof x === 'object' &&
    (x as FeatureCollection).type === 'FeatureCollection' &&
    Array.isArray((x as FeatureCollection).features)
  );
}

export function parseJsonFileText(text: string): FeatureCollection | null {
  try {
    const o = JSON.parse(text) as unknown;
    if (isFeatureCollection(o)) return o;
    return null;
  } catch {
    return null;
  }
}

export function filterByCulturaSafra(
  fc: FeatureCollection,
  cultura: string,
  safra: string
): FeatureCollection {
  if (cultura === 'all' && safra === 'all') return fc;
  const okTalhao = new Set<string>();
  for (const f of fc.features) {
    const p = f.properties as Record<string, unknown> | null | undefined;
    if (!p || String(p.tipo) !== 'talhao') continue;
    const c = p.cultura != null ? String(p.cultura) : '';
    const s = p.safra != null ? String(p.safra) : '';
    const matchC = cultura === 'all' || c === cultura;
    const matchS = safra === 'all' || s === safra;
    if (matchC && matchS) {
      const id = String(p.talhao_id ?? f.id ?? '');
      if (id) okTalhao.add(id);
    }
  }
  return {
    ...fc,
    features: fc.features.filter((f) => {
      const p = f.properties as Record<string, unknown> | null | undefined;
      if (!p) return false;
      const tipo = String(p.tipo);
      const tid = String(p.talhao_id ?? '');
      if (tipo === 'subarea' && okTalhao.has(tid)) return true;
      if (tipo === 'talhao' && okTalhao.has(tid)) return true;
      return false;
    }),
  };
}

export type TalhaoListItem = { talhaoId: string; label: string; areaHa: number | null; cultura: string; safra: string };

export function listTalhoesFromFc(fc: FeatureCollection): TalhaoListItem[] {
  const byId = new Map<string, TalhaoListItem>();
  for (const f of fc.features) {
    const p = f.properties as Record<string, unknown> | null | undefined;
    if (!p || String(p.tipo) !== 'talhao') continue;
    const id = String(p.talhao_id ?? f.id ?? '');
    if (!id) continue;
    const label = String(p.talhao ?? p.name ?? id);
    const areaH = p.area_ha;
    const areaHa = typeof areaH === 'number' && !Number.isNaN(areaH) ? areaH : null;
    const cultura = p.cultura != null ? String(p.cultura) : '—';
    const safra = p.safra != null ? String(p.safra) : '—';
    if (!byId.has(id)) byId.set(id, { talhaoId: id, label, areaHa, cultura, safra });
  }
  return Array.from(byId.values()).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
}

export function distinctCulturasSafas(fc: FeatureCollection): { culturas: string[]; safras: string[] } {
  const cSet = new Set<string>();
  const sSet = new Set<string>();
  for (const f of fc.features) {
    const p = f.properties as Record<string, unknown> | null | undefined;
    if (!p) continue;
    if (String(p.tipo) !== 'talhao') continue;
    if (p.cultura != null && String(p.cultura).trim() !== '') cSet.add(String(p.cultura));
    if (p.safra != null && String(p.safra).trim() !== '') sSet.add(String(p.safra));
  }
  return {
    culturas: ['all', ...Array.from(cSet).sort((a, b) => a.localeCompare(b, 'pt-BR'))],
    safras: ['all', ...Array.from(sSet).sort((a, b) => a.localeCompare(b, 'pt-BR'))],
  };
}

/**
 * Só exibe feições cujo talhão (id) está selecionado; subáreas acompanham o mesmo talhao_id.
 */
export function filterBySelectedTalhoes(
  fc: FeatureCollection,
  selected: Set<string>
): FeatureCollection {
  if (selected.size === 0) {
    return { type: 'FeatureCollection', features: [] };
  }
  return {
    ...fc,
    features: fc.features.filter((f) => {
      const p = f.properties as Record<string, unknown> | null | undefined;
      if (!p) return false;
      const tid = String(p.talhao_id ?? '');
      return tid && selected.has(tid);
    }),
  };
}

export function isFeatureCollectionGj(o: GeoJsonObject): o is FeatureCollection {
  return o.type === 'FeatureCollection' && 'features' in o && Array.isArray((o as FeatureCollection).features);
}

export function downloadGeoJson(fc: FeatureCollection, filename: string) {
  const blob = new Blob([JSON.stringify(fc, null, 2)], { type: 'application/geo+json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
