'use client';

import React from 'react';
import { motion } from 'framer-motion';
import FortSmartLogo from '@/components/FortSmartLogo';
import { formatDate, formatDateTime } from '@/utils/format';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import {
  buildComparativeKpis,
  climateLineFromApplications,
  deriveWinner,
  techLineFromApplications,
} from '@/lib/lado-a-lado-premium';
import { useReducedMotionClient } from './useReducedMotionClient';

type Props = {
  data: SideBySideReportData;
  sideAName: string;
  sideBName: string;
};

export default function PremiumHero({ data, sideAName, sideBName }: Props) {
  const reduced = useReducedMotionClient();
  const farm = data.farm || {};
  const coleta = data.coleta;
  const meta = data.meta || {};
  const climateApps = climateLineFromApplications(data);
  const techApps = techLineFromApplications(data);
  const winner = deriveWinner(sideAName, sideBName, data);
  const kpis = buildComparativeKpis(data);
  const top = kpis[0];
  let headlineDiff: string | null = null;
  if (top && top.valueA !== 0) {
    const d = ((top.valueB - top.valueA) / Math.abs(top.valueA)) * 100;
    if (Number.isFinite(d) && Math.abs(d) >= 0.5) {
      headlineDiff = `${d > 0 ? '+' : ''}${d.toFixed(1)}% em “${top.label}” (${sideBName} vs ${sideAName})`;
    }
  }

  const title = data.branding?.title || 'Relatório agronômico inteligente';
  const subtitle = data.branding?.subtitle;

  const line1 = [
    farm.fieldName || farm.farmName,
    farm.culture,
    coleta?.estadio ? `Estádio ${coleta.estadio}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const line2 = [farm.city, farm.state].filter(Boolean).join(' — ');
  const daa = coleta?.dae != null ? `${coleta.dae} DAE` : coleta?.dap != null ? `${coleta.dap} DAP` : null;
  const line3 = [daa, meta.createdAt ? formatDate(meta.createdAt) : null].filter(Boolean).join(' · ');

  const anim = reduced
    ? {}
    : {
        initial: { opacity: 0, filter: 'blur(6px)' },
        animate: { opacity: 1, filter: 'blur(0px)' },
        transition: { duration: 0.45 },
      };

  return (
    <header
      id="premium-hero"
      className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-sky-50 via-white to-emerald-50/90 shadow-md print:shadow-none"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07] print:hidden"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23059669\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-wrap items-start justify-between gap-6 lg:gap-10">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="flex-shrink-0 print:hidden">
              <FortSmartLogo size={52} />
            </div>
            <div className="min-w-0 space-y-2">
              <motion.h1
                className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-sky-800 to-emerald-800 bg-clip-text text-transparent"
                {...anim}
                transition={reduced ? undefined : { ...anim.transition, delay: 0 }}
              >
                {title}
              </motion.h1>
              {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
              <motion.div
                className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-700"
                {...(reduced ? {} : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.12, duration: 0.35 } })}
              >
                {line1 && <span className="font-medium">{line1}</span>}
              </motion.div>
              <motion.div
                className="flex flex-wrap gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-600"
                {...(reduced ? {} : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.22, duration: 0.35 } })}
              >
                {line2 && <span>📍 {line2}</span>}
                {line3 && <span>📅 {line3}</span>}
              </motion.div>
              <motion.div
                className="flex flex-wrap gap-2 text-xs text-slate-600 pt-1"
                {...(reduced ? {} : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.32, duration: 0.35 } })}
              >
                {climateApps && <span className="rounded-full bg-white/80 px-2.5 py-1 border border-slate-200/80">{climateApps}</span>}
                {techApps && <span className="rounded-full bg-white/80 px-2.5 py-1 border border-slate-200/80">{techApps}</span>}
              </motion.div>
              <p className="text-xs text-slate-500 pt-1">
                Comparativo: <span className="text-emerald-800 font-medium">{sideAName}</span> ×{' '}
                <span className="text-sky-800 font-medium">{sideBName}</span>
              </p>
              {(data.version || data.generated_at || data.schemaVersion) && (
                <p className="text-[10px] text-slate-400 pt-2 font-mono leading-relaxed">
                  {data.version && <span>Contrato {data.version}</span>}
                  {data.schemaVersion && (
                    <span>
                      {data.version ? ' · ' : ''}schema {data.schemaVersion}
                    </span>
                  )}
                  {data.generated_at && (
                    <span>
                      {' '}
                      · Emitido {formatDateTime(data.generated_at)}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          <aside className="w-full lg:w-auto lg:max-w-sm shrink-0 print:hidden">
            <div className="rounded-2xl border border-slate-200/90 bg-white/85 backdrop-blur-sm p-4 shadow-[0_4px_20px_-8px_rgba(15,23,42,0.15)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-2">
                Síntese executiva
              </p>
              {winner === 'tie' ? (
                <p className="text-sm font-semibold text-slate-800">Desempenho técnico equilibrado entre os manejos.</p>
              ) : (
                <p className="text-sm font-semibold text-slate-900">
                  Indicadores favorecem{' '}
                  <span className={winner === 'B' ? 'text-sky-800' : 'text-emerald-800'}>
                    {winner === 'B' ? sideBName : sideAName}
                  </span>
                  .
                </p>
              )}
              {headlineDiff && (
                <p className="text-xs text-slate-600 mt-2 leading-relaxed border-t border-slate-100 pt-2">
                  {headlineDiff}
                </p>
              )}
              {!headlineDiff && kpis.length === 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  Inclua KPIs ou critérios numéricos no app para destacar diferenças percentuais aqui.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </header>
  );
}
