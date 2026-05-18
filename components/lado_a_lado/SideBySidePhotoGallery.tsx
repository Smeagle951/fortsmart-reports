'use client';

import { useState } from 'react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { collectPhotos } from '@/lib/lado-a-lado-official/selectors';
import { FS } from '@/lib/lado-a-lado-official/theme';

function photoSrc(p: { url?: string; base64?: string }) {
  if (p.url?.trim()) return p.url;
  if (p.base64?.trim()) {
    const b = p.base64.trim();
    return b.startsWith('data:') ? b : `data:image/jpeg;base64,${b}`;
  }
  return null;
}

export default function SideBySidePhotoGallery({ data }: { data: SideBySideReportData }) {
  const photos = collectPhotos(data);
  const [idx, setIdx] = useState(0);
  if (photos.length === 0) return null;

  const current = photos[idx % photos.length];
  const src = photoSrc(current);

  return (
    <section className="fs-section">
      <h2 className="fs-official-section-title">Fotos do Ensaio</h2>
      <p className="fs-official-section-sub">Registros fotográficos por lado e estádio.</p>
      <div className="fs-official-card p-4">
        <div className="relative aspect-[16/9] max-h-[280px] overflow-hidden rounded-2xl bg-[#F1F5F9]">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={current.caption || 'Foto do ensaio'} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[#9CA3AF]">
              Imagem indisponível
            </div>
          )}
          {current.side ? (
            <span
              className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow"
              style={{ background: current.side === 'A' ? FS.sideA : FS.sideB }}
            >
              {current.side}
            </span>
          ) : null}
        </div>
        <p className="mt-3 text-sm text-[#374151]">{current.caption || current.category || '—'}</p>
        {photos.length > 1 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {photos.map((p, i) => {
              const s = photoSrc(p);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIdx(i)}
                  className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${
                    i === idx ? 'border-[#2E7D32]' : 'border-transparent'
                  }`}
                >
                  {s ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center bg-[#E5E7EB] text-[10px]">
                      {p.side || '?'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
