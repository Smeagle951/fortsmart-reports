'use client';

import React from 'react';

type Tone = 'light' | 'dark';

/**
 * Invólucro editorial comum às secções do relatório premium (dossiê / apresentação).
 */
export default function PremiumSectionShell({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  tone = 'light',
  className = '',
  contentClassName = '',
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-28 isolate ${className}`}>
      <div
        className="overflow-hidden rounded-[1.25rem] sm:rounded-3xl border border-slate-200/70 bg-gradient-to-b from-white via-slate-50/30 to-slate-100/20 shadow-[0_1px_0_0_rgba(255,255,255,0.88)_inset,0_14px_44px_-14px_rgba(15,23,42,0.1)] print:shadow-none print:rounded-lg print:border-slate-300"
      >
        {tone === 'dark' ? (
          <div className="relative overflow-hidden border-b border-slate-700/40 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-5 sm:px-8 sm:py-6 print:!border-slate-300 print:!bg-slate-100">
            {eyebrow ? (
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.32em] text-slate-400 print:text-slate-600">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="mt-2 text-xl sm:text-2xl font-light tracking-tight text-white print:!text-slate-900">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-2 max-w-3xl text-sm font-light leading-relaxed text-slate-300 print:!text-slate-700">
                {subtitle}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="relative border-b border-slate-200/80 bg-gradient-to-r from-white via-slate-50/95 to-slate-100/40 px-6 py-5 sm:px-8">
            {eyebrow ? (
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.26em] text-slate-500">{eyebrow}</p>
            ) : null}
            <h2 className="mt-2 text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">{title}</h2>
            {subtitle ? (
              <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-600">{subtitle}</p>
            ) : null}
          </div>
        )}
        <div className={`px-4 py-6 sm:px-8 sm:py-8 ${contentClassName}`}>{children}</div>
      </div>
    </section>
  );
}
