'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { applicationEventTotalCusto, buildComparativeKpis } from '@/lib/lado-a-lado-premium';
import { formatDate, formatNumber } from '@/utils/format';
import { useReducedMotionClient } from './useReducedMotionClient';

type Props = {
  data: SideBySideReportData;
  sideAName: string;
  sideBName: string;
};

export default function PremiumAplicacoes({ data, sideAName, sideBName }: Props) {
  const reduced = useReducedMotionClient();
  const apps = Array.isArray(data.applications) ? data.applications : [];

  const kpis = buildComparativeKpis(data);
  const top = kpis[0];
  let impactLine: string | null = null;
  if (top && top.valueA !== 0) {
    const d = ((top.valueB - top.valueA) / Math.abs(top.valueA)) * 100;
    if (Number.isFinite(d)) impactLine = `${d > 0 ? '+' : ''}${d.toFixed(1)}% em “${top.label}” (entre manejos)`;
  }

  return (
    <motion.section
      id="premium-aplicacoes"
      className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"
      initial={reduced ? false : { opacity: 0, y: 10 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Aplicações (registro operacional)</h2>
      <p className="text-xs text-slate-500 mb-4">Clima, bicos, produtos e custo por ha quando informados no app.</p>
      {apps.length > 0 && impactLine && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
          <span className="font-semibold">Resultado associado aos dados do relatório: </span>
          {impactLine}
          <span className="text-emerald-800/80"> — interpretação agronômica deve considerar o ensaio completo.</span>
        </div>
      )}
      {apps.length === 0 ? (
        <p className="text-sm text-slate-500">
          Nenhum registro na versão profissional de aplicações. Cadastre eventos na avaliação no app ou consulte o histórico legado mais abaixo, se houver.
        </p>
      ) : null}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {apps.map((ev, i) => {
          const total = applicationEventTotalCusto(ev);
          const sideLabel = ev.side === 'B' ? sideBName : sideAName;
          return (
            <div
              key={ev.id || i}
              className="rounded-xl border border-slate-100 bg-gradient-to-b from-slate-50/90 to-white p-4 space-y-2 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold text-slate-900">{ev.date ? formatDate(ev.date) : '—'}</span>
                {ev.stage && <span className="text-slate-600">• {ev.stage}</span>}
                {ev.daa != null && <span className="text-slate-500">• {ev.daa} DAA</span>}
                <span
                  className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                    ev.side === 'B' ? 'bg-sky-100 text-sky-900' : 'bg-emerald-100 text-emerald-900'
                  }`}
                >
                  {sideLabel}
                </span>
              </div>
              <p className="text-sm text-slate-800">
                <span className="font-medium">{ev.type || 'Aplicação'}</span>
                {ev.responsible && <span className="text-slate-600"> · {ev.responsible}</span>}
              </p>
              {(ev.climate?.temperature != null ||
                ev.climate?.humidity != null ||
                ev.climate?.wind != null ||
                ev.climate?.derivaRisco) && (
                <p className="text-xs text-slate-600 flex flex-wrap gap-x-2">
                  {ev.climate?.temperature != null && <span>🌡 {ev.climate.temperature}°C</span>}
                  {ev.climate?.humidity != null && <span>💧 {ev.climate.humidity}%</span>}
                  {ev.climate?.wind != null && <span>💨 {ev.climate.wind} km/h</span>}
                  {ev.climate?.derivaRisco && <span>Deriva: {ev.climate.derivaRisco}</span>}
                </p>
              )}
              {(ev.applicationTech?.bico || ev.applicationTech?.vazao != null || ev.applicationTech?.pressao != null) && (
                <p className="text-xs text-slate-600">
                  ⚙ {ev.applicationTech?.bico && `Bico ${ev.applicationTech.bico}`}
                  {ev.applicationTech?.vazao != null && ` · ${ev.applicationTech.vazao} L/min`}
                  {ev.applicationTech?.pressao != null && ` · ${ev.applicationTech.pressao} bar`}
                </p>
              )}
              {ev.scope === 'points' && (ev.point_ids?.length ?? 0) > 0 && (
                <p className="text-xs text-amber-800">Escopo: pontos específicos ({ev.point_ids!.length})</p>
              )}
              <div className="border-t border-slate-200/80 pt-2 mt-1">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">Produtos</p>
                <ul className="text-sm space-y-2">
                  {(ev.products || []).map((pr, j) => (
                    <li key={j} className="text-slate-700 border-l-2 border-sky-200 pl-2">
                      <span className="font-medium">{pr.nomeComercial || '—'}</span>
                      {pr.nomeAtivo && <span className="text-slate-500 text-xs"> · Ativo: {pr.nomeAtivo}</span>}
                      {pr.classe && <span className="text-slate-500"> ({pr.classe})</span>}
                      {pr.dose != null && pr.unidade && (
                        <div className="text-xs text-slate-600">
                          → {pr.dose} {pr.unidade.replace(/_/g, '/')}
                          {pr.custoHa != null && (
                            <span className="text-emerald-800 font-medium"> · R$ {formatNumber(pr.custoHa)}/ha</span>
                          )}
                        </div>
                      )}
                      {pr.linkedProtocolItemId && (
                        <div className="text-[10px] text-violet-700 mt-0.5">
                          Vinculado ao protocolo: {pr.linkedProtocolItemId.slice(0, 8)}…
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              {total > 0 && (
                <p className="text-sm font-semibold text-slate-900 pt-1">
                  Custo total (produtos): R$ {formatNumber(total)}/ha
                </p>
              )}
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
