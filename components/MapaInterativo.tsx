'use client';

import { useEffect, useRef } from 'react';
import { PontoMonitoramento } from '@/lib/types/monitoring';
import { calcularMetricasPorPonto } from '@/lib/calculations';

interface MapaInterativoProps {
    pontos: PontoMonitoramento[];
    poligono: { type: string; geometry: { type: string; coordinates: number[][][] }; properties?: Record<string, unknown> };
    talhaoId: string;
}

function severidadeColor(sev: number): string {
    if (sev < 10) return '#2E7D32';
    if (sev < 25) return '#F9A825';
    if (sev < 40) return '#E65100';
    return '#C62828';
}

export default function MapaInterativo({ pontos, poligono, talhaoId }: MapaInterativoProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<unknown>(null);

    useEffect(() => {
        if (typeof window === 'undefined' || mapInstance.current) return;

        // Dynamic import to avoid SSR issues
        import('leaflet').then(L => {
            if (!mapRef.current || mapInstance.current) return;

            // Fix default icon
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });

            // Calcular centro do polígono
            const coords = poligono.geometry.coordinates[0];
            const centerLat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
            const centerLng = coords.reduce((s, c) => s + c[0], 0) / coords.length;

            const map = L.map(mapRef.current!, { zoomControl: true, scrollWheelZoom: false });
            mapInstance.current = map;

            // Tile layer (MapTiler Satellite - idêntico ao App Mobile)
            const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY || 'TiQt1yLZoL6EmShd1flj';
            L.tileLayer(
                `https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${mapTilerKey}`,
                { attribution: '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a>', maxZoom: 20 }
            ).addTo(map);

            // Polígono verde translúcido
            const polygon = L.geoJSON(poligono as GeoJSON.GeoJsonObject, {
                style: {
                    color: '#2E7D32',
                    weight: 2.5,
                    opacity: 0.9,
                    fillColor: '#4CAF50',
                    fillOpacity: 0.15,
                },
            }).addTo(map);

            // Ajustar bounds
            map.fitBounds(polygon.getBounds(), { padding: [32, 32] });

            // Calcular métricas por ponto para colorir
            const metricasPorPonto = pontos.reduce((acc, p) => {
                const sev = p.infestacoes.length > 0
                    ? p.infestacoes.reduce((s, i) => s + i.severidade, 0) / p.infestacoes.length
                    : 0;
                acc[p.id] = sev;
                return acc;
            }, {} as Record<string, number>);

            // Adicionar pontos coloridos
            pontos.forEach(ponto => {
                const sev = metricasPorPonto[ponto.id] ?? 0;
                const cor = ponto.infestacoes.length === 0 ? '#94A3B8' : severidadeColor(sev);

                const icon = L.divIcon({
                    html: `
            <div style="
              width:28px; height:28px; border-radius:50%;
              background:${cor}; border:3px solid white;
              box-shadow:0 2px 6px rgba(0,0,0,.4);
              display:flex; align-items:center; justify-content:center;
              color:white; font-size:11px; font-weight:700;
              font-family:Inter,sans-serif;
            ">${ponto.identificador.replace('P', '')}</div>
          `,
                    className: '',
                    iconSize: [28, 28],
                    iconAnchor: [14, 14],
                });

                // Popup conteúdo
                const infContent = ponto.infestacoes.length === 0
                    ? '<em style="color:#64748B;font-size:12px">Sem ocorrências</em>'
                    : ponto.infestacoes.map(inf => `
              <div style="
                padding:6px 0; border-bottom:1px solid #F1F5F9;
                font-family:Inter,sans-serif; font-size:12px;
              ">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
                  <strong>${inf.nome}</strong>
                  <span style="
                    background:${severidadeColor(inf.severidade)}22;
                    color:${severidadeColor(inf.severidade)};
                    padding:2px 7px; border-radius:99px; font-weight:700;
                    font-size:11px;
                  ">${inf.severidade}%</span>
                </div>
                <div style="color:#64748B;margin-top:3px">
                  ${inf.tipo === 'praga' ? '🐛 Praga' : inf.tipo === 'doenca' ? '🦠 Doença' : '🌿 Daninha'} 
                  · Terço: ${inf.terco}
                  ${inf.quantidade != null ? `· Qtde: ${inf.quantidade}` : ''}
                </div>
                ${inf.imagem ? `<img src="${inf.imagem}" style="width:100%;height:60px;object-fit:cover;border-radius:6px;margin-top:5px" />` : ''}
              </div>
            `).join('');

                const popup = L.popup({ maxWidth: 260, className: '' }).setContent(`
          <div style="font-family:Inter,sans-serif; min-width:200px;">
            <div style="
              background:linear-gradient(135deg,#1B5E20,#2E7D32);
              color:white; padding:8px 12px; border-radius:6px 6px 0 0;
              margin:-1px -1px 8px;
              font-weight:700; font-size:13px;
            ">📍 Ponto ${ponto.identificador}</div>
            <div style="font-size:11px;color:#94A3B8;margin-bottom:8px">
              ${ponto.lat.toFixed(4)}, ${ponto.lng.toFixed(4)}
            </div>
            ${infContent}
          </div>
        `);

                L.marker([ponto.lat, ponto.lng], { icon }).bindPopup(popup).addTo(map);
            });

            // Adicionar mapa de calor (Heatmap)
            const heatData = pontos.map(p => {
                const sev = metricasPorPonto[p.id] ?? 0;
                return [p.lat, p.lng, sev / 100]; // [lat, lng, intensidade(0-1)]
            });

            if (heatData.length > 0) {
                // Import dinâmico do plugin leaflet.heat para não quebrar no SSR
                import('leaflet.heat').then(() => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (L as any).heatLayer(heatData, {
                        radius: 65,     // raio de influencia do ponto
                        blur: 45,       // desfoque (suavidade da borda)
                        maxZoom: 16,    // zoom máximo onde a intensidade é preservada
                        max: 1.0,       // escala max de intensidade
                        gradient: {
                            0.2: '#2E7D32', // Baixo (Verde)
                            0.5: '#F9A825', // Médio (Amarelo)
                            0.7: '#E65100', // Alto (Laranja)
                            1.0: '#C62828'  // Crítico (Vermelho)
                        }
                    }).addTo(map);
                }).catch(e => console.error('Falha ao carregar heatmap', e));
            }

            // Legenda
            const legend = (L.control as unknown as ({ position }: { position: string }) => L.Control & { onAdd: (map: L.Map) => HTMLElement })({ position: 'bottomright' });
            legend.onAdd = () => {
                const div = L.DomUtil.create('div');
                div.style.cssText = 'background:white;padding:10px 14px;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.15);font-family:Inter,sans-serif;font-size:11px;line-height:1.8';
                div.innerHTML = `
          <div style="font-weight:700;margin-bottom:4px;color:#1A2332">Legenda</div>
          <div><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#2E7D32;margin-right:5px"></span>Baixo (<10%)</div>
          <div><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#F9A825;margin-right:5px"></span>Médio (10–25%)</div>
          <div><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#E65100;margin-right:5px"></span>Alto (25–40%)</div>
          <div><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#C62828;margin-right:5px"></span>Crítico (>40%)</div>
          <div><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#94A3B8;margin-right:5px"></span>Sem ocorrência</div>
        `;
                return div;
            };
            legend.addTo(map);
        });

        return () => {
            if (mapInstance.current) {
                (mapInstance.current as { remove: () => void }).remove();
                mapInstance.current = null;
            }
        };
    }, [pontos, poligono, talhaoId]);

    return (
        <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12 }}>
                🗺️ Mapa do Talhão
            </h3>
            <div
                ref={mapRef}
                style={{ height: 360, borderRadius: 12, overflow: 'hidden', border: '1px solid #E2E8F0' }}
            />
        </div>
    );
}
