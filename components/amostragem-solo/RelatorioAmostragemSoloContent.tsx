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

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    let destroyed = false;

    (async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');
      await import('leaflet.markercluster/dist/MarkerCluster.css');
      await import('leaflet.markercluster');

      if (destroyed || !mapRef.current) return;

      const map = L.map(mapRef.current).setView([-14.235, -51.9253], 4);
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
  }, []);

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

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <header
        style={{
          padding: '16px 20px',
          background: '#14532d',
          color: '#fff',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Amostragem de solos</h1>
          <p style={{ margin: '6px 0 0', opacity: 0.9, fontSize: 14 }}>
            {(meta.campaignName as string) ?? 'Campanha'} · {(meta.culture as string) ?? '—'}
          </p>
          {Boolean(
            meta.description ||
              meta.safra ||
              meta.responsavel ||
              meta.crea ||
              meta.tipo_layout ||
              meta.fator_pontos_ha != null ||
              meta.modo_coleta ||
              meta.tipo
          ) && (
            <details style={{ marginTop: 10, fontSize: 13, opacity: 0.92, maxWidth: 560 }}>
              <summary style={{ cursor: 'pointer', userSelect: 'none' }}>Detalhes da campanha</summary>
              <div style={{ marginTop: 8, lineHeight: 1.5 }}>
                {meta.description ? <div>{String(meta.description)}</div> : null}
                {meta.safra ? (
                  <div>
                    <strong>Safra:</strong> {String(meta.safra)}
                  </div>
                ) : null}
                {meta.responsavel ? (
                  <div>
                    <strong>Responsável:</strong> {String(meta.responsavel)}
                    {meta.crea ? ` · CREA ${String(meta.crea)}` : ''}
                  </div>
                ) : meta.crea ? (
                  <div>
                    <strong>CREA:</strong> {String(meta.crea)}
                  </div>
                ) : null}
                {meta.tipo ? (
                  <div>
                    <strong>Tipo de coleta:</strong> {String(meta.tipo)}
                  </div>
                ) : null}
                {meta.modo_coleta ? (
                  <div>
                    <strong>Modo:</strong> {String(meta.modo_coleta)}
                  </div>
                ) : null}
                {meta.tipo_layout ? (
                  <div>
                    <strong>Layout:</strong> {String(meta.tipo_layout)}
                    {meta.fator_pontos_ha != null ? ` (${String(meta.fator_pontos_ha)} pts/ha)` : ''}
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
              style={{ padding: '8px 10px', borderRadius: 8, border: 'none' }}
            >
              <option value="">Todos os talhões</option>
              {talhoesOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome ?? t.id}
                </option>
              ))}
            </select>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <input type="checkbox" checked={showHeat} onChange={(e) => setShowHeat(e.target.checked)} />
            Heatmap
          </label>
          {isolinesFc ? (
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
              <input
                type="checkbox"
                checked={showIsolines}
                onChange={(e) => setShowIsolines(e.target.checked)}
              />
              Isolinhas (premium)
            </label>
          ) : null}
          <a
            href={shpUrl}
            style={{
              background: '#fff',
              color: '#14532d',
              padding: '8px 14px',
              borderRadius: 8,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Exportar SHP
          </a>
        </div>
      </header>

      <div style={{ position: 'relative', height: 'min(70vh, 640px)', margin: 16 }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden' }} />
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            background: 'rgba(255,255,255,0.95)',
            padding: '10px 12px',
            borderRadius: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,.12)',
            fontSize: 12,
            zIndex: 500,
            lineHeight: 1.6,
          }}
        >
          <strong style={{ display: 'block', marginBottom: 6 }}>Legenda — MPa</strong>
          <div>
            <span style={{ color: '#dc2626' }}>●</span> Crítica (&gt;3)
          </div>
          <div>
            <span style={{ color: '#ea580c' }}>●</span> Alta (2–3)
          </div>
          <div>
            <span style={{ color: '#ca8a04' }}>●</span> Moderada (1–2)
          </div>
          <div>
            <span style={{ color: '#16a34a' }}>●</span> Baixa (&lt;1)
          </div>
        </div>
      </div>

      <section style={{ padding: '0 20px 24px' }}>
        <h2 style={{ fontSize: '1.05rem' }}>Pontos ({filteredObs.length})</h2>
        <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ textAlign: 'left', padding: 8 }}>#</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Prof.</th>
                <th style={{ textAlign: 'left', padding: 8 }}>MPa</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Classe</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Talhão</th>
              </tr>
            </thead>
            <tbody>
              {filteredObs.map((o) => (
                <tr
                  key={String(o.id)}
                  style={{ borderTop: '1px solid #e2e8f0', cursor: 'pointer' }}
                  onClick={() => setSelected(o)}
                >
                  <td style={{ padding: 8 }}>{o.numero}</td>
                  <td style={{ padding: 8 }}>{o.profundidade ?? '—'}</td>
                  <td style={{ padding: 8 }}>{o.compactacao != null ? o.compactacao.toFixed(2) : '—'}</td>
                  <td style={{ padding: 8 }}>{o.classificacao}</td>
                  <td style={{ padding: 8 }}>{o.talhao_id ?? '—'}</td>
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
              background: '#fff',
              maxWidth: 420,
              width: '100%',
              borderRadius: 12,
              padding: 20,
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Ponto #{selected.numero}</h3>
            {selected.point_name ? (
              <p style={{ fontSize: 14, marginBottom: 4 }}>
                <strong>Nome:</strong> {selected.point_name}
              </p>
            ) : null}
            <p style={{ fontSize: 14, color: '#475569' }}>
              {selected.lat?.toFixed(6)}, {selected.lng?.toFixed(6)}
            </p>
            {selected.altitude_m != null ? (
              <p style={{ fontSize: 13, color: '#475569' }}>
                Alt. {selected.altitude_m.toFixed(1)} m
                {selected.gps_accuracy_m != null ? ` · precisão ±${selected.gps_accuracy_m.toFixed(1)} m` : ''}
                {selected.gps_provider ? ` · ${selected.gps_provider}` : ''}
              </p>
            ) : null}
            <p>
              <strong>Profundidade:</strong> {selected.profundidade ?? '—'}
            </p>
            {selected.sample_code ? (
              <p>
                <strong>Código amostra:</strong> {selected.sample_code}
              </p>
            ) : null}
            {selected.moisture_percent != null ? (
              <p>
                <strong>Umidade:</strong> {selected.moisture_percent.toFixed(1)}%
              </p>
            ) : null}
            {selected.bulk_density != null ? (
              <p>
                <strong>Densidade:</strong> {selected.bulk_density.toFixed(3)} g/cm³
              </p>
            ) : null}
            <p>
              <strong>Compactação:</strong>{' '}
              {selected.compactacao != null ? `${selected.compactacao.toFixed(2)} MPa` : '—'} ({selected.classificacao})
            </p>
            {selected.quantidade != null ? (
              <p>
                <strong>Quantidade (solo):</strong> {selected.quantidade}
              </p>
            ) : null}
            {(selected.tipo_penetrometro ||
              selected.peso_martelo_kg != null ||
              selected.altura_queda_cm != null ||
              selected.numero_impactos != null ||
              selected.profundidade_atingida_cm != null) && (
              <div style={{ fontSize: 13, marginTop: 8 }}>
                <strong>Penetrômetro / manual</strong>
                {selected.tipo_penetrometro ? (
                  <div>Tipo: {selected.tipo_penetrometro}</div>
                ) : null}
                {selected.peso_martelo_kg != null ? (
                  <div>Martelo: {selected.peso_martelo_kg} kg</div>
                ) : null}
                {selected.altura_queda_cm != null ? (
                  <div>Queda: {selected.altura_queda_cm} cm</div>
                ) : null}
                {selected.numero_impactos != null ? (
                  <div>Impactos: {selected.numero_impactos}</div>
                ) : null}
                {selected.profundidade_atingida_cm != null ? (
                  <div>Prof. atingida: {selected.profundidade_atingida_cm} cm</div>
                ) : null}
              </div>
            )}
            {selected.leituras && selected.leituras.length > 0 ? (
              <div style={{ marginTop: 10, fontSize: 13 }}>
                <strong>Leituras ({selected.leituras.length})</strong>
                <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                  {selected.leituras.map((L, i) => (
                    <li key={i}>
                      {L.raw_value != null ? `${L.raw_value} ${L.unit ?? ''}` : '—'}
                      {L.ci_mpa != null && Number.isFinite(L.ci_mpa) ? ` → ${Number(L.ci_mpa).toFixed(2)} MPa` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {selected.obs ? (
              <p>
                <strong>Obs.:</strong> {selected.obs}
              </p>
            ) : null}
            {selected.imagem_url ? (
              <img
                src={selected.imagem_url}
                alt="Amostra"
                style={{ width: '100%', borderRadius: 8, marginTop: 8 }}
              />
            ) : null}
            <button
              type="button"
              onClick={() => setSelected(null)}
              style={{ marginTop: 16, padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1' }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
