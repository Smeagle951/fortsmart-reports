'use client';

import React, { useState } from 'react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';

export type ReportPhoto = NonNullable<NonNullable<SideBySideReportData['sideA']>['photos']>[0];

type Props = {
  photo: ReportPhoto | null;
  alt: string;
  accentClass: string;
};

export default function PhotoWithHotspots({ photo, alt, accentClass }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  const url = photo?.url;
  const hotspots = photo?.hotspots;

  if (!url) {
    return (
      <div className="aspect-[4/3] rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-sm">
        Sem imagem
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-inner group">
      <img src={url} alt={alt} className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
      {hotspots && hotspots.length > 0
        ? hotspots.map((h, i) => (
            <button
              key={i}
              type="button"
              className={`absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-white shadow-md ${accentClass} animate-pulse focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500`}
              style={{ left: `${h.xPct}%`, top: `${h.yPct}%` }}
              aria-label={h.label || `Ponto ${i + 1}`}
              onClick={() => setOpen(open === i ? null : i)}
            />
          ))
        : null}
      {open != null && hotspots?.[open] && (
        <div className="absolute bottom-0 left-0 right-0 bg-slate-900/85 text-white text-xs p-3 backdrop-blur-sm">
          <p className="font-semibold">{hotspots[open].label || `Ponto ${open + 1}`}</p>
          {hotspots[open].detail && <p className="mt-1 text-white/90">{hotspots[open].detail}</p>}
        </div>
      )}
    </div>
  );
}
