'use client';

import { useState } from 'react';

export interface ImagemItem {
  id: string;
  url: string;
  dae?: number;
  data?: string;
  legenda?: string;
}

interface ImageGallerySaaSProps {
  imagens: ImagemItem[];
  marcaDagua?: string;
}

export default function ImageGallerySaaS({ imagens, marcaDagua = 'FortSmart' }: ImageGallerySaaSProps) {
  const [modalOpen, setModalOpen] = useState<ImagemItem | null>(null);

  if (!imagens?.length) return null;

  return (
    <section className="saas-section">
      <div className="mx-auto max-w-7xl">
        <h2 className="saas-section-title mb-4">Galeria Técnica com Preview</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {imagens.map((img) => (
            <div
              key={img.id}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300"
            >
              {/* Miniatura */}
              <div className="relative aspect-video overflow-hidden bg-slate-100">
                <img
                  src={img.url}
                  alt={img.legenda || 'Imagem'}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {marcaDagua && (
                  <span className="absolute bottom-1 right-1 text-[10px] font-medium text-white/90 drop-shadow-md" style={{ textShadow: '0 0 2px rgba(0,0,0,0.8)' }}>
                    {marcaDagua}
                  </span>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {img.dae != null && <span>DAE {img.dae}</span>}
                  {img.data && <span>{img.data}</span>}
                </div>
                {img.legenda && (
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600" title={img.legenda}>{img.legenda}</p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(img)}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                    title="Ampliar"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                    Zoom
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal com zoom, download e marca d'água automática */}
        {modalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            style={{ animation: 'galeriaModalIn 0.2s ease both' }}
            onClick={() => setModalOpen(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Visualização em tamanho grande"
          >
            <div
              className="relative max-h-[90vh] max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative inline-block rounded-xl bg-white p-2 shadow-2xl">
                <div className="relative">
                  <img
                    src={modalOpen.url}
                    alt={modalOpen.legenda || 'Imagem'}
                    className="max-h-[75vh] rounded-lg object-contain"
                  />
                  {/* Marca d'água automática no modal */}
                  {marcaDagua && (
                    <div
                      className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded px-3 py-1 text-sm font-medium text-white/90"
                      style={{ background: 'rgba(0,0,0,0.4)', textShadow: '0 0 4px rgba(0,0,0,0.6)' }}
                    >
                      {marcaDagua}
                    </div>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-sm text-slate-600">
                    {modalOpen.dae != null && `DAE ${modalOpen.dae}`}
                    {modalOpen.data && ` • ${modalOpen.data}`}
                    {modalOpen.legenda && ` • ${modalOpen.legenda}`}
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href={modalOpen.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="saas-btn saas-btn-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </a>
                    <button
                      type="button"
                      onClick={() => setModalOpen(null)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100"
                      aria-label="Fechar"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
