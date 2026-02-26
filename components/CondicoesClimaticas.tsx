'use client';

import { CondicoesClimaticas as CC } from '@/lib/types/monitoring';

interface CondicoesClimaticasProps {
    condicoes: CC;
}

const cardStyle = { background: '#fff', borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };

export default function CondicoesClimaticasCard({ condicoes }: CondicoesClimaticasProps) {
    return (
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: 13, fontWeight: 600, color: '#475569' }}>
                Condições climáticas
            </div>
            <div style={{ padding: 16, display: 'flex', gap: 32 }}>
                <div>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>Umidade</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1B5E20' }}>{condicoes.umidade}%</div>
                </div>
                <div>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>Chuva</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#1E293B' }}>{condicoes.chuva}</div>
                </div>
            </div>
        </div>
    );
}
