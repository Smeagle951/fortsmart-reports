/**
 * Dashboard mapa — constantes e URLs auxiliares.
 *
 * ## Fonte de dados (não confundir)
 *
 * - **Relatório / monitoramento / perfil / fotos ligadas ao registo:** vêm do **SQL do app**
 *   (persistido pelo backend; a web só pede e renderiza o JSON já guardado — mesmo fluxo que `/r/[token]`).
 *   Nada disso é “inventado” no frontend nem depende de ficheiros externos genéricos.
 * - **GeoJSON / KML (e similares):** fluxo **à parte**, tipicamente ficheiros no **cloud** (ex. Cloudflare R2).
 *   Esse bucket **não** substitui o SQL para dados de negócio nem para fotos do monitoramento no relatório.
 * - **Tiles de mapa (Esri, MapTiler):** apenas camada cartográfica de fundo; não são dados da fazenda.
 *
 * Manter esta distinção evita assumir R2/Storage “genérico” onde a verdade é sempre o payload do relatório (SQL).
 */
import type { MapEventPinKind } from './types';

/** Paleta centralizada — dashboard GIS + legenda de eventos */
export const COLORS = {
  /** Sidebar gradiente (topo / base) */
  primary: '#0B2E1D',
  secondary: '#103C26',
  /** Preenchimento talhão “normal” no mapa premium */
  talhao: '#4CAF50',
  /** Talhão / subárea experimental ou ensaio */
  experimental: '#D4AF37',
  fortGreen: '#137A35',
  fortGreenLight: '#E8F5EB',
  talhaoNormal: '#4CAF50',
  talhaoExperimental: '#D4AF37',
  talhaoBorder: '#FFFFFF',
  pragaAlta: '#C62828',
  pragaMedia: '#E65100',
  doenca: '#6A1B9A',
  normal: '#2E7D32',
  chuva: '#2F80ED',
  plantio: '#9C6B3B',
  pageBg: '#F4F7F4',
  cardBg: '#FFFFFF',
  muted: '#6B7280',
  border: '#E5E7EB',
  strokeMap: '#ffffff',
  fillTalhao: 'rgba(76, 175, 80, 0.35)',
  fillExperimental: 'rgba(212, 175, 55, 0.4)',
  fillSubareaStroke: 'rgba(255, 255, 255, 0.95)',
  fillSubarea: 'rgba(255, 255, 255, 0.18)',
} as const;

export const SEVERITY_BADGE_CLASS = {
  alto: 'border-red-200 bg-red-50 text-red-700',
  medio: 'border-amber-200 bg-amber-50 text-amber-700',
  baixo: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  normal: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  doenca: 'border-purple-200 bg-purple-50 text-purple-700',
} as const;

export const TILE_DEFAULTS = {
  attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
} as const;

/** MapTiler ou outro fornecedor — opcional */
export const TILE_ENV = {
  maptilerKey: process.env.NEXT_PUBLIC_MAPTILER_KEY?.trim() || '',
} as const;

export function tileUrlFromEnv(): { url: string; attribution: string } {
  if (TILE_ENV.maptilerKey) {
    return {
      url: `https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${TILE_ENV.maptilerKey}`,
      attribution: '<a href="https://www.maptiler.com/">MapTiler</a>',
    };
  }
  return TILE_DEFAULTS;
}

export function pinColorForKind(kind: MapEventPinKind): string {
  switch (kind) {
    case 'pest_high':
      return COLORS.pragaAlta;
    case 'pest_med':
      return COLORS.pragaMedia;
    case 'disease':
      return COLORS.doenca;
    default:
      return COLORS.normal;
  }
}

/**
 * Base pública para **ativos geográficos no cloud** (GeoJSON, KML, exports partilhados).
 * Não usar como origem de fotos de monitoramento do relatório — essas resolvem-se a partir do **payload SQL**
 * (`resolveReportPhotoSrc`, paridade com o relatório web).
 */
export const DASHBOARD_R2_MEDIA_BASE =
  process.env.NEXT_PUBLIC_FORTSMART_R2_MEDIA_BASE?.replace(/\/$/, '') ||
  'https://pub-placeholder.r2.dev/monitoramentos';

export const DASHBOARD_SAFRAS = ['2024/25', '2025/26', '2026/27'] as const;

export const DASHBOARD_CULTURAS = ['Todas', 'Milho', 'Soja', 'Algodão', 'Cana'] as const;

/**
 * Monta URL para ficheiro no bucket geográfico (ex. R2). **Não** representa foto de monitoramento do SQL;
 * uso legado/demo ou anexos vetoriais — fotos reais do app vêm do JSON do relatório.
 */
export function r2MonitoramentoUrl(id: string, ext = 'jpg'): string {
  const safe = id.replace(/[^a-zA-Z0-9/_-]/g, '');
  return `${DASHBOARD_R2_MEDIA_BASE}/${safe}.${ext}`;
}
