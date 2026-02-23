'use client';

import { useEffect, useRef } from 'react';
import { MetricasTalhao, TipoOrganismo } from '@/lib/types/monitoring';

interface IndicesChartProps {
    metricas: MetricasTalhao;
}

const TIPO_COLORS: Record<TipoOrganismo, string> = {
    praga: '#C62828',
    doenca: '#7B1FA2',
    daninha: '#2E7D32',
};

const TIPO_LABELS: Record<TipoOrganismo, string> = {
    praga: 'Pragas',
    doenca: 'Doenças',
    daninha: 'Daninhas',
};

export default function IndicesChart({ metricas }: IndicesChartProps) {
    const donutRef = useRef<HTMLCanvasElement>(null);
    const barRef = useRef<HTMLCanvasElement>(null);
    const charts = useRef<{ donut?: unknown; bar?: unknown }>({});

    useEffect(() => {
        import('chart.js').then(({ Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, DoughnutController }) => {
            Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, DoughnutController);

            // ── Rosca ─────────────────────────────────────────────────────────────
            if (donutRef.current && !charts.current.donut) {
                charts.current.donut = new Chart(donutRef.current, {
                    type: 'doughnut',
                    data: {
                        labels: ['Pragas', 'Doenças', 'Daninhas'],
                        datasets: [{
                            data: [metricas.pragas_pct, metricas.doencas_pct, metricas.daninhas_pct],
                            backgroundColor: ['#C62828', '#7B1FA2', '#2E7D32'],
                            borderWidth: 0,
                            hoverOffset: 8,
                        }],
                    },
                    options: {
                        responsive: true,
                        cutout: '72%',
                        plugins: {
                            legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 12 }, padding: 16, usePointStyle: true } },
                            tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw}%` } },
                        },
                        animation: { animateRotate: true, duration: 1000 },
                    },
                });
            }

            // ── Barras horizontais (top 5) ──────────────────────────────────────
            if (barRef.current && !charts.current.bar) {
                const top5 = metricas.top5Infestacoes;
                charts.current.bar = new Chart(barRef.current, {
                    type: 'bar',
                    data: {
                        labels: top5.map(i => i.nome),
                        datasets: [{
                            label: 'Índice (%)',
                            data: top5.map(i => i.percentual),
                            backgroundColor: top5.map(i => TIPO_COLORS[i.tipo] + 'CC'),
                            borderRadius: 6,
                            borderSkipped: false,
                        }],
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        plugins: {
                            legend: { display: false },
                            tooltip: { callbacks: { label: ctx => ` ${ctx.raw}% dos pontos` } },
                        },
                        scales: {
                            x: {
                                beginAtZero: true, max: 100,
                                grid: { color: '#F1F5F9' },
                                ticks: { callback: (v) => `${v}%`, font: { family: 'Inter', size: 11 } },
                            },
                            y: {
                                grid: { display: false },
                                ticks: { font: { family: 'Inter', size: 12 }, color: '#475569' },
                            },
                        },
                        animation: { duration: 1000 },
                    },
                });
            }
        });

        return () => {
            import('chart.js').then(({ Chart }) => {
                if (charts.current.donut) (charts.current.donut as { destroy: () => void }).destroy();
                if (charts.current.bar) (charts.current.bar as { destroy: () => void }).destroy();
                charts.current = {};
            });
        };
    }, [metricas]);

    return (
        <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 16 }}>
                📊 Índices de Ocorrência
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 24, alignItems: 'start' }}>
                {/* Rosca */}
                <div className="card animate-fadeInUp delay-100">
                    <div style={{ position: 'relative' }}>
                        <canvas ref={donutRef} />
                        {/* Centro da rosca */}
                        <div style={{
                            position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%,-50%)',
                            textAlign: 'center', pointerEvents: 'none',
                        }}>
                            <div style={{ fontSize: 24, fontWeight: 800, color: '#1A2332' }}>
                                {metricas.indiceOcorrencia}%
                            </div>
                            <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px' }}>
                                Índice Geral
                            </div>
                        </div>
                    </div>

                    {/* Pill breakdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                        {(['praga', 'doenca', 'daninha'] as TipoOrganismo[]).map(tipo => {
                            const pct = tipo === 'praga' ? metricas.pragas_pct : tipo === 'doenca' ? metricas.doencas_pct : metricas.daninhas_pct;
                            return (
                                <div key={tipo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{TIPO_LABELS[tipo]}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, marginLeft: 12 }}>
                                        <div style={{ flex: 1, height: 6, borderRadius: 99, background: '#ECEFF1', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${pct}%`, background: TIPO_COLORS[tipo], borderRadius: 99, transition: 'width 1s ease' }} />
                                        </div>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: TIPO_COLORS[tipo], minWidth: 36, textAlign: 'right' }}>{pct}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Barras horizontais */}
                <div className="card animate-fadeInUp delay-200">
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 12 }}>
                        Top {metricas.top5Infestacoes.length} Infestações
                    </div>
                    <canvas ref={barRef} />
                </div>
            </div>
        </div>
    );
}
