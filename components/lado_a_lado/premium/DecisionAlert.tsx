'use client';

import type { ReactNode } from 'react';

type Tone = 'amber' | 'slate';

const toneClass: Record<Tone, { wrap: string; title: string; body: string }> = {
  amber: {
    wrap: 'rounded-xl border border-amber-400/50 bg-amber-500/15 px-4 py-3 max-w-3xl',
    title: 'text-sm font-bold text-amber-100',
    body: 'mt-1 text-sm text-amber-50/95 leading-relaxed',
  },
  slate: {
    wrap: 'rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 max-w-3xl',
    title: 'text-sm font-bold text-slate-800',
    body: 'mt-1 text-sm text-slate-600 leading-relaxed',
  },
};

export default function DecisionAlert({
  title,
  children,
  tone = 'amber',
  role = 'status',
}: {
  title: string;
  children: ReactNode;
  tone?: Tone;
  role?: 'status' | 'alert';
}) {
  const c = toneClass[tone];
  return (
    <div className={c.wrap} role={role}>
      <p className={c.title}>{title}</p>
      <div className={c.body}>{children}</div>
    </div>
  );
}
