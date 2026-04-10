'use client';

import React from 'react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';

type Props = {
  data: SideBySideReportData;
};

function readRows(data: SideBySideReportData) {
  const raw = data.products_result;
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return raw
    .map((row) => {
      const product = typeof row.product === 'string' ? row.product : String(row.product ?? '—');
      const presentIn =
        typeof row.present_in === 'string' ? row.present_in : String(row.present_in ?? '—');
      const insight =
        typeof row.insight === 'string' && row.insight.trim()
          ? row.insight.trim()
          : typeof row.result === 'string' && row.result.trim()
            ? row.result.trim()
            : null;
      return { product, presentIn, insight };
    })
    .filter((r) => r.product !== '—' || r.insight);
}

export default function PremiumProdutosEnsaio({ data }: Props) {
  const rows = readRows(data);
  if (rows.length === 0) return null;

  return (
    <section
      id="premium-produtos-ensaio"
      className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Insumos do ensaio</h2>
      <p className="text-xs text-slate-500 mb-4">
        Leitura técnica por produto (dose e protocolo no app; texto sintetiza presença nos manejos e
        conclusão quando houver).
      </p>
      <ul className="space-y-4">
        {rows.map((r, i) => (
          <li
            key={`${r.product}-${i}`}
            className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-sm"
          >
            <p className="font-semibold text-slate-900">{r.product}</p>
            <p className="text-xs text-slate-500 mt-0.5">Presente em: {r.presentIn}</p>
            {r.insight && <p className="text-slate-700 mt-2 leading-relaxed">{r.insight}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
