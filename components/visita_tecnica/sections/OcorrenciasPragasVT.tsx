import React, { useMemo } from 'react';
import { labelCausa } from '@/lib/visita-tecnica/label-utils';

interface OcorrenciasPragasVTProps {
    pragas: Record<string, unknown>[];
}

export default function OcorrenciasPragasVT({ pragas }: OcorrenciasPragasVTProps) {
    const flags = useMemo(() => {
        let causa = false;
        let desfolha = false;
        let area = false;
        let impacto = false;
        let reco = false;
        for (const p of pragas) {
            if (p.causaProvavel != null && String(p.causaProvavel).trim() !== '') causa = true;
            if (p.pctDesfolha != null) desfolha = true;
            if (p.pctAreaAfetada != null) area = true;
            if (p.impactoVisual != null && String(p.impactoVisual).trim() !== '') impacto = true;
            if (p.recomendacao != null && String(p.recomendacao).trim() !== '') reco = true;
        }
        return { causa, desfolha, area, impacto, reco };
    }, [pragas]);

    if (pragas.length === 0) return null;

    return (
        <section className="section-block relatorio-editorial">
            <div className="section-block__title">Monitoramento Fitossanitário</div>
            <div className="section-block__body" style={{ overflowX: 'auto', padding: 20 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: flags.causa || flags.desfolha || flags.area || flags.impacto ? 920 : 600 }}>
                    <thead>
                        <tr style={{ background: '#F8FAFC' }}>
                            <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Tipo</th>
                            <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Alvo</th>
                            <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Incidência</th>
                            <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Severidade</th>
                            <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Situação</th>
                            {flags.causa && (
                                <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Causa provável</th>
                            )}
                            {flags.desfolha && (
                                <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>% desfolha</th>
                            )}
                            {flags.area && (
                                <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>% área afet.</th>
                            )}
                            {flags.impacto && (
                                <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Impacto visual</th>
                            )}
                            {flags.reco && (
                                <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Recomendação</th>
                            )}
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
                                        {Boolean(p.causaProvavelNota) && (
                                            <div style={{ fontSize: 11, color: '#64748B', marginTop: 4, fontWeight: 500 }}>Nota causa: {String(p.causaProvavelNota)}</div>
                                        )}
                                    </td>
                                    <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0', fontWeight: 600, color: '#334155' }}>{String(p.incidencia ?? '—')}</td>
                                    <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0', fontWeight: 700, color: isCritical ? '#DC2626' : '#64748B' }}>{String(p.severidade ?? '—')}</td>
                                    <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0', color: '#334155', fontWeight: 600 }}>{String(p.situacao ?? '—')}</td>
                                    {flags.causa && (
                                        <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0', fontSize: 12 }}>
                                            {p.causaProvavel != null && String(p.causaProvavel).trim() !== '' ? labelCausa(p.causaProvavel) : '—'}
                                        </td>
                                    )}
                                    {flags.desfolha && (
                                        <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0' }}>
                                            {p.pctDesfolha != null ? `${Number(p.pctDesfolha).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '—'}
                                        </td>
                                    )}
                                    {flags.area && (
                                        <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0' }}>
                                            {p.pctAreaAfetada != null ? `${Number(p.pctAreaAfetada).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '—'}
                                        </td>
                                    )}
                                    {flags.impacto && (
                                        <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0', fontSize: 12 }}>{p.impactoVisual != null ? String(p.impactoVisual) : '—'}</td>
                                    )}
                                    {flags.reco && (
                                        <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0', fontSize: 12, maxWidth: 220 }}>{p.recomendacao != null ? String(p.recomendacao) : '—'}</td>
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
