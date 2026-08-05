'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { PontoMonitoramento } from '@/lib/types/monitoring';

function normTipoMap(t: unknown): 'praga' | 'doenca' | 'daninha' {
  const s = String(t ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
  if (s.includes('doenc')) return 'doenca';
  if (s.includes('daninh')) return 'daninha';
  return 'praga';
}

/** Ícone no mapa para pontos com foto: prioriza doença > daninha > praga. */
function emojiIconForFotos(infestacoes: PontoMonitoramento['infestacoes']): string {
  const comFoto = infestacoes.filter((i) => i.imagem && String(i.imagem).trim());
  if (comFoto.length === 0) return '📍';
  if (comFoto.some((i) => normTipoMap(i.tipo) === 'doenca')) return '🦠';
  if (comFoto.some((i) => normTipoMap(i.tipo) === 'daninha')) return '🌿';
  return '🐛';
}

export interface MapaLayersVisible {
  poligono?: boolean;
  pontos?: boolean;
  heatmap?: boolean;
  fotos?: boolean;
  falhas?: boolean;
  duplos?: boolean;
  observacoes?: boolean;
}

export interface MapaInterativoRef {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
}

interface MapaInterativoProps {
  pontos: PontoMonitoramento[];
  poligono: { type: string; geometry: { type: string; coordinates: number[][][] }; properties?: Record<string, unknown> };
  talhaoId: string;
  hideHeader?: boolean;
  onImageClick?: (url: string, caption?: string) => void;
  /** Controle de camadas (todas true por padrão). */
  layersVisible?: MapaLayersVisible;
  /** Chamado quando o mapa está pronto (permite flyTo mesmo com dynamic import). */
  onMapReady?: (api: MapaInterativoRef) => void;
  /** Altura do tile map (px). */
  mapHeight?: number;
}

function severidadeColor(sev: number): string {
  if (sev < 10) return '#2E7D32';
  if (sev < 25) return '#F9A825';
  if (sev < 40) return '#E65100';
  return '#C62828';
}

const defaultLayers: MapaLayersVisible = {
  poligono: true,
  pontos: true,
  heatmap: true,
  fotos: true,
  falhas: true,
  duplos: true,
  observacoes: true,
};

const MapaInterativo = forwardRef<MapaInterativoRef, MapaInterativoProps>(function MapaInterativo(
  { pontos, poligono, talhaoId, hideHeader, onImageClick, layersVisible: layersVisibleProp, onMapReady, mapHeight = 360 },
  ref
) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);
  const polygonLayerRef = useRef<unknown>(null);
  const markersLayerRef = useRef<unknown>(null);
  const heatLayerRef = useRef<unknown>(null);
  const fotosLayerRef = useRef<unknown>(null);
  const falhasLayerRef = useRef<unknown>(null);
  const duplosLayerRef = useRef<unknown>(null);
  const observacoesLayerRef = useRef<unknown>(null);
  const onImageClickRef = useRef(onImageClick);
  const layersVisible = { ...defaultLayers, ...layersVisibleProp };
  const layersVisibleRef = useRef(layersVisible);
  layersVisibleRef.current = layersVisible;
  const [mapReady, setMapReady] = useState(false);

  const flyTo = (lat: number, lng: number, zoom?: number) => {
    const map = mapInstance.current as { flyTo: (latlng: [number, number], z?: number) => void } | null;
    if (map?.flyTo) map.flyTo([lat, lng], zoom ?? 16);
  };

  useImperativeHandle(ref, () => ({ flyTo }), []);

  const onMapReadyRef = useRef(onMapReady);
  onMapReadyRef.current = onMapReady;

  useEffect(() => {
    if (typeof window === 'undefined' || mapInstance.current) return;

    import('leaflet').then((L) => {
      if (!mapRef.current || mapInstance.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const coords = poligono.geometry.coordinates[0];
      const centerLat = coords.reduce((s: number, c: number[]) => s + c[1], 0) / coords.length;
      const centerLng = coords.reduce((s: number, c: number[]) => s + c[0], 0) / coords.length;

      const map = L.map(mapRef.current!, { zoomControl: true, scrollWheelZoom: true });
      mapInstance.current = map;

      const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY || 'TiQt1yLZoL6EmShd1flj';
      L.tileLayer(
        `https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${mapTilerKey}`,
        { attribution: '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a>', maxZoom: 20 }
      ).addTo(map);

      const polygon = L.geoJSON(poligono as GeoJSON.GeoJsonObject, {
        style: {
          color: '#2E7D32',
          weight: 2.5,
          opacity: 0.9,
          fillColor: '#4CAF50',
          fillOpacity: 0.15,
        },
      });
      polygonLayerRef.current = polygon;
      if (layersVisibleRef.current.poligono !== false) polygon.addTo(map);

      map.fitBounds(polygon.getBounds(), { padding: [32, 32] });

      const metricasPorPonto: Record<string, number> = {};
      pontos.forEach((p) => {
        const sev = p.infestacoes.length > 0
          ? p.infestacoes.reduce((s, i) => s + i.severidade, 0) / p.infestacoes.length
          : 0;
        metricasPorPonto[p.id] = sev;
      });

      const markersLayer = L.layerGroup();
      markersLayerRef.current = markersLayer;

      pontos.forEach((ponto) => {
        const sev = metricasPorPonto[ponto.id] ?? 0;
        const cor = ponto.infestacoes.length === 0 ? '#94A3B8' : severidadeColor(sev);
        const icon = L.divIcon({
          html: `<div style="width:28px;height:28px;border-radius:50%;background:${cor};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;font-family:Inter,sans-serif">${ponto.identificador.replace('P', '')}</div>`,
          className: '',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const infContent = ponto.infestacoes.length === 0
          ? '<em style="color:#64748B;font-size:12px">Sem ocorrências</em>'
          : ponto.infestacoes.map((inf) => {
              const tipoStr = inf.tipo === 'praga' ? 'Praga' : inf.tipo === 'doenca' ? 'Doença' : 'Daninha';
              const caption = `${inf.nome} · ${inf.severidade}% · ${tipoStr}`;
              const imgTag = inf.imagem
                ? `<img class="mapa-popup-img" src="${inf.imagem}" data-src="${inf.imagem}" data-caption="${caption.replace(/"/g, '&quot;')}" style="width:100%;height:60px;object-fit:cover;border-radius:6px;margin-top:5px;cursor:pointer" alt="${(inf.nome || '').replace(/"/g, '&quot;')}" title="Clique para ampliar" />`
                : '';
              return `<div style="padding:6px 0;border-bottom:1px solid #F1F5F9;font-family:Inter,sans-serif;font-size:12px"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><strong>${inf.nome}</strong><span style="background:${severidadeColor(inf.severidade)}22;color:${severidadeColor(inf.severidade)};padding:2px 7px;border-radius:99px;font-weight:700;font-size:11px">${inf.severidade}%</span></div><div style="color:#64748B;margin-top:3px">${inf.tipo === 'praga' ? '🐛 Praga' : inf.tipo === 'doenca' ? '🦠 Doença' : '🌿 Daninha'} · Terço: ${inf.terco} ${inf.quantidade != null ? `· Qtde: ${inf.quantidade}` : ''}</div>${imgTag}</div>`;
            }).join('');

        const popup = L.popup({ maxWidth: 280, className: 'mapa-popup-card' }).setContent(`
          <div style="font-family:Inter,sans-serif;min-width:220px">
            <div style="font-size:10px;color:#94A3B8;font-weight:600;margin-bottom:4px;letter-spacing:.04em">DETALHES DO PONTO</div>
            <div style="background:linear-gradient(135deg,#1B5E20,#2E7D32);color:white;padding:10px 12px;border-radius:8px 8px 0 0;margin:-1px -1px 0;font-weight:700;font-size:14px">📍 Ponto ${ponto.identificador}</div>
            <div style="font-size:11px;color:#64748B;margin:8px 0;padding:6px 8px;background:#F8FAFC;border-radius:6px">${ponto.lat.toFixed(5)}, ${ponto.lng.toFixed(5)}</div>
            <div class="mapa-popup-scroll" style="max-height:220px;overflow-y:auto;padding-right:4px">${infContent}</div>
          </div>
        `);

        L.marker([ponto.lat, ponto.lng], { icon }).bindPopup(popup).addTo(markersLayer);
      });

      if (layersVisibleRef.current.pontos !== false) markersLayer.addTo(map);

      map.on('popupopen', () => {
        document.querySelectorAll('.mapa-popup-card .mapa-popup-img').forEach((el) => {
          const img = el as HTMLImageElement;
          const once = () => {
            onImageClickRef.current?.(img.getAttribute('data-src') || img.src, img.getAttribute('data-caption') || img.alt || undefined);
          };
          img.addEventListener('click', once, { once: true });
        });
      });

      const heatData = pontos.map((p) => [p.lat, p.lng, (metricasPorPonto[p.id] ?? 0) / 100] as [number, number, number]);
      const finishInit = () => {
        setMapReady(true);
        onMapReadyRef.current?.({ flyTo });
      };
      if (heatData.length > 0 && typeof window !== 'undefined') {
        (window as unknown as { L: typeof L }).L = L;
        import('leaflet.heat').then(() => {
          const heat = (L as unknown as { heatLayer: (data: [number, number, number][], opts: object) => { addTo: (m: unknown) => unknown } }).heatLayer(heatData, {
            radius: 80,
            blur: 50,
            maxZoom: 15,
            max: 1.0,
            gradient: { 0.2: '#2E7D32', 0.4: '#F9A825', 0.7: '#E65100', 0.9: '#C62828', 1.0: '#B71C1C' },
          });
          heatLayerRef.current = heat;
          if (layersVisibleRef.current.heatmap !== false) heat.addTo(map);
          finishInit();
        }).catch((e) => {
          console.error('Falha ao carregar heatmap', e);
          finishInit();
        });
      } else {
        finishInit();
      }

      const fotosLayer = L.layerGroup();
      const esc = (s: string) =>
        String(s ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      pontos.forEach((p) => {
        const comFoto = p.infestacoes.filter((i) => i.imagem && String(i.imagem).trim());
        if (comFoto.length === 0) return;
        const emoji = emojiIconForFotos(p.infestacoes);
        const icon = L.divIcon({
          html: `<div style="width:28px;height:28px;border-radius:50%;background:#fff;border:2px solid #0f172a;box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font-size:15px;line-height:1;cursor:pointer" title="Ocorrência com foto">${emoji}</div>`,
          className: '',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        const blocos = comFoto
          .map((inf) => {
            const tipoStr = inf.tipo === 'praga' ? 'Praga' : inf.tipo === 'doenca' ? 'Doença' : 'Daninha';
            const qtd =
              inf.quantidade != null && Number.isFinite(inf.quantidade)
                ? ` · Qtde ${inf.quantidade}`
                : '';
            const sev = `${inf.severidade}%`;
            const img = inf.imagem
              ? `<img class="mapa-popup-img" src="${esc(inf.imagem)}" data-src="${esc(inf.imagem)}" data-caption="${esc(`${inf.nome} · ${sev}`)}" style="width:100%;max-height:56px;object-fit:cover;border-radius:6px;margin-top:6px;cursor:pointer" alt="${esc(inf.nome)}" />`
              : '';
            return `<div style="padding:8px 0;border-bottom:1px solid #E2E8F0;font-size:12px;line-height:1.35">
              <div style="font-weight:700;color:#0f172a">${esc(inf.nome)}</div>
              <div style="color:#64748B;font-size:11px;margin-top:2px">${tipoStr}${qtd} · Sev. ${sev}</div>
              ${img}
            </div>`;
          })
          .join('');
        const popupHtml = `
          <div style="font-family:system-ui,Segoe UI,sans-serif;min-width:200px;max-width:260px">
            <div style="font-size:10px;color:#94A3B8;font-weight:600;margin-bottom:4px">FOTOS DO PONTO</div>
            <div style="font-weight:700;font-size:13px;color:#1e3a5f;margin-bottom:6px">${esc(p.identificador)}</div>
            <div style="max-height:200px;overflow-y:auto">${blocos}</div>
          </div>`;
        const popup = L.popup({ maxWidth: 280, className: 'mapa-popup-card' }).setContent(popupHtml);
        const off = 0.000032;
        L.marker([p.lat + off, p.lng + off], { icon, zIndexOffset: 400 }).bindPopup(popup).addTo(fotosLayer);
      });
      fotosLayerRef.current = fotosLayer;
      if (layersVisibleRef.current.fotos !== false) fotosLayer.addTo(map);

      const falhasLayer = L.layerGroup();
      pontos.forEach((p) => {
        const sev = metricasPorPonto[p.id] ?? 0;
        if (sev < 40) return;
        const icon = L.divIcon({
          html: `<div style="width:20px;height:20px;border-radius:50%;background:${severidadeColor(sev)};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:white;font-size:9px;font-weight:700">!</div>`,
          className: '',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        L.marker([p.lat, p.lng], { icon }).addTo(falhasLayer);
      });
      falhasLayerRef.current = falhasLayer;
      if (layersVisibleRef.current.falhas !== false) falhasLayer.addTo(map);

      const duplosLayer = L.layerGroup();
      pontos.forEach((p) => {
        if (p.infestacoes.length < 2) return;
        const icon = L.divIcon({
          html: '<div style="width:20px;height:20px;border-radius:50%;background:#7C3AED;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:white;font-size:9px">2+</div>',
          className: '',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        L.marker([p.lat, p.lng], { icon }).addTo(duplosLayer);
      });
      duplosLayerRef.current = duplosLayer;
      if (layersVisibleRef.current.duplos !== false) duplosLayer.addTo(map);

      const observacoesLayer = L.layerGroup();
      pontos.forEach((p) => {
        const hasObs = p.infestacoes.some((i) => i.observacao?.trim());
        if (!hasObs) return;
        const icon = L.divIcon({
          html: '<div style="width:18px;height:18px;border-radius:50%;background:#0D9488;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:white;font-size:8px">📝</div>',
          className: '',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        L.marker([p.lat, p.lng], { icon }).addTo(observacoesLayer);
      });
      observacoesLayerRef.current = observacoesLayer;
      if (layersVisibleRef.current.observacoes !== false) observacoesLayer.addTo(map);
    });

    return () => {
      setMapReady(false);
      if (mapInstance.current) {
        (mapInstance.current as { remove: () => void }).remove();
        mapInstance.current = null;
      }
      polygonLayerRef.current = null;
      markersLayerRef.current = null;
      heatLayerRef.current = null;
      fotosLayerRef.current = null;
      falhasLayerRef.current = null;
      duplosLayerRef.current = null;
      observacoesLayerRef.current = null;
    };
  }, [pontos, poligono, talhaoId]);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapInstance.current as { hasLayer: (l: unknown) => boolean; addLayer: (l: unknown) => void; removeLayer: (l: unknown) => void } | null;
    if (!map) return;

    const toggle = (layerRef: React.MutableRefObject<unknown>, visible: boolean | undefined) => {
      const layer = layerRef.current as { addTo?: (m: unknown) => unknown } | null;
      if (!layer) return;
      try {
        if (visible !== false) {
          if (!map.hasLayer(layer)) (layer as { addTo: (m: unknown) => unknown }).addTo?.(map);
        } else {
          if (map.hasLayer(layer)) map.removeLayer(layer as unknown as { remove: () => void });
        }
      } catch (_) {}
    };

    const v = layersVisibleRef.current;
    toggle(polygonLayerRef, v.poligono);
    toggle(markersLayerRef, v.pontos);
    toggle(heatLayerRef, v.heatmap);
    toggle(fotosLayerRef, v.fotos);
    toggle(falhasLayerRef, v.falhas);
    toggle(duplosLayerRef, v.duplos);
    toggle(observacoesLayerRef, v.observacoes);
  }, [layersVisibleProp, mapReady]);

  return (
    <div>
      {!hideHeader && (
        <>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
            Polígono do talhão · Pontos georreferenciados
          </h3>
          <p className="no-print" style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>
            Clique no alfinete (número) ou no ícone 📷 para ver ocorrências e fotos do ponto.
          </p>
        </>
      )}
      <div
        ref={mapRef}
        style={{
          height: mapHeight,
          minHeight: mapHeight,
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
        }}
      />
    </div>
  );
});

export default MapaInterativo;
