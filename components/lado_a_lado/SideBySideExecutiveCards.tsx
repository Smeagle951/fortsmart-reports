'use client';

import {
  BadgeDollarSign,
  CircleDollarSign,
  ShieldCheck,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import type { ElementType } from 'react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { executiveKpis } from '@/lib/lado-a-lado-official/selectors';
import { FS } from '@/lib/lado-a-lado-official/theme';

const ICONS: Record<string, ElementType> = {
  winner: Trophy,
  prod: TrendingUp,
  margin: CircleDollarSign,
  roi: BadgeDollarSign,
  ai: ShieldCheck,
};

const TONE_BG: Record<string, string> = {
  green: FS.greenSoft,
  blue: '#E3F2FD',
  purple: FS.purpleSoft,
  orange: FS.orangeSoft,
  slate: '#F1F5F9',
};

const TONE_FG: Record<string, string> = {
  green: FS.green,
  blue: '#1976D2',
  purple: FS.purple,
  orange: FS.orange,
  slate: FS.textSecondary,
};

export default function SideBySideExecutiveCards({ data }: { data: SideBySideReportData }) {
  const kpis = executiveKpis(data);

  return (
    <section className="fs-section pt-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((k) => {
          const Icon = ICONS[k.id] ?? Trophy;
          return (
            <div
              key={k.id}
              className="fs-official-card flex min-h-[140px] flex-col justify-between p-5 transition hover:shadow-md"
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: TONE_BG[k.tone], color: TONE_FG[k.tone] }}
              >
                <Icon className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
                  {k.label}
                </p>
                <p className="mt-1 text-xl font-bold leading-tight text-[#111827] sm:text-2xl">
                  {k.value}
                </p>
                {k.hint ? (
                  <p className="mt-1 text-xs text-[#9CA3AF]">{k.hint}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
