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
        {p.hotspots != null && p.hotspots.some((h) => h.label || h.detail || hotspotMomentLabel(h.applicationMoment)) ? (
          <ul className="mt-2 space-y-1.5 border-t border-emerald-100/80 bg-emerald-50/30 pt-2 text-[11px] text-slate-700">
            <li className="font-bold uppercase tracking-wide text-emerald-900/80">Anotações na imagem</li>
            {p.hotspots.map((h, hi) => {
              const phase = hotspotMomentLabel(h.applicationMoment);
              const hasText = h.label || h.detail || phase;
              if (!hasText) return null;
              return (
                <li key={hi} className="leading-snug">
                  {h.label ? <span className="font-semibold text-slate-800">{h.label}</span> : <span className="font-semibold text-slate-800">Marcador {hi + 1}</span>}
                  {phase ? (
                    <span className="ml-1 inline-block rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-900">
                      {phase}
                    </span>
                  ) : null}
                  {h.detail ? <span className="block text-slate-600">{h.detail}</span> : null}
                </li>
              );
            })}
          </ul>
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
