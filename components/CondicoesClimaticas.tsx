'use client';

import { CondicoesClimaticas as CC } from '@/lib/types/monitoring';

interface CondicoesClimaticasProps {
    condicoes: CC;
}

const cardStyle = { background: '#fff', borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };

function formatTemp(n: number): string {
    if (n == null || !Number.isFinite(n)) return '—';
    return `${n} °C`;
}

function formatUmidade(n: number): string {
    if (n == null || !Number.isFinite(n)) return '—';
    return `${n}%`;
}

function formatChuva(s: string | undefined): string {
    const v = (s ?? '').trim();
    return v || '—';
}

export default function CondicoesClimaticasCard({ condicoes }: CondicoesClimaticasProps) {
    const temp = formatTemp(condicoes.temperatura);
    const umidade = formatUmidade(condicoes.umidade);
    const chuva = formatChuva(condicoes.chuva);
    const semDados = temp === '—' && umidade === '—' && (chuva === '—' || chuva === 'Sem Chuva');

    return (
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: 13, fontWeight: 600, color: '#475569' }}>
                Condições climáticas
            </div>
            <div style={{ padding: 16, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>Temperatura</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>{temp}</div>
                </div>
                <div>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>Umidade</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1B5E20' }}>{umidade}</div>
                </div>
                <div>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>Chuva</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#1E293B' }}>{chuva}</div>
                </div>
            </div>
            {semDados && (
                <div style={{ padding: '0 16px 16px', fontSize: 12, color: '#94A3B8' }}>
                    Dados da ocorrência não informados.
                </div>
            )}
        </div>
    );
}
