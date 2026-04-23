'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import {
  costPerHaPair,
  productivityScHaPair,
  roiPctPair,
} from '@/lib/ladoALadoEnterpriseMetrics';
import { ENT } from './enterpriseTheme';

type Props = { data: SideBySideReportData };

type Check = { label: string; ok: boolean; weight: number };

function buildChecks(data: SideBySideReportData): Check[] {
  const photos = (data.sideA?.photos?.length ?? 0) + (data.sideB?.photos?.length ?? 0);
  const apps = data.applications?.length ?? 0;
  const treatment = (data.treatment_protocol?.sides?.length ?? 0) >= 2;
  const prod = productivityScHaPair(data) != null;
  const price = typeof data.economia?.preco_saca_brl === 'number' && (data.economia?.preco_saca_brl ?? 0) > 0;
  const cost = costPerHaPair(data) != null;
  const roi = roiPctPair(data) != null;
  const conclusion = (data.conclusion?.summary?.trim()?.length ?? 0) > 0;

  return [
    { label: 'Protocolo de tratamento (A e B)', ok: treatment, weight: 12 },
    { label: 'Aplicações registadas no campo', ok: apps > 0, weight: 12 },
    { label: 'Produtividade comparável', ok: prod, weight: 20 },
    { label: 'Preço de referência', ok: price, weight: 10 },
    { label: 'Custos por manejo', ok: cost, weight: 18 },
    { label: 'ROI publicado (motor)', ok: roi, weight: 16 },
    { label: 'Conclusão do técnico', ok: conclusion, weight: 6 },
    { label: 'Evidência fotográfica', ok: photos >= 2, weight: 6 },
  ];
}

export default function ReportConfidenceBadge({ data }: Props) {
  const checks = useMemo(() => buildChecks(data), [data]);
  const total = checks.reduce((acc, c) => acc + c.weight, 0);
  const gained = checks.reduce((acc, c) => acc + (c.ok ? c.weight : 0), 0);
  const score = Math.round((gained / total) * 100);
  const faltando = checks.filter((c) => !c.ok);
  const nivel = score >= 85 ? 'Alta' : score >= 60 ? 'Média' : 'Em formação';
  const tone = score >= 85 ? 'emerald' : score >= 60 ? 'amber' : 'red';
  const toneBg =
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
      : tone === 'amber'
        ? 'bg-amber-50 text-amber-900 border-amber-200'
        : 'bg-rose-50 text-rose-900 border-rose-200';
  const ringColor = tone === 'emerald' ? ENT.green : tone === 'amber' ? ENT.gold : ENT.red;

  return (
    <section id="enterprise-confianca" className="scroll-mt-36 print:break-inside-avoid">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45 }}
        className="mx-auto max-w-[1400px] px-4 pb-6 sm:px-6 sm:pb-8"
      >
        <div
          className={`flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-sm sm:flex-row sm:items-center ${toneBg}`}
          style={{ boxShadow: ENT.shadowCard }}
        >
          <div className="flex items-center gap-4 sm:min-w-[240px]">
            <ProgressRing value={score} color={ringColor} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">Confiança do relatório</p>
              <p className="mt-0.5 text-2xl font-black tracking-tight">{score}%</p>
              <p className="text-xs font-semibold">{nivel}</p>
            </div>
          </div>

          <div className="flex-1 border-t border-current/10 pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
            {faltando.length === 0 ? (
              <p className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                Todos os blocos principais foram publicados.
              </p>
            ) : (
              <>
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Para subir a confiança
                </p>
                <ul className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                  {faltando.slice(0, 6).map((c) => (
                    <li key={c.label} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
                      {c.label}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="hidden shrink-0 items-center gap-2 rounded-xl bg-white/70 px-3 py-2 sm:flex">
            <ShieldCheck className="h-4 w-4" style={{ color: ringColor }} />
            <span className="text-[11px] font-semibold text-slate-700">FortSmart auditado</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function ProgressRing({ value, color }: { value: number; color: string }) {
  const size = 68;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      initial={{ rotate: -90, opacity: 0 }}
      animate={{ rotate: -90, opacity: 1 }}
      transition={{ duration: 0.45 }}
      aria-hidden
    >
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#e2e8f0" strokeWidth={stroke} fill="none" />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.svg>
  );
}
