'use client';

import React, { useState } from 'react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';

type Props = {
  data: SideBySideReportData;
  sideAName: string;
  sideBName: string;
};

export default function PremiumEvidencias({ data, sideAName, sideBName }: Props) {
  const photosA = data.sideA?.photos || [];
  const photosB = data.sideB?.photos || [];
  const [slider, setSlider] = useState(50);

  const pick = (list: typeof photosA, cat: string) => {
    const c = list.find((p) => (p?.category || '').toLowerCase() === cat && p?.url);
    return c || list.find((p) => p?.url);
  };

  const a = pick(photosA, 'raiz') || pick(photosA, 'estande') || photosA[0];
  const b = pick(photosB, 'raiz') || pick(photosB, 'estande') || photosB[0];

  const hasAny = Boolean(a?.url || b?.url);

  const legend =
    a?.caption && b?.caption
      ? `${sideAName}: ${a.caption} · ${sideBName}: ${b.caption}`
      : a?.caption || b?.caption || 'Compare as evidências registradas em campo.';

  return (
    <section id="premium-fotos" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm overflow-hidden">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Evidências em destaque</h2>
      <p className="text-xs text-slate-500 mb-4">Comparativo lado a lado; no desktop use o controle para simular antes/depois.</p>

      {!hasAny ? (
        <p className="text-sm text-slate-500 py-6">Sem fotos no JSON para este relatório. A galeria completa por categoria segue abaixo quando houver.</p>
      ) : null}

      <div className={`hidden md:block relative rounded-xl overflow-hidden border border-slate-200 aspect-[16/9] max-h-[420px] bg-slate-100 ${!hasAny ? 'hidden' : ''}`}>
        {b?.url && <img src={b.url} alt={sideBName} className="absolute inset-0 w-full h-full object-cover" />}
        {a?.url && (
          <div
            className="absolute top-0 left-0 bottom-0 overflow-hidden border-r-2 border-white shadow-[4px_0_12px_rgba(0,0,0,0.15)]"
            style={{ width: `${slider}%` }}
          >
            <img
              src={a.url}
              alt={sideAName}
              className="absolute top-0 left-0 h-full max-w-none object-cover"
              style={{ width: `${10000 / Math.max(slider, 5)}%` }}
            />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 flex justify-between text-xs text-white">
          <span>{sideAName}</span>
          <span>{sideBName}</span>
        </div>
        <input
          type="range"
          min={5}
          max={95}
          value={slider}
          onChange={(e) => setSlider(Number(e.target.value))}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 w-2/3 max-w-md h-2 accent-sky-600 cursor-ew-resize opacity-90"
          aria-label="Comparação antes e depois"
        />
      </div>

      <div className={`grid grid-cols-1 md:hidden gap-4 ${!hasAny ? 'hidden' : ''}`}>
        <figure className="rounded-xl overflow-hidden border border-slate-200">
          {a?.url ? (
            <img src={a.url} alt={sideAName} className="w-full aspect-[4/3] object-cover" />
          ) : (
            <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center text-slate-400 text-sm">Sem foto A</div>
          )}
          <figcaption className="p-2 text-xs text-slate-600 font-medium">{sideAName}</figcaption>
        </figure>
        <figure className="rounded-xl overflow-hidden border border-slate-200">
          {b?.url ? (
            <img src={b.url} alt={sideBName} className="w-full aspect-[4/3] object-cover" />
          ) : (
            <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center text-slate-400 text-sm">Sem foto B</div>
          )}
          <figcaption className="p-2 text-xs text-slate-600 font-medium">{sideBName}</figcaption>
        </figure>
      </div>

      {hasAny ? (
        <p className="text-sm text-slate-600 mt-4 leading-relaxed">
          <span className="font-semibold text-slate-800">Legenda: </span>
          {legend}
        </p>
      ) : null}
    </section>
  );
}
