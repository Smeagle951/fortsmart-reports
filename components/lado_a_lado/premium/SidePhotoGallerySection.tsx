'use client';

import type { ReportPhotoWeb } from '@/types/side-by-side-report';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import PremiumSectionShell from './PremiumSectionShell';

function PhotoCard({
  sideLabel,
  url,
  caption,
  category,
}: {
  sideLabel: string;
  url?: string | null;
  caption?: string | null;
  category?: string | null;
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
      </figcaption>
    </figure>
  );
}

export default function SidePhotoGallerySection({ data }: { data: SideBySideReportData }) {
  const a = (data.sideA?.photos ?? []) as ReportPhotoWeb[];
  const b = (data.sideB?.photos ?? []) as ReportPhotoWeb[];
  if (a.length === 0 && b.length === 0) return null;

  const nameA = data.sideA?.name || 'Manejo A';
  const nameB = data.sideB?.name || 'Manejo B';

  return (
    <PremiumSectionShell
      id="fotos-premium"
      eyebrow="Evidências"
      title="Galeria (A/B)"
      subtitle="Fotos publicadas no JSON. Categorias vêm do app quando existirem."
    >
      <div className="grid gap-4 lg:grid-cols-2 print:grid-cols-2">
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{nameA}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {a.map((p, i) => (
              <PhotoCard
                // eslint-disable-next-line react/no-array-index-key
                key={`A-${i}`}
                sideLabel="A"
                url={p.url}
                caption={p.caption}
                category={p.category}
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
                sideLabel="B"
                url={p.url}
                caption={p.caption}
                category={p.category}
              />
            ))}
          </div>
        </div>
      </div>
    </PremiumSectionShell>
  );
}
