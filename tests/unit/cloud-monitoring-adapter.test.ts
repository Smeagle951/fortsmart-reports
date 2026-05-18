import { describe, expect, it } from 'vitest';

import {
  coordNum,
  coordsPairFromRecord,
  monitoringImageDisplayHint,
  normalizeMonitoringWindowsPayload,
  selectMonitoringPointFeatures,
  selectMonitoringTimelineGroups,
} from '@/lib/cloud-monitoring/adapter';

describe('cloud-monitoring adapter', () => {
  it('coordNum aceita strings com vírgula decimal', () => {
    expect(coordNum('-15,12345')).toBeCloseTo(-15.12345);
    expect(coordNum('0')).toBe(0);
    expect(coordNum('')).toBeNull();
  });

  it('coordsPairFromRecord lê location Point (GeoJSON)', () => {
    const p = coordsPairFromRecord({
      location: { type: 'Point', coordinates: [-48.1, -22.2] },
    });
    expect(p).toEqual({ lat: -22.2, lng: -48.1 });
  });

  it('coordsPairFromRecord lê lat/lng alternativos', () => {
    expect(coordsPairFromRecord({ lat: '-10,5', lng: '-50.25' })).toEqual({ lat: -10.5, lng: -50.25 });
  });

  it('payload parcial: listas nulas e reports vazios', () => {
    const n = normalizeMonitoringWindowsPayload({
      success: true,
      data: {
        farm_id: 'f1',
        summary: {},
        plots: [
          {
            plot_name: 'T1',
            timeline: [
              null,
              { points: null, summary: {} },
              {
                monitoring_date: '2025-01-01',
                summary: { ok: true },
                points: [],
              },
              {
                monitoring_date: '2025-02-01',
                points: [
                  {
                    latitude: '-12,5',
                    longitude: '-45.2',
                    occurrences: null,
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    expect(n.plots[0]?.timeline.length).toBe(2);
    const groups = selectMonitoringTimelineGroups(n);
    expect(groups[0]?.reports.length).toBe(2);
    const fc = selectMonitoringPointFeatures(n);
    expect(fc.features.length).toBe(1);
    expect(fc.features[0]?.geometry).toEqual({ type: 'Point', coordinates: [-45.2, -12.5] });
  });

  it('ponto sem coordenada não entra no mapa mas aparece em estrutura', () => {
    const n = normalizeMonitoringWindowsPayload({
      data: {
        plots: [
          {
            plot_name: 'X',
            timeline: [
              {
                monitoring_date: '2025-03-01',
                summary: { a: 1 },
                points: [{ latitude: null, longitude: '', occurrences: [{ name: 'Pulgão', images: [] }] }],
              },
            ],
          },
        ],
      },
    });
    expect(selectMonitoringPointFeatures(n).features.length).toBe(0);
    expect(n.points.length).toBe(1);
    expect(n.points[0]?.latitude).toBeNull();
  });

  it('imagem cloud_url null → upload pendente', () => {
    const hint = monitoringImageDisplayHint({
      cloud_url: null,
      local_file_path: null,
    });
    expect(hint.mode).toBe('pending_cloud');
  });

  it('imagem expirada sem local_file_path', () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    const hint = monitoringImageDisplayHint({
      cloud_url: 'https://example.com/x.jpg',
      cloud_expires_at: past,
      local_file_path: null,
    });
    expect(hint.mode).toBe('expired');
  });

  it('timeline não inclui reports totalmente vazios após normalização', () => {
    const n = normalizeMonitoringWindowsPayload({
      data: {
        plots: [
          {
            plot_name: 'T',
            timeline: [
              { monitoring_date: '2025-01-01', summary: {}, points: [] },
              {
                monitoring_date: '2025-01-02',
                summary: {},
                points: [{ latitude: 1, longitude: 2, occurrences: [] }],
              },
            ],
          },
        ],
      },
    });
    expect(n.plots[0]?.timeline.length).toBe(1);
  });

  it('plot_geojson no relatório vira contorno no mapa + marcador', () => {
    const poly = {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
          [0, 0],
        ],
      ],
    };
    const n = normalizeMonitoringWindowsPayload({
      data: {
        plots: [
          {
            plot_name: 'Talhão A',
            timeline: [
              {
                monitoring_date: '2025-06-01',
                summary: { ok: true },
                plot_geojson: poly,
                points: [
                  {
                    local_id: 'p1',
                    latitude: -12,
                    longitude: -45,
                    occurrences: [{ name: 'Lagarta', risk_level: 'alto', images: [] }],
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    const fc = selectMonitoringPointFeatures(n);
    expect(fc.features.some((f) => f.geometry?.type === 'Polygon')).toBe(true);
    expect(fc.features.some((f) => f.geometry?.type === 'Point')).toBe(true);
  });

  it('ocorrências com GPS distinto do ponto geram marcadores separados', () => {
    const n = normalizeMonitoringWindowsPayload({
      data: {
        plots: [
          {
            plot_name: 'T',
            timeline: [
              {
                monitoring_date: '2025-04-01',
                summary: { x: 1 },
                points: [
                  {
                    latitude: 0,
                    longitude: 0,
                    occurrences: [
                      {
                        name: 'A',
                        risk_level: 'baixo',
                        latitude: 1,
                        longitude: 1,
                        images: [],
                      },
                      {
                        name: 'B',
                        risk_level: 'alto',
                        latitude: 2,
                        longitude: 2,
                        images: [],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    const pts = selectMonitoringPointFeatures(n).features.filter((f) => f.geometry?.type === 'Point');
    expect(pts.length).toBe(2);
  });
});
