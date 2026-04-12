'use client';

import { motion } from 'framer-motion';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import type { ReportPhotoWeb } from '@/types/side-by-side-report';
import { pickHeroPhoto } from '@/components/lado_a_lado/ladoALadoHelpers';

function ExtraPhotoThumb({ ph, label }: { ph: ReportPhotoWeb; label: string }) {
  if (!ph.url) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm"
    >
      <div className="relative aspect-[4/3] bg-slate-100">
        <img src={ph.url} alt={ph.caption || label} className="h-full w-full object-cover" />
        {ph.hotspots?.map((h, i) => (
          <div
            key={i}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5"
            style={{ left: `${h.xPct}%`, top: `${h.yPct}%` }}
            title={[h.label, h.detail].filter(Boolean).join(' — ') || undefined}
            role="group"
          >
            <span className="h-3 w-3 shrink-0 rounded-full border-2 border-white bg-amber-400 shadow" aria-hidden />
            {h.label?.trim() ? (
              <span className="max-w-[min(140px,40vw)] truncate rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow">
                {h.label.trim()}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      {ph.caption ? <p className="px-2 py-2 text-[11px] text-slate-600 leading-snug line-clamp-2">{ph.caption}</p> : null}
    </motion.div>
  );
}

/** Evidências extras (o comparativo principal já mostra a foto herói de cada lado). Sem gráficos. */
export default function EvaluationSection({ data }: { data: SideBySideReportData }) {
  const sideA = data.sideA;
  const sideB = data.sideB;
  const nameA = sideA?.name || 'Manejo A';
  const nameB = sideB?.name || 'Manejo B';
  const photosA = sideA?.photos ?? [];
  const photosB = sideB?.photos ?? [];
  const heroA = pickHeroPhoto(photosA);
  const heroB = pickHeroPhoto(photosB);

  const restA = photosA.filter((p) => p.url && p.url !== heroA?.url);
  const restB = photosB.filter((p) => p.url && p.url !== heroB?.url);
  const extras = [...restA, ...restB];

  if (extras.length === 0) return null;

  return (
    <section id="avaliacao-premium" className="scroll-mt-28">
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Mais evidências</h2>
      <p className="mt-2 text-sm text-slate-600 mb-6 max-w-2xl">
        Fotos adicionais publicadas no relatório (além do comparativo visual principal).
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {restA.map((ph, i) => (
          <ExtraPhotoThumb key={`a-${i}`} ph={ph} label={`${nameA} · ${i + 1}`} />
        ))}
        {restB.map((ph, i) => (
          <ExtraPhotoThumb key={`b-${i}`} ph={ph} label={`${nameB} · ${i + 1}`} />
        ))}
      </div>
    </section>
  );
}
