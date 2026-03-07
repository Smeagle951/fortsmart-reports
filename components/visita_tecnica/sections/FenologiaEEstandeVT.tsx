import React, { useState } from 'react';
import { cardStyle, sectionTitleStyle } from './IdentificacaoEContexto';
import ModalImagem from '@/components/ModalImagem';

interface FenologiaEEstandeVTProps {
    fenologia: Record<string, unknown>;
    contextoSafra?: Record<string, unknown>;
    populacao?: Record<string, unknown>;
    imagensFenologia: Array<{ url?: string; descricao?: string; categoria?: string; data?: string }>;
    imagensTotais: Array<{ url?: string; descricao?: string; categoria?: string; data?: string }>;
    setLightboxIndex: (index: number | null) => void;
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>{value}</div>
        </div>
    );
}

export default function FenologiaEEstandeVT({
    fenologia,
    contextoSafra,
    populacao,
    imagensFenologia,
    imagensTotais,
    setLightboxIndex
}: FenologiaEEstandeVTProps) {

    const showFenologia = (fenologia.estadio != null || fenologia.estagio != null || populacao?.plantasHa != null || populacao?.eficienciaPct != null || (Array.isArray(fenologia.historico) && (fenologia.historico as unknown[]).length > 0) || imagensFenologia.length > 0);

    if (!showFenologia) return null;

    return (
        <section style={{ ...cardStyle, marginBottom: 24, overflow: 'hidden' }}>
            <div style={sectionTitleStyle}>3. Fenologia e Estande da Cultura</div>
            <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20 }}>
                {(fenologia.estadio ?? fenologia.estagio) != null && (
                    <Row label="Estádio fenológico" value={String(fenologia.estadio ?? fenologia.estagio ?? '—')} />
                )}
                {(fenologia.dae ?? contextoSafra?.dae) != null && <Row label="DAE" value={String(fenologia.dae ?? contextoSafra?.dae ?? '—')} />}
                {(fenologia.dap ?? contextoSafra?.dap) != null && <Row label="DAP" value={String(fenologia.dap ?? contextoSafra?.dap ?? '—')} />}
                {populacao?.plantasHa != null && <Row label="Plantas/ha" value={String(populacao.plantasHa)} />}
                {populacao?.plantasPorMetro != null && <Row label="Plantas/m" value={String(populacao.plantasPorMetro)} />}
                {populacao?.eficienciaPct != null && <Row label="Eficiência" value={`${Number(populacao.eficienciaPct)}%`} />}
                {populacao?.situacao != null && <Row label="Situação estande" value={String(populacao.situacao)} />}
            </div>

            {/* Imagens específicas de Fenologia */}
            {imagensFenologia.length > 0 && (
                <div style={{ padding: '0 24px 24px', borderTop: '1px solid #E2E8F0', marginTop: 8, paddingTop: 16 }}>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase' }}>Evidências Fotográficas — Fenologia / Estande</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                        {imagensFenologia.map((img, idx) => {
                            const globalIndex = imagensTotais.findIndex((i) => i.url === img.url);
                            const src = img.url;
                            if (!src) return null;
                            return (
                                <button
                                    key={`fenologia-${idx}`}
                                    type="button"
                                    onClick={() => setLightboxIndex(globalIndex >= 0 ? globalIndex : 0)}
                                    style={{
                                        display: 'block',
                                        padding: 0,
                                        margin: 0,
                                        border: '1px solid #E2E8F0',
                                        borderRadius: 8,
                                        overflow: 'hidden',
                                        background: '#fff',
                                        cursor: 'pointer',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                                        width: 100,
                                        height: 100,
                                        flexShrink: 0,
                                    }}
                                >
                                    <img
                                        src={src}
                                        alt={img.descricao ?? `Fenologia ${idx + 1}`}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </button>
                            );
                        })}
                    </div>
                    {imagensFenologia.some((img) => img.descricao) && (
                        <div style={{ marginTop: 8, fontSize: 12, color: '#64748B' }}>
                            {imagensFenologia.map((img, i) => (img.descricao ? <div key={i} style={{ marginBottom: 4 }}>{img.descricao}</div> : null))}
                        </div>
                    )}
                </div>
            )}
            {/* Timeline linear de Fenologia */}
            {Array.isArray(fenologia.historico) && (fenologia.historico as Array<{ estagio?: string; data?: string; observacoes?: string }>).length > 0 && (
                <div style={{ padding: '0 24px 24px', borderTop: '1px solid #E2E8F0', marginTop: 8, paddingTop: 16 }}>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Histórico Evolutivo da Safra</div>
                    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                        {(fenologia.historico as Array<{ estagio?: string; data?: string; observacoes?: string }>).slice(0, 10).map((h, i) => (
                            <li key={i} style={{ marginBottom: 4 }}>
                                <span style={{ fontWeight: 700, color: '#166534' }}>{h.estagio}</span> {h.data && ` — ${h.data}`} {h.observacoes && ` (${h.observacoes})`}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
}
