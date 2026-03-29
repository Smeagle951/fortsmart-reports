import React from 'react';

interface FotografiasEAutoriaVTProps {
    imagens: Array<{ url?: string; descricao?: string; categoria?: string; data?: string }>;
    assinatura?: Record<string, unknown>;
    conclusao?: string;
    setLightboxIndex: (index: number | null) => void;
}

const categoriaLabel: Record<string, string> = {
    fenologia: 'Fenologia',
    praga: 'Praga',
    doença: 'Doença',
    doenca: 'Doença',
    daninha: 'Planta daninha',
    operacao: 'Operação',
    desvio: 'Desvio',
    evidencia: 'Evidência',
};

export default function FotografiasEAutoriaVT({ imagens, assinatura, conclusao, setLightboxIndex }: FotografiasEAutoriaVTProps) {
    return (
        <>
            {/* Galeria de Imagens */}
            {imagens.length > 0 && (
                <section className="section-block relatorio-editorial">
                    <div className="section-block__title">Galeria de Imagens</div>
                    <div className="section-block__body" style={{ padding: 24 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                            {imagens.map((img, i) => {
                                const src = img.url;
                                if (!src) return null;
                                const cat = (img.categoria ?? '').toLowerCase();
                                const catLabel = categoriaLabel[cat] || cat || 'Registro';
                                return (
                                    <figure key={i} style={{ margin: 0 }}>
                                        <button
                                            type="button"
                                            onClick={() => setLightboxIndex(i)}
                                            style={{
                                                display: 'block',
                                                width: '100%',
                                                padding: 0,
                                                margin: 0,
                                                border: '1px solid #E2E8F0',
                                                borderRadius: 10,
                                                overflow: 'hidden',
                                                background: '#fff',
                                                cursor: 'pointer',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                                            }}
                                        >
                                            <img
                                                src={src}
                                                alt={img.descricao ?? `Foto ${i + 1}`}
                                                style={{ width: '100%', height: 160, objectFit: 'cover' }}
                                            />
                                            <span style={{
                                                display: 'block',
                                                padding: '8px 12px',
                                                fontSize: 10,
                                                fontWeight: 700,
                                                color: '#166534',
                                                background: '#F0FDF4',
                                                textTransform: 'uppercase',
                                            }}>
                                                {catLabel}
                                            </span>
                                        </button>
                                        {img.descricao && (
                                            <figcaption style={{ fontSize: 12, color: '#64748B', marginTop: 8, padding: '0 4px' }}>
                                                {img.descricao}
                                            </figcaption>
                                        )}
                                        {(cat === 'praga' || cat === 'doença' || cat === 'doenca' || cat === 'daninha') && (
                                            <div style={{ fontSize: 11, color: '#166534', marginTop: 6, padding: '0 4px', fontWeight: 600, lineHeight: 1.35 }}>
                                                Contexto: registro fitossanitário — correlacionar com incidência, severidade e plano de ação desta visita.
                                            </div>
                                        )}
                                        {img.data && (
                                            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{img.data}</div>
                                        )}
                                    </figure>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Conclusão Técnica */}
            {conclusao != null && String(conclusao).trim() && (
                <section className="section-block relatorio-editorial">
                    <div className="section-block__title">Conclusão Técnica</div>
                    <div className="section-block__body" style={{ padding: 24, fontSize: 15, color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {String(conclusao)}
                    </div>
                </section>
            )}

            {/* Assinatura técnica */}
            {assinatura && (assinatura.nome != null || assinatura.crea != null) && (
                <section className="section-block relatorio-editorial">
                    <div className="section-block__body" style={{ padding: 24, textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Assinatura técnica digital</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#334155' }}>{String(assinatura.nome ?? '—')}</div>
                        {assinatura.crea != null && <div style={{ fontSize: 13, color: '#64748B' }}>CREA {String(assinatura.crea)}</div>}
                        {assinatura.dataAssinatura != null && <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>Data: {String(assinatura.dataAssinatura)}</div>}
                        {assinatura.cidade != null && <div style={{ fontSize: 12, color: '#94A3B8' }}>{String(assinatura.cidade)}</div>}
                    </div>
                </section>
            )}
        </>
    );
}

