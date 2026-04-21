'use client';

import { motion } from 'framer-motion';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { formatNumber } from '@/utils/format';
import PremiumSectionShell from './PremiumSectionShell';

function num(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function fmtDelta(d: number | null): string {
  if (d == null) return '—';
  const sign = d > 0 ? '+' : '';
  return `${sign}${formatNumber(d, { decimals: 2 })}`;
}

function EvoMetric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string | null;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/90 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-lg font-bold tabular-nums text-slate-900 mt-0.5">{value}</p>
      {sub ? <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p> : null}
    </div>
  );
}

export default function SubareaCostsAndEvolutionSection({ data }: { data: SideBySideReportData }) {
  const custos = Array.isArray(data.custos) ? data.custos : [];
  const evo = data.evolucao;

  const hasEvo =
    evo != null &&
    (evo.disponivel === true ||
      num(evo.sanidade_delta) != null ||
      num(evo.vigor_delta) != null ||
      num(evo.dae_atual) != null ||
      num(evo.dae_anterior) != null);

  if (custos.length === 0 && !hasEvo) return null;

  const tipoLabel = (t: string | undefined) => {
    const x = (t || '').toLowerCase();
    if (x === 'insumo') return 'Insumo';
    if (x === 'operacao') return 'Operação';
    return t?.trim() || '—';
  };

  return (
    <PremiumSectionShell
      id="custos-evolucao-visitas-premium"
      eyebrow="Talhão e histórico"
      title="Subáreas, custos e evolução"
      subtitle="Custos alocados por subárea quando publicados, e indicadores de evolução entre visitas consecutivas no mesmo contexto (talhão, cultura, safra)."
      contentClassName="space-y-10"
    >
      {hasEvo && evo ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Evolução entre visitas</h3>
          <p className="mt-1 text-sm text-slate-600 mb-4 max-w-2xl">
            Comparação com a visita anterior no mesmo talhão, safra e cultura, quando houver histórico.
          </p>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            {evo.melhoria === true ? (
              <p className="text-sm font-medium text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                Indicadores de sanidade e/ou vigor melhoraram em relação à visita anterior.
              </p>
            ) : evo.disponivel === true && evo.melhoria === false ? (
              <p className="text-sm text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Sem ganho claro de sanidade/vigor vs. visita anterior — revisar manejo ou amostragem.
              </p>
            ) : null}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <EvoMetric
                label="Δ Sanidade (0–5)"
                value={fmtDelta(num(evo.sanidade_delta))}
                sub={
                  num(evo.sanidade_media_atual) != null || num(evo.sanidade_media_anterior) != null
                    ? `Atual ${num(evo.sanidade_media_atual) != null ? formatNumber(num(evo.sanidade_media_atual)!, { decimals: 2 }) : '—'} · Ant. ${num(evo.sanidade_media_anterior) != null ? formatNumber(num(evo.sanidade_media_anterior)!, { decimals: 2 }) : '—'}`
                    : null
                }
              />
              <EvoMetric
                label="Δ Vigor (0–5)"
                value={fmtDelta(num(evo.vigor_delta))}
                sub={
                  num(evo.vigor_media_atual) != null || num(evo.vigor_media_anterior) != null
                    ? `Atual ${num(evo.vigor_media_atual) != null ? formatNumber(num(evo.vigor_media_atual)!, { decimals: 2 }) : '—'} · Ant. ${num(evo.vigor_media_anterior) != null ? formatNumber(num(evo.vigor_media_anterior)!, { decimals: 2 }) : '—'}`
                    : null
                }
              />
              <EvoMetric
                label="Dias após plantio (esta visita)"
                value={num(evo.dae_atual) != null ? `${Math.round(num(evo.dae_atual)!)} d` : '—'}
                sub="Entre a data de plantio (identificação) e a data desta avaliação"
              />
              <EvoMetric
                label="Dias após plantio (visita ant.)"
                value={num(evo.dae_anterior) != null ? `${Math.round(num(evo.dae_anterior)!)} d` : '—'}
                sub={evo.avaliacao_anterior_id ? `Ref. ${evo.avaliacao_anterior_id.slice(0, 8)}…` : null}
              />
            </div>
          </div>
        </motion.div>
      ) : null}

      {custos.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Custos por subárea</h3>
          <p className="mt-1 text-sm text-slate-600 mb-4 max-w-2xl">
            Itens calculados com a área da subárea vinculada ao tratamento (quando aplicável).
          </p>
          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  <th className="px-4 py-3">Tratamento</th>
                  <th className="px-4 py-3">Subárea</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3 text-right">R$/ha</th>
                  <th className="px-4 py-3 text-right">Área (ha)</th>
                  <th className="px-4 py-3 text-right">Total (R$)</th>
                </tr>
              </thead>
              <tbody>
                {custos.map((row, i) => {
                  const vph = num(row.valor_por_ha);
                  const ah = num(row.area_ha);
                  const vt = num(row.valor_total);
                  return (
                    <tr key={i} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2.5 text-slate-800">{row.tratamento ?? '—'}</td>
                      <td className="px-4 py-2.5 text-slate-700">{row.subarea_nome ?? row.subarea_id ?? '—'}</td>
                      <td className="px-4 py-2.5 text-slate-600">{tipoLabel(row.tipo)}</td>
                      <td className="px-4 py-2.5 text-slate-700 max-w-[220px]">{row.descricao ?? '—'}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {vph != null ? formatNumber(vph, { decimals: 2 }) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {ah != null ? formatNumber(ah, { decimals: 2 }) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                        {vt != null ? formatNumber(vt, { decimals: 2 }) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : null}
    </PremiumSectionShell>
  );
}
