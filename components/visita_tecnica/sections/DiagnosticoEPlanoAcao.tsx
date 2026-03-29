import React from 'react';
import { PayloadVisitaTecnica } from '@/components/RelatorioVisitaTecnicaContent';

interface DiagnosticoEPlanoAcaoProps {
    diagnostico?: Record<string, unknown>;
    planoAcao?: PayloadVisitaTecnica['planoAcao'];
}

export default function DiagnosticoEPlanoAcao({ diagnostico, planoAcao }: DiagnosticoEPlanoAcaoProps) {
    const hasDiagnostico = diagnostico && (diagnostico.problemaPrincipal != null || diagnostico.causaProvavel != null || diagnostico.nivelRisco != null || diagnostico.urgenciaAcao != null || (Array.isArray(diagnostico.recomendacoes) && diagnostico.recomendacoes.length > 0));
    const hasPlanoAcao = planoAcao && (planoAcao.objetivoManejo != null || (Array.isArray(planoAcao.acoes) && planoAcao.acoes.length > 0));

    if (!hasDiagnostico && !hasPlanoAcao) return null;

    const acoes = Array.isArray(planoAcao?.acoes) ? planoAcao!.acoes : [];
    const showProduto = acoes.some((a) => (a as { produto?: string }).produto != null && String((a as { produto?: string }).produto).trim() !== '');
    const showDose = acoes.some((a) => (a as { dose?: string }).dose != null && String((a as { dose?: string }).dose).trim() !== '');
    const showMomento = acoes.some((a) => (a as { momento?: string }).momento != null && String((a as { momento?: string }).momento).trim() !== '');
    const showObjetivo = acoes.some((a) => (a as { objetivoTecnico?: string }).objetivoTecnico != null && String((a as { objetivoTecnico?: string }).objetivoTecnico).trim() !== '');

    const riskColor = String(diagnostico?.nivelRisco || '').toLowerCase().includes('alto') || String(diagnostico?.nivelRisco || '').toLowerCase().includes('crítico') ? '#EF4444' : '#F59E0B';

    return (
        <>
            {/* Diagnóstico Agronômico — texto técnico */}
            {hasDiagnostico && (
                <section className="section-block relatorio-editorial">
                    <div className="section-block__title">Diagnóstico Agronômico</div>
                    <div className="section-block__body" style={{ padding: 24 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
                            <div>
                                {diagnostico!.problemaPrincipal != null && String(diagnostico!.problemaPrincipal).trim() && (
                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Problema principal</div>
                                        <div style={{ fontSize: 15, color: '#334155', lineHeight: 1.5 }}>{String(diagnostico!.problemaPrincipal)}</div>
                                    </div>
                                )}
                                {diagnostico!.causaProvavel != null && String(diagnostico!.causaProvavel).trim() && (
                                    <div>
                                        <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Causa provável</div>
                                        <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.5 }}>{String(diagnostico!.causaProvavel)}</div>
                                    </div>
                                )}
                            </div>
                            <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 16, border: '1px solid #E2E8F0' }}>
                                {(diagnostico!.nivelRisco != null || diagnostico!.urgenciaAcao != null) && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
                                        {diagnostico!.nivelRisco != null && (
                                            <div>
                                                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Nível de risco</div>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: riskColor }}>{String(diagnostico!.nivelRisco)}</div>
                                            </div>
                                        )}
                                        {diagnostico!.urgenciaAcao != null && (
                                            <div>
                                                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Urgência de ação</div>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>{String(diagnostico!.urgenciaAcao)}</div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {Array.isArray(diagnostico!.recomendacoes) && diagnostico!.recomendacoes.length > 0 && (
                                    <div>
                                        <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Recomendações técnicas</div>
                                        <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 10px', lineHeight: 1.45 }}>
                                            Priorize itens com produto, dose, momento e objetivo técnico quando forem registrados no app — isso reforça rastreabilidade e execução de campo.
                                        </p>
                                        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
                                            {(diagnostico!.recomendacoes as string[]).map((r, i) => (
                                                <li key={i} style={{ marginBottom: 6 }}>{String(r)}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Plano de Ação — tabela Prioridade | Ação | Prazo */}
            {hasPlanoAcao && (
                <section className="section-block relatorio-editorial">
                    <div className="section-block__title">Plano de Ação</div>
                    <div className="section-block__body" style={{ padding: 20 }}>
                        {planoAcao!.objetivoManejo != null && String(planoAcao!.objetivoManejo).trim() && (
                            <p style={{ fontSize: 14, color: '#334155', marginBottom: 16, lineHeight: 1.5 }}>
                                <strong>Objetivo de manejo:</strong> {String(planoAcao!.objetivoManejo)}
                            </p>
                        )}
                        {Array.isArray(planoAcao!.acoes) && planoAcao!.acoes.length > 0 && (
                            <table className="table-tech" style={{ width: '100%', marginTop: 8 }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 12 }}>Prioridade</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 12 }}>Ação</th>
                                        {showProduto && (
                                            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 12 }}>Produto</th>
                                        )}
                                        {showDose && (
                                            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 12 }}>Dose</th>
                                        )}
                                        {showMomento && (
                                            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 12 }}>Momento</th>
                                        )}
                                        {showObjetivo && (
                                            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 12 }}>Objetivo técnico</th>
                                        )}
                                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 12 }}>Prazo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {planoAcao!.acoes.map((acao, i) => {
                                        const a = acao as {
                                            prioridade?: string;
                                            acao?: string;
                                            prazo?: string;
                                            produto?: string;
                                            dose?: string;
                                            momento?: string;
                                            objetivoTecnico?: string;
                                        };
                                        return (
                                            <tr key={i}>
                                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', color: '#64748b', fontWeight: 600 }}>{String(a.prioridade ?? '—')}</td>
                                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', color: '#334155' }}>{String(a.acao ?? '—')}</td>
                                                {showProduto && (
                                                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', color: '#334155' }}>{a.produto != null ? String(a.produto) : '—'}</td>
                                                )}
                                                {showDose && (
                                                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', color: '#334155' }}>{a.dose != null ? String(a.dose) : '—'}</td>
                                                )}
                                                {showMomento && (
                                                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', color: '#334155' }}>{a.momento != null ? String(a.momento) : '—'}</td>
                                                )}
                                                {showObjetivo && (
                                                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', color: '#334155', fontSize: 13 }}>{a.objetivoTecnico != null ? String(a.objetivoTecnico) : '—'}</td>
                                                )}
                                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', color: '#334155' }}>{String(a.prazo ?? '—')}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>
            )}
        </>
    );
}
