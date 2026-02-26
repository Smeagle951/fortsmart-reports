'use client';

import React, { useState, useEffect } from 'react';
import { formatDate } from '@/utils/format';
import { getStoragePublicUrl } from '@/lib/supabase';
import ModalImagem from './ModalImagem';

type ImagemItem = {
  url?: string;
  path?: string;
  descricao?: string;
  categoria?: string;
  data?: string;
};

interface GaleriaProps {
  imagens: ImagemItem[];
  relatorioId?: string;
  bucketPathPrefix?: string;
}

const categoriaLabel: Record<string, string> = {
  fenologia: 'Fenologia',
  praga: 'Praga',
  doença: 'Doença',
  daninha: 'Planta daninha',
  operacao: 'Operação',
  desvio: 'Desvio',
  evidencia: 'Evidência',
};

export default function Galeria({ imagens, relatorioId, bucketPathPrefix = '' }: GaleriaProps) {
  if (!imagens?.length) return null;

  const resolveUrl = (img: ImagemItem) => {
    if (img.url) return img.url;
    if (relatorioId && img.path) {
      return getStoragePublicUrl(relatorioId, img.path);
    }
    if (bucketPathPrefix && img.path) {
      return getStoragePublicUrl(bucketPathPrefix, img.path);
    }
    return '';
  };

  const [lightbox, setLightbox] = useState<{ src: string; descricao?: string; data?: string; categoria?: string } | null>(null);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightbox(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <section className="section galeria-section">
      <h2 className="section-title">Registros fotográficos</h2>
      <div className="galeria-grid">
        {imagens.map((img, i) => {
          const src = resolveUrl(img);
          if (!src) return null;
          const cat = (img.categoria || '').toLowerCase();
          const catLabel = categoriaLabel[cat] || cat || 'Registro';
          return (
            <article key={i} className="galeria-card">
              <div
                className="galeria-card__img-wrap"
                role="button"
                tabIndex={0}
                onClick={() => {
                  setGalleryIndex(i);
                  setLightbox({ src, descricao: img.descricao, data: img.data, categoria: img.categoria });
                }}
                onKeyDown={(e) => e.key === 'Enter' && (setGalleryIndex(i), setLightbox({ src, descricao: img.descricao, data: img.data, categoria: img.categoria }))}
              >
                <img src={src} alt={img.descricao || 'Foto'} className="galeria-card__img" loading="lazy" />
                <span className="galeria-card__badge">{catLabel}</span>
              </div>
              <div className="galeria-card__body">
                <p className="galeria-card__caption">{img.descricao || '—'}</p>
                {img.data && <time className="galeria-card__date">{formatDate(img.data)}</time>}
              </div>
            </article>
          );
        })}
      </div>

      {lightbox && (
        <ModalImagem
          src={lightbox.src}
          descricao={lightbox.descricao}
          data={lightbox.data}
          onClose={() => {
            setLightbox(null);
            setGalleryIndex(null);
          }}
          onPrev={() => {
            const prev = (galleryIndex ?? 0) > 0 ? (galleryIndex ?? 0) - 1 : imagens.length - 1;
            const img = imagens[prev];
            setGalleryIndex(prev);
            setLightbox({ src: resolveUrl(img), descricao: img.descricao, data: img.data, categoria: img.categoria });
          }}
          onNext={() => {
            const next = (galleryIndex ?? 0) < imagens.length - 1 ? (galleryIndex ?? 0) + 1 : 0;
            const img = imagens[next];
            setGalleryIndex(next);
            setLightbox({ src: resolveUrl(img), descricao: img.descricao, data: img.data, categoria: img.categoria });
          }}
        />
      )}
    </section>
  );
}
