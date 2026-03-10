import React, { useState } from 'react';
import { cardStyle, sectionTitleStyle } from './IdentificacaoEContexto';
import { PayloadVisitaTecnica } from '@/components/RelatorioVisitaTecnicaContent';

interface DiagnosticoEPlanoAcaoProps {
    diagnostico?: Record<string, unknown>;
    planoAcao?: PayloadVisitaTecnica['planoAcao'];
}

export default function DiagnosticoEPlanoAcao({ diagnostico, planoAcao }: DiagnosticoEPlanoAcaoProps) {
    if (!diagnostico && !planoAcao) return null;

    const hasDiagnostico = diagnostico && (diagnostico.problemaPrincipal != null || diagnostico.causaProvavel != null || (Array.isArray(diagnostico.recomendacoes) && diagnostico.recomendacoes.length > 0));
    const hasPlanoAcao = planoAcao && (planoAcao.objetivoManejo != null || (Array.isArray(planoAcao.acoes) && planoAcao.acoes.length > 0));

    if (!hasDiagnostico && !hasPlanoAcao) return null;

    const riskColor = String(diagnostico?.nivelRisco || '').toLowerCase().includes('alto') || String(diagnostico?.nivelRisco || '').toLowerCase().includes('crítico') ? '#EF4444' : '#F59E0B';

    return (
        <section style={{ ...cardStyle, marginBottom: 24, overflow: 'hidden' }}>
            <div style={{ ...sectionTitleStyle, background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)', color: '#B45309', borderBottomColor: '#FDE68A' }}>
                7. Diagnóstico e Plano de Ação Estratégico
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
                {/* Diagnóstico Parte */}
                {hasDiagnostico && (
                    <div style={{ padding: 24, borderBottom: hasPlanoAcao ? '1px dashed #E2E8F0' : 'none' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                            <div>
                                {diagnostico.problemaPrincipal != null && String(diagnostico.problemaPrincipal).trim() && (
                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Problema principal</div>
                                        <div style={{ fontSize: 15, color: '#334155', lineHeight: 1.5 }}>{String(diagnostico.problemaPrincipal)}</div>
                                    </div>
                                )}
                                {diagnostico.causaProvavel != null && String(diagnostico.causaProvavel).trim() && (
                                    <div>
                                        <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Causa provável</div>
                                        <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.5 }}>{String(diagnostico.causaProvavel)}</div>
                                    </div>
                                )}
                            </div>

                            <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 16, border: '1px solid #E2E8F0' }}>
                                {Boolean(diagnostico.nivelRisco || diagnostico.urgenciaAcao) && (
                                    <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                                        {Boolean(diagnostico.nivelRisco) && (
                                            <div>
                                                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>NÍVEL DE RISCO</div>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: riskColor }}>{String(diagnostico.nivelRisco)}</div>
                                            </div>
                                        )}
                                        {Boolean(diagnostico.urgenciaAcao) && (
                                            <div>
                                                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>URGÊNCIA</div>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>{String(diagnostico.urgenciaAcao)}</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {Array.isArray(diagnostico.recomendacoes) && diagnostico.recomendacoes.length > 0 && (
                                    <div>
                                        <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Recomendações</div>
                                        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
                                            {(diagnostico.recomendacoes as string[]).map((r, i) => (
                                                <li key={i} style={{ marginBottom: 6 }}>{String(r)}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Plano de Ação (Timeline style) */}
                {hasPlanoAcao && (
                    <div style={{ padding: 24, background: '#F0FDF4' }}>
                        {planoAcao.objetivoManejo != null && String(planoAcao.objetivoManejo).trim() && (
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>Objetivo de manejo</div>
                                <div style={{ fontSize: 15, color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{String(planoAcao.objetivoManejo)}</div>
                            </div>
                        )}

                        {Array.isArray(planoAcao.acoes) && planoAcao.acoes.length > 0 && (
                            <div style={{ position: 'relative', marginTop: 16, paddingLeft: 8 }}>
                                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 16, width: 2, background: '#BBF7D0' }} />
                                {planoAcao.acoes.map((acao, i) => {
                                    const isUrgente = String(acao.prioridade || '').toLowerCase().includes('alta') || String(acao.prioridade || '').toLowerCase().includes('imediata');

                                    return (
                                        <div key={i} style={{ position: 'relative', paddingLeft: 32, paddingBottom: i === planoAcao.acoes!.length - 1 ? 0 : 20 }}>
                                            <div style={{
                                                position: 'absolute', left: 4, top: 2, width: 10, height: 10, borderRadius: '50%',
                                                background: isUrgente ? '#EF4444' : '#22C55E', border: '2px solid #fff', boxShadow: '0 0 0 1px #E2E8F0'
                                            }} />
                                            <div style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #BBF7D0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: '#166534', marginBottom: 4 }}>Passo {i + 1}: {String(acao.acao ?? '—')}</div>
                                                {(acao.prioridade || acao.prazo) && (
                                                    <div style={{ display: 'flex', gap: 12, fontSize: 12, fontWeight: 600 }}>
                                                        {acao.prioridade && <span style={{ color: isUrgente ? '#EF4444' : '#F59E0B' }}>Prioridade: {acao.prioridade}</span>}
                                                        {acao.prazo && <span style={{ color: '#64748B' }}>Prazo limite: {acao.prazo}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
