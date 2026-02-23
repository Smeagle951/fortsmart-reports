'use client';

import { MetricasPonto, NivelClassificacao } from '@/lib/types/monitoring';

interface IndicesPorPontoProps {
    metricasPorPonto: MetricasPonto[];
}

const CLASSIF_CONFIG: Record<NivelClassificacao, { color: string; label: string }> = {
    CONTROLADO: { color: '#2E7D32', label: 'Controlado' },
    ATENCAO: { color: '#F9A825', label: 'Atenção' },
    ALTO_RISCO: { color: '#E65100', label: 'Alto Risco' },
    CRITICO: { color: '#C62828', label: 'Crítico' },
};

export default function IndicesPorPonto({ metricasPorPonto }: IndicesPorPontoProps) {
    return (
        <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 14 }}>
                📍 Índice Individual por Ponto
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                {metricasPorPonto.map((mp, idx) => {
                    const cfg = CLASSIF_CONFIG[mp.classificacao];
                    return (
                        <div
                            key={mp.pontoId}
                            className={`card animate-fadeInUp delay-${Math.min(idx * 50 + 100, 600)}`}
                            style={{ textAlign: 'center', borderTop: `3px solid ${cfg.color}`, padding: '14px 12px' }}
                        >
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748B', marginBottom: 6 }}>
                                {mp.identificador}
                            </div>
                            <div style={{ fontSize: 26, fontWeight: 800, color: cfg.color }}>
                                {mp.severidadeMedia}%
                            </div>
                            <div style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 8px' }}>
                                {mp.numOcorrencias} ocorrência{mp.numOcorrencias !== 1 ? 's' : ''}
                            </div>
                            <div style={{
                                display: 'inline-block', padding: '2px 10px', borderRadius: 99,
                                background: cfg.color + '18', color: cfg.color,
                                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px',
                            }}>
                                {cfg.label}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
