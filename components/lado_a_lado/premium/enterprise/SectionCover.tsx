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

export default function SectionCover({ number, title, subtitle, icon: Icon, tone = 'slate' }: Props) {
  const accent = tone === 'emerald' ? ENT.green : tone === 'blue' ? ENT.blue : '#0f172a';
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 pt-10 pb-2 sm:px-6 sm:pt-14 print:break-before-page"
    >
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-md sm:h-16 sm:w-16"
        style={{ backgroundColor: accent, boxShadow: ENT.shadowCard }}
      >
        {Icon ? <Icon className="h-6 w-6" strokeWidth={2} /> : (
          <span className="text-xl font-black tabular-nums">{number}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Secção {number}</p>
        <h2 className="mt-0.5 text-xl font-black leading-tight tracking-tight text-slate-900 sm:text-2xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      <div
        className="hidden h-[2px] flex-1 rounded-full sm:block"
        style={{
          background: `linear-gradient(90deg, ${accent}33 0%, transparent 100%)`,
        }}
        aria-hidden
      />
    </motion.div>
  );
}
