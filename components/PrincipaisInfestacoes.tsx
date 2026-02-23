'use client';

import { MetricasTalhao, TipoOrganismo } from '@/lib/types/monitoring';

interface PrincipaisInfestacoesProps {
    metricas: MetricasTalhao;
}

const TIPO_ICON: Record<TipoOrganismo, string> = {
    praga: '🐛', doenca: '🦠', daninha: '🌿',
};

function getClassifStyle(pct: number) {
    if (pct < 10) return { label: 'Baixo', color: '#2E7D32', bg: '#E8F5E9' };
    if (pct < 25) return { label: 'Médio', color: '#8B6914', bg: '#FFF9C4' };
    if (pct < 40) return { label: 'Alto Risco', color: '#E65100', bg: '#FBE9E7' };
    return { label: 'Crítico', color: '#C62828', bg: '#FFEBEE' };
}

export default function PrincipaisInfestacoes({ metricas }: PrincipaisInfestacoesProps) {
    const top = metricas.top5Infestacoes;

    return (
        <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 14 }}>
                🏆 Principais Infestações
            </h3>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {top.map((inf, idx) => {
                    const estilo = getClassifStyle(inf.percentual);
                    return (
                        <div
                            key={idx}
                            className={`animate-fadeInUp delay-${Math.min(idx * 100 + 100, 500)}`}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '12px 16px',
                                borderBottom: idx < top.length - 1 ? '1px solid #F1F5F9' : 'none',
                                transition: 'background .15s',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#FAFBFF'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                        >
                            {/* Rank */}
                            <div style={{
                                width: 28, height: 28, borderRadius: '50%',
                                background: idx === 0 ? '#FFF9C4' : idx === 1 ? '#F1F5F9' : '#FAFAFA',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 13, fontWeight: 800, color: idx === 0 ? '#F9A825' : '#94A3B8',
                                flexShrink: 0,
                            }}>
                                {idx + 1}
                            </div>

                            {/* Ícone tipo */}
                            <span style={{ fontSize: 20, flexShrink: 0 }}>{TIPO_ICON[inf.tipo]}</span>

                            {/* Nome */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: '#1A2332', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {inf.nome}
                                </div>
                                <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'capitalize' }}>{inf.tipo}</div>
                            </div>

                            {/* Progress bar mini */}
                            <div style={{ width: 80, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <div style={{ height: 5, borderRadius: 99, background: '#ECEFF1', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', width: `${inf.percentual}%`,
                                        background: estilo.color, borderRadius: 99,
                                        transition: 'width 1s ease',
                                    }} />
                                </div>
                            </div>

                            {/* Percentual */}
                            <div style={{ fontSize: 15, fontWeight: 800, color: estilo.color, minWidth: 40, textAlign: 'right' }}>
                                {inf.percentual}%
                            </div>

                            {/* Badge */}
                            <div style={{
                                padding: '3px 10px', borderRadius: 99,
                                background: estilo.bg, color: estilo.color,
                                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px',
                                flexShrink: 0,
                            }}>
                                {estilo.label}
                            </div>
                        </div>
                    );
                })}

                {top.length === 0 && (
                    <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                        Nenhuma infestação registrada.
                    </div>
                )}
            </div>
        </div>
    );
}
