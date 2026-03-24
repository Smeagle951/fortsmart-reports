'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FeatureCollection, GeoJsonObject, Point } from 'geojson';
import {
  computeCompactacaoAnalytics,
  computeSamplingQuality,
} from '@/lib/amostragem-solo/compactacaoAnalytics';
import {
  buildCompactacaoDiagnostico,
  buildDiagnosticoAgronomicoBreve,
  buildRecomendacoesCompactacao,
} from '@/lib/amostragem-solo/diagnostics';
import { IC_LEGEND_ROWS } from '@/lib/amostragem-solo/mpa';
import {
  getFeatureCollection,
  type AmostragemObservacao,
  type AmostragemSoloPayload,
} from '@/lib/amostragem-solo/payload';

type Props = {
  payload: Record<string, unknown>;
  shareToken: string;
};

/** Paleta e tipografia — relatório técnico agronómico (dados reais do módulo; sem placeholders). */
const ag = {
  fontTitle: '"Source Serif 4", "Georgia", "Times New Roman", serif',
  fontBody: '"Source Sans 3", "Segoe UI", system-ui, sans-serif',
  paper: '#f7f4ee',
  paper2: '#efe9df',
  ink: '#1c1917',
  inkMuted: '#57534e',
  forest: '#1a3d2e',
  forest2: '#0f2419',
  border: '#d6d3cd',
  card: '#fffcf7',
} as const;

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || 'TiQt1yLZoL6EmShd1flj';
const MAPTILER_SATELLITE_URL = `https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`;

function labelTipoColeta(raw: unknown): string {
  const s = String(raw ?? '');
  if (s === 'compactacao') return 'Levantamento de compactação do solo';
  if (s === 'solos') return 'Amostragem de solos';
  return s ? s.replace(/_/g, ' ') : '';
}

function labelModoColeta(raw: unknown): string {
  const s = String(raw ?? '');
  if (s === 'manual') return 'Pontos definidos no mapa';
  if (s === 'caminhada') return 'Trajeto contínuo (GPS)';
  return s || '';
}

function colorForClass(c: string | undefined): string {
  switch (c) {
    case 'Crítica':
      return '#dc2626';
    case 'Alta':
      return '#ea580c';
    case 'Moderada':
      return '#ca8a04';
    case 'Baixa':
      return '#16a34a';
    default:
      return '#64748b';
  }
}

function colorForDepth(prof: string | null | undefined): string {
  const s = String(prof ?? '').toLowerCase();
  if (s.startsWith('0-10')) return '#38bdf8';
  if (s.startsWith('10-20')) return '#22c55e';
  if (s.startsWith('20-30')) return '#f59e0b';
  if (s.startsWith('30-40')) return '#f97316';
  if (s.startsWith('40-50')) return '#a855f7';
  return '#475569';
}

