'use client';

import { CondicoesClimaticas as CC } from '@/lib/types/monitoring';

interface CondicoesClimaticasProps {
    condicoes: CC;
}

export default function CondicoesClimaticasCard({ condicoes }: CondicoesClimaticasProps) {
    return (
        <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 14 }}>
                🌤 Condições Climáticas
            </h3>
            <div className="card animate-fadeInUp" style={{ display: 'flex', gap: 16, justifyContent: 'space-around', textAlign: 'center', flexWrap: 'wrap' }}>
                <ClimaItem icon="🌡️" label="Temperatura" value={`${condicoes.temperatura}°C`} color="#C62828" />
                <ClimaItem icon="💧" label="Umidade" value={`${condicoes.umidade}%`} color="#1565C0" />
                <ClimaItem icon="🌧️" label="Chuva" value={condicoes.chuva} color="#455A64" />
            </div>
        </div>
    );
}

function ClimaItem({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
    return (
        <div>
            <div style={{ fontSize: 22 }}>{icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px', marginTop: 4 }}>
                {label}
            </div>
        </div>
    );
}
