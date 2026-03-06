import React from 'react';
import { PayloadVisitaTecnica } from '@/components/RelatorioVisitaTecnicaContent';
import { cardStyle, sectionTitleStyle } from './IdentificacaoEContexto';

interface AplicacoesRealizadasVTProps {
    aplicacoes: NonNullable<PayloadVisitaTecnica['aplicacoes']>;
}

export default function AplicacoesRealizadasVT({ aplicacoes }: AplicacoesRealizadasVTProps) {
    if (aplicacoes.length === 0) return null;

    return (
        <section style={{ ...cardStyle, marginBottom: 24, overflow: 'hidden' }}>
            <div style={sectionTitleStyle}>Aplicações e Operações Realizadas</div>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 640 }}>
                    <thead>
                        <tr style={{ background: '#F8FAFC' }}>
                            <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Data</th>
                            <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Operação / Alvo</th>
                            <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Produto</th>
                            <th style={{ padding: 14, textAlign: 'right', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Dose</th>
                            <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Classe</th>
                            {(aplicacoes.some((a) => a.quantidade != null)) && (
                                <th style={{ padding: 14, textAlign: 'right', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Volume Utilizado</th>
                            )}
                            {(aplicacoes.some((a) => a.responsavel)) && (
                                <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Responsável</th>
                            )}
                            {(aplicacoes.some((a) => a.custoPorHa != null)) && (
                                <th style={{ padding: 14, textAlign: 'right', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Custo (R$/ha)</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {aplicacoes.map((a, i) => {
                            const classe = String(a.classe ?? '—');
                            const badgeClasse =
                                classe.toLowerCase().includes('herbicida') ? { bg: '#DCFCE7', color: '#166534' } :
                                    classe.toLowerCase().includes('inseticida') ? { bg: '#FEF3C7', color: '#B45309' } :
                                        classe.toLowerCase().includes('fungicida') ? { bg: '#DBEAFE', color: '#1D4ED8' } :
                                            { bg: '#F1F5F9', color: '#475569' };
                            return (
                                <tr key={i} style={{ borderBottom: '1px solid #E2E8F0', '&:hover': { background: '#F8FAFC' } } as React.CSSProperties}>
                                    <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0', color: '#475569' }}>{String(a.data ?? '—')}</td>
                                    <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0', color: '#334155' }}>
                                        <div style={{ fontWeight: 700 }}>{String(a.tipo ?? '—')}</div>
                                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{String(a.alvo ?? '—')}</div>
                                    </td>
                                    <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0', fontWeight: 600, color: '#0F172A' }}>{String(a.produto ?? '—')}</td>
                                    <td style={{ padding: 14, textAlign: 'right', borderBottom: '1px solid #E2E8F0', fontWeight: 600, color: '#334155' }}>
                                        {a.dose != null ? `${a.dose}${a.unidade ? ` ${a.unidade}` : ''}` : '—'}
                                    </td>
                                    <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0' }}>
                                        <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: badgeClasse.bg, color: badgeClasse.color }}>
                                            {classe}
                                        </span>
                                    </td>
                                    {(aplicacoes.some((b) => b.quantidade != null)) && (
                                        <td style={{ padding: 14, textAlign: 'right', borderBottom: '1px solid #E2E8F0', color: '#334155', fontSize: 12 }}>
                                            {a.quantidade != null ? `${Number(a.quantidade).toFixed(2)} ${a.unidade ?? ''}`.trim() : '—'}
                                        </td>
                                    )}
                                    {(aplicacoes.some((b) => b.responsavel)) && (
                                        <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: 12 }}>{a.responsavel ?? '—'}</td>
                                    )}
                                    {(aplicacoes.some((b) => b.custoPorHa != null)) && (
                                        <td style={{ padding: 14, textAlign: 'right', borderBottom: '1px solid #E2E8F0', color: '#166534', fontWeight: 600, fontSize: 12 }}>
                                            {a.custoPorHa != null ? `R$ ${Number(a.custoPorHa).toFixed(2)}` : '—'}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
