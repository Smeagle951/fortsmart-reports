'use client';

import { useEffect, useRef } from 'react';
import { PontoMonitoramento } from '@/lib/types/monitoring';
import { calcularMetricasPorPonto } from '@/lib/calculations';

interface MapaInterativoProps {
    pontos: PontoMonitoramento[];
    poligono: { type: string; geometry: { type: string; coordinates: number[][][] }; properties?: Record<string, unknown> };
    talhaoId: string;
    /** Quando true, não exibe o título/legenda padrão (para uso embutido em outros cards). */
    hideHeader?: boolean;
    /** Callback ao clicar em uma imagem do popup (abre preview com zoom/legenda). */
    onImageClick?: (url: string, caption?: string) => void;
}

function severidadeColor(sev: number): string {
    if (sev < 10) return '#2E7D32';
    if (sev < 25) return '#F9A825';
    if (sev < 40) return '#E65100';
    return '#C62828';
}

export default function MapaInterativo({ pontos, poligono, talhaoId, hideHeader, onImageClick }: MapaInterativoProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<unknown>(null);
    const onImageClickRef = useRef(onImageClick);
    onImageClickRef.current = onImageClick;

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

            const map = L.map(mapRef.current!, { zoomControl: true, scrollWheelZoom: true });
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

                // Popup conteúdo (área rolável; imagens clicáveis para preview)
                const infContent = ponto.infestacoes.length === 0
                    ? '<em style="color:#64748B;font-size:12px">Sem ocorrências</em>'
                    : ponto.infestacoes.map(inf => {
                        const tipoStr = inf.tipo === 'praga' ? 'Praga' : inf.tipo === 'doenca' ? 'Doença' : 'Daninha';
                        const caption = `${inf.nome} · ${inf.severidade}% · ${tipoStr}`;
                        const imgTag = inf.imagem
                            ? `<img class="mapa-popup-img" src="${inf.imagem}" data-src="${inf.imagem}" data-caption="${caption.replace(/"/g, '&quot;')}" style="width:100%;height:60px;object-fit:cover;border-radius:6px;margin-top:5px;cursor:pointer" alt="${(inf.nome || '').replace(/"/g, '&quot;')}" title="Clique para ampliar" />`
                            : '';
                        return `
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
                ${imgTag}
              </div>
            `;
                    }).join('');

                const popup = L.popup({ maxWidth: 280, className: 'mapa-popup-card' }).setContent(`
          <div style="font-family:Inter,sans-serif; min-width:220px;">
            <div style="font-size:10px;color:#94A3B8;font-weight:600;margin-bottom:4px;letter-spacing:.04em">DETALHES DO PONTO</div>
            <div style="
              background:linear-gradient(135deg,#1B5E20,#2E7D32);
              color:white; padding:10px 12px; border-radius:8px 8px 0 0;
              margin:-1px -1px 0;
              font-weight:700; font-size:14px;
            ">📍 Ponto ${ponto.identificador}</div>
            <div style="font-size:11px;color:#64748B;margin:8px 0;padding:6px 8px;background:#F8FAFC;border-radius:6px">
              ${ponto.lat.toFixed(5)}, ${ponto.lng.toFixed(5)}
            </div>
            <div class="mapa-popup-scroll" style="max-height:220px;overflow-y:auto;padding-right:4px">
              ${infContent}
            </div>
          </div>
        `);

                L.marker([ponto.lat, ponto.lng], { icon }).bindPopup(popup).addTo(map);
            });

            // Clique em imagem do popup → abrir preview (zoom + legenda)
            map.on('popupopen', () => {
                const wrapper = document.querySelector('.mapa-popup-card .leaflet-popup-content-wrapper');
                wrapper?.querySelectorAll('.mapa-popup-img').forEach((el) => {
                    const img = el as HTMLImageElement;
                    const once = () => {
                        const url = img.getAttribute('data-src') || img.src;
                        const caption = img.getAttribute('data-caption') || img.alt;
                        onImageClickRef.current?.(url, caption || undefined);
                    };
                    img.addEventListener('click', once, { once: true });
                });
            });

            // Adicionar mapa de calor (Heatmap)
            const heatData = pontos.map(p => {
                const sev = metricasPorPonto[p.id] ?? 0;
                return [p.lat, p.lng, sev / 100]; // [lat, lng, intensidade(0-1)]
            });

            if (heatData.length > 0) {
                // Import dinâmico do plugin leaflet.heat para não quebrar no SSR
                // O plugin req L global no frontend
                if (typeof window !== 'undefined') {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (window as any).L = L;
                }

                import('leaflet.heat').then(() => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (L as any).heatLayer(heatData, {
                        radius: 80,     // Aumentado o raio de influencia do ponto (manchas maiores)
                        blur: 50,       // Desfoque suavizando as transições
                        maxZoom: 15,    // Zoom máximo onde a intensidade é preservada
                        max: 1.0,       // Escala max de intensidade
                        gradient: {
                            0.2: '#2E7D32', // Baixo (Verde)
                            0.4: '#F9A825', // Médio (Amarelo)
                            0.7: '#E65100', // Alto (Laranja)
                            0.9: '#C62828', // Crítico (Vermelho Escuro)
                            1.0: '#B71C1C'  // Muito Crítico
                        }
                    }).addTo(map);
                }).catch(e => console.error('Falha ao carregar heatmap', e));
            }

            // Legenda não é mais exibida no mapa; fica no rodapé do card (RelatorioFitossanitarioContent)
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
            {!hideHeader && (
                <>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
                        Polígono do talhão · Pontos georreferenciados
                    </h3>
                    <p className="no-print" style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>
                        Clique no alfinete para ver detalhes do ponto.
                    </p>
                </>
            )}
            <div
                ref={mapRef}
                style={{ height: 360, borderRadius: 12, overflow: 'hidden', border: '1px solid #E2E8F0' }}
            />
        </div>
    );
}
