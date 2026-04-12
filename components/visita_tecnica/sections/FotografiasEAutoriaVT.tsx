import React from 'react';
import { Camera, PenLine } from 'lucide-react';
import { assinaturaImagemUrl } from '../assinaturaImagemUrl';
import deck from '../visita-tecnica-deck.module.css';

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
  const assinaturaRecord = assinatura && typeof assinatura === 'object' ? (assinatura as Record<string, unknown>) : null;
  const imgAssinatura = assinaturaRecord ? assinaturaImagemUrl(assinaturaRecord) : undefined;
  const mostrarAssinatura =
    assinaturaRecord != null &&
    (assinaturaRecord.nome != null ||
      assinaturaRecord.crea != null ||
      (typeof imgAssinatura === 'string' && imgAssinatura.length > 0));

  return (
    <>
      {imagens.length > 0 && (
        <section className={`${deck.reportCard} ${deck.noBreakInside} pdf-keep-together`}>
          <div className={deck.reportCardHead}>
            <span className={deck.reportCardIcon} aria-hidden>
              <Camera size={18} strokeWidth={2.25} />
            </span>
            <div style={{ minWidth: 0 }}>
              <span className={deck.reportCardKicker}>Registro visual</span>
              <h2 className={deck.reportCardTitle}>Imagens de campo</h2>
            </div>
          </div>
          <div className={deck.reportCardBody}>
            <div className={deck.photoGrid}>
              {imagens.map((img, i) => {
                const src = img.url;
                if (!src) return null;
                const cat = (img.categoria ?? '').toLowerCase();
                const catLabel = categoriaLabel[cat] || cat || 'Registro';
                return (
                  <figure key={i} className={deck.photoFigure}>
                    <button type="button" onClick={() => setLightboxIndex(i)} className={deck.photoButton}>
                      <img src={src} alt={img.descricao ?? `Foto ${i + 1}`} className={deck.photoImg} />
                      <span className={deck.photoCatBar}>{catLabel}</span>
                    </button>
                    {img.descricao && <figcaption className={deck.photoCaption}>{img.descricao}</figcaption>}
                    {(cat === 'praga' || cat === 'doença' || cat === 'doenca' || cat === 'daninha') && (
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--vt-accent)',
                          marginTop: 6,
                          padding: '0 0.2rem',
                          fontWeight: 700,
                          lineHeight: 1.4,
                        }}
                      >
                        Contexto: registro fitossanitário — correlacionar com incidência, severidade e plano de ação desta visita.
                      </div>
                    )}
                    {img.data && <div className={deck.photoDate}>{img.data}</div>}
                  </figure>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {conclusao != null && String(conclusao).trim() && (
        <div className={deck.conclusaoBox}>
          <div className={deck.conclusaoTitle}>Recomendação técnica / diagnóstico final</div>
          <p className={deck.conclusaoText} style={{ whiteSpace: 'pre-wrap' }}>
            {String(conclusao)}
          </p>
        </div>
      )}

      {mostrarAssinatura && assinaturaRecord && (
        <section className={`${deck.reportCard} ${deck.noBreakInside} pdf-keep-together`}>
          <div className={deck.reportCardHead}>
            <span className={deck.reportCardIcon} aria-hidden>
              <PenLine size={18} strokeWidth={2.25} />
            </span>
            <div style={{ minWidth: 0 }}>
              <span className={deck.reportCardKicker}>Validação</span>
              <h2 className={deck.reportCardTitle}>Assinatura técnica</h2>
            </div>
          </div>
          <div className={deck.reportCardBody}>
            {imgAssinatura ? (
              <div className={deck.signatureImageWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgAssinatura} alt="Assinatura do responsável técnico" className={deck.signatureImage} />
              </div>
            ) : null}
            <div className={deck.signatureBlock}>
              <div className={deck.signatureKicker}>Registro de responsabilidade técnica</div>
              <div className={deck.signatureName}>{String(assinaturaRecord.nome ?? '—')}</div>
              {assinaturaRecord.crea != null && <div className={deck.signatureMeta}>CREA {String(assinaturaRecord.crea)}</div>}
              {assinaturaRecord.dataAssinatura != null && (
                <div className={deck.signatureMeta} style={{ marginTop: 6 }}>
                  Data · {String(assinaturaRecord.dataAssinatura)}
                </div>
              )}
              {assinaturaRecord.cidade != null && <div className={deck.signatureMeta}>{String(assinaturaRecord.cidade)}</div>}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
