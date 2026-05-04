import type { FeatureCollection } from 'geojson';

export type DashboardMapRenderMode = 'standard' | 'cluster' | 'heatmap_or_cluster';

export function shouldClusterEvents(eventsCount: number): boolean {
  return eventsCount > 250;
}

export function shouldSimplifyGeoJson(featuresCount: number): boolean {
  return featuresCount > 1000;
}

export function getRecommendedRenderMode(params: {
  eventsCount: number;
  featuresCount?: number;
}): DashboardMapRenderMode {
  if (params.eventsCount > 500) return 'heatmap_or_cluster';
  if (shouldClusterEvents(params.eventsCount)) return 'cluster';
  return 'standard';
}

export function countGeoJsonFeatures(fc: FeatureCollection | null | undefined): number {
  return fc?.features?.length ?? 0;
}
