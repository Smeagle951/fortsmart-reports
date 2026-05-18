'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReportPhotoWeb } from '@/types/side-by-side-report';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { photoDisplayCaption } from '@/lib/photoCaption';
import { resolveReportPhotoSrc } from '@/lib/resolveReportPhotoSrc';
import { ENT } from './enterpriseTheme';

type Props = { data: SideBySideReportData };

function GalleryCard({
  url,
  caption,
  delay,
  onOpen,
  sideColor,
  sideLabel,
}: {
  url?: string | null;
  caption: string;
  delay: number;
  onOpen: () => void;
  sideColor: string;
  sideLabel: string;
}) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -3, boxShadow: ENT.shadowHover }}
      className="group relative overflow-hidden rounded-2xl border-2 bg-white shadow-md print:break-inside-avoid"
      style={{ borderColor: `${sideColor}30`, boxShadow: ENT.shadowCard }}
    >
      <button
        type="button"
        onClick={onOpen}
        className="block w-full cursor-zoom-in text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
        aria-label={`Ampliar imagem: ${caption}`}
      >
        <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={caption}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-3 text-center text-xs text-slate-500">
              Sem URL publicada
            </div>
          )}

          {/* Badge de lado */}
          <span
            className="absolute left-2 top-2 rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white shadow-sm"
            style={{ backgroundColor: sideColor }}
          >
            {sideLabel}
          </span>

          {/* Overlay com caption (hover) */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
          <p className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 px-3 pb-3 text-[11px] font-semibold leading-tight text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            {caption}
          </p>

          {/* Ícone zoom */}
          <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-white/90 p-1.5 opacity-0 shadow-md transition group-hover:opacity-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-700">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3M11 8v6M8 11h6" />
            </svg>
          </span>
        </div>
      </button>
      <figcaption className="border-t px-3 py-2 text-[11px] font-semibold leading-snug text-slate-700" style={{ borderColor: `${sideColor}25` }}>
        {caption}
      </figcaption>
    </motion.figure>
  );
}

export default function PhotoGalleryEnterprise({ data }: Props) {
  const a = (data.sideA?.photos ?? []) as ReportPhotoWeb[];
  const b = (data.sideB?.photos ?? []) as ReportPhotoWeb[];
  const [lightbox, setLightbox] = useState<{ url: string; caption: string } | null>(null);

  const close = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, close]);

  if (a.length === 0 && b.length === 0) return null;

  const nameA = data.sideA?.name || 'Manejo A';
  const nameB = data.sideB?.name || 'Manejo B';

  return (
    <section id="fotos-premium" className="scroll-mt-36 print:break-inside-avoid" dir="ltr">
      <div className="mx-auto max-w-[1400px] px-4 pb-10 sm:px-6 sm:pb-12">
        <h3 className="text-base font-bold text-slate-900">Registro fotográfico</h3>
        <p className="mt-1 text-sm text-slate-500">Toque na imagem para ampliar</p>
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <div
              className="mb-3 inline-flex rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white"
              style={{ backgroundColor: ENT.green }}
            >
              {nameA}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {a.slice(0, 6).map((p, i) => {
                const cap = photoDisplayCaption(p);
                const src = resolveReportPhotoSrc(p);
                return (
                  <GalleryCard
                    key={`A-${i}`}
                    url={src}
                    caption={cap}
                    delay={i * 0.05}
                    sideColor={ENT.green}
                    sideLabel="A"
                    onOpen={() => {
                      if (src) setLightbox({ url: src, caption: cap });
                    }}
                  />
                );
              })}
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
              {b.slice(0, 6).map((p, i) => {
                const cap = photoDisplayCaption(p);
                const src = resolveReportPhotoSrc(p);
                return (
                  <GalleryCard
                    key={`B-${i}`}
                    url={src}
                    caption={cap}
                    delay={i * 0.05}
                    sideColor={ENT.blue}
                    sideLabel="B"
                    onOpen={() => {
                      if (src) setLightbox({ url: src, caption: cap });
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {lightbox ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 print:hidden"
            role="dialog"
            aria-modal
            aria-label="Visualização ampliada"
            onClick={close}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="max-h-[90vh] max-w-[min(96vw,1100px)] overflow-hidden rounded-xl border border-white/20 bg-slate-950 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2 text-sm text-white">
                <p className="min-w-0 flex-1 truncate font-medium">{lightbox.caption}</p>
                <button
                  type="button"
                  onClick={close}
                  className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20"
                >
                  Fechar
                </button>
              </div>
              <div className="max-h-[calc(90vh-52px)] overflow-auto p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={lightbox.url} alt={lightbox.caption} className="mx-auto max-h-[calc(90vh-80px)] w-auto max-w-full object-contain" />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
