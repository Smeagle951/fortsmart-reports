'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface HeatmapLayerProps {
    pontos: Array<{ lat: number; lng: number; intensidade: number }>;
}

export default function HeatmapLayer({ pontos }: HeatmapLayerProps) {
    const map = useMap();

    useEffect(() => {
        if (!pontos || pontos.length === 0) return;
        if (typeof window === 'undefined') return;

        // A biblioteca leaflet.heat precisa que L esteja globalmente no window
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).L = L;

        let heatLayer: any;

        import('leaflet.heat').then(() => {
            const heatData = pontos.map(p => [p.lat, p.lng, p.intensidade]);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            heatLayer = (L as any).heatLayer(heatData, {
                radius: 80,     // Manchas maiores
                blur: 50,       // Desfoque suave nas transições
                maxZoom: 15,    // Preserva intensidade zoom
                max: 1.0,       // Escala de intensidade
                gradient: {
                    0.2: '#2E7D32', // Verde
                    0.4: '#F9A825', // Amarelo
                    0.7: '#E65100', // Laranja
                    0.9: '#C62828', // Vermelho Escuro
                    1.0: '#B71C1C'  // Muito Crítico
                }
            });
            heatLayer.addTo(map);
        }).catch(e => console.error('Falha ao carregar heatmap plugin', e));

        return () => {
            if (heatLayer && map) {
                map.removeLayer(heatLayer);
            }
        };
    }, [map, pontos]);

    return null;
}
