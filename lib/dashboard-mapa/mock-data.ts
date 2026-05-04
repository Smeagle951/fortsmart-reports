import type { FeatureCollection } from 'geojson';

import { r2MonitoramentoUrl } from './constants';
import type { DashboardMonitorEvent, PropertyAlert } from './types';

/** GeoJSON de demonstração alinhado ao mock FortSmart (talhões + subáreas). */
export const DEMO_FEATURE_COLLECTION: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        talhao_id: '17',
        talhao: 'Talhão 17',
        cultura: 'Milho',
        material: 'P3707PWU',
        area_ha: 128,
        data_plantio: '22/12/2025',
        safra: '2025/26',
        estande_pl_ha: 65000,
        tipo: 'talhao',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-47.945, -15.768],
            [-47.932, -15.768],
            [-47.932, -15.762],
            [-47.945, -15.762],
            [-47.945, -15.768],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        talhao_id: '13',
        talhao: 'Talhão 13',
        cultura: 'Milho',
        material: 'BIOAGRO',
        area_ha: 182,
        data_plantio: '10/12/2025',
        safra: '2025/26',
        tipo: 'talhao',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-47.952, -15.758],
            [-47.935, -15.758],
            [-47.935, -15.748],
            [-47.952, -15.748],
            [-47.952, -15.758],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        talhao_id: '13',
        talhao: 'Talhão 13',
        cultura: 'Milho',
        material: 'Experimento',
        area_ha: 90,
        tipo: 'subarea',
        subtipo: 'Subárea A (Experimento)',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-47.952, -15.758],
            [-47.9435, -15.758],
            [-47.9435, -15.753],
            [-47.952, -15.753],
            [-47.952, -15.758],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        talhao_id: '13',
        talhao: 'Talhão 13',
        cultura: 'Milho',
        material: 'Tratamento',
        area_ha: 92,
        tipo: 'subarea',
        subtipo: 'Subárea B (Tratamento)',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-47.9435, -15.758],
            [-47.935, -15.758],
            [-47.935, -15.753],
            [-47.9435, -15.753],
            [-47.9435, -15.758],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        talhao_id: '14',
        talhao: 'Talhão 14',
        cultura: 'Milho',
        material: 'DKB240',
        area_ha: 95,
        safra: '2025/26',
        tipo: 'talhao',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-47.928, -15.772],
            [-47.918, -15.772],
            [-47.918, -15.766],
            [-47.928, -15.766],
            [-47.928, -15.772],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        talhao_id: '15',
        talhao: 'Talhão 15',
        cultura: 'Milho',
        material: 'P4285PWU',
        area_ha: 110,
        safra: '2025/26',
        tipo: 'talhao',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-47.928, -15.78],
            [-47.916, -15.78],
            [-47.916, -15.774],
            [-47.928, -15.774],
            [-47.928, -15.78],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        talhao_id: '16',
        talhao: 'Talhão 16',
        cultura: 'Milho',
        material: 'NS92',
        area_ha: 88,
        safra: '2025/26',
        tipo: 'talhao',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-47.915, -15.77],
            [-47.905, -15.77],
            [-47.905, -15.764],
            [-47.915, -15.764],
            [-47.915, -15.77],
          ],
        ],
      },
    },
  ],
};

export const DEMO_MONITOR_EVENTS: DashboardMonitorEvent[] = [
  {
    id: 'ev-lagarta-17',
    title: 'Lagarta-do-cartucho',
    subtitle: 'Spodoptera frugiperda',
    talhaoLabel: 'Talhão 17',
    areaLabel: 'Área SE',
    lat: -15.7645,
    lng: -47.939,
    pinKind: 'pest_high',
    severity: 'alto',
    type: 'praga',
    dateIso: '2026-04-28',
    evaluator: 'Jeferson Silva',
    observation:
      'Infestação alta em folhas medianas; presença de várias lagartas por planta. Lavoura em V6. Recomenda-se monitoramento ampliado e avaliação de controle.',
    imageUrl: r2MonitoramentoUrl('ev-lagarta-17'),
    specs: [
      { label: 'Estande', value: '65.000 pl/ha' },
      { label: 'DAP', value: '121' },
      { label: 'DAE', value: '118' },
      { label: 'Plantio', value: '22/12/2025' },
      { label: 'Híbrido', value: 'P3707PWU' },
      { label: 'Cultura', value: 'Milho' },
    ],
  },
  {
    id: 'ev-pulgao-16',
    title: 'Pulgão',
    talhaoLabel: 'Talhão 16',
    areaLabel: 'Área NE',
    lat: -15.767,
    lng: -47.912,
    pinKind: 'pest_med',
    severity: 'medio',
    type: 'praga',
    dateIso: '2026-04-27',
    evaluator: 'Jeferson Silva',
    observation: 'Colônias em folhas novas; incidência média.',
    imageUrl: r2MonitoramentoUrl('ev-pulgao-16'),
    specs: [
      { label: 'Cultura', value: 'Milho' },
      { label: 'Talhão', value: 'Talhão 16' },
    ],
  },
  {
    id: 'ev-ferrugem-14',
    title: 'Ferrugem polifólica',
    talhaoLabel: 'Talhão 14',
    areaLabel: 'Área central',
    lat: -15.769,
    lng: -47.923,
    pinKind: 'disease',
    severity: 'medio',
    type: 'doenca',
    dateIso: '2026-04-26',
    evaluator: 'Equipe técnica',
    observation: 'Lesões iniciais em folhas inferiores.',
    imageUrl: r2MonitoramentoUrl('ev-ferrugem-14'),
    specs: [{ label: 'Cultura', value: 'Milho' }],
  },
  {
    id: 'ev-ok-15',
    title: 'Monitoramento — sem alerta',
    talhaoLabel: 'Talhão 15',
    areaLabel: 'Área NW',
    lat: -15.777,
    lng: -47.922,
    pinKind: 'normal',
    severity: 'baixo',
    type: 'normal',
    dateIso: '2026-04-25',
    evaluator: 'Equipe técnica',
    observation: 'Lavoura em bom estado fitossanitário.',
    imageUrl: r2MonitoramentoUrl('ev-ok-15'),
    specs: [{ label: 'Cultura', value: 'Milho' }],
  },
];

export const DEMO_PROPERTY_ALERTS: PropertyAlert[] = [
  {
    id: 'a1',
    message: 'Alta incidência de pragas',
    talhaoLabel: 'Talhão 17',
    tone: 'danger',
  },
  {
    id: 'a2',
    message: 'Doença detectada',
    talhaoLabel: 'Talhão 13',
    tone: 'warning',
  },
];
