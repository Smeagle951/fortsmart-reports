import { describe, expect, it } from 'vitest';
import { simplifyFeatureCollection } from '../../lib/amostragem-solo/mapPerf';
import { buildTalhaoRanking } from '../../lib/amostragem-solo/multiTalhao';

describe('amostragem utils', () => {
  it('simplifica geometria mantendo feature collection válida', () => {
    const fc = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [-50, -10],
              [-49.99999, -10.00001],
              [-49.99, -10.01],
            ],
          },
          properties: {},
        },
      ],
    } as const;
    const simplified = simplifyFeatureCollection(fc as never, 0.0001);
    expect(simplified).not.toBeNull();
    expect(simplified?.features.length).toBe(1);
  });

  it('gera ranking multi-talhão com confiabilidade e criticidade', () => {
    const ranking = buildTalhaoRanking([
      { talhao_id: 'A', talhao_nome: 'Talhão A', numero: 1, compactacao: 3.8, lat: -10, lng: -50, gps_accuracy_m: 5 },
      { talhao_id: 'A', talhao_nome: 'Talhão A', numero: 2, compactacao: 3.1, lat: -10.0001, lng: -50.0001, gps_accuracy_m: 6 },
      { talhao_id: 'B', talhao_nome: 'Talhão B', numero: 1, compactacao: 1.4, lat: -11, lng: -51, gps_accuracy_m: 12 },
    ]);
    expect(ranking.length).toBe(2);
    const talhaoA = ranking.find((r) => r.talhaoId === 'A');
    expect(talhaoA?.pctAltaCritica).toBeGreaterThan(0);
  });
});

