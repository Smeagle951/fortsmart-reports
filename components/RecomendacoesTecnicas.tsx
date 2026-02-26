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
    praga: 'Praga', doenca: 'Doença', daninha: 'Daninha',
};

const NIVEL_COLOR: Record<NivelRecomendacao, string> = {
    ACAO_IMEDIATA: '#C62828',
    ALTO_RISCO: '#E65100',
    MONITORAR: '#F59E0B',
    PREVENTIVO: '#2E7D32',
};

export default function RecomendacoesTecnicas({ recomendacoes }: RecomendacoesTecnicasProps) {
    if (recomendacoes.length === 0) {
        return (
            <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 12 }}>Recomendações técnicas</div>
                <div style={{ color: '#94A3B8', fontSize: 13, padding: 16, background: '#F8FAFC', borderRadius: 6 }}>Nenhuma recomendação necessária para este talhão.</div>
            </div>
        );
    }

    return (
        <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 16 }}>Recomendações técnicas</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recomendacoes.map((rec, idx) => {
                    const cor = NIVEL_COLOR[rec.nivel];
                    return (
                        <div
                            key={idx}
                            style={{
                                padding: 16,
                                background: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                borderRadius: 8,
                                borderLeft: `4px solid ${cor}`,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                                <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: `${cor}18`, color: cor }}>{NIVEL_LABEL[rec.nivel]}</span>
                                <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{rec.organismo}</span>
                                <span style={{ fontSize: 12, color: '#64748B' }}>({TIPO_LABEL[rec.tipo]})</span>
                                <span style={{ fontSize: 11, color: '#64748B', marginLeft: 'auto' }}>Pontos: {rec.pontos.join(', ')}</span>
                            </div>
                            <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, marginBottom: 10 }}>{rec.acao}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#fff', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                                <div>
                                    <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Produto indicado</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1B5E20' }}>{rec.produto} · {rec.dose}</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
