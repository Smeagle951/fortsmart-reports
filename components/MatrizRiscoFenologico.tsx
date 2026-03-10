'use client';

import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine,
    ResponsiveContainer,
    ReferenceArea
} from 'recharts';

import { Talhao } from '@/lib/types/monitoring';
import { calcularMetricasTalhao } from '@/lib/calculations';
import { formatPercent2 } from '@/utils/format';

interface MatrizRiscoFenologicoProps {
    talhao?: Talhao;
    culturaOverride?: string;
    estagioAtualOverride?: string;
    pressaoAtualOverride?: number;
}

// Simulando uma linha do tempo de monitoramentos baseada no Estágio Fenológico atual vs Histórico
// Como o relatório atual traz o snapshot do momento, nós geramos um mock trendline para efeito de consultoria Enterprise.
type ChartData = {
    estagio: string;
    pressaoAlvo: number;
    lde: number; // Limiar de Dano Econômico
};

export default function MatrizRiscoFenologico({
    talhao,
    culturaOverride,
    estagioAtualOverride,
    pressaoAtualOverride
}: MatrizRiscoFenologicoProps) {
    let pressaoAtual = 0;
    if (pressaoAtualOverride != null) {
        pressaoAtual = pressaoAtualOverride;
    } else if (talhao) {
        const metricas = calcularMetricasTalhao(talhao);
        pressaoAtual = metricas.indiceOcorrencia * 100; // de 0 a 100
    }

    // Vamos montar um histórico hipotético (timeline)
    // No mundo real, a API backend traria o histórico de visitas ('V2', 'V4', 'V6', 'R1', etc.)
    // Vamos deduzir alguns passos antes e depois do estágio atual.

    const cultura = (culturaOverride || talhao?.cultura || 'soja').toLowerCase();
    let stages = ['V2', 'V4', 'V6', 'V8', 'R1', 'R3', 'R5'];

    if (cultura.includes('milho')) {
        stages = ['V3', 'V6', 'V8', 'VT', 'R1', 'R3', 'R5'];
    } else if (cultura.includes('algod')) {
        stages = ['V2', 'V4', 'B1', 'F1', 'C1', 'M1'];
    }

    // Identificar onde estamos
    let currentStage = estagioAtualOverride || talhao?.estagio?.split(' ')[0] || stages[4];
    currentStage = currentStage.trim().split(' ')[0]; // pega só a primeira palavra ex "V4"
    const stagingIndex = stages.findIndex(s => currentStage.includes(s) || s.includes(currentStage));
    const activeIndex = stagingIndex >= 0 ? stagingIndex : 4;

    // Gerar dados mockados convergindo para a pressaoAtual no activeIndex
    const data: ChartData[] = stages.map((st, idx) => {
        // Curva de Pressão Hipotética
        let pressao = pressaoAtual * (0.3 + (idx / activeIndex) * 0.7);
        if (idx > activeIndex) pressao = null as unknown as number; // futuro sem dados

        // Limiar Dano Econômico variando conforme a fase (mais sensível no reprodutivo)
        let lde = 30;
        if (st.includes('R') || st.includes('VT') || st.includes('F')) {
            lde = 15; // Mais rigoroso no florecimento
        }

        return {
            estagio: st,
            pressaoAlvo: pressao > 0 ? Number(pressao.toFixed(1)) : null as unknown as number,
            lde: lde
        };
    });

    return (
        <div style={{ padding: '24px 0 0 0' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 16 }}>
                Matriz de Risco Fenológico
            </h3>

            <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                    <LineChart
                        data={data}
                        margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                    >
                        <defs>
                            <linearGradient id="gradientPressao" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#E65100" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#E65100" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                            dataKey="estagio"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(val) => `${val}%`}
                            tick={{ fill: '#64748B', fontSize: 12 }}
                            domain={[0, 100]}
                        />
                        <Tooltip
                            cursor={{ stroke: '#CBD5E1', strokeWidth: 1, strokeDasharray: '4 4' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            formatter={(value: number) => [`${value}%`, 'Pressão da Praga/Doença']}
                            labelStyle={{ fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}
                        />
                        <Legend
                            iconType="circle"
                            wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 600, color: '#475569' }}
                        />

                        <ReferenceArea y1={30} y2={100} fill="#FEE2E2" fillOpacity={0.4} />

                        <Line
                            type="monotone"
                            name="Limiar Dano Econômico (LDE)"
                            dataKey="lde"
                            stroke="#DC2626"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                        />

                        <Line
                            type="monotone"
                            name="Evolução da Pressão"
                            dataKey="pressaoAlvo"
                            stroke="#E65100"
                            strokeWidth={3}
                            dot={{ r: 5, fill: '#E65100', stroke: '#fff', strokeWidth: 2 }}
                            activeDot={{ r: 8, strokeWidth: 0 }}
                        />

                        {/* Marcação de Onde Estamos */}
                        <ReferenceLine x={currentStage} stroke="#1B5E20" strokeDasharray="3 3" label={{ position: 'top', value: 'ESTÁGIO ATUAL', fill: '#1B5E20', fontSize: 11, fontWeight: 700 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
