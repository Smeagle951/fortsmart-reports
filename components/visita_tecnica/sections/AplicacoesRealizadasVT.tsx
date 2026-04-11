import React from 'react';
import { Droplets } from 'lucide-react';
import type { PayloadVisitaTecnica } from '@/types/payload-visita-tecnica';
import deck from '../visita-tecnica-deck.module.css';

interface AplicacoesRealizadasVTProps {
    aplicacoes: NonNullable<PayloadVisitaTecnica['aplicacoes']>;
    embedded?: boolean;
}

export default function AplicacoesRealizadasVT({ aplicacoes, embedded }: AplicacoesRealizadasVTProps) {
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

    const getClasseChipClass = (classeRaw?: string | null): string => {
        const classe = String(classeRaw ?? '—').toLowerCase();
        if (classe.includes('herbicida')) return deck.classeChipHerbicida;
        if (classe.includes('inseticida')) return deck.classeChipInseticida;
        if (classe.includes('fungicida')) return deck.classeChipFungicida;
        return deck.classeChip;
    };

    const body = (
                <div style={{ display: 'grid', gap: 12 }}>
                    {grupos.map((g) => {
                        const primeiro = g.produtos[0];
                        const dosePreview = primeiro?.dose != null
                            ? `${String(primeiro.dose)}${primeiro.unidade ? ` ${String(primeiro.unidade)}` : ''}`.trim()
                            : '—';
                        const classePreviewClass = getClasseChipClass(primeiro?.classe as string | null);
                        return (
                            <details key={g.chave} className={deck.aplicacaoDetails}>
                                <summary>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                                        <div style={{ display: 'grid', gap: 6 }}>
                                            <div className={deck.aplicacaoSummaryTitle}>
                                                {String(g.tipoOperacao ?? g.tipo ?? '—')} · {String(g.data ?? '—')}
                                            </div>
                                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                                                <span className={classePreviewClass}>{String(primeiro?.classe ?? '—')}</span>
                                                <span className={deck.aplicacaoMeta}>
                                                    Área {g.areaTrabalhoHa != null ? `${Number(g.areaTrabalhoHa).toFixed(2)} ha` : '—'}
                                                </span>
                                                <span className={deck.aplicacaoMeta}>Status {statusLabel(g.status)}</span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gap: 4, textAlign: 'right' }}>
                                            <div className={deck.aplicacaoMeta}>Produtos · {g.produtos.length}</div>
                                            <div style={{ fontSize: '0.82rem', color: 'var(--vt-ink)', fontWeight: 800 }}>
                                                {String(primeiro?.produto ?? '—')} · {dosePreview}
                                            </div>
                                        </div>
                                    </div>
                                </summary>

                                <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                                    {g.produtos.map((a, idx) => {
                                        const chipClass = getClasseChipClass(a.classe as string | null);
                                        return (
                                            <div key={`${g.chave}_${idx}`} className={deck.aplicacaoProdutoCard}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                                                    <div style={{ minWidth: 240 }}>
                                                        <div style={{ fontWeight: 800, color: 'var(--vt-ink)', fontSize: '0.82rem' }}>
                                                            {String(a.produto ?? '—')}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--vt-muted)', marginTop: 4, fontWeight: 600 }}>
                                                            Dose:{' '}
                                                            {a.dose != null ? `${String(a.dose)}${a.unidade ? ` ${String(a.unidade)}` : ''}`.trim() : '—'}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--vt-muted)', fontWeight: 600 }}>
                                                            Área: {a.areaTrabalhoHa != null ? `${Number(a.areaTrabalhoHa).toFixed(2)} ha` : '—'}
                                                        </div>
                                                        <div style={{ marginTop: 8 }}>
                                                            <span className={chipClass}>{String(a.classe ?? '—')}</span>
                                                        </div>
                                                    </div>

                                                    <div style={{ textAlign: 'right' }}>
                                                        {a.grupoQuimico && (
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--vt-muted)', fontWeight: 700 }}>
                                                                Grupo: {String(a.grupoQuimico)}
                                                            </div>
                                                        )}
                                                        {a.intervaloSeguranca && (
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--vt-muted)', fontWeight: 700, marginTop: 4 }}>
                                                                IS: {String(a.intervaloSeguranca)}
                                                            </div>
                                                        )}
                                                        {a.quantidade != null && (
                                                            <div style={{ fontSize: '0.78rem', color: 'var(--vt-ink)', fontWeight: 800, marginTop: 8 }}>
                                                                Quant.: {Number(a.quantidade).toFixed(2)} {a.unidade ? String(a.unidade) : ''}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {a.observacoes && String(a.observacoes).trim().length > 0 && (
                                                    <div style={{ marginTop: 10, fontSize: '0.78rem', color: '#57534e', fontWeight: 700, lineHeight: 1.45 }}>
                                                        Obs.: {String(a.observacoes)}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                        {g.responsavel && <span className={deck.aplicacaoMeta}>Responsável · {String(g.responsavel)}</span>}
                                        {g.tipoOperacao && <span className={deck.aplicacaoMeta}>Operação · {String(g.tipoOperacao)}</span>}
                                        {g.observacoes && String(g.observacoes).trim().length > 0 && (
                                            <span style={{ fontSize: '0.75rem', color: '#57534e', fontWeight: 700 }}>
                                                Observações gerais: {String(g.observacoes)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </details>
                        );
                    })}
                </div>
    );

    if (embedded) return body;

    return (
        <section className={`${deck.reportCard} ${deck.noBreakInside} pdf-keep-together`}>
            <div className={deck.reportCardHead}>
                <span className={deck.reportCardIcon} aria-hidden>
                    <Droplets size={18} strokeWidth={2.25} />
                </span>
                <div style={{ minWidth: 0 }}>
                    <span className={deck.reportCardKicker}>Operações</span>
                    <h2 className={deck.reportCardTitle}>Aplicações e prescrições</h2>
                </div>
            </div>
            <div className={deck.reportCardBody}>{body}</div>
        </section>
    );
}
