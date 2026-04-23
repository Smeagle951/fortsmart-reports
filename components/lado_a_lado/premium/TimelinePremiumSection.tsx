'use client';

import { motion } from 'framer-motion';
import { CalendarDays, Droplets, Sprout, ClipboardCheck, Leaf, Gauge } from 'lucide-react';
import type { ComponentType } from 'react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { COLOR_SIDE_A, COLOR_SIDE_B } from '@/components/lado_a_lado/ladoALadoHelpers';
import { formatDate } from '@/utils/format';
import PremiumSectionShell from './PremiumSectionShell';

type IconCmp = ComponentType<{ className?: string; strokeWidth?: number }>;

type TimelineEvent = {
  date: string | null;
  title: string;
  detail?: string | null;
  kind: 'plantio' | 'emergencia' | 'aplicacao' | 'avaliacao' | 'colheita' | 'marco';
  side?: 'A' | 'B' | null;
  order: number;
};

function toDateMs(s: string | null | undefined): number | null {
  if (!s) return null;
  const t = new Date(s).getTime();
  return Number.isFinite(t) ? t : null;
}

export default function TimelinePremiumSection({ data }: { data: SideBySideReportData }) {
  const coleta = data.coleta;
  const apps = data.applications ?? [];
  const legacy = data.aplicacoes ?? [];
  const design = data.experiment_design;
  const emergenceDate = design?.data_emergencia ?? null;
  const harvestDate = null;

  const events: TimelineEvent[] = [];

  if (coleta?.dataPlantio?.trim()) {
    const t = toDateMs(coleta.dataPlantio);
    events.push({
      date: coleta.dataPlantio,
      title: 'Plantio',
      detail: 'Início do ciclo no talhão',
      kind: 'plantio',
      order: t ?? 0,
    });
  }
  if (emergenceDate && emergenceDate.trim()) {
    const t = toDateMs(emergenceDate);
    events.push({
      date: emergenceDate,
      title: 'Emergência',
      detail: 'V0 / plântulas no campo',
      kind: 'emergencia',
      order: t ?? 0,
    });
  }

  if (apps.length > 0) {
    for (const ev of apps) {
      if (!ev.date) continue;
      const t = toDateMs(ev.date);
      const productNames = (ev.products ?? [])
        .map((p) => p.nomeComercial || p.nomeAtivo)
        .filter(Boolean)
        .slice(0, 2)
        .join(' + ');
      const sideSafe: 'A' | 'B' | null =
        ev.side === 'A' || ev.side === 'B' ? ev.side : null;
      events.push({
        date: ev.date,
        title: ev.daa != null ? `${ev.daa} DAA · ${ev.type || 'Aplicação'}` : ev.type || 'Aplicação',
        detail: productNames || null,
        kind: 'aplicacao',
        side: sideSafe,
        order: t ?? 0,
      });
    }
  } else if (legacy.length > 0) {
    for (const a of legacy) {
      if (!a.data) continue;
      const t = toDateMs(a.data);
      events.push({
        date: a.data,
        title: a.tipo || 'Aplicação',
        detail: a.produtos ?? null,
        kind: 'aplicacao',
        order: t ?? 0,
      });
    }
  }

  if (coleta?.dae != null) {
    events.push({
      date: null,
      title: `Avaliação de campo · ${coleta.dae} DAE`,
      detail: coleta?.estadio ? `Estádio ${coleta.estadio}` : 'Leitura técnica no talhão',
      kind: 'avaliacao',
      order: Number.POSITIVE_INFINITY - 1,
    });
  }

  if (harvestDate) {
    events.push({
      date: harvestDate,
      title: 'Colheita',
      detail: 'Fechamento produtivo',
      kind: 'colheita',
      order: toDateMs(harvestDate) ?? Number.POSITIVE_INFINITY,
    });
  }

  if (events.length === 0) return null;

  events.sort((a, b) => a.order - b.order);

  return (
    <PremiumSectionShell
      id="timeline-premium"
      eyebrow="Cronologia"
      title="Linha do tempo do ensaio"
      subtitle="Sequência dos eventos registrados — plantio, emergência, aplicações por manejo e fechamento produtivo."
    >
      <div className="relative">
        {/* Linha vertical */}
        <span
          className="pointer-events-none absolute left-4 top-2 bottom-2 w-[2px] rounded-full bg-gradient-to-b from-emerald-300 via-slate-200 to-blue-300 sm:left-5"
          aria-hidden
        />
        <ol className="space-y-3">
          {events.map((ev, i) => (
            <TimelineItem key={`${ev.title}-${i}`} ev={ev} delay={i * 0.04} />
          ))}
        </ol>
      </div>
    </PremiumSectionShell>
  );
}

function TimelineItem({ ev, delay }: { ev: TimelineEvent; delay: number }) {
  const iconMap: Record<TimelineEvent['kind'], IconCmp> = {
    plantio: Sprout,
    emergencia: Leaf,
    aplicacao: Droplets,
    avaliacao: ClipboardCheck,
    colheita: Gauge,
    marco: CalendarDays,
  };
  const Icon = iconMap[ev.kind];
  const toneBg =
    ev.kind === 'aplicacao'
      ? ev.side === 'A'
        ? { bg: COLOR_SIDE_A, soft: '#dbeafe' }
        : ev.side === 'B'
          ? { bg: COLOR_SIDE_B, soft: '#dcfce7' }
          : { bg: '#64748b', soft: '#f1f5f9' }
      : ev.kind === 'plantio' || ev.kind === 'emergencia'
        ? { bg: '#16a34a', soft: '#dcfce7' }
        : ev.kind === 'colheita'
          ? { bg: '#a16207', soft: '#fef3c7' }
          : { bg: '#0f172a', soft: '#e2e8f0' };

  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.35 }}
      className="relative flex gap-4 pl-0"
    >
      {/* Bolha com ícone */}
      <div
        className="relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-md ring-4 ring-white sm:h-10 sm:w-10"
        style={{ backgroundColor: toneBg.bg }}
      >
        <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2.2} />
      </div>

      {/* Cartão do evento */}
      <div className="min-w-0 flex-1 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="text-sm font-bold text-slate-900">{ev.title}</p>
          <div className="flex items-center gap-2">
            {ev.side ? (
              <span
                className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white"
                style={{ backgroundColor: toneBg.bg }}
              >
                Lado {ev.side}
              </span>
            ) : null}
            {ev.date ? (
              <span
                className="rounded-md px-2 py-0.5 text-[10px] font-bold tabular-nums"
                style={{ backgroundColor: toneBg.soft, color: toneBg.bg }}
              >
                {formatDate(ev.date)}
              </span>
            ) : null}
          </div>
        </div>
        {ev.detail ? <p className="mt-0.5 text-[12px] leading-snug text-slate-600">{ev.detail}</p> : null}
      </div>
    </motion.li>
  );
}
