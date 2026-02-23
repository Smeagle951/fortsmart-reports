'use client';

import { useEffect, useRef, useState } from 'react';
import { MetricasTalhao, NivelClassificacao } from '@/lib/types/monitoring';

interface ResumoExecutivoProps {
    metricas: MetricasTalhao;
    talhaoNome: string;
    area_ha: number;
    ultimoMonitoramento: string;
}

function useCountUp(target: number, duration = 1200) {
    const [value, setValue] = useState(0);
    const started = useRef(false);

    useEffect(() => {
        if (started.current) return;
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [target, duration]);

    return value;
}

function ClassifBadge({ nivel }: { nivel: NivelClassificacao }) {
    const map: Record<NivelClassificacao, { cls: string; label: string; icon: string }> = {
        CONTROLADO: { cls: 'badge-controlado', label: 'Controlado', icon: '✅' },
        ATENCAO: { cls: 'badge-atencao', label: 'Atenção', icon: '⚠️' },
        ALTO_RISCO: { cls: 'badge-alto-risco', label: 'Alto Risco', icon: '🔶' },
        CRITICO: { cls: 'badge-critico', label: 'Crítico', icon: '🔴' },
    };
    const { cls, label, icon } = map[nivel];
    return <span className={`badge ${cls}`}>{icon} {label}</span>;
}

export default function ResumoExecutivo({ metricas, talhaoNome, area_ha, ultimoMonitoramento }: ResumoExecutivoProps) {
    const pontos = useCountUp(metricas.totalPontos, 800);
    const ocorrencias = useCountUp(metricas.totalOcorrencias, 900);
    const indice = useCountUp(metricas.indiceOcorrencia, 1200);
    const areaAnim = useCountUp(Math.round(area_ha * 10), 1000);

    const indiceColor =
        metricas.indiceOcorrencia < 10 ? 'var(--green-primary)' :
            metricas.indiceOcorrencia < 25 ? '#F9A825' :
                metricas.indiceOcorrencia < 40 ? 'var(--orange)' : 'var(--red)';

    return (
        <section>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 14 }}>
                📊 Resumo Executivo
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>

                {/* Pontos amostrados */}
                <StatCard delay="delay-100" icon="📍" label="Pontos Amostrados" color="#1565C0">
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: 32, fontWeight: 800, color: '#1565C0' }}>{pontos}</span>
                        <span style={{ fontSize: 13, color: '#94A3B8' }}>pts</span>
                    </div>
                </StatCard>

                {/* Total ocorrências */}
                <StatCard delay="delay-200" icon="🐛" label="Total de Ocorrências" color="var(--red)">
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--red)' }}>{ocorrencias}</span>
                    </div>
                </StatCard>

                {/* Índice geral */}
                <StatCard delay="delay-300" icon="📈" label="Índice Geral" color={indiceColor}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 32, fontWeight: 800, color: indiceColor }}>{indice}%</span>
                        <ClassifBadge nivel={metricas.classificacao} />
                    </div>
                    <div style={{ marginTop: 8 }}>
                        <div className="progress-bar-animated">
                            <div
                                className="fill"
                                style={{
                                    background: indiceColor,
                                    '--target-width': `${Math.min(metricas.indiceOcorrencia, 100)}%`,
                                } as React.CSSProperties}
                            />
                        </div>
                    </div>
                </StatCard>

                {/* Área do talhão */}
                <StatCard delay="delay-400" icon="🌾" label="Área do Talhão" color="var(--green-primary)">
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--green-primary)' }}>
                            {(areaAnim / 10).toFixed(1)}
                        </span>
                        <span style={{ fontSize: 14, color: '#64748B', fontWeight: 600 }}>ha</span>
                    </div>
                </StatCard>
            </div>

            {/* Último monitoramento */}
            <div style={{
                marginTop: 14,
                padding: '8px 16px',
                borderRadius: 10,
                background: '#F1F5F9',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: '#64748B',
                fontWeight: 500,
            }}>
                🕐 Último Monitoramento: <strong style={{ color: '#1A2332' }}>{ultimoMonitoramento}</strong>
            </div>
        </section>
    );
}

function StatCard({ children, delay, icon, label, color }: {
    children: React.ReactNode;
    delay: string;
    icon: string;
    label: string;
    color: string;
}) {
    return (
        <div className={`card animate-fadeInUp ${delay}`} style={{ borderTop: `3px solid ${color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.4px' }}>
                    {label}
                </span>
            </div>
            {children}
        </div>
    );
}
