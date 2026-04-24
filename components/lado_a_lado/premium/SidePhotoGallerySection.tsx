'use client';

import type { ReportPhotoWeb } from '@/types/side-by-side-report';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import PremiumSectionShell from './PremiumSectionShell';

function PhotoCard({
  sideLabel,
  url,
  caption,
  category,
  p,
}: {
  sideLabel: string;
  url?: string | null;
  caption?: string | null;
  category?: string | null;
  p: ReportPhotoWeb;
}) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:break-inside-avoid">
      <div className="aspect-4/3 w-full overflow-hidden bg-slate-100">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={caption || `${sideLabel} — foto`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-500 px-3 text-center">
            Imagem indisponível (URL não publicada)
          </div>
        )}
      </div>
      <figcaption className="px-3 py-2 text-xs text-slate-600">
        <div className="font-semibold text-slate-800">
          {sideLabel}
          {category ? <span className="text-slate-500"> · {category}</span> : null}
        </div>
        {caption ? <p className="mt-1 text-slate-600">{caption}</p> : null}
        {p.hotspots != null && p.hotspots.length > 0 ? (
          <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2 text-[11px] text-slate-700">
            <li className="font-semibold text-slate-500">Marcadores na imagem</li>
            {p.hotspots.map((h, hi) => (
              <li key={hi} className="leading-snug">
                <span className="text-slate-500">
                  {Math.round(h.xPct)}%, {Math.round(h.yPct)}%
                </span>
                {h.label ? <span className="text-slate-800"> — {h.label}</span> : null}
                {h.detail ? <span className="block text-slate-600">{h.detail}</span> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </figcaption>
    </figure>
  );
}

export default function SidePhotoGallerySection({
  data,
  embedded,
}: {
  data: SideBySideReportData;
  /** Sem capa duplicada — usado pelo relatório agronómico único. */
  embedded?: boolean;
}) {
  const a = (data.sideA?.photos ?? []) as ReportPhotoWeb[];
  const b = (data.sideB?.photos ?? []) as ReportPhotoWeb[];
  if (a.length === 0 && b.length === 0) return null;

  const nameA = data.sideA?.name?.trim() || data.sideA?.label?.trim() || 'Tratamento 1 (nome no app)';
  const nameB = data.sideB?.name?.trim() || data.sideB?.label?.trim() || 'Tratamento 2 (nome no app)';

  const gallery = (
    <div className="grid gap-4 lg:grid-cols-2 print:grid-cols-2">
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{nameA}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {a.map((p, i) => (
            <PhotoCard
              // eslint-disable-next-line react/no-array-index-key
              key={`A-${i}`}
              sideLabel={nameA}
              url={p.url}
              caption={p.caption}
              category={p.category}
              p={p}
            />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{nameB}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {b.map((p, i) => (
            <PhotoCard
              // eslint-disable-next-line react/no-array-index-key
              key={`B-${i}`}
              sideLabel={nameB}
              url={p.url}
              caption={p.caption}
              category={p.category}
              p={p}
            />
          ))}
        </div>
      </div>
    </div>
  );

  if (embedded) return gallery;

  return (
    <PremiumSectionShell
      id="fotos-premium"
      eyebrow="Evidências"
      title="Galeria (A/B)"
      subtitle="Fotos publicadas no JSON. Categorias vêm do app quando existirem."
    >
      {gallery}
    </PremiumSectionShell>
  );
}
