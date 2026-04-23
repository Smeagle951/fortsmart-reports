'use client';

import { motion } from 'framer-motion';
import type { ElementType } from 'react';
import { ENT } from './enterpriseTheme';

type Props = {
  number: string;
  title: string;
  subtitle?: string;
  icon?: ElementType;
  tone?: 'slate' | 'emerald' | 'blue';
};

/**
 * Título de secção contínuo (referência: linha e texto, sem “capítulo” pesado).
 */
export default function SectionCover({ number, title, subtitle, icon: Icon, tone = 'slate' }: Props) {
  const accent = tone === 'emerald' ? ENT.green : tone === 'blue' ? ENT.blue : '#0f172a';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-[1400px] px-4 pt-8 pb-1 sm:px-6 sm:pt-10 print:pt-6"
    >
      <div className="flex items-start gap-3 border-b border-slate-200/90 pb-3">
        {Icon ? (
          <div
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
            style={{ backgroundColor: accent }}
          >
            <Icon className="h-4 w-4" strokeWidth={2.2} />
          </div>
        ) : (
          <span
            className="mt-1 flex h-7 min-w-7 items-center justify-center rounded-md text-[10px] font-black tabular-nums text-white"
            style={{ backgroundColor: accent }}
          >
            {number}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Secção {number}</p>
          <h2 className="mt-0.5 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
    </motion.div>
  );
}
