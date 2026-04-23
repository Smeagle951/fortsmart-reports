'use client';

import { motion } from 'framer-motion';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { buildPremiumRadarRows } from '../evaluationRadar';
import { buildIndexEvolutionRows } from './buildIndexEvolutionRows';
import { ENT } from './enterpriseTheme';

type Props = { data: SideBySideReportData };

export default function ChartsEnterpriseGrid({ data }: Props) {
  const nameA = data.sideA?.name || 'Manejo A';
  const nameB = data.sideB?.name || 'Manejo B';
  const radarRows = buildPremiumRadarRows(data);
  const lineRows = buildIndexEvolutionRows(data);

  return (
    <section id="enterprise-charts" className="scroll-mt-36 print:break-inside-avoid">
      <div className="mx-auto max-w-[1400px] px-4 pb-8 sm:px-6 sm:pb-10">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-24px' }}
            transition={{ duration: 0.45 }}
            className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-md sm:p-5 lg:col-span-6"
            style={{ boxShadow: ENT.shadowCard }}
          >
            <h3 className="text-sm font-bold text-slate-900">Comparativo de desempenho</h3>
            <p className="mt-0.5 text-xs text-slate-500">Radar técnico normalizado (0–100)</p>
            <div className="mt-3 h-[280px] w-full sm:h-[320px]">
              {radarRows.length >= 2 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarRows} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} tickCount={4} />
                    <Radar
                      name={nameA}
                      dataKey="A"
                      stroke={ENT.green}
                      fill={ENT.green}
                      fillOpacity={0.22}
                      strokeWidth={2}
                      isAnimationActive
                    />
                    <Radar
                      name={nameB}
                      dataKey="B"
                      stroke={ENT.blue}
                      fill={ENT.blue}
                      fillOpacity={0.18}
                      strokeWidth={2}
                      isAnimationActive
                    />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">
                  Dados insuficientes para o radar (publique KPIs em ambos os lados).
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-24px' }}
            transition={{ duration: 0.45, delay: 0.06 }}
            className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-md sm:p-5 lg:col-span-6"
            style={{ boxShadow: ENT.shadowCard }}
          >
            <h3 className="text-sm font-bold text-slate-900">Evolução das avaliações (DAA)</h3>
            <p className="mt-0.5 text-xs text-slate-500">Índice consolidado ao longo do ensaio</p>
            <div className="mt-3 h-[280px] w-full sm:h-[320px]">
              {lineRows.length >= 2 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineRows} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="tick" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} label={{ value: 'Índice', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="iA" name={nameA} stroke={ENT.green} strokeWidth={2} dot={{ r: 3 }} isAnimationActive />
                    <Line type="monotone" dataKey="iB" name={nameB} stroke={ENT.blue} strokeWidth={2} dot={{ r: 3 }} isAnimationActive />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">
                  Índice não disponível para evolução temporal.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
