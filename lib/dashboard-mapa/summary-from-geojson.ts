import type { FeatureCollection } from 'geojson';

import { listTalhoesFromFc } from '@/components/mapa-talhoes/geojsonUtils';

import type { PropertySummary } from './types';

export function propertySummaryFromFeatureCollection(
  fc: FeatureCollection,
  eventsLast7Days: number,
): PropertySummary {
  const talhoes = listTalhoesFromFc(fc);
  let totalHa = 0;
  for (const t of talhoes) {
    if (t.areaHa != null) totalHa += t.areaHa;
  }
  let subareaCount = 0;
  for (const f of fc.features) {
    const p = f.properties as Record<string, unknown> | null | undefined;
    if (p && String(p.tipo) === 'subarea') subareaCount += 1;
  }
  return {
    totalHa: Math.round(totalHa * 10) / 10,
    talhaoCount: talhoes.length,
    subareaCount,
    eventsLast7Days,
  };
}
