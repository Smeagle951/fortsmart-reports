import React, { useState, useEffect } from 'react';
import { formatDate } from '@/utils/format';
import { getStoragePublicUrl } from '@/lib/supabase';

type ImagemItem = {
  url?: string;
  path?: string;
  descricao?: string;
  data?: string;
};

interface GaleriaProps {
  imagens: ImagemItem[];
  relatorioId?: string;
  bucketPathPrefix?: string;
}

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

  const [lightbox, setLightbox] = useState<{ src: string; descricao?: string; data?: string } | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightbox(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <section className="section">
      <h2 className="section-title">Registros fotográficos</h2>
      <div className="grid photos-grid">
        {imagens.map((img, i) => {
          const src = resolveUrl(img);
          if (!src) return null;
          return (
            <div key={i} className="card photo-card" role="button" data-ponto-index={(img as any).index ?? (img as any).pointIndex ?? (img as any).pontoIndex ?? i + 1} onClick={() => setLightbox({ src, descricao: img.descricao, data: img.data })} onKeyDown={() => {}} tabIndex={0}>
              <img src={src} alt={img.descricao || 'Foto'} className="photo-img" />
              <div className="photo-caption">{img.descricao}</div>
              {img.data && <div className="photo-meta">{formatDate(img.data)}</div>}
            </div>
          );
        })}
      </div>

      {lightbox && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)} role="dialog" aria-modal="true">
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.src} alt={lightbox.descricao || 'Foto ampliada'} className="lightbox-img" />
            <div className="lightbox-caption">
              <div className="photo-caption">{lightbox.descricao}</div>
              {lightbox.data && <div className="photo-meta">{formatDate(lightbox.data)}</div>}
            </div>
            <button className="btn btn-secondary lightbox-close" onClick={() => setLightbox(null)}>Fechar</button>
          </div>
        </div>
      )}
    </section>
  );
}
