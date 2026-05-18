import React from 'react';
import { Camera, PenLine } from 'lucide-react';
import { assinaturaImagemUrl } from '../assinaturaImagemUrl';
import deck from '../visita-tecnica-deck.module.css';

interface FotografiasEAutoriaVTProps {
  imagens: Array<{
    url?: string;
    descricao?: string;
    categoria?: string;
    data?: string;
    talhaoNome?: string;
    latitude?: number;
    longitude?: number;
  }>;
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

function photoAnalysis(cat: string, descricao?: string): string | null {
  const desc = String(descricao ?? '').toLowerCase();
  if (cat === 'praga' || desc.includes('lagarta') || desc.includes('spodoptera')) {
    return 'Evidencia de alimentacao ativa — correlacionar com incidencia e estagio larval.';
  }
  if (cat === 'doença' || cat === 'doenca' || desc.includes('mancha') || desc.includes('fung')) {
    return 'Evidencia fitossanitaria registrada — validar severidade e evolucao na proxima visita.';
  }
  if (cat === 'daninha') {
    return 'Evidencia de competicao no talhao — cruzar com janela de manejo e area afetada.';
  }
  if (cat === 'fenologia') {
    return 'Registro fenologico util para confirmar janela critica e potencial produtivo.';
  }
  return null;
}

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
                const analysis = photoAnalysis(cat, img.descricao);
                return (
                  <figure key={i} className={deck.photoFigure}>
                    <button type="button" onClick={() => setLightboxIndex(i)} className={deck.photoButton}>
                      <img src={src} alt={img.descricao ?? `Foto ${i + 1}`} className={deck.photoImg} />
                      <span className={deck.photoCatBar}>{catLabel}</span>
                    </button>
                    {img.descricao && <figcaption className={deck.photoCaption}>{img.descricao}</figcaption>}
                    {analysis ? <div className={deck.photoAnalysis}>{analysis}</div> : null}
                    {(img.talhaoNome || img.latitude != null || img.longitude != null) && (
                      <div className={deck.photoDate} style={{ fontSize: 11, opacity: 0.85 }}>
                        {[img.talhaoNome ? `Talhão: ${img.talhaoNome}` : null,
                          img.latitude != null && img.longitude != null
                            ? `${Number(img.latitude).toFixed(5)}, ${Number(img.longitude).toFixed(5)}`
                            : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    )}
                    {img.data && <div className={deck.photoDate}>Data: {img.data}</div>}
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
