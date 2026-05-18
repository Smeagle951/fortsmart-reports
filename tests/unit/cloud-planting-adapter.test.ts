import { describe, expect, it } from 'vitest';

import {
  expandLooseGeoJsonToFeatures,
  normalizePlantingWindowsPayload,
  selectPlantingGeoFeatureCollection,
  unwrapWindowsPlantingBody,
} from '@/lib/cloud-planting/adapter';

describe('cloud-planting adapter', () => {
  it('unwrapWindowsPlantingBody lê success + data', () => {
    const body = { success: true, data: { farm_id: 'x', summary: {}, plots: [] } };
    expect(unwrapWindowsPlantingBody(body)?.farm_id).toBe('x');
  });

  it('normaliza payload parcial sem lançar', () => {
    const n = normalizePlantingWindowsPayload({
      data: {
        farm_id: 'f1',
        summary: { total_plantings: '2' },
        plots: [
          {
            plot_name: 'T1',
            subareas: [
              {
                subarea_name: 'S1',
                records: [
                  null,
                  { planting: null },
                  {
                    stand_evaluations: null,
                    cv_records: undefined,
                    geo_exports: [{ geojson: null, kml_text: null }],
                    images: [{}],
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    expect(n.farm_id).toBe('f1');
    expect(n.summary.total_plantings).toBe(2);
    expect(n.plots[0]?.subareas[0]?.records.length).toBe(3);
    expect(n.plots[0]?.subareas[0]?.records[2]?.stand_evaluations).toEqual([]);
    const fc = selectPlantingGeoFeatureCollection(n);
    expect(fc.type).toBe('FeatureCollection');
    expect(fc.features).toEqual([]);
  });

  it('aceita GeoJSON em plot_geojson', () => {
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
    const n = normalizePlantingWindowsPayload({
      data: {
        plots: [
          {
            plot_name: 'P',
            subareas: [
              {
                subarea_name: 'Sub',
                records: [{ planting: { plot_geojson: poly } }],
              },
            ],
          },
        ],
      },
    });
    const fc = selectPlantingGeoFeatureCollection(n);
    expect(fc.features.length).toBe(1);
    expect(fc.features[0]?.geometry).toEqual(poly);
  });

  it('aceita plot_geojson como string JSON (API/SQLite)', () => {
    const poly = {
      type: 'Polygon',
      coordinates: [
        [
          [-47, -22],
          [-47.01, -22],
          [-47.01, -22.01],
          [-47, -22.01],
          [-47, -22],
        ],
      ],
    };
    const n = normalizePlantingWindowsPayload({
      data: {
        plots: [
          {
            plot_name: 'P',
            subareas: [
              {
                subarea_name: 'Sub',
                records: [{ planting: { plot_geojson: JSON.stringify(poly) } }],
              },
            ],
          },
        ],
      },
    });
    const fc = selectPlantingGeoFeatureCollection(n);
    expect(fc.features.length).toBe(1);
    expect(fc.features[0]?.geometry).toEqual(poly);
  });

  it('aceita geo_exports.geojson como FeatureCollection', () => {
    const fcIn = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'A' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [2, 0],
                [2, 2],
                [0, 2],
                [0, 0],
              ],
            ],
          },
        },
      ],
    };
    const n = normalizePlantingWindowsPayload({
      data: {
        plots: [
          {
            plot_name: 'P',
            subareas: [
              {
                subarea_name: 'S',
                records: [
                  {
                    planting: {},
                    geo_exports: [{ geojson: fcIn, file_name: 'x.geojson' }],
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    const fc = selectPlantingGeoFeatureCollection(n);
    expect(fc.features.length).toBe(1);
    expect(fc.features[0]?.properties?.name).toBe('A');
    expect(fc.features[0]?.properties?.layer).toBe('geo_export');
  });

  it('expandLooseGeoJsonToFeatures retorna vazio para string inválida', () => {
    expect(expandLooseGeoJsonToFeatures('not-json', { layer: 'x' })).toEqual([]);
  });
});
