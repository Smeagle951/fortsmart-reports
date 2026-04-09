'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Feature, FeatureCollection, GeoJsonObject } from 'geojson';
import {
  computeCompactacaoAnalytics,
  computeSamplingQuality,
  groupObservationsByFieldPoint,
  type FieldPointGroup,
} from '@/lib/amostragem-solo/compactacaoAnalytics';
import { simplifyFeatureCollection } from '@/lib/amostragem-solo/mapPerf';
import { buildTalhaoRanking } from '@/lib/amostragem-solo/multiTalhao';
import {
  buildCompactacaoDiagnostico,
  buildDiagnosticoAgronomicoBreve,
  buildRecomendacoesCompactacao,
} from '@/lib/amostragem-solo/diagnostics';
import { IC_LEGEND_ROWS } from '@/lib/amostragem-solo/mpa';
import { type AmostragemObservacao, type AmostragemSoloPayload } from '@/lib/amostragem-solo/payload';
import InteligenciaAgronomicaPanel from '@/components/InteligenciaAgronomicaPanel';

type Props = {
  payload: Record<string, unknown>;
  shareToken: string;
  /** Destaca e rola até a linha da tabela com este `sample_code` (query `?sample=`). */
  highlightSampleCode?: string | null;
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

/** Profundidades planejadas na campanha (`meta.desired_depths` do app, schema ≥ 2). */
function formatMetaDesiredDepths(raw: unknown): string | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const parts: string[] = [];
  for (const e of raw) {
    if (!e || typeof e !== 'object') continue;
    const o = e as Record<string, unknown>;
    const top = o.top;
    const bottom = o.bottom;
    const t = typeof top === 'number' ? top : Number(top);
    const b = typeof bottom === 'number' ? bottom : Number(bottom);
    if (Number.isFinite(t) && Number.isFinite(b)) parts.push(`${t}–${b} cm`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
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

function fmtNumPt(n: unknown, decimals: number): string {
  if (n == null || !Number.isFinite(Number(n))) return '—';
  return Number(n).toFixed(decimals);
}

function coletaValidacaoRecord(meta: Record<string, unknown>): Record<string, unknown> | null {
  const v = meta.coleta_validacao;
  return v != null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

const CLASSE_PIOR_ORDEM = ['Crítica', 'Alta', 'Moderada', 'Baixa', 'Indefinido'] as const;

function piorClasseEntreCamadas(layers: AmostragemObservacao[]): string {
  let pick = 'Indefinido';
  let bestRank = Number.POSITIVE_INFINITY;
  for (const o of layers) {
    const c = String(o.classificacao ?? 'Indefinido');
    const i = CLASSE_PIOR_ORDEM.indexOf(c as (typeof CLASSE_PIOR_ORDEM)[number]);
    const rank = i >= 0 ? i : CLASSE_PIOR_ORDEM.length;
    if (rank < bestRank) {
      bestRank = rank;
      pick = c;
    }
  }
  return pick;
}

function rotuloNumeroPonto(layers: AmostragemObservacao[]): string {
  const nums = layers.map((o) => o.numero).filter((n): n is number => n != null && Number.isFinite(n));
  if (nums.length === 0) return '—';
  const u = new Set(nums);
  return u.size === 1 ? String([...u][0]) : `${Math.min(...nums)}–${Math.max(...nums)}`;
}

function icMedioDoPonto(layers: AmostragemObservacao[]): number | null {
  const vals = layers
    .map((o) => o.compactacao)
    .filter((v): v is number => v != null && Number.isFinite(Number(v)))
    .map(Number);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function coordsRepresentativas(layers: AmostragemObservacao[]): { lat: number; lng: number } | null {
  for (const o of layers) {
    if (o.lat != null && o.lng != null && Number.isFinite(o.lat) && Number.isFinite(o.lng)) {
      return { lat: o.lat, lng: o.lng };
    }
  }
  return null;
}

function imagensDistintasDoPonto(layers: AmostragemObservacao[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const o of layers) {
    const u = o.imagem_url && String(o.imagem_url).trim();
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

function featureMatchesTalhao(
  props: Record<string, unknown> | undefined,
  selectedTalhao: string,
): boolean {
  if (!selectedTalhao) return true;
  if (!props) return false;
  const candidates = [props.talhao_id, props.talhaoId, props.field_id, props.fieldId, props.id]
    .filter((v) => v != null)
    .map((v) => String(v));
  return candidates.includes(selectedTalhao);
}

/** Anéis exteriores [lat,lng][] para polyline (fecha o anel se o GeoJSON vier aberto). */
function outerRingsAsLatLngArrays(ft: Feature): [number, number][][] {
  const g = ft.geometry;
  if (!g) return [];
  if (g.type === 'Polygon') {
    const outer = g.coordinates[0];
    if (!Array.isArray(outer) || outer.length === 0) return [];
    return [ringLngLatToLatLngClosed(outer)];
  }
  if (g.type === 'MultiPolygon') {
    const out: [number, number][][] = [];
    for (const poly of g.coordinates) {
      const outer = poly[0];
      if (!Array.isArray(outer) || outer.length === 0) continue;
      out.push(ringLngLatToLatLngClosed(outer));
    }
    return out;
  }
  return [];
}

function ringLngLatToLatLngClosed(ring: number[][]): [number, number][] {
  const pts: [number, number][] = [];
  for (const c of ring) {
    if (!Array.isArray(c) || c.length < 2) continue;
    const lng = Number(c[0]);
    const lat = Number(c[1]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) pts.push([lat, lng]);
  }
  if (pts.length < 2) return pts;
  const [fLat, fLng] = pts[0];
  const [lLat, lLng] = pts[pts.length - 1];
  if (fLat !== lLat || fLng !== lLng) pts.push([fLat, fLng]);
  return pts;
}

type AgTheme = typeof ag;

function TabelaGruposPontos({
  grupos,
  tabelaTemFoto,
  ag: theme,
  onOpen,
  highlightSampleCode,
}: {
  grupos: FieldPointGroup[];
  tabelaTemFoto: boolean;
  ag: AgTheme;
  onOpen: (g: FieldPointGroup) => void;
  highlightSampleCode?: string | null;
}) {
  return (
    <div
      style={{
        overflowX: 'auto',
        borderRadius: 4,
        border: `1px solid ${theme.border}`,
        background: theme.card,
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: theme.paper2, color: theme.ink, fontWeight: 600 }}>
            <th style={{ textAlign: 'left', padding: 10 }}>Ponto</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Camadas</th>
            <th style={{ textAlign: 'left', padding: 10 }}>IC médio (ponto)</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Classe (pior)</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Talhão</th>
            {tabelaTemFoto ? <th style={{ textAlign: 'left', padding: 10 }}>Foto</th> : null}
          </tr>
        </thead>
        <tbody>
          {grupos.map((g) => {
            const layers = g.layers;
            const numLabel = rotuloNumeroPonto(layers);
            const icM = icMedioDoPonto(layers);
            const pior = piorClasseEntreCamadas(layers);
            const tal = layers[0]?.talhao_nome || layers[0]?.talhao_id || '—';
            const resumoCamadas =
              layers.length <= 3
                ? layers.map((l) => l.profundidade ?? '—').join(' · ')
                : `${layers.length} profundidades`;
            const thumbs = imagensDistintasDoPonto(layers);
            const matchCode =
              highlightSampleCode &&
              layers.some((l) => l.sample_code === highlightSampleCode)
                ? highlightSampleCode
                : layers.find((l) => l.sample_code)?.sample_code ?? undefined;
            return (
              <tr
                key={g.key}
                data-sample-code={matchCode}
                style={{
                  borderTop: `1px solid ${theme.border}`,
                  cursor: 'pointer',
                  outline:
                    highlightSampleCode && matchCode === highlightSampleCode
                      ? `2px solid ${theme.forest}`
                      : undefined,
                }}
                onClick={() => onOpen(g)}
              >
                <td style={{ padding: 10, fontWeight: 600 }}>{numLabel}</td>
                <td style={{ padding: 10, fontSize: 12, color: theme.inkMuted }}>{resumoCamadas}</td>
                <td style={{ padding: 10 }}>{icM != null ? icM.toFixed(2) : '—'}</td>
                <td style={{ padding: 10 }}>{pior}</td>
                <td style={{ padding: 10 }}>{tal}</td>
                {tabelaTemFoto ? (
                  <td style={{ padding: 8 }} onClick={(e) => e.stopPropagation()}>
                    {thumbs.length > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumbs[0]}
                          alt=""
                          style={{
                            width: 44,
                            height: 44,
                            objectFit: 'cover',
                            borderRadius: 4,
                            border: `1px solid ${theme.border}`,
                          }}
                        />
                        {thumbs.length > 1 ? (
                          <span style={{ fontSize: 10, color: theme.inkMuted }}>+{thumbs.length - 1}</span>
                        ) : null}
                      </div>
                    ) : (
                      <span style={{ color: theme.inkMuted }}>—</span>
                    )}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function RelatorioAmostragemSoloContent({
  payload,
  shareToken,
  highlightSampleCode,
}: Props) {
  const p = payload as unknown as AmostragemSoloPayload;
  const meta = (p.meta ?? {}) as Record<string, unknown>;
  const observacoes = useMemo(() => (Array.isArray(p.observacoes) ? p.observacoes : []) as AmostragemObservacao[], [p.observacoes]);

  useEffect(() => {
    const code = highlightSampleCode?.trim();
    if (!code) return;
    const t = window.setTimeout(() => {
      try {
        const el = document.querySelector(`[data-sample-code="${CSS.escape(code)}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch {
        const el = document.querySelector(`[data-sample-code="${code}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [highlightSampleCode]);
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
  const [selectedGroup, setSelectedGroup] = useState<FieldPointGroup | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<import('leaflet').Map | null>(null);
  const clusterRef = useRef<import('leaflet').LayerGroup | null>(null);
  const heatRef = useRef<import('leaflet').Layer | null>(null);
  const isolineLayerRef = useRef<import('leaflet').Layer | null>(null);
  const talhoesLayerRef = useRef<import('leaflet').Layer | null>(null);
  const talhaoOutlineLayerRef = useRef<import('leaflet').Layer | null>(null);
  const rotaLayerRef = useRef<import('leaflet').Layer | null>(null);
  const talhaoLabelLayerRef = useRef<import('leaflet').Layer | null>(null);
  const rotaDirectionLayerRef = useRef<import('leaflet').Layer | null>(null);

  const filteredObs = useMemo(() => {
    if (!selectedTalhao) return observacoes;
    return observacoes.filter((o) => (o.talhao_id ?? '') === selectedTalhao);
  }, [observacoes, selectedTalhao]);

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

  const filteredTalhoesFc = useMemo((): FeatureCollection | null => {
    if (!talhoesFc) return null;
    if (!selectedTalhao) return talhoesFc;
    const features = talhoesFc.features.filter((f) =>
      featureMatchesTalhao((f.properties ?? {}) as Record<string, unknown>, selectedTalhao),
    );
    if (features.length === 0) return talhoesFc;
    return { type: 'FeatureCollection', features };
  }, [talhoesFc, selectedTalhao]);

  const filteredRotaFc = useMemo((): FeatureCollection | null => {
    if (!rotaFc) return null;
    if (!selectedTalhao) return rotaFc;
    const features = rotaFc.features.filter((f) =>
      featureMatchesTalhao((f.properties ?? {}) as Record<string, unknown>, selectedTalhao),
    );
    if (features.length === 0) return rotaFc;
    return { type: 'FeatureCollection', features };
  }, [rotaFc, selectedTalhao]);

  const simplifiedTalhoesFc = useMemo(
    () => simplifyFeatureCollection(filteredTalhoesFc, 0.000006),
    [filteredTalhoesFc],
  );
  const simplifiedRotaFc = useMemo(
    () => simplifyFeatureCollection(filteredRotaFc, 0.00001),
    [filteredRotaFc],
  );

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

  /** Contorno do(s) talhão(ões) no payload — enquadramento inicial quando ainda não há pontos. */
  const talhaoOutlineLatLngPoints = useMemo((): [number, number][] => {
    const pts: [number, number][] = [];
    if (!talhoesFc?.features) return pts;
    for (const f of talhoesFc.features) {
      if (f.geometry?.type !== 'Polygon') continue;
      const coords = (f.geometry as { type: 'Polygon'; coordinates: number[][][] }).coordinates;
      const ring = coords[0];
      if (!Array.isArray(ring)) continue;
      for (const c of ring) {
        if (!Array.isArray(c) || c.length < 2) continue;
        const lng = Number(c[0]);
        const lat = Number(c[1]);
        if (Number.isFinite(lat) && Number.isFinite(lng)) pts.push([lat, lng]);
      }
    }
    return pts;
  }, [talhoesFc]);

  const mapViewLatLngPoints = useMemo((): [number, number][] => {
    if (obsLatLngPoints.length > 0) return obsLatLngPoints;
    return talhaoOutlineLatLngPoints;
  }, [obsLatLngPoints, talhaoOutlineLatLngPoints]);

  const centerLat = useMemo(() => {
    if (mapViewLatLngPoints.length === 0) return -14.235;
    let s = 0;
    for (const [lat] of mapViewLatLngPoints) s += lat;
    return s / mapViewLatLngPoints.length;
  }, [mapViewLatLngPoints]);

  const centerLng = useMemo(() => {
    if (mapViewLatLngPoints.length === 0) return -51.9253;
    let s = 0;
    for (const [, lng] of mapViewLatLngPoints) s += lng;
    return s / mapViewLatLngPoints.length;
  }, [mapViewLatLngPoints]);

  const initialZoom = useMemo(() => {
    return mapViewLatLngPoints.length > 0 ? 14 : 4;
  }, [mapViewLatLngPoints]);

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
  const rankingTalhoes = useMemo(() => buildTalhaoRanking(observacoes), [observacoes]);

  const gruposCampoFiltrados = useMemo(
    () => groupObservationsByFieldPoint(filteredObs),
    [filteredObs],
  );

  const gruposComFoto = useMemo(
    () => gruposCampoFiltrados.filter((g) => imagensDistintasDoPonto(g.layers).length > 0),
    [gruposCampoFiltrados],
  );
  const tabelaTemFoto = useMemo(
    () => gruposCampoFiltrados.some((g) => imagensDistintasDoPonto(g.layers).length > 0),
    [gruposCampoFiltrados],
  );

  const gruposPorTalhao = useMemo(() => {
    const m = new Map<string, FieldPointGroup[]>();
    for (const g of gruposCampoFiltrados) {
      const tid = String(g.layers[0]?.talhao_id ?? '');
      const arr = m.get(tid);
      if (arr) arr.push(g);
      else m.set(tid, [g]);
    }
    return m;
  }, [gruposCampoFiltrados]);

  const blocosTalhaoParaTabela = useMemo(() => {
    const entries = [...gruposPorTalhao.entries()];
    entries.sort((a, b) => {
      const nomeA = String(a[1][0]?.layers[0]?.talhao_nome ?? a[0] ?? '');
      const nomeB = String(b[1][0]?.layers[0]?.talhao_nome ?? b[0] ?? '');
      return nomeA.localeCompare(nomeB, 'pt-BR');
    });
    return entries;
  }, [gruposPorTalhao]);

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
      const cluster = (L as any).markerClusterGroup({
        maxClusterRadius: (zoom: number) => {
          if (zoom >= 17) return 14;
          if (zoom >= 15) return 22;
          if (zoom >= 13) return 30;
          return 40;
        },
        spiderfyOnMaxZoom: true,
        disableClusteringAtZoom: 18,
      });
      cluster.addTo(map);
      clusterRef.current = cluster;

      if (mapViewLatLngPoints.length > 0) {
        map.fitBounds(mapViewLatLngPoints, { padding: [40, 40], maxZoom: 17 });
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
      talhaoOutlineLayerRef.current = null;
      rotaLayerRef.current = null;
      talhaoLabelLayerRef.current = null;
      rotaDirectionLayerRef.current = null;
    };
  }, [centerLat, centerLng, initialZoom, mapViewLatLngPoints]);

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
      if (talhaoOutlineLayerRef.current) {
        map.removeLayer(talhaoOutlineLayerRef.current);
        talhaoOutlineLayerRef.current = null;
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

      if (simplifiedTalhoesFc) {
        const talhoesLayer = L.geoJSON(simplifiedTalhoesFc as unknown as GeoJsonObject, {
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

        const outlineGroup = L.layerGroup();
        for (const ft of simplifiedTalhoesFc.features) {
          for (const ring of outerRingsAsLatLngArrays(ft as Feature)) {
            if (ring.length < 2) continue;
            outlineGroup.addLayer(
              L.polyline(ring, {
                color: '#22c55e',
                weight: 4,
                opacity: 0.98,
                lineJoin: 'round',
                lineCap: 'round',
                interactive: false,
              }),
            );
          }
        }
        outlineGroup.addTo(map);
        talhaoOutlineLayerRef.current = outlineGroup;

        if (showTalhaoLabels) {
          const labels = L.layerGroup();
          for (const ft of simplifiedTalhoesFc.features) {
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

      if (simplifiedRotaFc) {
        const rotaLayer = L.geoJSON(simplifiedRotaFc as unknown as GeoJsonObject, {
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
        for (const ft of simplifiedRotaFc.features) {
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
      if (simplifiedTalhoesFc) {
        for (const ft of simplifiedTalhoesFc.features) {
          if (ft.geometry?.type === 'Polygon') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rings = (ft.geometry as any).coordinates as number[][][];
            for (const ring of rings) {
              for (const [lng, lat] of ring) bounds.push([lat, lng]);
            }
          }
        }
      }
      for (const g of gruposCampoFiltrados) {
        const crd = coordsRepresentativas(g.layers);
        if (!crd) continue;
        const { lat, lng } = crd;
        const numLabel = rotuloNumeroPonto(g.layers);
        const cls = piorClasseEntreCamadas(g.layers);
        const color = colorForClass(cls);
        const multiDepth = g.layers.length > 1;
        const depthColor = multiDepth
          ? '#64748b'
          : colorForDepth(String(g.layers[0]?.profundidade ?? ''));
        const displayOnPin = numLabel.length <= 3 ? numLabel : '·';
        const icon = L.divIcon({
          className: 'fs-soil-marker',
          html: `<div style="width:22px;height:22px;border-radius:50%;background:${color};color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid ${depthColor};box-shadow:0 1px 4px rgba(0,0,0,.35);">${displayOnPin}</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        const m = L.marker([lat, lng], { icon });
        const talhaoStr = String(g.layers[0]?.talhao_nome ?? g.layers[0]?.talhao_id ?? '—');
        const icMed = icMedioDoPonto(g.layers);
        const tipHtml = [
          `<strong>Ponto ${escapeTooltipText(numLabel)}</strong>`,
          `${g.layers.length} camada(s)`,
          icMed != null ? `IC médio: ${escapeTooltipText(icMed.toFixed(2))} MPa` : '',
          `Classe (pior): ${escapeTooltipText(cls)}`,
          `Talhão: ${escapeTooltipText(talhaoStr)}`,
        ]
          .filter(Boolean)
          .join('<br/>');
        m.bindTooltip(tipHtml, { direction: 'top', opacity: 0.95 });
        const popupRows = g.layers
          .map((layer) => {
            const prof = escapeTooltipText(String(layer.profundidade ?? '—'));
            const icStr =
              layer.compactacao != null && Number.isFinite(Number(layer.compactacao))
                ? `${Number(layer.compactacao).toFixed(2)} MPa`
                : '—';
            const cl = escapeTooltipText(String(layer.classificacao ?? '—'));
            return `<div style="margin:2px 0;padding:4px 0;border-bottom:1px solid #e7e5e4;font-size:12px;line-height:1.35"><strong>${prof}</strong><br/>IC: ${icStr} · ${cl}</div>`;
          })
          .join('');
        const first = g.layers[0];
        const coordLine =
          first?.lat != null && first?.lng != null
            ? `Coord.: ${Number(first.lat).toFixed(6)}, ${Number(first.lng).toFixed(6)}<br/>`
            : '';
        const popupHtml = [
          `<div style="min-width:200px;font-size:12px">`,
          `<strong>Ponto ${escapeTooltipText(numLabel)}</strong><br/>`,
          coordLine,
          `Talhão: ${escapeTooltipText(talhaoStr)}<br/>`,
          icMed != null ? `IC médio (ponto): ${escapeTooltipText(icMed.toFixed(2))} MPa<br/>` : '',
          `<div style="margin-top:6px;font-weight:600">Camadas</div>`,
          popupRows,
          `</div>`,
        ].join('');
        m.bindPopup(popupHtml);
        m.on('click', () => setSelectedGroup(g));
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
  }, [
    gruposCampoFiltrados,
    filteredObs,
    showHeat,
    showIsolines,
    showTalhaoLabels,
    isolinesFc,
    simplifiedTalhoesFc,
    simplifiedRotaFc,
  ]);

  const shpUrl = `/api/amostragem/export/shp?token=${encodeURIComponent(shareToken)}`;

  const cultura = (meta.culture as string) || '';
  const nomeCampanha = (meta.campaignName as string) || '';
  const nomeFazenda = (meta.fazenda_nome as string) || '';
  const talhoesTexto = talhoesOptions.map((t) => t.nome ?? t.id).join(' · ');
  const profundidadesPlanejadas = formatMetaDesiredDepths(meta.desired_depths);

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
              meta.usuario_coleta_id ||
              profundidadesPlanejadas
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
                {profundidadesPlanejadas ? (
                  <div>
                    <strong>Profundidades planejadas (campanha):</strong> {profundidadesPlanejadas}
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

      <div style={{ margin: '12px 22px 0' }}>
        <InteligenciaAgronomicaPanel
          relatorio={{ ...payload, tipo: 'amostragem_solo' }}
          variant="default"
        />
      </div>

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

      {Boolean(meta.compliance_mode) ? (
        <section
          style={{
            margin: '12px 22px 0',
            padding: '16px 18px',
            borderRadius: 4,
            background: ag.card,
            border: `1px solid ${ag.border}`,
            boxShadow: '0 4px 18px rgba(28,25,23,0.06)',
          }}
        >
          <h2 style={{ margin: 0, fontFamily: ag.fontTitle, fontSize: '1.1rem', color: ag.forest }}>
            Metodologia de amostragem (compliance)
          </h2>
          <p style={{ margin: '10px 0 0', fontSize: 13, color: ag.inkMuted, lineHeight: 1.55 }}>
            Levantamento georreferenciado com registro de precisão do GPS, evidência fotográfica por ponto de campo e
            identificação única por profundidade. Cada camada planejada é associada a um código de amostra imutável após a
            coleta; o QR codifica o link público deste relatório quando disponível após publicação.
          </p>
          <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 13, color: ag.ink, lineHeight: 1.55 }}>
            <li>
              <strong>Método declarado:</strong> {String(meta.sampling_method ?? '—')}
            </li>
            <li>
              <strong>Pontos mínimos exigidos:</strong> {String(meta.min_points ?? '—')}
            </li>
            <li>
              <strong>Distância mínima entre pontos:</strong>{' '}
              {meta.min_distance_m != null ? `${String(meta.min_distance_m)} m` : '—'}
            </li>
            <li>
              <strong>Precisão GPS máxima aceita:</strong>{' '}
              {meta.max_gps_accuracy_m != null ? `${String(meta.max_gps_accuracy_m)} m` : '—'}
            </li>
            <li>
              <strong>Subamostras por ponto (planejado):</strong> {String(meta.subsamples_per_point ?? 1)}
            </li>
            {meta.soil_moisture_condition ? (
              <li>
                <strong>Condição de umidade do solo:</strong> {String(meta.soil_moisture_condition)}
              </li>
            ) : null}
            {profundidadesPlanejadas ? (
              <li>
                <strong>Profundidades planejadas:</strong> {profundidadesPlanejadas}
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}

      {Boolean(meta.compliance_mode) ? (
        <section
          style={{
            margin: '12px 22px 0',
            padding: '16px 18px',
            borderRadius: 4,
            background: ag.card,
            border: `1px solid ${ag.border}`,
            boxShadow: '0 4px 18px rgba(28,25,23,0.06)',
          }}
        >
          <h2 style={{ margin: 0, fontFamily: ag.fontTitle, fontSize: '1.1rem', color: ag.forest }}>
            Validação da coleta
          </h2>
          <p style={{ margin: '10px 0 0', fontSize: 13, color: ag.inkMuted, lineHeight: 1.55 }}>
            Indicadores calculados a partir dos pontos publicados e do polígono do talhão (quando disponível). Úteis para
            auditoria e revisão da distribuição espacial da amostragem.
          </p>
          {(() => {
            const cv = coletaValidacaoRecord(meta);
            if (!cv) {
              return (
                <p style={{ margin: '10px 0 0', fontSize: 13, color: ag.inkMuted }}>
                  Publique o relatório novamente com o app atualizado para incluir estas métricas no payload.
                </p>
              );
            }
            return (
              <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 13, color: ag.ink, lineHeight: 1.55 }}>
                <li>
                  <strong>Pontos (total):</strong> {String(cv.pontos_total ?? '—')}
                </li>
                <li>
                  <strong>GPS válido / inválido (critério de precisão):</strong>{' '}
                  {cv.pontos_gps_valido != null && cv.pontos_gps_invalido != null
                    ? `${String(cv.pontos_gps_valido)} / ${String(cv.pontos_gps_invalido)}`
                    : '—'}
                </li>
                <li>
                  <strong>Precisão GPS média:</strong>{' '}
                  {fmtNumPt(cv.precisao_gps_media_m, 1) !== '—' ? `${fmtNumPt(cv.precisao_gps_media_m, 1)} m` : '—'}
                </li>
                <li>
                  <strong>Distância média ao vizinho mais próximo:</strong>{' '}
                  {fmtNumPt(cv.distancia_media_vizinho_m, 1) !== '—'
                    ? `${fmtNumPt(cv.distancia_media_vizinho_m, 1)} m`
                    : '—'}
                </li>
                <li>
                  <strong>Cobertura da área (envoltória vs talhão):</strong>{' '}
                  {fmtNumPt(cv.cobertura_area_pct, 1) !== '—' ? `${fmtNumPt(cv.cobertura_area_pct, 1)} %` : '—'}
                </li>
                {cv.area_talhao_ha != null && Number.isFinite(Number(cv.area_talhao_ha)) ? (
                  <li>
                    <strong>Área do talhão (polígono):</strong> {fmtNumPt(cv.area_talhao_ha, 2)} ha
                  </li>
                ) : null}
                {cv.area_envoltoria_pontos_ha != null && Number.isFinite(Number(cv.area_envoltoria_pontos_ha)) ? (
                  <li>
                    <strong>Área envoltória dos pontos:</strong> {fmtNumPt(cv.area_envoltoria_pontos_ha, 2)} ha
                  </li>
                ) : null}
                {cv.criterio_precisao_max_m != null && Number.isFinite(Number(cv.criterio_precisao_max_m)) ? (
                  <li>
                    <strong>Critério de precisão máx. (campanha):</strong> {fmtNumPt(cv.criterio_precisao_max_m, 1)} m
                  </li>
                ) : null}
              </ul>
            );
          })()}
        </section>
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
          {analytics.icDesvioPadrao != null && (
            <div style={{ padding: 12, background: ag.paper2, borderRadius: 4, border: `1px solid ${ag.border}` }}>
              <div style={{ fontSize: 11, color: ag.inkMuted, textTransform: 'uppercase' }}>Desv. Padrão</div>
              <div style={{ fontSize: 1.25 + 'rem', fontWeight: 700, marginTop: 4 }}>
                {analytics.icDesvioPadrao.toFixed(2)} MPa
              </div>
            </div>
          )}
          {analytics.coefVariacao != null && (
            <div style={{ padding: 12, background: ag.paper2, borderRadius: 4, border: `1px solid ${ag.border}` }}>
              <div style={{ fontSize: 11, color: ag.inkMuted, textTransform: 'uppercase' }}>CV%</div>
              <div style={{ fontSize: 1.25 + 'rem', fontWeight: 700, marginTop: 4, color: analytics.coefVariacao > 40 ? '#dc2626' : analytics.coefVariacao > 25 ? '#ca8a04' : ag.ink }}>
                {analytics.coefVariacao.toFixed(1)}%
                <span style={{ fontSize: 11, fontWeight: 500, color: ag.inkMuted, marginLeft: 4 }}>
                  {analytics.coefVariacao > 40 ? '(alto)' : analytics.coefVariacao > 25 ? '(moderado)' : '(baixo)'}
                </span>
              </div>
            </div>
          )}
          {analytics.icP90 != null && (
            <div style={{ padding: 12, background: ag.paper2, borderRadius: 4, border: `1px solid ${ag.border}` }}>
              <div style={{ fontSize: 11, color: ag.inkMuted, textTransform: 'uppercase' }}>Percentil 90</div>
              <div style={{ fontSize: 1.25 + 'rem', fontWeight: 700, marginTop: 4 }}>
                {analytics.icP90.toFixed(2)} MPa
              </div>
            </div>
          )}
        </div>
        {analytics.distribuicao.length > 0 ? (
          <div style={{ marginTop: 16 }}>
            <strong style={{ fontSize: 13, color: ag.forest }}>Distribuição por classe (camadas com IC)</strong>
            <div style={{ marginTop: 10 }}>
              {analytics.distribuicao.map((d) => (
                <div key={d.classe} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ width: 80, fontSize: 12, fontWeight: 600, color: colorForClass(d.classe) }}>
                    ● {d.classe}
                  </span>
                  <div style={{ flex: 1, height: 20, background: `${ag.border}40`, borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                    <div
                      style={{
                        width: `${Math.max(d.pct, 2)}%`,
                        height: '100%',
                        background: colorForClass(d.classe),
                        borderRadius: 4,
                        transition: 'width 0.6s ease',
                        opacity: 0.85,
                      }}
                    />
                  </div>
                  <span style={{ width: 80, fontSize: 12, fontWeight: 600, textAlign: 'right' }}>
                    {d.count} ({d.pct}%)
                  </span>
                </div>
              ))}
            </div>
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

      {rankingTalhoes.length > 1 ? (
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
            Ranking consolidado multi-talhão
          </h2>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: ag.inkMuted }}>
            Comparativo rápido entre talhões para priorização em reunião técnica.
          </p>
          <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.7 }}>
            {(() => {
              const critico = [...rankingTalhoes].sort((a, b) => b.pctAltaCritica - a.pctAltaCritica)[0];
              const melhor = [...rankingTalhoes].sort((a, b) => (a.icMedio ?? 999) - (b.icMedio ?? 999))[0];
              const baixaConf = [...rankingTalhoes].sort((a, b) => a.confiabilidade - b.confiabilidade)[0];
              return (
                <>
                  <div>
                    <strong>Talhão mais crítico:</strong> {critico?.talhaoNome ?? '—'} ({critico?.pctAltaCritica ?? 0}% alta+crítica)
                  </div>
                  <div>
                    <strong>Talhão com melhor tendência:</strong> {melhor?.talhaoNome ?? '—'} (IC médio {melhor?.icMedio?.toFixed(2) ?? '—'} MPa)
                  </div>
                  <div>
                    <strong>Baixa confiabilidade de amostragem:</strong> {baixaConf?.talhaoNome ?? '—'} (score {baixaConf?.confiabilidade ?? 0}%)
                  </div>
                </>
              );
            })()}
          </div>
          <div style={{ overflowX: 'auto', marginTop: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: ag.paper2 }}>
                  <th style={{ textAlign: 'left', padding: 8 }}>Talhão</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>IC médio</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>% alta+crítica</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Confiabilidade</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Tendência</th>
                </tr>
              </thead>
              <tbody>
                {rankingTalhoes
                  .sort((a, b) => b.pctAltaCritica - a.pctAltaCritica)
                  .map((r) => (
                    <tr key={r.talhaoId} style={{ borderTop: `1px solid ${ag.border}` }}>
                      <td style={{ padding: 8 }}>{r.talhaoNome}</td>
                      <td style={{ padding: 8 }}>{r.icMedio != null ? `${r.icMedio.toFixed(2)} MPa` : '—'}</td>
                      <td style={{ padding: 8 }}>{r.pctAltaCritica.toFixed(1)}%</td>
                      <td style={{ padding: 8 }}>{r.confiabilidade.toFixed(1)}%</td>
                      <td style={{ padding: 8 }}>
                        {r.tendenciaSlope == null
                          ? 'Sem série'
                          : r.tendenciaSlope < 0
                            ? 'Melhorando'
                            : r.tendenciaSlope > 0
                              ? 'Piorando'
                              : 'Estável'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <div style={{ position: 'relative', height: 'min(70vh, 640px)', margin: 18, boxShadow: '0 8px 28px rgba(28,25,23,0.08)' }}>
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 12,
            zIndex: 500,
            background: 'rgba(255,252,247,0.95)',
            border: `1px solid ${ag.border}`,
            borderRadius: 4,
            padding: '6px 10px',
            fontSize: 12,
            color: ag.inkMuted,
            boxShadow: '0 2px 10px rgba(28,25,23,0.08)',
          }}
        >
          {selectedTalhao
            ? `Visualização filtrada por talhão (${talhoesOptions.find((t) => t.id === selectedTalhao)?.nome ?? selectedTalhao})`
            : 'Visualização consolidada de todos os talhões da campanha'}
        </div>
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
            bottom: 10,
            left: 10,
            background: 'rgba(255,252,247,0.88)',
            padding: '6px 9px',
            borderRadius: 3,
            boxShadow: '0 2px 10px rgba(28,25,23,0.07)',
            fontSize: 10,
            zIndex: 500,
            lineHeight: 1.35,
            border: `1px solid ${ag.border}`,
            fontFamily: ag.fontBody,
            maxWidth: 210,
            color: ag.inkMuted,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 9, letterSpacing: '0.04em', color: ag.forest, marginBottom: 4, opacity: 0.9 }}>
            IC (índice de cone)
          </div>
          {IC_LEGEND_ROWS.map((row) => (
            <div key={row.classificacao} style={{ fontSize: 10 }}>
              <span style={{ color: row.color }}>●</span>{' '}
              <span style={{ color: ag.ink }}>{row.descricao}</span>{' '}
              <span style={{ opacity: 0.85 }}>{row.faixaMpa}</span>
            </div>
          ))}
          <details style={{ marginTop: 6, fontSize: 9 }}>
            <summary style={{ cursor: 'pointer', userSelect: 'none', fontWeight: 600, color: ag.ink }}>
              Mapa · profundidades e vetores
            </summary>
            <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${ag.border}` }}>
              <div style={{ marginBottom: 4, fontWeight: 600, color: ag.ink }}>Borda = camada (1 ponto)</div>
              <div><span style={{ color: '#38bdf8' }}>●</span> 0–10</div>
              <div><span style={{ color: '#22c55e' }}>●</span> 10–20</div>
              <div><span style={{ color: '#f59e0b' }}>●</span> 20–30</div>
              <div><span style={{ color: '#f97316' }}>●</span> 30–40</div>
              <div><span style={{ color: '#a855f7' }}>●</span> 40–50 cm</div>
              <div style={{ marginTop: 6, fontSize: 9 }}>
                <span style={{ color: '#64748b' }}>●</span> várias camadas no mesmo GPS
              </div>
              <div style={{ marginTop: 6 }}>
                <span style={{ color: '#60a5fa' }}>━</span> Rota
              </div>
              <div>
                <span style={{ color: '#f8fafc' }}>▭</span> Talhão
              </div>
            </div>
          </details>
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
                  <th style={{ textAlign: 'left', padding: 10 }}>Mín / Máx</th>
                  <th style={{ textAlign: 'left', padding: 10 }}>Classe</th>
                  <th style={{ textAlign: 'left', padding: 10, minWidth: 220 }}>Interpretação agronômica</th>
                </tr>
              </thead>
              <tbody>
                {analytics.porProfundidade.map((row) => (
                  <tr key={row.profundidade} style={{ borderTop: `1px solid ${ag.border}` }}>
                    <td style={{ padding: 10, fontWeight: 600 }}>{row.profundidade}</td>
                    <td style={{ padding: 10 }}>{row.n}</td>
                    <td style={{ padding: 10, fontWeight: 700 }}>{row.icMedio.toFixed(2)}</td>
                    <td style={{ padding: 10, fontSize: 12 }}>{row.icMin.toFixed(2)} / {row.icMax.toFixed(2)}</td>
                    <td style={{ padding: 10 }}>
                      <span style={{ color: colorForClass(row.classePredominante) }}>●</span> {row.classePredominante}
                    </td>
                    <td style={{ padding: 10, fontSize: 12, color: row.icMedio > 2.0 ? '#dc2626' : row.icMedio > 1.5 ? '#ca8a04' : ag.inkMuted, fontStyle: 'italic' }}>
                      {row.interpretacao}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section style={{ padding: '0 22px 18px' }}>
        <h2 style={{ fontFamily: ag.fontTitle, fontSize: '1.15rem', color: ag.forest, marginBottom: 6 }}>
          Registro de pontos ({gruposCampoFiltrados.length})
        </h2>
        <p style={{ margin: '0 0 12px', fontSize: 12, color: ag.inkMuted, lineHeight: 1.5 }}>
          Uma linha por ponto de GPS; profundidades e detalhes abrem ao clicar (pop-up). No recorte há{' '}
          <strong>{filteredObs.length}</strong> registro(s) de camada.
          {talhoesOptions.length > 1 && !selectedTalhao ? (
            <>
              {' '}
              Talhões agrupados abaixo — expanda cada bloco para ver os pontos.
            </>
            ) : null}
        </p>
        {talhoesOptions.length > 1 && !selectedTalhao ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {blocosTalhaoParaTabela.map(([tid, gruposTal]) => {
              const nomeTal =
                gruposTal[0]?.layers[0]?.talhao_nome ??
                talhoesOptions.find((t) => t.id === tid)?.nome ??
                (tid ? tid : 'Sem talhão');
              return (
                <details
                  key={tid || '_sem_talhao'}
                  style={{
                    borderRadius: 4,
                    border: `1px solid ${ag.border}`,
                    background: ag.card,
                    overflow: 'hidden',
                  }}
                >
                  <summary
                    style={{
                      padding: '12px 14px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 14,
                      color: ag.forest,
                      listStyle: 'none',
                    }}
                  >
                    {nomeTal} — {gruposTal.length} ponto(s)
                  </summary>
                  <div style={{ padding: '0 8px 12px' }}>
                    <TabelaGruposPontos
                      grupos={gruposTal}
                      tabelaTemFoto={tabelaTemFoto}
                      ag={ag}
                      onOpen={(g) => setSelectedGroup(g)}
                      highlightSampleCode={highlightSampleCode}
                    />
                  </div>
                </details>
              );
            })}
          </div>
        ) : (
          <TabelaGruposPontos
            grupos={gruposCampoFiltrados}
            tabelaTemFoto={tabelaTemFoto}
            ag={ag}
            onOpen={(g) => setSelectedGroup(g)}
            highlightSampleCode={highlightSampleCode}
          />
        )}
      </section>

      {gruposComFoto.length > 0 ? (
        <section style={{ padding: '0 22px 22px' }}>
          <h2 style={{ fontFamily: ag.fontTitle, fontSize: '1.15rem', color: ag.forest, marginBottom: 10 }}>
            Registros fotográficos ({gruposComFoto.length} ponto(s))
          </h2>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: ag.inkMuted }}>
            Uma miniatura por ponto de campo; fotos repetidas entre camadas aparecem uma vez até abrir o detalhe.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 14,
            }}
          >
            {gruposComFoto.map((g) => {
              const layers = g.layers;
              const thumbs = imagensDistintasDoPonto(layers);
              const primary = thumbs[0]!;
              const numLabel = rotuloNumeroPonto(layers);
              const icM = icMedioDoPonto(layers);
              return (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setSelectedGroup(g)}
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
                    src={primary}
                    alt={`Ponto ${numLabel}`}
                    style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{ padding: 10, fontSize: 12, lineHeight: 1.45 }}>
                    <strong>Ponto {numLabel}</strong>
                    <div style={{ color: ag.inkMuted }}>
                      {layers.length} camada(s)
                      {thumbs.length > 1 ? ` · ${thumbs.length} foto(s) distinta(s)` : ''}
                    </div>
                    {icM != null ? (
                      <div style={{ color: ag.forest, fontWeight: 600 }}>
                        IC médio {icM.toFixed(2)} MPa · {piorClasseEntreCamadas(layers)}
                      </div>
                    ) : null}
                    {(layers[0]?.talhao_nome || layers[0]?.talhao_id) && (
                      <div style={{ color: ag.inkMuted }}>{layers[0]?.talhao_nome || layers[0]?.talhao_id}</div>
                    )}
                  </div>
                </button>
              );
            })}
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

      {selectedGroup && (
        <div
          role="dialog"
          aria-modal="true"
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
          onClick={() => setSelectedGroup(null)}
        >
          <div
            style={{
              background: ag.card,
              maxWidth: 520,
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
            {(() => {
              const layers = selectedGroup.layers;
              const head = layers[0];
              const numLabel = rotuloNumeroPonto(layers);
              const icM = icMedioDoPonto(layers);
              return (
                <>
                  <h3 style={{ marginTop: 0, fontFamily: ag.fontTitle, color: ag.forest }}>
                    Ponto de amostragem {numLabel}
                  </h3>
                  {head?.point_name ? (
                    <p style={{ fontSize: 14, marginBottom: 4 }}>
                      <strong>Identificação no campo:</strong> {head.point_name}
                    </p>
                  ) : null}
                  {(head?.talhao_nome || head?.talhao_id) && (
                    <p style={{ fontSize: 14 }}>
                      <strong>Talhão:</strong> {head?.talhao_nome || head?.talhao_id}
                    </p>
                  )}
                  {head?.lat != null && head?.lng != null ? (
                    <p style={{ fontSize: 13, color: ag.inkMuted }}>
                      <strong>Coordenadas (WGS84):</strong> {head.lat.toFixed(6)}, {head.lng.toFixed(6)}
                    </p>
                  ) : null}
                  {head?.altitude_m != null ? (
                    <p style={{ fontSize: 13, color: ag.inkMuted }}>
                      <strong>Cota ortométrica aprox.:</strong> {head.altitude_m.toFixed(1)} m
                      {head.gps_accuracy_m != null ? ` · precisão horizontal ±${head.gps_accuracy_m.toFixed(1)} m` : ''}
                      {head.gps_provider ? ` · fonte: ${head.gps_provider}` : ''}
                    </p>
                  ) : null}
                  {icM != null ? (
                    <p style={{ fontSize: 14, fontWeight: 600, color: ag.forest }}>
                      IC médio no ponto: {icM.toFixed(2)} MPa ({piorClasseEntreCamadas(layers)})
                    </p>
                  ) : null}
                  <p style={{ fontSize: 12, color: ag.inkMuted, marginBottom: 12 }}>
                    {layers.length} camada(s) — expanda cada bloco para ver dados, leituras e foto por profundidade.
                  </p>
                </>
              );
            })()}
            {(() => {
              const indicePrimeiraPorUrl = new Map<string, number>();
              selectedGroup.layers.forEach((layer, idx) => {
                const u = layer.imagem_url && String(layer.imagem_url).trim();
                if (u && !indicePrimeiraPorUrl.has(u)) indicePrimeiraPorUrl.set(u, idx);
              });
              return selectedGroup.layers.map((selected, i) => (
              <details
                key={String(selected.id ?? `${selectedGroup.key}-${i}`)}
                style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: `1px solid ${ag.border}`,
                }}
              >
                <summary
                  style={{
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 14,
                    color: ag.forest,
                  }}
                >
                  {selected.profundidade ?? 'Camada'}{' '}
                  <span style={{ fontWeight: 500, color: ag.inkMuted }}>
                    · IC{' '}
                    {selected.compactacao != null ? `${selected.compactacao.toFixed(2)} MPa` : '—'} ·{' '}
                    {selected.classificacao}
                  </span>
                </summary>
                <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.55 }}>
                  {selected.sample_code ? (
                    <p style={{ margin: '6px 0' }}>
                      <strong>Código da amostra:</strong> {selected.sample_code}
                    </p>
                  ) : null}
                  {selected.moisture_percent != null ? (
                    <p style={{ margin: '6px 0' }}>
                      <strong>Teor de umidade (gravimétrico, %):</strong> {selected.moisture_percent.toFixed(1)}
                    </p>
                  ) : null}
                  {selected.bulk_density != null ? (
                    <p style={{ margin: '6px 0' }}>
                      <strong>Densidade aparente:</strong> {selected.bulk_density.toFixed(3)} g/cm³
                    </p>
                  ) : null}
                  {selected.quantidade != null ? (
                    <p style={{ margin: '6px 0' }}>
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
                        {selected.leituras.map((L, j) => (
                          <li key={j}>
                            {L.raw_value != null ? `${L.raw_value} ${L.unit ?? ''}` : '—'}
                            {L.ci_mpa != null && Number.isFinite(L.ci_mpa) ? ` → IC ${Number(L.ci_mpa).toFixed(2)} MPa` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {selected.obs ? (
                    <p style={{ margin: '10px 0 0' }}>
                      <strong>Observações de campo:</strong> {selected.obs}
                    </p>
                  ) : null}
                  {selected.imagem_url ? (() => {
                    const u = String(selected.imagem_url).trim();
                    const primeiroIdx = indicePrimeiraPorUrl.get(u);
                    if (primeiroIdx === i) {
                      return (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selected.imagem_url}
                          alt={`Registro fotográfico — ${selected.profundidade ?? 'camada'}`}
                          style={{ width: '100%', borderRadius: 4, marginTop: 10, border: `1px solid ${ag.border}` }}
                        />
                      );
                    }
                    const ref = primeiroIdx != null ? selectedGroup.layers[primeiroIdx] : null;
                    return (
                      <p style={{ marginTop: 10, fontSize: 12, color: ag.inkMuted, fontStyle: 'italic' }}>
                        Mesma foto que em <strong>{ref?.profundidade ?? 'outra camada'}</strong> (URL repetida no envio).
                      </p>
                    );
                  })() : null}
                </div>
              </details>
            ));
            })()}
            <button
              type="button"
              onClick={() => setSelectedGroup(null)}
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
