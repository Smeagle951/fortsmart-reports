'use client';

import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { COLOR_SIDE_A, COLOR_SIDE_B, evolutionSeriesFromApplications } from '@/components/lado_a_lado/ladoALadoHelpers';

/** Só exibe quando há ≥2 DAA distintos com contagem real de eventos (sem curva sintética). */
export default function EvolutionSection({ data }: { data: SideBySideReportData }) {
  const series = evolutionSeriesFromApplications(data.applications);
  if (!series || series.length < 2) return null;

  const nameA = data.sideA?.name || 'Manejo A';
  const nameB = data.sideB?.name || 'Manejo B';

  return (
    <section id="evolucao-premium" className="scroll-mt-28">
      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Evolução operacional</h2>
      <p className="mt-1 text-sm text-slate-600 mb-6 max-w-2xl">
        Número de aplicações registradas por DAA e por manejo — só aparece com série real no JSON.
      </p>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="A" name={nameA} stroke={COLOR_SIDE_A} strokeWidth={2} dot />
              <Line type="monotone" dataKey="B" name={nameB} stroke={COLOR_SIDE_B} strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </section>
  );
}
