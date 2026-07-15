import type { TechnicalVisitSeverity } from './technicalVisitReport.types';

/** Ícones Leaflet — só importar no cliente (`MapaTalhao`). Nunca importar este ficheiro no SSR/mapper. */
import L from 'leaflet';

const MARKER_COLORS: Record<TechnicalVisitSeverity, { bg: string; border: string; shape: 'circle' | 'triangle' | 'pin' }> = {
  critical: { bg: '#DC2626', border: '#ffffff', shape: 'pin' },
  high: { bg: '#DC2626', border: '#ffffff', shape: 'pin' },
  medium: { bg: '#F59E0B', border: '#ffffff', shape: 'triangle' },
  low: { bg: '#0EA5E9', border: '#ffffff', shape: 'pin' },
  unknown: { bg: '#94A3B8', border: '#ffffff', shape: 'circle' },
};

function emojiForType(type?: string): string {
  const raw = (type ?? '').toLowerCase();
  if (raw.includes('prag')) return '🐛';
  if (raw.includes('doen')) return '🦠';
  if (raw.includes('daninh') || raw.includes('weed')) return '🌿';
  if (raw.includes('desvio')) return '⚠';
  return '📍';
}

function pinHtml(color: string, border: string, inner: string, size = 32): string {
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid ${border};box-shadow:0 2px 8px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:700;line-height:1;font-family:Inter,system-ui,sans-serif">${inner}</div>`;
}

function triangleHtml(color: string, border: string, inner: string, size = 34): string {
  return `<div style="width:0;height:0;border-left:${size / 2}px solid transparent;border-right:${size / 2}px solid transparent;border-bottom:${size}px solid ${color};filter:drop-shadow(0 2px 4px rgba(0,0,0,.35));position:relative"><span style="position:absolute;left:50%;top:55%;transform:translate(-50%,-50%);color:#fff;font-size:12px;font-weight:800">${inner}</span></div>`;
}

export function createVtPointIcon(
  severityTone: TechnicalVisitSeverity = 'unknown',
  opts: { index?: number; type?: string } = {},
): L.DivIcon {
  const palette = MARKER_COLORS[severityTone] ?? MARKER_COLORS.unknown;
  const inner = opts.index != null ? String(opts.index + 1) : emojiForType(opts.type);
  const html =
    palette.shape === 'triangle'
      ? triangleHtml(palette.bg, palette.border, inner)
      : pinHtml(palette.bg, palette.border, inner);

  const size = palette.shape === 'triangle' ? 34 : 32;
  return L.divIcon({
    html,
    className: 'vt-map-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, palette.shape === 'triangle' ? size : size / 2],
    popupAnchor: [0, palette.shape === 'triangle' ? -size + 4 : -size / 2],
  });
}

export function createPlotLabelIcon(name: string, area?: string): L.DivIcon {
  const safeName = name.replace(/</g, '&lt;');
  const safeArea = area ? area.replace(/</g, '&lt;') : '';
  const html = `<div style="pointer-events:none;text-align:center;font-family:Inter,system-ui,sans-serif;text-shadow:0 1px 3px rgba(0,0,0,.8)"><div style="font-size:15px;font-weight:800;color:#fff;letter-spacing:.02em">${safeName}</div>${safeArea ? `<div style="font-size:12px;font-weight:600;color:rgba(255,255,255,.92);margin-top:2px">${safeArea}</div>` : ''}</div>`;
  return L.divIcon({
    html,
    className: 'vt-plot-label',
    iconSize: [120, 48],
    iconAnchor: [60, 24],
  });
}
