'use client';

import { motion } from 'framer-motion';
import type { ReportPhotoWeb } from '@/types/side-by-side-report';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { resolveReportPhotoSrc } from '@/lib/resolveReportPhotoSrc';
import PremiumSectionShell from './PremiumSectionShell';

function hotspotMomentLabel(m?: string): string | null {
  const t = m?.trim().toLowerCase();
  if (t === 'antes') return 'Antes da aplicação';
  if (t === 'depois') return 'Depois da aplicação';
  return null;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v != null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function photosFromFieldCollection(data: SideBySideReportData, side: 'A' | 'B'): ReportPhotoWeb[] {
  const fcm = asRecord(data.field_collection_modules);
  const points = Array.isArray(fcm?.points) ? fcm.points : [];
  const out: ReportPhotoWeb[] = [];
  for (const point of points) {
    const sides = asRecord(asRecord(point)?.sides);
    const sideRec = asRecord(sides?.[side]);
    if (!sideRec) continue;
    for (const [sectionKey, sectionValue] of Object.entries(sideRec)) {
      const section = asRecord(sectionValue);
      const occurrences = Array.isArray(section?.occurrences) ? section.occurrences : [];
      for (const occurrence of occurrences) {
        const occ = asRecord(occurrence);
        const images = Array.isArray(occ?.images) ? occ.images : [];
        for (const image of images) {
          const img = asRecord(image);
          const url = typeof img?.url === 'string' && img.url.trim() ? img.url.trim() : null;
          if (!url) continue;
          out.push({
            url,
            caption:
              (typeof img?.caption === 'string' && img.caption.trim()) ||
              (typeof occ?.alvo === 'string' && occ.alvo.trim()) ||
              null,
            category: sectionKey,
          } as ReportPhotoWeb);
        }
      }
    }
  }
  return out;
}

function mergeRenderablePhotos(base: ReportPhotoWeb[], extra: ReportPhotoWeb[]): ReportPhotoWeb[] {
  const seen = new Set<string>();
  const out: ReportPhotoWeb[] = [];
  for (const photo of [...base, ...extra]) {
    const src = resolveReportPhotoSrc(photo as unknown as Record<string, unknown>);
    if (!src) continue;
    const key = `${src}|${photo.category ?? ''}|${photo.caption ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...photo, url: src });
  }
  return out;
}

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
  if (!url) return null;
  return (
    <motion.figure
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/80 shadow-md shadow-emerald-950/5 ring-1 ring-emerald-900/5 print:break-inside-avoid print:shadow-sm"
    >
      <div className="aspect-4/3 w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200/80">
        {url ? (
          <div className="relative h-full w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={caption || `${sideLabel} — foto`} className="h-full w-full object-cover" />
            {p.hotspots?.map((h, hi) => (
              <span
                key={hi}
                className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.25)]"
                style={{
                  left: `${Math.max(0, Math.min(100, h.xPct))}%`,
                  top: `${Math.max(0, Math.min(100, h.yPct))}%`,
                }}
                title={[h.label, h.detail].filter(Boolean).join(' — ') || `Marcador ${hi + 1}`}
              />
            ))}
          </div>
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
  const a = mergeRenderablePhotos((data.sideA?.photos ?? []) as ReportPhotoWeb[], photosFromFieldCollection(data, 'A'));
  const b = mergeRenderablePhotos((data.sideB?.photos ?? []) as ReportPhotoWeb[], photosFromFieldCollection(data, 'B'));
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
              url={resolveReportPhotoSrc(p as unknown as Record<string, unknown>)}
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
              url={resolveReportPhotoSrc(p as unknown as Record<string, unknown>)}
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
