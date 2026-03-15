import React from 'react';

interface OcorrenciasPragasVTProps {
    pragas: Record<string, unknown>[];
}

export default function OcorrenciasPragasVT({ pragas }: OcorrenciasPragasVTProps) {
    if (pragas.length === 0) return null;

    return (
        <section className="section-block relatorio-editorial">
            <div className="section-block__title">Monitoramento Fitossanitário</div>
            <div className="section-block__body" style={{ overflowX: 'auto', padding: 20 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 600 }}>
                    <thead>
                        <tr style={{ background: '#F8FAFC' }}>
                            <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Tipo</th>
                            <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Alvo</th>
                            <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Incidência</th>
                            <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Severidade</th>
                            <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Situação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pragas.map((p, i) => {
                            const isCritical = String(p.severidade || '').toLowerCase().includes('alta') || String(p.situacao || '').toLowerCase().includes('acima');
                            return (
                                <tr key={i} style={{ borderBottom: '1px solid #E2E8F0', background: isCritical ? '#FEF2F2' : '#fff' }}>
                                    <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0', color: isCritical ? '#B91C1C' : '#64748B' }}>
                                        <div style={{
                                            display: 'inline-block',
                                            padding: '4px 8px',
                                            borderRadius: 4,
                                            background: isCritical ? '#FCA5A5' : '#E2E8F0',
                                            color: isCritical ? '#7F1D1D' : '#475569',
                                            fontSize: 11,
                                            fontWeight: 700,
                                            textTransform: 'uppercase'
                                        }}>
                                            {String(p.tipo ?? '—')}
                                        </div>
                                    </td>
                                    <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0', fontWeight: 700, color: isCritical ? '#991B1B' : '#334155' }}>
                                        {String(p.alvo ?? p.nome ?? '—')}
                                        {Boolean(p.observacoes) && <div style={{ fontSize: 11, color: '#64748B', marginTop: 4, fontWeight: 500 }}>{String(p.observacoes)}</div>}
                                    </td>
                                    <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0', fontWeight: 600, color: '#334155' }}>{String(p.incidencia ?? '—')}</td>
                                    <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0', fontWeight: 700, color: isCritical ? '#DC2626' : '#64748B' }}>{String(p.severidade ?? '—')}</td>
                                    <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0', color: '#334155', fontWeight: 600 }}>{String(p.situacao ?? '—')}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
