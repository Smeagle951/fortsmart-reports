'use client';

import { useEffect, useRef } from 'react';

interface MapaInterativoProps {
    pontos: Array<{
        id: string;
        latitude: number;
        longitude: number;
        titulo?: string;
        descricao?: string;
        estagio?: string;
        severidade?: number;
        infestacoes?: Array<{
            nome: string;
            severidade: number;
            tipo: string;
            terco?: string;
            quantidade?: number;
            imagem?: string;
        }>;
    }>;
    style?: React.CSSProperties;
}

function severidadeColor(sev: number): string {
    if (sev < 10) return '#2E7D32';
    if (sev < 25) return '#F9A825';
    if (sev < 40) return '#E65100';
    return '#C62828';
}

export default function MapaInterativo({ pontos, style }: MapaInterativoProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);

    useEffect(() => {
        if (typeof window === 'undefined' || mapInstance.current || !mapRef.current) return;

        import('leaflet').then(L => {
            if (!mapRef.current || mapInstance.current) return;

            // Fix leaflet icons
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });

            const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false });
            mapInstance.current = map;

            L.tileLayer(
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                { attribution: '&copy; Esri', maxZoom: 19 }
            ).addTo(map);

            if (pontos.length === 0) {
                map.setView([-15.7801, -47.9292], 4);
                return;
            }

            const bounds = L.latLngBounds(pontos.map(p => [p.latitude, p.longitude]));
            map.fitBounds(bounds, { padding: [50, 50] });

            // Adicionar pontos e popups
            pontos.forEach(ponto => {
                const sev = ponto.severidade ?? 0;
                const cor = ponto.infestacoes?.length === 0 ? '#94A3B8' : severidadeColor(sev);

                const icon = L.divIcon({
                    html: `
            <div style="
              width:28px; height:28px; border-radius:50%;
              background:${cor}; border:3px solid white;
              box-shadow:0 2px 6px rgba(0,0,0,.4);
              display:flex; align-items:center; justify-content:center;
              color:white; font-size:11px; font-weight:700;
              font-family:Inter,sans-serif;
            ">${ponto.titulo?.replace(/[^0-9]/g, '') || '!'}</div>
          `,
                    className: '',
                    iconSize: [28, 28],
                    iconAnchor: [14, 14],
                });

                const infContent = !ponto.infestacoes || ponto.infestacoes.length === 0
                    ? '<em style="color:#64748B;font-size:12px">Sem ocorrências registradas</em>'
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
                   ${inf.terco ? `· Terço: ${inf.terco}` : ''}
                  ${inf.quantidade != null ? `· Qtde: ${inf.quantidade}` : ''}
                </div>
              </div>
            `).join('');

                const popup = L.popup({ maxWidth: 260 }).setContent(`
          <div style="font-family:Inter,sans-serif; min-width:200px;">
            <div style="
              background:linear-gradient(135deg,#1B5E20,#2E7D32);
              color:white; padding:8px 12px; border-radius:6px 6px 0 0;
              margin:-1px -1px 8px;
              font-weight:700; font-size:13px;
            ">📍 ${ponto.titulo || 'Ponto'}</div>
            <div style="font-size:11px;color:#94A3B8;margin-bottom:8px">
              Lat: ${ponto.latitude.toFixed(5)} <br/> Lng: ${ponto.longitude.toFixed(5)}
            </div>
            ${infContent}
          </div>
        `);

                L.marker([ponto.latitude, ponto.longitude], { icon }).bindPopup(popup).addTo(map);
            });

            // Heatmap
            const heatData = pontos.map(p => [p.latitude, p.longitude, (p.severidade ?? 20) / 100]);
            if (heatData.length > 0) {
                // importar dinamicamente 
                const script = document.createElement('script');
                script.src = "https://unpkg.com/leaflet.heat/dist/leaflet-heat.js";
                script.onload = () => {
                    if ((L as any).heatLayer) {
                        (L as any).heatLayer(heatData, {
                            radius: 65,
                            blur: 45,
                            maxZoom: 16,
                            max: 1.0,
                            gradient: { 0.2: '#2E7D32', 0.5: '#F9A825', 0.7: '#E65100', 1.0: '#C62828' }
                        }).addTo(map);
                    }
                };
                document.head.appendChild(script);
            }
        });

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [pontos]);

    return (
        <div style={style}>
            <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 12, zIndex: 0 }} />
        </div>
    );
}
