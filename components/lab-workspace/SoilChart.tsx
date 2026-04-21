'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Row = { nutriente: string; atual: number; ideal: number };

function buildRows(norm: Record<string, unknown> | null | undefined): Row[] {
  if (!norm) return [];
  const ph = Number(norm.ph_h2o) || 0;
  const ca = Number(norm.ca_cmol) || 0;
  const mg = Number(norm.mg_cmol) || 0;
  const k = Number(norm.k_mg_kg) || 0;
  return [
    { nutriente: 'pH×10', atual: ph * 10, ideal: 60 },
    { nutriente: 'Ca', atual: ca, ideal: 3.5 },
    { nutriente: 'Mg', atual: mg, ideal: 1.2 },
    { nutriente: 'K/10', atual: k / 10, ideal: 12 },
  ];
}

export function SoilChart({ normalized }: { normalized: Record<string, unknown> | null | undefined }) {
  const data = buildRows(normalized);
  if (!data.length) return <p className="text-sm text-slate-500">Sem dados normalizados.</p>;
  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="nutriente" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="ideal" name="Referência" fill="#16a34a" radius={[4, 4, 0, 0]} />
          <Bar dataKey="atual" name="Atual" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
