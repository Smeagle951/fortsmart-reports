'use client';

import { motion } from 'framer-motion';
import type { ReportPhotoWeb } from '@/types/side-by-side-report';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { shortenPhotoCaptionForGallery } from '@/lib/photoCaption';
import { resolveReportPhotoSrc } from '@/lib/resolveReportPhotoSrc';
import PremiumSectionShell from './PremiumSectionShell';

/** Aceita objeto foto DTO ou string URL pura publicada pelo app. */
function coerceGalleryPhoto(raw: unknown): ReportPhotoWeb | null {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t) return null;
    return { url: t };
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as ReportPhotoWeb;
  return null;
}

function hotspotSummaryLine(hotspots: NonNullable<ReportPhotoWeb['hotspots']>): string {
  const n = hotspots.length;
  if (n === 0) return '';
  let antes = 0;
  let depois = 0;
  for (const h of hotspots) {
    const t = h.applicationMoment?.trim().toLowerCase();
    if (t === 'antes') antes += 1;
    else if (t === 'depois') depois += 1;
  }
  const bits = [`${n} marcador${n === 1 ? '' : 'es'}`];
  if (antes) bits.push(`${antes} antes`);
  if (depois) bits.push(`${depois} depois`);
  return bits.join(' · ');
}

function PhotoCard({
  sideLabel,
  src,
  category,
  p,
}: {
  sideLabel: string;
  src?: string | null;
  category?: string | null;
  p: ReportPhotoWeb;
}) {
  const captionShort = shortenPhotoCaptionForGallery(p);
  return (
    <motion.figure
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/80 shadow-md shadow-emerald-950/5 ring-1 ring-emerald-900/5 print:break-inside-avoid print:shadow-sm"
    >
      <div className="aspect-4/3 w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200/80">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={captionShort || `${sideLabel} — foto`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-500 px-3 text-center">
            Imagem indisponível. Se a foto já está na web, reenvie o relatório pelo app (URLs em
            <code className="mx-0.5 rounded bg-slate-200/80 px-1">imageBase64Jpg</code> passam a ser
            reconhecidas).
          </div>
        )}
      </div>
      <figcaption className="px-3 py-2 text-xs text-slate-600">
        <div className="font-semibold text-slate-800">
          {sideLabel}
          {category ? <span className="text-slate-500"> · {category}</span> : null}
        </div>
        {captionShort ? <p className="mt-1 text-slate-600">{captionShort}</p> : null}
        {p.hotspots != null && p.hotspots.length > 0 ? (
          <p className="mt-2 border-t border-emerald-100/80 pt-2 text-[11px] font-medium tabular-nums text-emerald-900/90">
            {hotspotSummaryLine(p.hotspots)}
          </p>
        ) : null}
      </figcaption>
    </motion.figure>
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
  const a = (data.sideA?.photos ?? []).map(coerceGalleryPhoto).filter((x): x is ReportPhotoWeb => x != null);
  const b = (data.sideB?.photos ?? []).map(coerceGalleryPhoto).filter((x): x is ReportPhotoWeb => x != null);
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
              src={resolveReportPhotoSrc(p)}
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
              src={resolveReportPhotoSrc(p)}
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
