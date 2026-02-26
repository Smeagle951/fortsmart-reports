'use client';

import { formatDate } from '@/utils/format';
import { getStoragePublicUrl } from '@/lib/supabase';

type ImagemItem = {
  url?: string;
  path?: string;
  descricao?: string;
  data?: string;
  categoria?: string;
};

interface GaleriaImagensProps {
  imagens: ImagemItem[];
  relatorioId?: string;
  variant?: 'grid' | 'print';
}

export default function GaleriaImagens({ imagens, relatorioId, variant = 'grid' }: GaleriaImagensProps) {
  if (!imagens?.length) return null;

  const resolveUrl = (img: ImagemItem) => {
    if (img.url) return img.url;
    if (relatorioId && img.path) return getStoragePublicUrl(relatorioId, img.path);
    return '';
  };

  return (
    <section className="plantio-card">
      <h3 className="plantio-card-title">
        Registros fotográficos
      </h3>
      <div className={`grid gap-4 ${variant === 'print' ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
        {imagens.map((img, i) => {
          const src = resolveUrl(img);
          if (!src) return null;
          return (
            <figure key={i} className="overflow-hidden rounded-lg border border-slate-200">
              <img
                src={src}
                alt={img.descricao || 'Foto'}
                className="h-40 w-full object-cover print:h-32"
              />
              <figcaption className="border-t border-slate-100 bg-slate-50 px-2 py-1.5 text-xs text-slate-700">
                {img.descricao || 'Sem descrição'}
              </figcaption>
              {img.data && (
                <div className="px-2 pb-1 text-xs text-slate-500">
                  {formatDate(img.data)}
                </div>
              )}
            </figure>
          );
        })}
      </div>
    </section>
  );
}
