'use client';

import React from 'react';
import { PayloadVisitaTecnica } from '../RelatorioVisitaTecnicaContent';

interface DashboardProps {
    indicadores?: PayloadVisitaTecnica['indicadores'];
}

export default function DashboardExecutiveVisita({ indicadores }: DashboardProps) {
    if (!indicadores) return null;

    const {
        scoreGeral,
        indiceAgronomicoTalhao,
        indiceSanitario,
        riscoAtual,
        tendencia,
        itemsIAT
    } = indicadores;

    const getColorForScore = (score: number | undefined) => {
        if (!score) return '#94A3B8';
        if (score >= 85) return '#16A34A'; // Verde
        if (score >= 70) return '#EAB308'; // Amarelo
        return '#DC2626'; // Vermelho
    };

    const getRiscoBadge = (risco: string | undefined) => {
        const val = (risco || '').toLowerCase();
        if (val === 'baixo') return { bg: '#DCFCE7', text: '#166534', label: 'BAIXO' };
        if (val === 'medio' || val === 'médio') return { bg: '#FEF3C7', text: '#B45309', label: 'MÉDIO' };
        if (val === 'alto') return { bg: '#FEE2E2', text: '#B91C1C', label: 'ALTO' };
        return { bg: '#F1F5F9', text: '#475569', label: 'N/A' };
    };

    const riscoTheme = getRiscoBadge(riscoAtual);

    return (
        <section style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 24, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)', borderBottom: '1px solid #BBF7D0', fontSize: 15, fontWeight: 700, color: '#166534', letterSpacing: '-0.01em' }}>
                Dashboard Executivo (Health Check)
            </div>
            <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>

                {/* Score Geral Radial Mock */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                    <div style={{ position: 'relative', width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: `8px solid ${getColorForScore(scoreGeral)}`, marginBottom: 12 }}>
                        <span style={{ fontSize: 28, fontWeight: 800, color: '#1E293B', letterSpacing: '-1px' }}>{scoreGeral ?? '--'}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Score Geral</span>
                </div>

                <div style={{ display: 'flex', gap: 16, flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F1F5F9' }}>
                        <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>Índice Agronômico (IAT)</span>
                        <span style={{ fontSize: 18, color: '#0F172A', fontWeight: 800 }}>{indiceAgronomicoTalhao ?? '--'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F1F5F9' }}>
                        <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>Índice Sanitário</span>
                        <span style={{ fontSize: 18, color: '#0F172A', fontWeight: 800 }}>{indiceSanitario ?? '--'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>Tendência</span>
                        <span style={{ fontSize: 14, color: '#334155', fontWeight: 600, textTransform: 'capitalize' }}>{tendencia ?? '--'}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#F8FAFC', borderRadius: 8, padding: 16 }}>
                    <span style={{ fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Nível de Risco Atual</span>
                    <span style={{ padding: '8px 24px', borderRadius: 999, fontSize: 18, fontWeight: 800, background: riscoTheme.bg, color: riscoTheme.text }}>
                        {riscoTheme.label}
                    </span>
                </div>

            </div>
            {itemsIAT && itemsIAT.length > 0 && (
                <div style={{ padding: '0 24px 24px 24px' }}>
                    <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>Componentes do IAT</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                        {itemsIAT.map((item, idx) => (
                            <div key={idx} style={{ background: '#F8FAFC', padding: 12, border: '1px solid #F1F5F9', borderRadius: 8 }}>
                                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                                <div style={{ fontSize: 14, color: '#1E293B', fontWeight: 700 }}>{item.valor}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
