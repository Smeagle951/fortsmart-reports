import React from 'react';
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

  return (
    <section className="section">
      <h2 className="section-title">Registros fotográficos</h2>
      <div className="grid photos-grid">
        {imagens.map((img, i) => {
          const src = resolveUrl(img);
          if (!src) return null;
          return (
            <div key={i} className="card photo-card">
              <img src={src} alt={img.descricao || 'Foto'} className="photo-img" />
              <div className="photo-caption">{img.descricao}</div>
              {img.data && <div className="photo-meta">{formatDate(img.data)}</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
