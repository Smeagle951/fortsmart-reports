'use client';

import { motion } from 'framer-motion';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { COLOR_SIDE_A, COLOR_SIDE_B } from '@/components/lado_a_lado/ladoALadoHelpers';
import { formatNumber } from '@/utils/format';

export default function TreatmentSection({ data }: { data: SideBySideReportData }) {
  const sides = [...(data.treatment_protocol?.sides ?? [])].sort((a, b) => (a.side === 'A' ? -1 : b.side === 'A' ? 1 : 0));
  if (sides.length === 0) return null;

  return (
    <section id="tratamento-premium" className="scroll-mt-28">
      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Plano de tratamento</h2>
      <p className="mt-1 text-sm text-slate-600 mb-6 max-w-2xl">Protocolo planejado antes da execução — cartão técnico por manejo.</p>
      <div className="grid md:grid-cols-2 gap-4">
        {sides.map((s, i) => {
          const isA = s.side === 'A';
          const headerBg = isA ? 'bg-blue-800' : 'bg-emerald-800';
          const ring = isA ? 'ring-blue-100' : 'ring-emerald-100';
          return (
            <motion.div
              key={s.side + s.name}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm ring-2 ${ring}`}
            >
              <div className={`${headerBg} text-white px-4 py-3 text-center`}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-95">
                  Manejo {s.side}
                </p>
                <p className="font-bold text-lg mt-0.5">{s.name}</p>
                <p className="text-[11px] opacity-85">Tratamento {s.side}</p>
              </div>
              <div className="p-5 space-y-3 text-sm text-slate-700">
                {s.objective ? (
                  <p>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Objetivo</span>
                    <br />
                    {s.objective}
                  </p>
                ) : null}
                {s.expected_result ? (
                  <p>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Resultado esperado</span>
                    <br />
                    {s.expected_result}
                  </p>
                ) : null}
                {s.description ? <p className="text-slate-600 leading-relaxed">{s.description}</p> : null}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Produtos</p>
                  <ul className="space-y-2">
                    {(s.products ?? []).map((p, j) => (
                      <li
                        key={j}
                        className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border border-slate-100 rounded-xl px-3 py-2 bg-slate-50/90"
                        style={{ borderLeftWidth: 3, borderLeftColor: isA ? COLOR_SIDE_A : COLOR_SIDE_B }}
                      >
                        <span className="font-semibold text-slate-900">{p.name}</span>
                        <span className="text-xs text-slate-600">
                          {p.dose != null ? String(p.dose) : '—'}
                          {p.dose_unit ? ` ${p.dose_unit}` : ''}
                          {p.cost_per_ha != null && (
                            <span className="ml-2 font-medium text-slate-800">
                              · R$ {formatNumber(p.cost_per_ha, { decimals: 2 })}/ha
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
