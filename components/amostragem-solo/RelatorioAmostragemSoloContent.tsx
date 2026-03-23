'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FeatureCollection, GeoJsonObject, Point } from 'geojson';
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
  const [selected, setSelected] = useState<AmostragemObservacao | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<import('leaflet').Map | null>(null);
  const clusterRef = useRef<import('leaflet').LayerGroup | null>(null);
  const heatRef = useRef<import('leaflet').Layer | null>(null);
  const isolineLayerRef = useRef<import('leaflet').Layer | null>(null);

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

  const centerLat = useMemo(() => {
    for (const o of observacoes) {
      if (o.lat != null && Number.isFinite(o.lat)) return o.lat;
    }
    return -14.235;
  }, [observacoes]);

  const centerLng = useMemo(() => {
    for (const o of observacoes) {
      if (o.lng != null && Number.isFinite(o.lng)) return o.lng;
    }
    return -51.9253;
  }, [observacoes]);

  const initialZoom = useMemo(() => {
    return observacoes.some((o) => o.lat != null && o.lng != null) ? 15 : 4;
  }, [observacoes]);

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
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);
      mapInstance.current = map;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cluster = (L as any).markerClusterGroup({ maxClusterRadius: 40, spiderfyOnMaxZoom: true });
      cluster.addTo(map);
      clusterRef.current = cluster;
    })();

    return () => {
      destroyed = true;
      mapInstance.current?.remove();
      mapInstance.current = null;
      clusterRef.current = null;
      heatRef.current = null;
      isolineLayerRef.current = null;
    };
  }, [centerLat, centerLng, initialZoom]);

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

      const bounds: import('leaflet').LatLngBoundsExpression = [];
      for (const f of filteredFc.features) {
        if (f.geometry?.type !== 'Point') continue;
        const coords = (f.geometry as Point).coordinates;
        const lng = coords[0];
        const lat = coords[1];
        const pr = (f.properties ?? {}) as Record<string, unknown>;
        const num = Number(pr.numero) || 0;
        const cls = String(pr.classificacao ?? '');
        const color = colorForClass(cls);
        const icon = L.divIcon({
          className: 'fs-soil-marker',
          html: `<div style="width:22px;height:22px;border-radius:50%;background:${color};color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);">${num}</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        const m = L.marker([lat, lng], { icon });
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
  }, [filteredFc, filteredObs, observacoes, showHeat, showIsolines, isolinesFc]);

  const shpUrl = `/api/amostragem/export/shp?token=${encodeURIComponent(shareToken)}`;

  const cultura = (meta.culture as string) || '';
  const nomeCampanha = (meta.campaignName as string) || '';

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
          {Boolean(
            meta.description ||
              meta.safra ||
              meta.responsavel ||
              meta.crea ||
              meta.tipo_layout ||
              meta.fator_pontos_ha != null ||
              meta.modo_coleta ||
              meta.tipo ||
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
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <input type="checkbox" checked={showHeat} onChange={(e) => setShowHeat(e.target.checked)} />
            Mapa de intensidade (IC)
          </label>
          {isolinesFc ? (
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={showIsolines}
                onChange={(e) => setShowIsolines(e.target.checked)}
              />
              Isolinhas de IC
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
          <div>
            <span style={{ color: '#dc2626' }}>●</span> Restrição crítica (IC &gt; 3 MPa)
          </div>
          <div>
            <span style={{ color: '#ea580c' }}>●</span> Restrição alta (2–3 MPa)
          </div>
          <div>
            <span style={{ color: '#ca8a04' }}>●</span> Restrição moderada (1–2 MPa)
          </div>
          <div>
            <span style={{ color: '#16a34a' }}>●</span> Baixa restrição (IC &lt; 1 MPa)
          </div>
        </div>
      </div>

      <section style={{ padding: '0 22px 28px' }}>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
