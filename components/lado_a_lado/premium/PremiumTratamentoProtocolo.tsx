'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { formatNumber } from '@/utils/format';
import { useReducedMotionClient } from './useReducedMotionClient';

type SideBlock = {
  side?: string;
  name?: string;
  description?: string;
  objective?: string;
  treatment_type?: string;
  expected_result?: string;
  products?: Array<Record<string, unknown>>;
};

function readSides(data: SideBySideReportData): SideBlock[] {
  const tp = data.treatment_protocol as Record<string, unknown> | null | undefined;
  if (tp && Array.isArray(tp.sides)) {
    return tp.sides.filter((s): s is SideBlock => s != null && typeof s === 'object');
  }
  const leg = data.treatments as unknown;
  if (Array.isArray(leg)) {
    return leg.filter((s): s is SideBlock => s != null && typeof s === 'object');
  }
  return [];
}

function typeLabel(t?: string) {
  if (!t) return null;
  if (t === 'padrao') return 'Padrão';
  if (t === 'teste') return 'Teste / ensaio';
  if (t === 'comercial') return 'Comercial';
  return t;
}

export default function PremiumTratamentoProtocolo({ data }: { data: SideBySideReportData }) {
  const reduced = useReducedMotionClient();
  const sides = readSides(data);
  if (sides.length === 0) {
    return (
      <section
        id="premium-protocolo-tratamento"
        className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-center"
      >
        <h2 className="text-lg font-semibold text-slate-800">Protocolo do ensaio (plano)</h2>
        <p className="text-sm text-slate-600 mt-2 max-w-lg mx-auto leading-relaxed">
          Não há <code className="text-xs bg-white px-1 rounded">treatment_protocol</code> nem{' '}
          <code className="text-xs bg-white px-1 rounded">treatments</code> neste JSON. Cadastre o plano por manejo no app e publique
          novamente para exibir os cartões A × B como no modelo executivo.
        </p>
      </section>
    );
  }

  const note =
    (data.treatment_protocol as Record<string, unknown> | undefined)?.note?.toString() ||
    'Plano do ensaio por manejo. As datas, clima e bicos ficam em Aplicações (execução em campo).';

  return (
    <motion.section
      id="premium-protocolo-tratamento"
      className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-[0_8px_30px_-14px_rgba(15,23,42,0.12)]"
      initial={reduced ? false : { opacity: 0, y: 10 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Protocolo do ensaio (plano)</h2>
      <p className="text-xs text-slate-600 mb-6 leading-relaxed">{note}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sides.map((s, i) => {
          const letter = s.side === 'B' ? 'B' : 'A';
          const prods = Array.isArray(s.products) ? s.products : [];
          const totalPlanned = prods.reduce((sum, p) => {
            const cph = p.cost_per_ha as number | undefined;
            return sum + (cph != null && Number.isFinite(cph) ? cph : 0);
          }, 0);
          const headerBg = letter === 'A' ? 'bg-sky-700' : 'bg-emerald-700';
          const footerBg = letter === 'A' ? 'bg-sky-50 border-sky-200' : 'bg-emerald-50 border-emerald-200';
          return (
            <div
              key={`${letter}-${i}`}
              className="rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col bg-white"
            >
              <div className={`${headerBg} text-white px-4 py-3`}>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-90">[{letter}] Manejo</p>
                <p className="font-semibold text-base leading-tight mt-0.5">{s.name || `Tratamento ${letter}`}</p>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                {s.description && (
                  <p className="text-sm text-slate-700 leading-relaxed">{String(s.description)}</p>
                )}
                <ul className="mt-3 text-xs text-slate-600 space-y-1.5">
                  {s.objective && (
                    <li>
                      <span className="font-semibold text-slate-800">Objetivo:</span> {String(s.objective)}
                    </li>
                  )}
                  {s.treatment_type && (
                    <li>
                      <span className="font-semibold text-slate-800">Tipo:</span> {typeLabel(String(s.treatment_type))}
                    </li>
                  )}
                  {s.expected_result && (
                    <li>
                      <span className="font-semibold text-slate-800">Resultado esperado:</span>{' '}
                      {String(s.expected_result)}
                    </li>
                  )}
                </ul>
                {prods.length > 0 ? (
                  <div className="mt-4 border-t border-slate-100 pt-4 flex-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Insumos planejados</p>
                    <ul className="space-y-3 text-sm">
                      {prods.map((p, j) => {
                        const name = (p.name ?? p.nome ?? '—') as string;
                        const cat = (p.category ?? p.classe ?? '') as string;
                        const dose = (p.dose ?? '') as string;
                        const cph = p.cost_per_ha as number | undefined;
                        const pid = p.id as string | undefined;
                        const active = (p.active_ingredient ?? p.nome_ativo ?? '') as string;
                        return (
                          <li
                            key={j}
                            className={`rounded-lg border pl-3 pr-2 py-2 ${
                              letter === 'A' ? 'border-sky-100 bg-sky-50/30' : 'border-emerald-100 bg-emerald-50/30'
                            }`}
                          >
                            <div className="font-semibold text-slate-900">{name}</div>
                            {active ? <div className="text-xs text-slate-600">{active}</div> : null}
                            {cat ? <div className="text-[11px] text-slate-500">{cat}</div> : null}
                            {dose && dose !== '—' ? (
                              <div className="text-xs text-slate-700 mt-1 font-medium">{dose}</div>
                            ) : null}
                            {cph != null && Number.isFinite(cph) ? (
                              <div className="text-xs text-emerald-800 font-semibold mt-1">
                                R$ {formatNumber(cph, { decimals: 2 })}/ha
                              </div>
                            ) : null}
                            {pid ? (
                              <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5" title={pid}>
                                ID: {pid.slice(0, 8)}…
                              </div>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mt-4">Sem insumos listados no protocolo deste lado.</p>
                )}
                <div className={`mt-4 rounded-lg border px-3 py-2.5 text-sm font-semibold ${footerBg}`}>
                  Custo planejado (soma insumos): R$ {formatNumber(totalPlanned, { decimals: 2 })}/ha
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
