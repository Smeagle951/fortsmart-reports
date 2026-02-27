'use client';

import { MetricasTalhao, TipoOrganismo } from '@/lib/types/monitoring';

interface PrincipaisInfestacoesProps {
    metricas: MetricasTalhao;
}

const TIPO_LABEL: Record<TipoOrganismo, string> = {
    praga: 'Praga', doenca: 'Doença', daninha: 'Daninha',
};

function getClassifStyle(pct: number) {
    if (pct < 10) return { label: 'Baixo', color: '#2E7D32' };
    if (pct < 25) return { label: 'Médio', color: '#F59E0B' };
    if (pct < 40) return { label: 'Alto', color: '#E65100' };
    return { label: 'Crítico', color: '#C62828' };
}

const cardStyle = { background: '#fff', borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };

export default function PrincipaisInfestacoes({ metricas }: PrincipaisInfestacoesProps) {
    const top = metricas.top5Infestacoes;

    return (
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: 13, fontWeight: 600, color: '#475569' }}>
                Principais infestações
            </div>
            {top.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Nenhuma infestação registrada.</div>
            ) : (
                <div style={{ padding: 12 }}>
                    {top.map((inf, idx) => {
                        const estilo = getClassifStyle(inf.percentual);
                        return (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 16,
                                    padding: '10px 12px',
                                    borderBottom: idx < top.length - 1 ? '1px solid #E2E8F0' : 'none',
                                }}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{inf.nome}</div>
                                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{TIPO_LABEL[inf.tipo]}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 60, height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{ width: `${Math.min(inf.percentual, 100)}%`, height: '100%', background: estilo.color, borderRadius: 3 }} />
                                    </div>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: estilo.color, minWidth: 36, textAlign: 'right' }}>{inf.percentual}%</span>
                                    <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: `${estilo.color}18`, color: estilo.color }}>{estilo.label}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
