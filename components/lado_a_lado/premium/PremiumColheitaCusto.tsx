'use client';

import React from 'react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import {
  readColheitaPayload,
  readCustoPayload,
  readEconomiaPayload,
  colheitaScHaDiff,
} from '@/lib/lado-a-lado-economic';
import { formatDate, formatNumber } from '@/utils/format';

type Props = {
  data: SideBySideReportData;
};

function fontePrecoLegivel(fonte: string) {
  if (fonte === 'padrao_sistema') return 'referência do sistema';
  if (fonte === 'cliente') return 'informado pelo cliente';
  return fonte;
}

export default function PremiumColheitaCusto({ data }: Props) {
  const colheita = readColheitaPayload(data.colheita);
  const custo = readCustoPayload(data.custo);
  const economia = readEconomiaPayload(data.economia);
  if (!colheita && !custo && !economia) {
    return (
      <section id="premium-economico" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Colheita e custos por tratamento</h2>
        <p className="text-sm text-slate-600">
          Não há registros de colheita, snapshot de custos nem bloco econômico nesta avaliação. Preencha nas abas{' '}
          <strong>Colheita</strong> e <strong>Custos</strong> no app e publique o relatório novamente para exibir
          produtividade real, R$/ha e itens detalhados.
        </p>
      </section>
    );
  }

  const scDiff = colheitaScHaDiff(colheita);

  return (
    <section id="premium-economico" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Colheita e custos por tratamento</h2>
        <p className="text-xs text-slate-500">Dados gravados no módulo de avaliação (SQLite) e enviados na publicação.</p>
      </div>

      {economia && (
        <p className="text-sm text-slate-700 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
          <span className="font-medium text-slate-800">Preço de referência da saca:</span> R${' '}
          {formatNumber(economia.precoSacaBrl, { decimals: 2 })} ({fontePrecoLegivel(economia.fontePreco)}) — usado no resumo
          executivo para converter Δ sc/ha em R$/ha.
        </p>
      )}

      {colheita && (
        <div>
          <h3 className="text-sm font-semibold text-emerald-900 mb-3">Colheita</h3>
          {scDiff != null && Math.abs(scDiff) >= 0.01 && (
            <p className="text-sm text-slate-700 mb-3">
              Diferença entre tratamentos:{' '}
              <span className="font-bold text-emerald-800">
                {scDiff > 0 ? '+' : ''}
                {formatNumber(scDiff, { decimals: 2 })} sc/ha
              </span>{' '}
              (B vs A, conversão {colheita.kgPerSack ?? 60} kg/saca).
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {colheita.sides?.map((s, i) => (
              <div
                key={`${s.side}-${i}`}
                className={`rounded-xl border p-4 ${
                  s.side === 'B' ? 'border-sky-200 bg-sky-50/50' : 'border-emerald-200 bg-emerald-50/50'
                }`}
              >
                <p className="font-semibold text-slate-900">{s.sideName || `Tratamento ${s.side}`}</p>
                <ul className="mt-2 text-sm text-slate-700 space-y-1">
                  <li>Produtividade: {formatNumber(s.yieldScHa ?? 0, { decimals: 2 })} sc/ha</li>
                  <li>{formatNumber(s.yieldKgHa ?? 0, { decimals: 1 })} kg/ha</li>
                  <li>Área colhida: {formatNumber(s.areaHa ?? 0, { decimals: 2 })} ha</li>
                  <li>Peso líquido: {formatNumber(s.netWeightKg ?? 0, { decimals: 1 })} kg</li>
                  {s.moisturePct != null && <li>Umidade: {formatNumber(s.moisturePct, { decimals: 1 })}%</li>}
                  {s.impurityPct != null && <li>Impureza: {formatNumber(s.impurityPct, { decimals: 1 })}%</li>}
                  {s.pmsG != null && <li>PMS: {formatNumber(s.pmsG, { decimals: 0 })} g</li>}
                  {s.harvestDate && <li>Data: {formatDate(s.harvestDate)}</li>}
                  {s.linkedToHarvestModule && (
                    <li className="text-xs text-emerald-800">Vinculado ao módulo Colheita & Qualidade</li>
                  )}
                  {s.notes && <li className="text-xs text-slate-600 pt-1">Obs.: {s.notes}</li>}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {custo && (
        <div>
          <h3 className="text-sm font-semibold text-amber-900 mb-3">Custos (snapshot)</h3>
          {custo.deltaCostPerHa_B_vs_A != null && (
            <p className="text-sm text-slate-700 mb-3">
              Δ custo operacional (B − A):{' '}
              <span className="font-semibold">
                R$ {formatNumber(custo.deltaCostPerHa_B_vs_A, { decimals: 2 })}/ha
              </span>
            </p>
          )}
          <div className="space-y-6">
            {custo.by_side?.map((block, i) => (
              <div key={i} className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 flex flex-wrap justify-between gap-2 text-sm">
                  <span className="font-semibold text-slate-900">{block.sideName || `Tratamento ${block.side}`}</span>
                  <span>
                    Total: R$ {formatNumber(block.totalCost ?? 0, { decimals: 2 })} ·{' '}
                    {formatNumber(block.costPerHa ?? 0, { decimals: 2 })} R$/ha
                  </span>
                  <span className="text-xs text-slate-500">
                    {block.source === 'stock' ? 'Estoque' : block.source === 'manual' ? 'Manual' : block.source}
                    {block.currency ? ` · ${block.currency}` : ''}
                  </span>
                </div>
                {block.items && block.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-slate-600">
                          <th className="py-2 px-3">Produto</th>
                          <th className="py-2 px-3">Categoria</th>
                          <th className="py-2 px-3">Qtd</th>
                          <th className="py-2 px-3">Total R$</th>
                        </tr>
                      </thead>
                      <tbody>
                        {block.items.map((it, j) => (
                          <tr key={j} className="border-b border-slate-100">
                            <td className="py-2 px-3 font-medium">{it.productName || '—'}</td>
                            <td className="py-2 px-3">{it.category || '—'}</td>
                            <td className="py-2 px-3">
                              {formatNumber(it.qty ?? 0, { decimals: 2 })} {it.unit || ''}
                              {it.dosePerHa != null && (
                                <span className="text-slate-500 block">
                                  {formatNumber(it.dosePerHa, { decimals: 2 })} {it.doseUnit || ''}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3">R$ {formatNumber(it.itemTotal ?? 0, { decimals: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="p-4 text-sm text-slate-500">Sem itens detalhados neste snapshot.</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <details className="text-xs">
        <summary className="cursor-pointer text-slate-600 font-medium">Payload bruto (auditoria técnica)</summary>
        <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-900 text-emerald-100 p-3 text-[10px] leading-relaxed">
          {JSON.stringify(
            { colheita: data.colheita ?? null, custo: data.custo ?? null, economia: data.economia ?? null },
            null,
            2
          )}
        </pre>
      </details>
    </section>
  );
}
