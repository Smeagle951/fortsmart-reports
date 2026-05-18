'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { productivityScHaPair, roiPctPair } from '@/lib/ladoALadoEnterpriseMetrics';
import { sideLabel } from '@/lib/lado-a-lado-official/selectors';
import { FS } from '@/lib/lado-a-lado-official/theme';

export default function SideBySideCharts({ data }: { data: SideBySideReportData }) {
  const prod = productivityScHaPair(data);
  const roi = roiPctPair(data);

  const chartData =
    prod?.a != null && prod?.b != null
      ? [
          { name: sideLabel(data, 'A'), sc: prod.a, fill: FS.sideA },
          { name: sideLabel(data, 'B'), sc: prod.b, fill: FS.sideB },
        ]
      : [];

  const roiData =
    roi?.a != null && roi?.b != null
      ? [
          { name: 'Lado A', roi: roi.a },
          { name: 'Lado B', roi: roi.b },
        ]
      : [];

  if (chartData.length === 0 && roiData.length === 0) return null;

  return (
    <section className="fs-section">
      <h2 className="fs-official-section-title">Gráficos</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {chartData.length > 0 ? (
          <div className="fs-official-card p-4">
            <p className="mb-3 text-sm font-semibold text-[#111827]">Produtividade (sc/ha)</p>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="sc" radius={[8, 8, 0, 0]} fill={FS.sideB} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}
        {roiData.length > 0 ? (
          <div className="fs-official-card p-4">
            <p className="mb-3 text-sm font-semibold text-[#111827]">ROI (%)</p>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roiData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="roi" radius={[8, 8, 0, 0]} fill={FS.orange} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
