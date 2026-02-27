'use client';

import { Recomendacao, NivelRecomendacao, TipoOrganismo } from '@/lib/types/monitoring';

interface RecomendacoesTecnicasProps {
    recomendacoes: Recomendacao[];
}

const NIVEL_LABEL: Record<NivelRecomendacao, string> = {
    ACAO_IMEDIATA: 'Ação Imediata',
    ALTO_RISCO: 'Alto Risco',
    MONITORAR: 'Monitorar',
    PREVENTIVO: 'Preventivo',
};

const TIPO_LABEL: Record<TipoOrganismo, string> = {
    praga: 'Praga',
    doenca: 'Doença',
    daninha: 'Daninha',
};

const NIVEL_COLOR: Record<NivelRecomendacao, string> = {
    ACAO_IMEDIATA: '#C62828',
    ALTO_RISCO: '#E65100',
    MONITORAR: '#F59E0B',
    PREVENTIVO: '#2E7D32',
};

function hasContent(rec: Recomendacao): boolean {
    const acao = (rec.acao ?? '').trim();
    return acao.length > 0 && acao !== '—' && acao !== '-';
}

export default function RecomendacoesTecnicas({ recomendacoes }: RecomendacoesTecnicasProps) {
    const list = recomendacoes.filter(hasContent);
    if (list.length === 0) {
        return (
            <section aria-labelledby="rec-tec-title">
                <h2 id="rec-tec-title" style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 14 }}>
                    Recomendações técnicas
                </h2>
                <p style={{ color: '#94A3B8', fontSize: 13, margin: 0 }}>Nenhuma recomendação registrada para este talhão.</p>
            </section>
        );
    }

    return (
        <section aria-labelledby="rec-tec-title">
            <h2 id="rec-tec-title" style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 14 }}>
                Recomendações técnicas
            </h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {list.map((rec, idx) => {
                    const cor = NIVEL_COLOR[rec.nivel];
                    const temProduto = (rec.produto ?? '').trim().length > 0 || (rec.dose ?? '').trim().length > 0;
                    const temPontos = Array.isArray(rec.pontos) && rec.pontos.length > 0;
                    return (
                        <li
                            key={idx}
                            style={{
                                padding: 14,
                                background: '#FAFBFC',
                                border: '1px solid #E2E8F0',
                                borderRadius: 8,
                                borderLeft: `4px solid ${cor}`,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                                <span
                                    style={{
                                        padding: '3px 8px',
                                        borderRadius: 6,
                                        fontSize: 11,
                                        fontWeight: 700,
                                        background: `${cor}18`,
                                        color: cor,
                                    }}
                                >
                                    {NIVEL_LABEL[rec.nivel]}
                                </span>
                                <span style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{rec.organismo}</span>
                                <span style={{ fontSize: 12, color: '#64748B' }}>({TIPO_LABEL[rec.tipo]})</span>
                                {temPontos && (
                                    <span style={{ fontSize: 11, color: '#64748B' }}>
                                        Pontos: {rec.pontos.join(', ')}
                                    </span>
                                )}
                            </div>
                            <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                                {rec.acao}
                            </p>
                            {temProduto && (
                                <div
                                    style={{
                                        padding: '8px 12px',
                                        background: '#fff',
                                        borderRadius: 6,
                                        border: '1px solid #E2E8F0',
                                        fontSize: 13,
                                        color: '#1B5E20',
                                        fontWeight: 600,
                                    }}
                                >
                                    {[rec.produto, rec.dose].filter(Boolean).join(' · ')}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
