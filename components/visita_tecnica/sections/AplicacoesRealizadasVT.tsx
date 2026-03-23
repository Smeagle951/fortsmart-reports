import React from 'react';
import { PayloadVisitaTecnica } from '@/components/RelatorioVisitaTecnicaContent';

interface AplicacoesRealizadasVTProps {
    aplicacoes: NonNullable<PayloadVisitaTecnica['aplicacoes']>;
}

export default function AplicacoesRealizadasVT({ aplicacoes }: AplicacoesRealizadasVTProps) {
    if (aplicacoes.length === 0) return null;

    type AplicacaoItem = NonNullable<PayloadVisitaTecnica['aplicacoes']>[number];

    type GrupoAplicacao = {
        chave: string;
        status?: string;
        tipo?: string;
        tipoOperacao?: string;
        data?: string;
        responsavel?: string;
        areaTrabalhoHa?: number;
        observacoes?: string;
        produtos: AplicacaoItem[];
    };

    const gruposMap = new Map<string, GrupoAplicacao>();
    aplicacoes.forEach((a, idx) => {
        const chave = String(a.aplicacaoId ?? `sem_id_${idx}`);
        if (!gruposMap.has(chave)) {
            gruposMap.set(chave, {
                chave,
                status: a.status,
                tipo: a.tipo,
                tipoOperacao: a.tipoOperacao,
                data: a.data,
                responsavel: a.responsavel,
                areaTrabalhoHa: a.areaTrabalhoHa,
                observacoes: a.observacoes,
                produtos: [],
            });
        }
        gruposMap.get(chave)!.produtos.push(a);
    });

    const grupos = Array.from(gruposMap.values());

    const statusLabel = (s?: string) => {
        if (!s) return '—';
        const t = String(s).trim().toLowerCase();
        if (t === 'executada') return 'Executada';
        if (t === 'finalizada') return 'Finalizada';
        if (t === 'calculada') return 'Calculada';
        if (t === 'rascunho') return 'Rascunho';
        return String(s);
    };

    const getBadgeClasse = (classeRaw?: string | null) => {
        const classe = String(classeRaw ?? '—');
        if (classe.toLowerCase().includes('herbicida')) return { bg: '#DCFCE7', color: '#166534' };
        if (classe.toLowerCase().includes('inseticida')) return { bg: '#FEF3C7', color: '#B45309' };
        if (classe.toLowerCase().includes('fungicida')) return { bg: '#DBEAFE', color: '#1D4ED8' };
        return { bg: '#F1F5F9', color: '#475569' };
    };

    return (
        <section className="section-block relatorio-editorial">
            <div className="section-block__title">Aplicações (Prescrições)</div>
            <div className="section-block__body" style={{ padding: 20 }}>
                <div style={{ display: 'grid', gap: 12 }}>
                    {grupos.map((g) => {
                        const primeiro = g.produtos[0];
                        const dosePreview = primeiro?.dose != null
                            ? `${String(primeiro.dose)}${primeiro.unidade ? ` ${String(primeiro.unidade)}` : ''}`.trim()
                            : '—';
                        const classePreview = getBadgeClasse(primeiro?.classe as any);
                        return (
                            <details
                                key={g.chave}
                                style={{
                                    background: '#fff',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: 12,
                                    padding: '12px 14px',
                                }}
                            >
                                <summary style={{ cursor: 'pointer', listStyle: 'none' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                                        <div style={{ display: 'grid', gap: 2 }}>
                                            <div style={{ fontWeight: 950, color: '#0F172A', fontSize: 14 }}>
                                                {String(g.tipoOperacao ?? g.tipo ?? '—')} · {String(g.data ?? '—')}
                                            </div>
                                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                                                <span style={{ padding: '4px 10px', borderRadius: 999, background: classePreview.bg, color: classePreview.color, fontSize: 12, fontWeight: 900 }}>
                                                    {String(primeiro?.classe ?? '—')}
                                                </span>
                                                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 800 }}>
                                                    Área: {g.areaTrabalhoHa != null ? `${Number(g.areaTrabalhoHa).toFixed(2)} ha` : '—'}
                                                </span>
                                                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 800 }}>
                                                    Status: {statusLabel(g.status)}
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gap: 3, textAlign: 'right' }}>
                                            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 900 }}>
                                                Produtos: {g.produtos.length}
                                            </div>
                                            <div style={{ fontSize: 13, color: '#334155', fontWeight: 900 }}>
                                                {String(primeiro?.produto ?? '—')} · {dosePreview}
                                            </div>
                                        </div>
                                    </div>
                                </summary>

                                <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                                    {g.produtos.map((a, idx) => {
                                        const badgeClasse = getBadgeClasse(a.classe as any);
                                        return (
                                            <div
                                                key={`${g.chave}_${idx}`}
                                                style={{
                                                    border: '1px solid #E2E8F0',
                                                    borderRadius: 10,
                                                    padding: '10px 12px',
                                                    background: '#F8FAFC',
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                                                    <div style={{ minWidth: 240 }}>
                                                        <div style={{ fontWeight: 950, color: '#0F172A', fontSize: 13 }}>
                                                            {String(a.produto ?? '—')}
                                                        </div>
                                                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                                                            Dose: {a.dose != null ? `${String(a.dose)}${a.unidade ? ` ${String(a.unidade)}` : ''}`.trim() : '—'}
                                                        </div>
                                                        <div style={{ fontSize: 12, color: '#64748B' }}>
                                                            Área: {a.areaTrabalhoHa != null ? `${Number(a.areaTrabalhoHa).toFixed(2)} ha` : '—'}
                                                        </div>
                                                        <div style={{ marginTop: 6 }}>
                                                            <span style={{ padding: '4px 10px', borderRadius: 999, background: badgeClasse.bg, color: badgeClasse.color, fontSize: 12, fontWeight: 900 }}>
                                                                {String(a.classe ?? '—')}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div style={{ textAlign: 'right' }}>
                                                        {a.grupoQuimico && (
                                                            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 800 }}>
                                                                Grupo: {String(a.grupoQuimico)}
                                                            </div>
                                                        )}
                                                        {a.intervaloSeguranca && (
                                                            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 800, marginTop: 2 }}>
                                                                IS: {String(a.intervaloSeguranca)}
                                                            </div>
                                                        )}
                                                        {a.quantidade != null && (
                                                            <div style={{ fontSize: 12, color: '#334155', fontWeight: 900, marginTop: 6 }}>
                                                                Quant.: {Number(a.quantidade).toFixed(2)} {a.unidade ? String(a.unidade) : ''}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {a.observacoes && String(a.observacoes).trim().length > 0 && (
                                                    <div style={{ marginTop: 8, fontSize: 12, color: '#475569', fontWeight: 800 }}>
                                                        Obs.: {String(a.observacoes)}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                        {g.responsavel && (
                                            <span style={{ fontSize: 12, color: '#475569', fontWeight: 900 }}>
                                                Responsável: {String(g.responsavel)}
                                            </span>
                                        )}
                                        {g.tipoOperacao && (
                                            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 900 }}>
                                                Operação: {String(g.tipoOperacao)}
                                            </span>
                                        )}
                                        {g.observacoes && String(g.observacoes).trim().length > 0 && (
                                            <span style={{ fontSize: 12, color: '#475569', fontWeight: 800 }}>
                                                Observações gerais: {String(g.observacoes)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </details>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
