'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { RelatorioPlantioData } from './DashboardTalhao';

interface AnalyticsProps {
    analytics?: RelatorioPlantioData['analytics'];
}

export default function AnalyticsPredictivePlantio({ analytics }: AnalyticsProps) {
    if (!analytics) return null;

    const comparativo = analytics.comparativoSafraAnterior;
    const curtoPrazo = analytics.previsaoCurtoPrazo;

    const dataComparativo = [
        { name: 'População Inicial', var: comparativo?.variacaoPopulacaoPct ?? 0 },
        { name: 'Incidência Pragas', var: comparativo?.variacaoIncidenciaPragasPct ?? 0 },
        { name: 'Desuniformidade (CV)', var: comparativo?.variacaoCVPct ?? 0 },
    ];

    const isHighProbability = (curtoPrazo?.probabilidadeIntervencaoPct || 0) > 40;

    return (
        <section className="print:break-inside-avoid" style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 24, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', borderBottom: '1px solid #BFDBFE', fontSize: 15, fontWeight: 700, color: '#1E3A8A', letterSpacing: '-0.01em' }}>
                Inteligência Analítica & Previsibilidade (Comparativo de Plantio)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(250px, 1fr)', gap: 24, padding: 24 }}>

                {/* Gráfico do Comparativo Safra Anterior */}
                <div>
                    <div style={{ fontSize: 13, color: '#475569', fontWeight: 700, marginBottom: 16 }}>Comparativo vs Safra Anterior (Variação %)</div>
                    <div style={{ height: 200, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dataComparativo} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                <XAxis type="number" stroke="#94A3B8" fontSize={12} />
                                <YAxis dataKey="name" type="category" width={120} stroke="#64748B" fontSize={11} fontWeight={600} />
                                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="var" radius={[0, 4, 4, 0]} barSize={24}>
                                    {dataComparativo.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.var > 0 ? (entry.name === 'Incidência Pragas' || entry.name === 'Desuniformidade (CV)' ? '#EF4444' : '#10B981') : (entry.name === 'Incidência Pragas' || entry.name === 'Desuniformidade (CV)' ? '#10B981' : '#F59E0B')} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Previsão IA */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ background: isHighProbability ? '#FEF2F2' : '#F8FAFC', border: `1px solid ${isHighProbability ? '#FECACA' : '#E2E8F0'}`, padding: 20, borderRadius: 12 }}>
                        <div style={{ fontSize: 12, color: isHighProbability ? '#991B1B' : '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
                            Probabilidade de Falhas (Curto Prazo)
                        </div>
                        <div style={{ fontSize: 36, fontWeight: 900, color: isHighProbability ? '#DC2626' : '#0F172A', letterSpacing: '-1px' }}>
                            {curtoPrazo?.probabilidadeIntervencaoPct ?? 0}%
                        </div>
                        <div style={{ fontSize: 13, color: isHighProbability ? '#B91C1C' : '#64748B', marginTop: 4 }}>
                            Confiança do Modelo ML: {Math.round((curtoPrazo?.confiancaModelo ?? 0) * 100)}%
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
