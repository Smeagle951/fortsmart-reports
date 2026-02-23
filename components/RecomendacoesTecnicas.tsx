'use client';

import { Recomendacao, NivelRecomendacao, TipoOrganismo } from '@/lib/types/monitoring';

interface RecomendacoesTecnicasProps {
    recomendacoes: Recomendacao[];
}

const NIVEL_CONFIG: Record<NivelRecomendacao, {
    bg: string; border: string; icon: string; label: string; textColor: string;
}> = {
    ACAO_IMEDIATA: { bg: '#FFF5F5', border: '#C62828', icon: '🔴', label: 'Ação Imediata', textColor: '#C62828' },
    ALTO_RISCO: { bg: '#FFF3E0', border: '#E65100', icon: '🟠', label: 'Alto Risco', textColor: '#E65100' },
    MONITORAR: { bg: '#FFFDE7', border: '#F9A825', icon: '🟡', label: 'Monitorar', textColor: '#8B6914' },
    PREVENTIVO: { bg: '#F1F8E9', border: '#2E7D32', icon: '✅', label: 'Preventivo', textColor: '#2E7D32' },
};

const TIPO_ICON: Record<TipoOrganismo, string> = {
    praga: '🐛', doenca: '🦠', daninha: '🌿',
};
const TIPO_LABEL: Record<TipoOrganismo, string> = {
    praga: 'Praga', doenca: 'Doença', daninha: 'Daninha',
};

export default function RecomendacoesTecnicas({ recomendacoes }: RecomendacoesTecnicasProps) {
    if (recomendacoes.length === 0) {
        return (
            <div className="card" style={{ textAlign: 'center', color: '#94A3B8', padding: 24 }}>
                ✅ Nenhuma recomendação necessária para este talhão.
            </div>
        );
    }

    return (
        <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 16 }}>
                🧠 Recomendações Técnicas
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recomendacoes.map((rec, idx) => {
                    const cfg = NIVEL_CONFIG[rec.nivel];
                    return (
                        <div
                            key={idx}
                            className={`animate-fadeInUp delay-${Math.min(idx * 100 + 100, 600)}`}
                            style={{
                                background: cfg.bg,
                                border: `1.5px solid ${cfg.border}22`,
                                borderLeft: `4px solid ${cfg.border}`,
                                borderRadius: 12,
                                padding: '14px 18px',
                                transition: 'transform .15s, box-shadow .15s',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateX(3px)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateX(0)'; }}
                        >
                            {/* Header da recomendação */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 16 }}>{cfg.icon}</span>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: cfg.textColor, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                                        {cfg.label}
                                    </span>
                                    <span style={{
                                        fontSize: 11, background: cfg.border + '22', color: cfg.textColor,
                                        padding: '2px 8px', borderRadius: 99, fontWeight: 600,
                                    }}>
                                        {rec.severidade}% severidade
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {rec.pontos.map(p => (
                                        <span key={p} style={{
                                            fontSize: 10, background: '#E2E8F0', color: '#475569',
                                            padding: '2px 7px', borderRadius: 99, fontWeight: 600,
                                        }}>
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Organismo */}
                            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>{TIPO_ICON[rec.tipo]}</span>
                                <strong style={{ fontSize: 14, color: '#1A2332' }}>{rec.organismo}</strong>
                                <span style={{ fontSize: 11, color: '#94A3B8' }}>({TIPO_LABEL[rec.tipo]})</span>
                            </div>

                            {/* Ação */}
                            <div style={{ marginTop: 6, fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                                {rec.acao}
                            </div>

                            {/* Produto recomendado */}
                            <div style={{
                                marginTop: 10,
                                display: 'inline-flex', alignItems: 'center', gap: 7,
                                background: '#fff', borderRadius: 8,
                                border: `1.5px solid ${cfg.border}33`,
                                padding: '6px 12px',
                            }}>
                                <span style={{ fontSize: 14 }}>💊</span>
                                <div>
                                    <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px' }}>
                                        Produto Indicado
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1B5E20' }}>
                                        {rec.produto}
                                        <span style={{ fontWeight: 400, fontSize: 12, color: '#475569', marginLeft: 6 }}>
                                            · {rec.dose}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
