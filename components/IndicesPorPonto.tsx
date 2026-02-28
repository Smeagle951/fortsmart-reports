'use client';

import React, { useState } from 'react';
import { MetricasPonto, NivelClassificacao, PontoMonitoramento, Infestacao } from '@/lib/types/monitoring';
import { classificarNivel } from '@/lib/calculations';

interface IndicesPorPontoProps {
    metricasPorPonto: MetricasPonto[];
    pontos?: PontoMonitoramento[];
}

const CLASSIF_CONFIG: Record<NivelClassificacao, { color: string; label: string }> = {
    CONTROLADO: { color: '#2E7D32', label: 'Controlado' },
    ATENCAO: { color: '#F9A825', label: 'Atenção' },
    ALTO_RISCO: { color: '#E65100', label: 'Alto Risco' },
    CRITICO: { color: '#C62828', label: 'Crítico' },
};

const TIPO_LABEL: Record<string, string> = {
    praga: 'Praga',
    doenca: 'Doença',
    daninha: 'Daninha',
};

export default function IndicesPorPonto({ metricasPorPonto, pontos = [] }: IndicesPorPontoProps) {
    const [expandidoId, setExpandidoId] = useState<string | null>(null);
    const [modalImg, setModalImg] = useState<{ imagem: string; nome: string; ponto: string } | null>(null);

    const pontoPorId = Object.fromEntries(pontos.map(p => [p.id, p]));

    return (
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Índice individual por ponto</div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Clique em um ponto para ver detalhes das ocorrências e imagens</div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                        <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0', width: 40 }}></th>
                        <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Ponto</th>
                        <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Índice</th>
                        <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Ocorrências</th>
                        <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Classificação</th>
                    </tr>
                </thead>
                <tbody>
                    {metricasPorPonto.map((mp) => {
                        const cfg = CLASSIF_CONFIG[mp.classificacao];
                        const ponto = pontoPorId[mp.pontoId];
                        const expandido = expandidoId === mp.pontoId;

                        return (
                            <React.Fragment key={mp.pontoId}>
                                <tr
                                    key={mp.pontoId}
                                    onClick={() => setExpandidoId(expandido ? null : mp.pontoId)}
                                    style={{
                                        borderBottom: '1px solid #E2E8F0',
                                        cursor: 'pointer',
                                        background: expandido ? '#F8FAFC' : undefined,
                                    }}
                                    onMouseEnter={e => { if (!expandido) (e.currentTarget as HTMLTableRowElement).style.background = '#F8FAFC'; }}
                                    onMouseLeave={e => { if (!expandido) (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                                >
                                    <td style={{ padding: '10px 16px', color: '#94A3B8', fontSize: 14 }}>
                                        {expandido ? '▼' : '▶'}
                                    </td>
                                    <td style={{ padding: '10px 16px', fontWeight: 600, color: '#1E293B' }}>{mp.identificador}</td>
                                    <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: cfg.color }}>{mp.severidadeMedia}%</td>
                                    <td style={{ padding: '10px 16px', textAlign: 'center', color: '#64748B' }}>
                                        {mp.numOcorrencias} ocorrência{mp.numOcorrencias !== 1 ? 's' : ''}
                                    </td>
                                    <td style={{ padding: '10px 16px' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '2px 8px',
                                            borderRadius: 4,
                                            background: cfg.color + '18',
                                            color: cfg.color,
                                            fontSize: 11,
                                            fontWeight: 600,
                                        }}>
                                            {cfg.label}
                                        </span>
                                    </td>
                                </tr>
                                {expandido && ponto && (
                                    <tr key={`${mp.pontoId}-detalhes`}>
                                        <td colSpan={5} style={{ padding: 0, borderBottom: '1px solid #E2E8F0', background: '#FAFBFC', verticalAlign: 'top' }}>
                                            <DetalhesPonto ponto={ponto} onImageClick={setModalImg} />
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>

            {modalImg && (
                <div
                    onClick={() => setModalImg(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        cursor: 'pointer',
                    }}
                >
                    <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={modalImg.imagem}
                            alt={modalImg.nome}
                            style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8 }}
                        />
                        <div style={{ color: '#fff', textAlign: 'center', marginTop: 12, fontSize: 14 }}>
                            {modalImg.nome} · {modalImg.ponto}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function DetalhesPonto({ ponto, onImageClick }: { ponto: PontoMonitoramento; onImageClick: (v: { imagem: string; nome: string; ponto: string }) => void }) {
    const infestacoes = ponto.infestacoes;

    if (infestacoes.length === 0) {
        return (
            <div style={{ padding: 16, color: '#64748B', fontSize: 13 }}>
                Nenhuma ocorrência registrada neste ponto.
            </div>
        );
    }

    return (
        <div style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.4px' }}>
                Ocorrências em {ponto.identificador}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {infestacoes.map((inf, idx) => (
                    <OcorrenciaItem key={inf.id || idx} inf={inf} pontoId={ponto.identificador} onImageClick={onImageClick} />
                ))}
            </div>
        </div>
    );
}

function OcorrenciaItem({ inf, pontoId, onImageClick }: { inf: Infestacao; pontoId: string; onImageClick: (v: { imagem: string; nome: string; ponto: string }) => void }) {
    const nivel = classificarNivel(inf.severidade);
    const cfg = CLASSIF_CONFIG[nivel];

    return (
        <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16,
            padding: 12,
            background: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            borderLeft: `4px solid ${cfg.color}`,
        }}>
            {/* Sempre reservar espaço para imagem: miniatura ou placeholder */}
            <div
                onClick={() => inf.imagem && onImageClick({ imagem: inf.imagem, nome: inf.nome, ponto: pontoId })}
                style={{
                    width: 100,
                    height: 100,
                    borderRadius: 8,
                    overflow: 'hidden',
                    flexShrink: 0,
                    cursor: inf.imagem ? 'pointer' : 'default',
                    border: '1px solid #E2E8F0',
                    background: inf.imagem ? undefined : '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {inf.imagem ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={inf.imagem}
                        alt={inf.nome}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textAlign: 'center', padding: 8 }}>
                        Sem imagem
                    </span>
                )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{inf.nome}</span>
                    <span style={{
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: cfg.color + '18',
                        color: cfg.color,
                        fontSize: 10,
                        fontWeight: 600,
                    }}>
                        {cfg.label}
                    </span>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>{TIPO_LABEL[inf.tipo] || inf.tipo}</span>
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginBottom: 2 }}>
                    Índice: <strong style={{ color: cfg.color }}>{inf.severidade}%</strong>
                    {inf.terco && <> · Terço: {inf.terco}</>}
                    {inf.quantidade != null && <> · Qtd: {inf.quantidade}</>}
                </div>
                {inf.observacao && (
                    <div style={{ fontSize: 11, color: '#64748B', fontStyle: 'italic', marginTop: 4 }}>
                        {inf.observacao}
                    </div>
                )}
            </div>
        </div>
    );
}
