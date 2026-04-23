'use client';

import { motion } from 'framer-motion';
import type { ReportPhotoWeb } from '@/types/side-by-side-report';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { ENT } from './enterpriseTheme';

type Props = { data: SideBySideReportData };

function GalleryCard({
  url,
  caption,
  delay,
}: {
  url?: string | null;
  caption?: string | null;
  delay: number;
}) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.02, boxShadow: ENT.shadowHover }}
      className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md print:break-inside-avoid"
      style={{ boxShadow: ENT.shadowCard }}
    >
      <div className="aspect-square w-full overflow-hidden bg-slate-100">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={caption || 'Evidência de campo'} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-3 text-center text-xs text-slate-500">Sem URL publicada</div>
        )}
      </div>
      {caption ? (
        <figcaption className="border-t border-slate-100 px-3 py-2 text-xs font-medium text-slate-600">{caption}</figcaption>
      ) : null}
    </motion.figure>
  );
}

export default function PhotoGalleryEnterprise({ data }: Props) {
  const a = (data.sideA?.photos ?? []) as ReportPhotoWeb[];
  const b = (data.sideB?.photos ?? []) as ReportPhotoWeb[];
  if (a.length === 0 && b.length === 0) return null;

  const nameA = data.sideA?.name || 'Manejo A';
  const nameB = data.sideB?.name || 'Manejo B';

  return (
    <section id="fotos-premium" className="scroll-mt-36 print:break-inside-avoid">
      <div className="mx-auto max-w-[1400px] px-4 pb-10 sm:px-6 sm:pb-12">
        <h3 className="text-base font-bold text-slate-900">Registro fotográfico</h3>
        <p className="mt-1 text-sm text-slate-500">Evidências publicadas por manejo</p>
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <div
              className="mb-3 inline-flex rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white"
              style={{ backgroundColor: ENT.green }}
            >
              {nameA}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {a.slice(0, 6).map((p, i) => (
                <GalleryCard key={`A-${i}`} url={p.url} caption={p.caption || p.category || undefined} delay={i * 0.05} />
              ))}
            </div>
          </div>
          <div>
            <div
              className="mb-3 inline-flex rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white"
              style={{ backgroundColor: ENT.blue }}
            >
              {nameB}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {b.slice(0, 6).map((p, i) => (
                <GalleryCard key={`B-${i}`} url={p.url} caption={p.caption || p.category || undefined} delay={i * 0.05} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