function escapeTooltipText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default function RelatorioAmostragemSoloContent({ payload, shareToken }: Props) {
  const p = payload as unknown as AmostragemSoloPayload;
  const meta = (p.meta ?? {}) as Record<string, unknown>;
  const observacoes = useMemo(() => (Array.isArray(p.observacoes) ? p.observacoes : []) as AmostragemObservacao[], [p.observacoes]);
  const fc = useMemo(() => getFeatureCollection(p), [p]);

  const isolinesFc = useMemo((): FeatureCollection | null => {
    const prem = p.premium as Record<string, unknown> | undefined;
    const gj = prem?.isolines_geojson as FeatureCollection | undefined;
    if (gj && gj.type === 'FeatureCollection' && Array.isArray(gj.features) && gj.features.length > 0) {
      return gj;
    }
    return null;
  }, [p.premium]);

  const [selectedTalhao, setSelectedTalhao] = useState<string>('');
  const [showHeat, setShowHeat] = useState(false);
  const [showIsolines, setShowIsolines] = useState(true);
  const [showTalhaoLabels, setShowTalhaoLabels] = useState(true);
  const [selected, setSelected] = useState<AmostragemObservacao | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<import('leaflet').Map | null>(null);
  const clusterRef = useRef<import('leaflet').LayerGroup | null>(null);
  const heatRef = useRef<import('leaflet').Layer | null>(null);
  const isolineLayerRef = useRef<import('leaflet').Layer | null>(null);
  const talhoesLayerRef = useRef<import('leaflet').Layer | null>(null);
  const rotaLayerRef = useRef<import('leaflet').Layer | null>(null);
  const talhaoLabelLayerRef = useRef<import('leaflet').Layer | null>(null);
  const rotaDirectionLayerRef = useRef<import('leaflet').Layer | null>(null);

  const filteredObs = useMemo(() => {
    if (!selectedTalhao) return observacoes;
    return observacoes.filter((o) => (o.talhao_id ?? '') === selectedTalhao);
  }, [observacoes, selectedTalhao]);

  const filteredFc: FeatureCollection = useMemo(() => {
    const ids = new Set(filteredObs.map((o) => o.id).filter(Boolean));
    return {
      type: 'FeatureCollection',
      features: fc.features.filter((f) => {
        const id = (f.properties as Record<string, unknown>)?.id;
        return ids.has(String(id));
      }),
    };
  }, [fc.features, filteredObs]);

  const talhoesOptions = useMemo(() => {
    const t = (Array.isArray(p.talhoes) ? p.talhoes : []) as Array<{ id?: string; nome?: string }>;
    return t.filter((x) => x.id);
  }, [p.talhoes]);

  const talhoesFc = useMemo(() => {
    const gj = p.talhoes_geojson as FeatureCollection | undefined;
    if (gj && gj.type === 'FeatureCollection' && Array.isArray(gj.features) && gj.features.length > 0) return gj;
    return null;
  }, [p.talhoes_geojson]);

  const rotaFc = useMemo(() => {
    const gj = p.rota_geojson as FeatureCollection | undefined;
    if (gj && gj.type === 'FeatureCollection' && Array.isArray(gj.features) && gj.features.length > 0) return gj;
    return null;
  }, [p.rota_geojson]);

  /** Todos os pontos com coordenadas válidas — centro e fit inicial por extensão real, não só o 1.º ponto. */
  const obsLatLngPoints = useMemo((): [number, number][] => {
    const pts: [number, number][] = [];
    for (const o of observacoes) {
      if (o.lat != null && o.lng != null && Number.isFinite(o.lat) && Number.isFinite(o.lng)) {
        pts.push([o.lat, o.lng]);
      }
    }
    return pts;
  }, [observacoes]);

  const centerLat = useMemo(() => {
    if (obsLatLngPoints.length === 0) return -14.235;
    let s = 0;
    for (const [lat] of obsLatLngPoints) s += lat;
    return s / obsLatLngPoints.length;
  }, [obsLatLngPoints]);

  const centerLng = useMemo(() => {
    if (obsLatLngPoints.length === 0) return -51.9253;
    let s = 0;
    for (const [, lng] of obsLatLngPoints) s += lng;
    return s / obsLatLngPoints.length;
  }, [obsLatLngPoints]);

  const initialZoom = useMemo(() => {
    return obsLatLngPoints.length > 0 ? 14 : 4;
  }, [obsLatLngPoints]);

  const isLegacyPayload = !p.schemaVersion || Number(p.schemaVersion) < 2;

  const analyticsObs = selectedTalhao ? filteredObs : observacoes;
  const analytics = useMemo(() => computeCompactacaoAnalytics(analyticsObs), [analyticsObs]);
  const samplingQ = useMemo(
    () => computeSamplingQuality(analyticsObs, talhoesFc ?? undefined, meta),
    [analyticsObs, talhoesFc, meta],
  );

  const diagnosticoBreve = useMemo(() => buildDiagnosticoAgronomicoBreve(analytics), [analytics]);
  const recomendacoes = useMemo(() => buildRecomendacoesCompactacao(analytics), [analytics]);
  const diagnosticoText = useMemo(() => buildCompactacaoDiagnostico(analyticsObs), [analyticsObs]);

  const obsComFoto = useMemo(
    () => filteredObs.filter((o) => o.imagem_url && String(o.imagem_url).trim()),
    [filteredObs],
  );
  const tabelaTemFoto = useMemo(() => filteredObs.some((o) => o.imagem_url), [filteredObs]);

  const comparacaoPlanejadoLabel = (() => {
    switch (samplingQ.comparacaoPlanejado) {
      case 'abaixo':
        return 'Amostragem mais esparsa que o fator planejado (pontos/ha).';
      case 'acima':
        return 'Densidade de pontos acima do fator planejado (pontos/ha).';
      case 'proximo':
        return 'Densidade compatível com o fator planejado (pontos/ha).';
      default:
        return null;
    }
  })();

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    let destroyed = false;

    (async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');
      await import('leaflet.markercluster/dist/MarkerCluster.css');
      await import('leaflet.markercluster');

      if (destroyed || !mapRef.current) return;

      const map = L.map(mapRef.current).setView([centerLat, centerLng], initialZoom);
      L.tileLayer(MAPTILER_SATELLITE_URL, {
        attribution: '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; OpenStreetMap',
        maxZoom: 20,
      }).addTo(map);
      mapInstance.current = map;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cluster = (L as any).markerClusterGroup({ maxClusterRadius: 40, spiderfyOnMaxZoom: true });
      cluster.addTo(map);
      clusterRef.current = cluster;

      if (obsLatLngPoints.length > 0) {
        map.fitBounds(obsLatLngPoints, { padding: [40, 40], maxZoom: 17 });
      }
    })();

    return () => {
      destroyed = true;
      mapInstance.current?.remove();
      mapInstance.current = null;
      clusterRef.current = null;
      heatRef.current = null;
      isolineLayerRef.current = null;
      talhoesLayerRef.current = null;
      rotaLayerRef.current = null;
      talhaoLabelLayerRef.current = null;
      rotaDirectionLayerRef.current = null;
    };
  }, [centerLat, centerLng, initialZoom, obsLatLngPoints]);

  useEffect(() => {
    const map = mapInstance.current;
    const cluster = clusterRef.current as import('leaflet').LayerGroup | null;
    if (!map || !cluster) return;

    (async () => {
      const L = (await import('leaflet')).default;
      cluster.clearLayers();

      if (isolineLayerRef.current) {
        map.removeLayer(isolineLayerRef.current);
        isolineLayerRef.current = null;
      }
      if (talhoesLayerRef.current) {
        map.removeLayer(talhoesLayerRef.current);
        talhoesLayerRef.current = null;
      }
      if (rotaLayerRef.current) {
        map.removeLayer(rotaLayerRef.current);
        rotaLayerRef.current = null;
      }
      if (talhaoLabelLayerRef.current) {
        map.removeLayer(talhaoLabelLayerRef.current);
        talhaoLabelLayerRef.current = null;
      }
      if (rotaDirectionLayerRef.current) {
        map.removeLayer(rotaDirectionLayerRef.current);
        rotaDirectionLayerRef.current = null;
      }
      if (showIsolines && isolinesFc) {
        const isoLayer = L.geoJSON(isolinesFc as unknown as GeoJsonObject, {
          style: (feat) => {
            const pr = (feat?.properties ?? {}) as Record<string, unknown>;
            return {
              color: String(pr.stroke ?? '#1e293b'),
              weight: Number(pr.stroke_width ?? 2),
              opacity: 0.85,
              fill: false,
            };
          },
        });
        isoLayer.addTo(map);
        isolineLayerRef.current = isoLayer;
      }

      if (talhoesFc) {
        const talhoesLayer = L.geoJSON(talhoesFc as unknown as GeoJsonObject, {
          style: {
            color: '#f8fafc',
            weight: 2,
            opacity: 0.95,
            fillColor: '#0f172a',
            fillOpacity: 0.16,
          },
        });
        talhoesLayer.addTo(map);
        talhoesLayerRef.current = talhoesLayer;

        if (showTalhaoLabels) {
          const labels = L.layerGroup();
          for (const ft of talhoesFc.features) {
            if (ft.geometry?.type !== 'Polygon') continue;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rings = (ft.geometry as any).coordinates as number[][][];
            if (!Array.isArray(rings) || rings.length === 0 || rings[0].length === 0) continue;
            const ring = rings[0];
            let sLat = 0;
            let sLng = 0;
            let n = 0;
            for (const [lng, lat] of ring) {
              sLat += lat;
              sLng += lng;
              n++;
            }
            if (n === 0) continue;
            const label = String((ft.properties as Record<string, unknown>)?.talhao_nome ?? 'Talhão');
            const marker = L.marker([sLat / n, sLng / n], {
              icon: L.divIcon({
                className: 'fs-talhao-label',
                html: `<div style="padding:2px 6px;border-radius:4px;background:rgba(15,23,42,.72);color:#fff;font-size:11px;font-weight:700;border:1px solid rgba(255,255,255,.35);white-space:nowrap;">${label}</div>`,
              }),
              interactive: false,
            });
            labels.addLayer(marker);
          }
          labels.addTo(map);
          talhaoLabelLayerRef.current = labels;
        }
      }

      if (rotaFc) {
        const rotaLayer = L.geoJSON(rotaFc as unknown as GeoJsonObject, {
          style: {
            color: '#60a5fa',
            weight: Math.min(6, 2 + Math.floor(filteredObs.length / 40)),
            opacity: 0.95,
          },
        });
        rotaLayer.addTo(map);
        rotaLayerRef.current = rotaLayer;

        // Indicadores de direção: início/fim + setas ao longo da rota
        const dirLayer = L.layerGroup();
        for (const ft of rotaFc.features) {
          if (ft.geometry?.type !== 'LineString') continue;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const line = (ft.geometry as any).coordinates as number[][];
          if (!Array.isArray(line) || line.length < 2) continue;

          const [startLng, startLat] = line[0];
          const [endLng, endLat] = line[line.length - 1];
          const mkStart = L.circleMarker([startLat, startLng], {
            radius: 6,
            color: '#16a34a',
            fillColor: '#16a34a',
            fillOpacity: 1,
            weight: 2,
          }).bindTooltip('Início', { permanent: false });
          const mkEnd = L.circleMarker([endLat, endLng], {
            radius: 6,
            color: '#dc2626',
            fillColor: '#dc2626',
            fillOpacity: 1,
            weight: 2,
          }).bindTooltip('Fim', { permanent: false });
          dirLayer.addLayer(mkStart);
          dirLayer.addLayer(mkEnd);

          const step = Math.max(2, Math.floor(line.length / 12));
          for (let i = step; i < line.length - 1; i += step) {
            const [lng, lat] = line[i];
            const marker = L.marker([lat, lng], {
              icon: L.divIcon({
                className: 'fs-route-arrow',
                html: '<div style="font-size:13px;color:#bfdbfe;text-shadow:0 1px 2px rgba(0,0,0,.8)">➤</div>',
                iconSize: [14, 14],
                iconAnchor: [7, 7],
              }),
              interactive: false,
            });
            dirLayer.addLayer(marker);
          }
        }
        dirLayer.addTo(map);
        rotaDirectionLayerRef.current = dirLayer;
      }

      const bounds: import('leaflet').LatLngBoundsExpression = [];
      if (talhoesFc) {
        for (const ft of talhoesFc.features) {
          if (ft.geometry?.type === 'Polygon') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rings = (ft.geometry as any).coordinates as number[][][];
            for (const ring of rings) {
              for (const [lng, lat] of ring) bounds.push([lat, lng]);
            }
          }
        }
      }
      for (const f of filteredFc.features) {
        if (f.geometry?.type !== 'Point') continue;
        const coords = (f.geometry as Point).coordinates;
        const lng = coords[0];
        const lat = coords[1];
        const pr = (f.properties ?? {}) as Record<string, unknown>;
        const num = Number(pr.numero) || 0;
        const cls = String(pr.classificacao ?? '');
        const color = colorForClass(cls);
        const depthColor = colorForDepth(String(pr.profundidade ?? ''));
        const icon = L.divIcon({
          className: 'fs-soil-marker',
          html: `<div style="width:22px;height:22px;border-radius:50%;background:${color};color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid ${depthColor};box-shadow:0 1px 4px rgba(0,0,0,.35);">${num}</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        const m = L.marker([lat, lng], { icon });
        const profStr = String(pr.profundidade ?? '—');
        const icStr =
          pr.compactacao != null && Number.isFinite(Number(pr.compactacao))
            ? `${Number(pr.compactacao).toFixed(2)} MPa`
            : '—';
        const talhaoStr = String(pr.talhao_nome ?? pr.talhao_id ?? '—');
        const tipHtml = [
          `<strong>Ponto ${num}</strong>`,
          `IC: ${escapeTooltipText(icStr)} (${escapeTooltipText(cls || '—')})`,
          `Prof: ${escapeTooltipText(profStr)}`,
          `Talhão: ${escapeTooltipText(talhaoStr)}`,
        ].join('<br/>');
        m.bindTooltip(tipHtml, { direction: 'top', opacity: 0.95 });
        m.on('click', () => {
          const id = String(pr.id ?? '');
          const hit = observacoes.find((o) => String(o.id) === id);
          setSelected(hit ?? null);
        });
        cluster.addLayer(m);
        bounds.push([lat, lng]);
      }

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
      }

      if (heatRef.current) {
        map.removeLayer(heatRef.current);
        heatRef.current = null;
      }
      if (showHeat && bounds.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await import('leaflet.heat');
        const heatPoints: [number, number, number][] = [];
        for (const o of filteredObs) {
          if (o.lat == null || o.lng == null) continue;
          const v = o.compactacao != null ? Math.min(1, Number(o.compactacao) / 4) : 0.2;
          heatPoints.push([o.lat, o.lng, v]);
        }
        if (heatPoints.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const layer = (L as any).heatLayer(heatPoints, { radius: 28, blur: 22, maxZoom: 17 });
          layer.addTo(map);
          heatRef.current = layer;
        }
      }
    })();
  }, [filteredFc, filteredObs, observacoes, showHeat, showIsolines, showTalhaoLabels, isolinesFc, talhoesFc, rotaFc]);

  const shpUrl = `/api/amostragem/export/shp?token=${encodeURIComponent(shareToken)}`;

  const cultura = (meta.culture as string) || '';
  const nomeCampanha = (meta.campaignName as string) || '';
  const nomeFazenda = (meta.fazenda_nome as string) || '';
  const talhoesTexto = talhoesOptions.map((t) => t.nome ?? t.id).join(' · ');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(180deg, ${ag.paper} 0%, ${ag.paper2} 100%)`,
        fontFamily: ag.fontBody,
        color: ag.ink,
      }}
    >
      <header
        style={{
          padding: '20px 22px',
          background: `linear-gradient(135deg, ${ag.forest} 0%, ${ag.forest2} 100%)`,
          color: '#fafaf9',
          borderBottom: `3px solid ${ag.paper2}`,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 14,
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ maxWidth: 720 }}>
          <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.88 }}>
            Relatório técnico agronómico
          </p>
          <h1 style={{ margin: '6px 0 0', fontFamily: ag.fontTitle, fontSize: '1.45rem', fontWeight: 700, lineHeight: 1.25 }}>
            Compactação do solo / amostragem pontual
          </h1>
          <p style={{ margin: '10px 0 0', opacity: 0.92, fontSize: 15, lineHeight: 1.45 }}>
            <strong>{nomeCampanha}</strong>
            {cultura ? (
              <>
                {' '}
                · <span style={{ fontStyle: 'italic' }}>{cultura}</span>
              </>
            ) : null}
          </p>
          {(nomeFazenda || talhoesTexto) ? (
            <p style={{ margin: '8px 0 0', opacity: 0.96, fontSize: 13, lineHeight: 1.45 }}>
              {nomeFazenda ? (
                <>
                  <strong>Fazenda:</strong> {nomeFazenda}
                </>
              ) : null}
              {talhoesTexto ? (
                <>
                  {nomeFazenda ? ' · ' : ''}
                  <strong>Talhões coletados:</strong> {talhoesTexto}
                </>
              ) : null}
            </p>
          ) : null}
          {Boolean(
            meta.description ||
              meta.safra ||
              meta.responsavel ||
              meta.crea ||
              meta.tipo_layout ||
              meta.fator_pontos_ha != null ||
              meta.modo_coleta ||
              meta.tipo ||
              meta.fazenda_nome ||
              meta.empresa_id ||
              meta.usuario_coleta_id
          ) && (
            <details style={{ marginTop: 12, fontSize: 13, opacity: 0.94, maxWidth: 640 }}>
              <summary style={{ cursor: 'pointer', userSelect: 'none', fontWeight: 600 }}>
                Identificação do levantamento
              </summary>
              <div style={{ marginTop: 10, lineHeight: 1.55 }}>
                {meta.description ? <div>{String(meta.description)}</div> : null}
                {meta.safra ? (
                  <div>
                    <strong>Safra agrícola:</strong> {String(meta.safra)}
                  </div>
                ) : null}
                {meta.responsavel ? (
                  <div>
                    <strong>Responsável técnico:</strong> {String(meta.responsavel)}
                    {meta.crea ? (
                      <>
                        {' '}
                        · <strong>Registro profissional (CREA):</strong> {String(meta.crea)}
                      </>
                    ) : null}
                  </div>
                ) : meta.crea ? (
                  <div>
                    <strong>Registro profissional (CREA):</strong> {String(meta.crea)}
                  </div>
                ) : null}
                {meta.tipo ? (
                  <div>
                    <strong>Objetivo do levantamento:</strong> {labelTipoColeta(meta.tipo)}
                  </div>
                ) : null}
                {meta.modo_coleta ? (
                  <div>
                    <strong>Modo de coleta:</strong> {labelModoColeta(meta.modo_coleta)}
                  </div>
                ) : null}
                {meta.tipo_layout ? (
                  <div>
                    <strong>Malha / intensidade:</strong> {String(meta.tipo_layout)}
                    {meta.fator_pontos_ha != null ? ` · ${String(meta.fator_pontos_ha)} pontos por hectare` : ''}
                  </div>
                ) : null}
                {meta.fazenda_nome ? (
                  <div>
                    <strong>Fazenda:</strong> {String(meta.fazenda_nome)}
                  </div>
                ) : null}
                {meta.empresa_id ? (
                  <div>
                    <strong>Identificador da propriedade (app):</strong> {String(meta.empresa_id)}
                  </div>
                ) : null}
                {meta.usuario_coleta_id ? (
                  <div>
                    <strong>Identificador do usuário da coleta:</strong> {String(meta.usuario_coleta_id)}
                  </div>
                ) : null}
              </div>
            </details>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {talhoesOptions.length > 0 && (
            <select
              value={selectedTalhao}
              onChange={(e) => setSelectedTalhao(e.target.value)}
              style={{
                padding: '9px 11px',
                borderRadius: 6,
                border: `1px solid ${ag.border}`,
                background: ag.card,
                color: ag.ink,
                fontFamily: ag.fontBody,
                fontSize: 13,
              }}
            >
              <option value="">Todos os talhões</option>
              {talhoesOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome ?? t.id}
                </option>
              ))}
            </select>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, maxWidth: 220 }}>
            <input type="checkbox" checked={showHeat} onChange={(e) => setShowHeat(e.target.checked)} />
            Intensidade por pontos (kernel)
          </label>
          {isolinesFc ? (
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, maxWidth: 240 }}>
              <input
                type="checkbox"
                checked={showIsolines}
                onChange={(e) => setShowIsolines(e.target.checked)}
              />
              Superfície interpolada (IDW) / isolinhas
            </label>
          ) : null}
          {talhoesFc ? (
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={showTalhaoLabels}
                onChange={(e) => setShowTalhaoLabels(e.target.checked)}
              />
              Rótulos de talhão
            </label>
          ) : null}
          <a
            href={shpUrl}
            style={{
              background: ag.card,
              color: ag.forest,
              padding: '9px 14px',
              borderRadius: 6,
              fontWeight: 700,
              textDecoration: 'none',
              border: `1px solid ${ag.border}`,
              fontSize: 13,
            }}
          >
            Exportar Shapefile (SHP)
          </a>
        </div>
      </header>

      {isLegacyPayload ? (
        <div
          style={{
            margin: '0 22px',
            padding: '12px 14px',
            borderRadius: 4,
            background: '#fffbeb',
            border: `1px solid #fcd34d`,
            color: ag.ink,
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          <strong>Relatório legado (schema &lt; 2):</strong> metadados de campanha (empresa, usuário da coleta ou nome de
          talhão) podem estar incompletos ou inferidos dos pontos. Publique novamente pelo app atualizado para snapshot
          completo na campanha.
        </div>
      ) : null}

      <section
        style={{
          margin: '16px 22px 0',
          padding: '16px 18px',
          borderRadius: 4,
          background: ag.card,
          border: `1px solid ${ag.border}`,
          boxShadow: '0 4px 18px rgba(28,25,23,0.06)',
        }}
      >
        <h2 style={{ margin: 0, fontFamily: ag.fontTitle, fontSize: '1.1rem', color: ag.forest }}>
          Resumo técnico
        </h2>
        <p style={{ margin: '8px 0 0', fontSize: 12, color: ag.inkMuted, lineHeight: 1.5 }}>
          Estatísticas sobre <strong>camadas amostradas</strong> (cada linha = ponto × profundidade com IC). Percentuais não
          representam % da área do talhão sem interpolação espacial por polígono.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 12,
            marginTop: 14,
          }}
        >
          <div style={{ padding: 12, background: ag.paper2, borderRadius: 4, border: `1px solid ${ag.border}` }}>
            <div style={{ fontSize: 11, color: ag.inkMuted, textTransform: 'uppercase' }}>IC médio</div>
            <div style={{ fontSize: 1.25 + 'rem', fontWeight: 700, marginTop: 4 }}>
              {analytics.icMedia != null ? `${analytics.icMedia.toFixed(2)}` : '—'} MPa
            </div>
          </div>
          <div style={{ padding: 12, background: ag.paper2, borderRadius: 4, border: `1px solid ${ag.border}` }}>
            <div style={{ fontSize: 11, color: ag.inkMuted, textTransform: 'uppercase' }}>Mín / Máx</div>
            <div style={{ fontSize: 1.05 + 'rem', fontWeight: 700, marginTop: 4 }}>
              {analytics.icMin != null ? analytics.icMin.toFixed(2) : '—'} /{' '}
              {analytics.icMax != null ? analytics.icMax.toFixed(2) : '—'}
            </div>
          </div>
          <div style={{ padding: 12, background: ag.paper2, borderRadius: 4, border: `1px solid ${ag.border}` }}>
            <div style={{ fontSize: 11, color: ag.inkMuted, textTransform: 'uppercase' }}>Mediana</div>
            <div style={{ fontSize: 1.25 + 'rem', fontWeight: 700, marginTop: 4 }}>
              {analytics.icMediana != null ? `${analytics.icMediana.toFixed(2)}` : '—'} MPa
            </div>
          </div>
          <div style={{ padding: 12, background: ag.paper2, borderRadius: 4, border: `1px solid ${ag.border}` }}>
            <div style={{ fontSize: 11, color: ag.inkMuted, textTransform: 'uppercase' }}>Alta + crítica</div>
            <div style={{ fontSize: 1.25 + 'rem', fontWeight: 700, marginTop: 4 }}>
              {analytics.nObservacoesComIc ? `${analytics.pctCamadasAltaCritica}%` : '—'}{' '}
              <span style={{ fontSize: 12, fontWeight: 500, color: ag.inkMuted }}>das camadas</span>
            </div>
          </div>
        </div>
        {analytics.distribuicao.length > 0 ? (
          <div style={{ marginTop: 16 }}>
            <strong style={{ fontSize: 13, color: ag.forest }}>Distribuição por classe (camadas com IC)</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
              {analytics.distribuicao.map((d) => (
                <li key={d.classe}>
                  <span style={{ color: colorForClass(d.classe) }}>●</span> {d.classe}: {d.count} ({d.pct}%)
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${ag.border}` }}>
          <strong style={{ fontSize: 13, color: ag.forest }}>Qualidade da amostragem</strong>
          <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
            <li>
              <strong>Registros no recorte:</strong> {analytics.nObservacoesTotal} linhas ·{' '}
              <strong>Camadas com IC:</strong> {analytics.nObservacoesComIc} · <strong>Pontos de campo distintos:</strong>{' '}
              {analytics.pontosDistintos}
            </li>
            {samplingQ.layoutLabel ? (
              <li>
                <strong>Modo de malha (app):</strong> {samplingQ.layoutLabel}
                {samplingQ.fatorPlanejado != null ? ` · fator planejado: ${samplingQ.fatorPlanejado} pontos/ha` : ''}
              </li>
            ) : samplingQ.fatorPlanejado != null ? (
              <li>
                <strong>Fator planejado:</strong> {samplingQ.fatorPlanejado} pontos/ha
              </li>
            ) : null}
            {samplingQ.areaHa != null ? (
              <li>
                <strong>Área aproximada dos talhões (polígonos):</strong> {samplingQ.areaHa} ha
                {samplingQ.densidadePontosPorHa != null ? (
                  <>
                    {' '}
                    · <strong>Densidade observada:</strong> {samplingQ.densidadePontosPorHa} pontos/ha
                  </>
                ) : null}
              </li>
            ) : (
              <li>Área do talhão não disponível (sem polígonos no relatório); densidade em pontos/ha não calculada.</li>
            )}
            {comparacaoPlanejadoLabel ? (
              <li style={{ fontStyle: 'italic', color: ag.inkMuted }}>{comparacaoPlanejadoLabel}</li>
            ) : null}
          </ul>
        </div>
      </section>

      <div style={{ position: 'relative', height: 'min(70vh, 640px)', margin: 18, boxShadow: '0 8px 28px rgba(28,25,23,0.08)' }}>
        <div
          ref={mapRef}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 4,
            overflow: 'hidden',
            border: `1px solid ${ag.border}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            left: 14,
            background: 'rgba(255,252,247,0.97)',
            padding: '11px 13px',
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(28,25,23,0.12)',
            fontSize: 12,
            zIndex: 500,
            lineHeight: 1.55,
            border: `1px solid ${ag.border}`,
            fontFamily: ag.fontBody,
            maxWidth: 280,
          }}
        >
          <strong style={{ display: 'block', marginBottom: 8, fontFamily: ag.fontTitle, color: ag.forest }}>
            Legenda — índice de cone (IC)
          </strong>
          {IC_LEGEND_ROWS.map((row) => (
            <div key={row.classificacao}>
              <span style={{ color: row.color }}>●</span> {row.descricao} ({row.faixaMpa})
            </div>
          ))}
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${ag.border}` }}>
            <strong style={{ display: 'block', marginBottom: 4 }}>Borda do ponto por profundidade</strong>
            <div><span style={{ color: '#38bdf8' }}>●</span> 0-10 cm</div>
            <div><span style={{ color: '#22c55e' }}>●</span> 10-20 cm</div>
            <div><span style={{ color: '#f59e0b' }}>●</span> 20-30 cm</div>
            <div><span style={{ color: '#f97316' }}>●</span> 30-40 cm</div>
            <div><span style={{ color: '#a855f7' }}>●</span> 40-50 cm</div>
          </div>
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${ag.border}` }}>
            <div><span style={{ color: '#60a5fa' }}>━</span> Rota de coleta</div>
            <div><span style={{ color: '#f8fafc' }}>▭</span> Limite de talhão (KML/GeoJSON)</div>
          </div>
        </div>
      </div>

      {analytics.porProfundidade.length > 0 ? (
        <section
          style={{
            margin: '0 22px 18px',
            padding: '16px 18px',
            borderRadius: 4,
            background: ag.card,
            border: `1px solid ${ag.border}`,
            boxShadow: '0 4px 18px rgba(28,25,23,0.06)',
          }}
        >
          <h2 style={{ margin: 0, fontFamily: ag.fontTitle, fontSize: '1.1rem', color: ag.forest }}>
            Análise por profundidade (camada)
          </h2>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: ag.inkMuted }}>
            Média de IC por faixa de profundidade; classe predominante = maior número de camadas naquela faixa.
          </p>
          <div style={{ overflowX: 'auto', marginTop: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: ag.paper2, fontWeight: 600 }}>
                  <th style={{ textAlign: 'left', padding: 10 }}>Camada</th>
                  <th style={{ textAlign: 'left', padding: 10 }}>Nº camadas</th>
                  <th style={{ textAlign: 'left', padding: 10 }}>IC médio (MPa)</th>
                  <th style={{ textAlign: 'left', padding: 10 }}>Classe predominante</th>
                </tr>
              </thead>
              <tbody>
                {analytics.porProfundidade.map((row) => (
                  <tr key={row.profundidade} style={{ borderTop: `1px solid ${ag.border}` }}>
                    <td style={{ padding: 10 }}>{row.profundidade}</td>
                    <td style={{ padding: 10 }}>{row.n}</td>
                    <td style={{ padding: 10 }}>{row.icMedio.toFixed(2)}</td>
                    <td style={{ padding: 10 }}>
                      <span style={{ color: colorForClass(row.classePredominante) }}>●</span> {row.classePredominante}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section style={{ padding: '0 22px 18px' }}>
        <h2 style={{ fontFamily: ag.fontTitle, fontSize: '1.15rem', color: ag.forest, marginBottom: 10 }}>
          Registro de pontos ({filteredObs.length})
        </h2>
        <div
          style={{
            overflowX: 'auto',
            borderRadius: 4,
            border: `1px solid ${ag.border}`,
            background: ag.card,
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: ag.paper2, color: ag.ink, fontWeight: 600 }}>
                <th style={{ textAlign: 'left', padding: 10 }}>Ponto</th>
                <th style={{ textAlign: 'left', padding: 10 }}>Profundidade (camada)</th>
                <th style={{ textAlign: 'left', padding: 10 }}>IC médio (MPa)</th>
                <th style={{ textAlign: 'left', padding: 10 }}>Classe de restrição</th>
                <th style={{ textAlign: 'left', padding: 10 }}>Talhão</th>
                {tabelaTemFoto ? (
                  <th style={{ textAlign: 'left', padding: 10 }}>Foto</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {filteredObs.map((o) => (
                <tr
                  key={String(o.id)}
                  style={{ borderTop: `1px solid ${ag.border}`, cursor: 'pointer' }}
                  onClick={() => setSelected(o)}
                >
                  <td style={{ padding: 10 }}>{o.numero}</td>
                  <td style={{ padding: 10 }}>{o.profundidade ?? '—'}</td>
                  <td style={{ padding: 10 }}>{o.compactacao != null ? o.compactacao.toFixed(2) : '—'}</td>
                  <td style={{ padding: 10 }}>{o.classificacao}</td>
                  <td style={{ padding: 10 }}>{o.talhao_nome || o.talhao_id || '—'}</td>
                  {tabelaTemFoto ? (
                    <td style={{ padding: 8 }} onClick={(e) => e.stopPropagation()}>
                      {o.imagem_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={o.imagem_url}
                          alt=""
                          style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4, border: `1px solid ${ag.border}` }}
                        />
                      ) : (
                        <span style={{ color: ag.inkMuted }}>—</span>
                      )}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {obsComFoto.length > 0 ? (
        <section style={{ padding: '0 22px 22px' }}>
          <h2 style={{ fontFamily: ag.fontTitle, fontSize: '1.15rem', color: ag.forest, marginBottom: 10 }}>
            Registros fotográficos ({obsComFoto.length})
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 14,
            }}
          >
            {obsComFoto.map((o) => (
              <button
                key={String(o.id)}
                type="button"
                onClick={() => setSelected(o)}
                style={{
                  textAlign: 'left',
                  padding: 0,
                  border: `1px solid ${ag.border}`,
                  borderRadius: 4,
                  overflow: 'hidden',
                  background: ag.card,
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(28,25,23,0.06)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={o.imagem_url!}
                  alt={`Ponto ${o.numero ?? ''}`}
                  style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
                />
                <div style={{ padding: 10, fontSize: 12, lineHeight: 1.45 }}>
                  <strong>Ponto {o.numero}</strong>
                  {o.profundidade ? <div>{o.profundidade}</div> : null}
                  {o.compactacao != null ? (
                    <div style={{ color: ag.forest, fontWeight: 600 }}>
                      IC {o.compactacao.toFixed(2)} MPa · {o.classificacao}
                    </div>
                  ) : null}
                  {(o.talhao_nome || o.talhao_id) && (
                    <div style={{ color: ag.inkMuted }}>{o.talhao_nome || o.talhao_id}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section
        style={{
          margin: '0 22px 18px',
          padding: '16px 18px',
          borderRadius: 4,
          background: ag.card,
          border: `1px solid ${ag.border}`,
          boxShadow: '0 4px 18px rgba(28,25,23,0.06)',
        }}
      >
        <h2 style={{ margin: 0, fontFamily: ag.fontTitle, fontSize: '1.05rem', color: ag.forest }}>
          Diagnóstico agronômico (automático)
        </h2>
        <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.55, color: ag.ink }}>{diagnosticoBreve}</p>
      </section>

      <section
        style={{
          margin: '0 22px 18px',
          padding: '16px 18px',
          borderRadius: 4,
          background: ag.card,
          border: `1px solid ${ag.border}`,
          boxShadow: '0 4px 18px rgba(28,25,23,0.06)',
        }}
      >
        <h2 style={{ margin: 0, fontFamily: ag.fontTitle, fontSize: '1.05rem', color: ag.forest }}>
          Recomendações técnicas
        </h2>
        <ul style={{ margin: '10px 0 0', paddingLeft: 20, fontSize: 14, lineHeight: 1.6 }}>
          {recomendacoes.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
        <p style={{ margin: '12px 0 0', fontSize: 11, color: ag.inkMuted, fontStyle: 'italic' }}>
          Sugestões geradas por regras sobre os dados publicados; não substituem receituário agronômico nem visita presencial.
        </p>
      </section>

      <section
        style={{
          margin: '0 22px 28px',
          padding: '16px 18px',
          borderRadius: 4,
          background: ag.paper2,
          border: `1px solid ${ag.border}`,
        }}
      >
        <h2 style={{ margin: 0, fontFamily: ag.fontTitle, fontSize: '1rem', color: ag.forest }}>
          Síntese detalhada (IC)
        </h2>
        <p style={{ margin: '10px 0 0', fontSize: 13, lineHeight: 1.55, color: ag.ink }}>{diagnosticoText}</p>
      </section>

      {selected && (
        <div
          role="dialog"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.45)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{
              background: ag.card,
              maxWidth: 440,
              width: '100%',
              borderRadius: 4,
              padding: 22,
              maxHeight: '90vh',
              overflow: 'auto',
              border: `1px solid ${ag.border}`,
              fontFamily: ag.fontBody,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, fontFamily: ag.fontTitle, color: ag.forest }}>Ponto de amostragem #{selected.numero}</h3>
            {selected.point_name ? (
              <p style={{ fontSize: 14, marginBottom: 4 }}>
                <strong>Identificação no campo:</strong> {selected.point_name}
              </p>
            ) : null}
            {(selected.talhao_nome || selected.talhao_id) && (
              <p style={{ fontSize: 14 }}>
                <strong>Talhão:</strong> {selected.talhao_nome || selected.talhao_id}
              </p>
            )}
            <p style={{ fontSize: 13, color: ag.inkMuted }}>
              <strong>Coordenadas (WGS84):</strong> {selected.lat?.toFixed(6)}, {selected.lng?.toFixed(6)}
            </p>
            {selected.altitude_m != null ? (
              <p style={{ fontSize: 13, color: ag.inkMuted }}>
                <strong>Cota ortométrica aprox.:</strong> {selected.altitude_m.toFixed(1)} m
                {selected.gps_accuracy_m != null ? ` · precisão horizontal ±${selected.gps_accuracy_m.toFixed(1)} m` : ''}
                {selected.gps_provider ? ` · fonte: ${selected.gps_provider}` : ''}
              </p>
            ) : null}
            <p>
              <strong>Profundidade da amostra / camada:</strong> {selected.profundidade ?? '—'}
            </p>
            {selected.sample_code ? (
              <p>
                <strong>Código da amostra:</strong> {selected.sample_code}
              </p>
            ) : null}
            {selected.moisture_percent != null ? (
              <p>
                <strong>Teor de umidade (gravimétrico, %):</strong> {selected.moisture_percent.toFixed(1)}
              </p>
            ) : null}
            {selected.bulk_density != null ? (
              <p>
                <strong>Densidade aparente:</strong> {selected.bulk_density.toFixed(3)} g/cm³
              </p>
            ) : null}
            <p>
              <strong>Índice de cone (IC) médio na camada:</strong>{' '}
              {selected.compactacao != null ? `${selected.compactacao.toFixed(2)} MPa` : '—'}{' '}
              <span style={{ color: ag.inkMuted }}>({selected.classificacao})</span>
            </p>
            {selected.quantidade != null ? (
              <p>
                <strong>Volume / massa coletada (registro de campo):</strong> {selected.quantidade}
              </p>
            ) : null}
            {(selected.tipo_penetrometro ||
              selected.peso_martelo_kg != null ||
              selected.altura_queda_cm != null ||
              selected.numero_impactos != null ||
              selected.profundidade_atingida_cm != null) && (
              <div style={{ fontSize: 13, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${ag.border}` }}>
                <strong>Penetrômetro — parâmetros de ensaio</strong>
                {selected.tipo_penetrometro ? (
                  <div>Equipamento / modo: {selected.tipo_penetrometro}</div>
                ) : null}
                {selected.peso_martelo_kg != null ? (
                  <div>Massa do martelo: {selected.peso_martelo_kg} kg</div>
                ) : null}
                {selected.altura_queda_cm != null ? (
                  <div>Altura de queda: {selected.altura_queda_cm} cm</div>
                ) : null}
                {selected.numero_impactos != null ? (
                  <div>Número de impactos: {selected.numero_impactos}</div>
                ) : null}
                {selected.profundidade_atingida_cm != null ? (
                  <div>Profundidade máxima atingida: {selected.profundidade_atingida_cm} cm</div>
                ) : null}
              </div>
            )}
            {selected.leituras && selected.leituras.length > 0 ? (
              <div style={{ marginTop: 12, fontSize: 13 }}>
                <strong>Leituras brutas e IC por golpe ({selected.leituras.length})</strong>
                <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                  {selected.leituras.map((L, i) => (
                    <li key={i}>
                      {L.raw_value != null ? `${L.raw_value} ${L.unit ?? ''}` : '—'}
                      {L.ci_mpa != null && Number.isFinite(L.ci_mpa) ? ` → IC ${Number(L.ci_mpa).toFixed(2)} MPa` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {selected.obs ? (
              <p>
                <strong>Observações de campo:</strong> {selected.obs}
              </p>
            ) : null}
            {selected.imagem_url ? (
              <img
                src={selected.imagem_url}
                alt="Registro fotográfico da amostra"
                style={{ width: '100%', borderRadius: 4, marginTop: 10, border: `1px solid ${ag.border}` }}
              />
            ) : null}
            <button
              type="button"
              onClick={() => setSelected(null)}
              style={{
                marginTop: 18,
                padding: '10px 18px',
                borderRadius: 4,
                border: `1px solid ${ag.border}`,
                background: ag.paper2,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
