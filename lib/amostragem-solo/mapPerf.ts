import type { Feature, FeatureCollection, Position } from 'geojson';

function sqDist(a: Position, b: Position): number {
  const dx = (a[0] ?? 0) - (b[0] ?? 0);
  const dy = (a[1] ?? 0) - (b[1] ?? 0);
  return dx * dx + dy * dy;
}

function simplifyLine(points: Position[], tolerance: number): Position[] {
  if (points.length <= 3) return points;
  const out: Position[] = [points[0]!];
  let last = points[0]!;
  const tol2 = tolerance * tolerance;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i]!;
    if (sqDist(last, p) >= tol2) {
      out.push(p);
      last = p;
    }
  }
  out.push(points[points.length - 1]!);
  return out;
}

function simplifyFeature(feature: Feature, tolerance: number): Feature {
  if (!feature.geometry) return feature;
  const g = feature.geometry;
  if (g.type === 'LineString') {
    return { ...feature, geometry: { ...g, coordinates: simplifyLine(g.coordinates, tolerance) } };
  }
  if (g.type === 'Polygon') {
    return {
      ...feature,
      geometry: {
        ...g,
        coordinates: g.coordinates.map((ring) => simplifyLine(ring, tolerance)),
      },
    };
  }
  if (g.type === 'MultiPolygon') {
    return {
      ...feature,
      geometry: {
        ...g,
        coordinates: g.coordinates.map((poly) => poly.map((ring) => simplifyLine(ring, tolerance))),
      },
    };
  }
  return feature;
}

export function simplifyFeatureCollection(
  fc: FeatureCollection | null | undefined,
  tolerance = 0.00001,
): FeatureCollection | null {
  if (!fc || fc.type !== 'FeatureCollection' || !Array.isArray(fc.features)) return null;
  return {
    type: 'FeatureCollection',
    features: fc.features.map((f) => simplifyFeature(f, tolerance)),
  };
}

