'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';

import { Talhao } from '@/lib/types/monitoring';
import { calcularMetricasTalhao } from '@/lib/calculations';
import { formatPercent2 } from '@/utils/format';

interface MatrizRiscoFenologicoProps {
  talhao?: Talhao;
  culturaOverride?: string;
  estagioAtualOverride?: string;
  pressaoAtualOverride?: number;
}

type Row = {
  estagio: string;
  /** Índice de ocorrência (0–100%) neste snapshot — só preenchido até o estágio atual. */
  indiceRelatorio: number | null;
  /** Limiar de referência (%) — mais rigoroso em fases reprodutivas. */
  limiarReferencia: number;
};

/**
 * Gráfico único por snapshot: eixo X = estágios típicos da cultura; Y = índice de ocorrência (%).
 * Mostra trajeto ilustrativo até o estágio atual (mesmo índice do relatório) e zona acima do limiar.
 */
export default function MatrizRiscoFenologico({
  talhao,
  culturaOverride,
  estagioAtualOverride,
  pressaoAtualOverride,
}: MatrizRiscoFenologicoProps) {
  let indicePct = 0;
  if (pressaoAtualOverride != null && Number.isFinite(pressaoAtualOverride)) {
    indicePct = Math.min(100, Math.max(0, pressaoAtualOverride));
  } else if (talhao) {
    const metricas = calcularMetricasTalhao(talhao);
    const raw = metricas.indiceOcorrencia;
    indicePct = Math.min(100, Math.max(0, raw <= 1 ? raw * 100 : raw));
  }

  const cultura = (culturaOverride || talhao?.cultura || 'soja').toLowerCase();
  let stages = ['V2', 'V4', 'V6', 'V8', 'R1', 'R3', 'R5'];
  if (cultura.includes('milho')) {
    stages = ['V3', 'V6', 'V8', 'VT', 'R1', 'R3', 'R5'];
  } else if (cultura.includes('algod')) {
    stages = ['V2', 'V4', 'B1', 'F1', 'C1', 'M1'];
  }

  let currentStage = (estagioAtualOverride || talhao?.estagio || stages[Math.min(3, stages.length - 1)]).trim();
  const firstToken = currentStage.split(/[\s,.;/]+/)[0] || currentStage;
  currentStage = firstToken;

  const stagingIndex = stages.findIndex((s) => currentStage.toUpperCase().includes(s) || s.includes(currentStage.toUpperCase()));
  const activeIndex = stagingIndex >= 0 ? stagingIndex : Math.min(3, stages.length - 1);
  const stageAtualKey = stages[activeIndex];

  const data: Row[] = stages.map((st, idx) => {
    const reprodutivo = /R|VT|F|B|C|M/i.test(st);
    const limiarReferencia = reprodutivo ? 18 : 32;
    let indiceRelatorio: number | null = null;
    if (idx < activeIndex) {
      const t = activeIndex <= 0 ? 1 : activeIndex;
      const frac = (idx + 1) / t;
      indiceRelatorio = Number((indicePct * frac * 0.92).toFixed(1));
    } else if (idx === activeIndex) {
      indiceRelatorio = Number(indicePct.toFixed(1));
    } else {
      indiceRelatorio = null;
    }
    return { estagio: st, indiceRelatorio, limiarReferencia };
  });

  return (
    <div style={{ padding: '24px 0 0 0' }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
        Matriz de risco fenológico
      </h3>
      <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.55, margin: '0 0 16px' }}>
        Eixo vertical: índice de ocorrência do relatório (0–100%). A linha tracejada vermelha é um limiar de referência por fase (mais rigoroso no reprodutivo).
        O valor no estágio <strong>{stageAtualKey}</strong> corresponde ao índice calculado para este talhão ({formatPercent2(indicePct)}).
        Estágios futuros não têm medição neste snapshot.
      </p>

      <div style={{ width: '100%', height: 340, minHeight: 320 }}>
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={data} margin={{ top: 16, right: 28, left: 4, bottom: 8 }}>
            <defs>
              <linearGradient id="gradientIndice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E65100" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#E65100" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="estagio"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => `${val}%`}
              tick={{ fill: '#64748B', fontSize: 12 }}
              domain={[0, 100]}
              width={44}
            />
            <Tooltip
              cursor={{ stroke: '#CBD5E1', strokeWidth: 1, strokeDasharray: '4 4' }}
              contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              formatter={(value: number | string, name: string) => {
                if (name === 'indiceRelatorio' && (value === '' || value == null)) return ['—', 'Índice (snapshot)'];
                return [`${value}%`, name === 'indiceRelatorio' ? 'Índice (snapshot)' : name];
              }}
              labelStyle={{ fontWeight: 700, color: '#1E293B', marginBottom: 4 }}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ paddingTop: 12, fontSize: 12, fontWeight: 600, color: '#475569' }}
            />

            <ReferenceArea y1={40} y2={100} fill="#FEE2E2" fillOpacity={0.35} />

            <Line
              type="monotone"
              name="Limiar referência (fase)"
              dataKey="limiarReferencia"
              stroke="#DC2626"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              isAnimationActive={false}
            />

            <Line
              type="monotone"
              name="Índice de ocorrência (relatório)"
              dataKey="indiceRelatorio"
              stroke="#C2410C"
              strokeWidth={3}
              connectNulls={false}
              dot={{ r: 5, fill: '#C2410C', stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 7, strokeWidth: 0 }}
              isAnimationActive={false}
            />

            <ReferenceLine
              x={stageAtualKey}
              stroke="#166534"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{
                position: 'top',
                value: 'Estágio atual',
                fill: '#166534',
                fontSize: 11,
                fontWeight: 700,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
