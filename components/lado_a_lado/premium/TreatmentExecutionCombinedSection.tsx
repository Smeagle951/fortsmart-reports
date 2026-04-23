'use client';

import { motion } from 'framer-motion';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import type { ReportApplicationEventV2Json } from '@/types/side-by-side-report';
import type { TreatmentProtocolSideJson } from '@/types/side-by-side-report';
import { COLOR_SIDE_A, COLOR_SIDE_B, formatWind } from '@/components/lado_a_lado/ladoALadoHelpers';
import { formatDate, formatNumber } from '@/utils/format';
import PremiumSectionShell from './PremiumSectionShell';

function protocolBadge(ev: ReportApplicationEventV2Json): { label: string; ok: boolean } {
  const prods = ev.products ?? [];
  if (prods.length === 0) return { label: 'Sem produtos no registro', ok: true };
  const linked = prods.filter((p) => p.linkedProtocolItemId?.trim()).length;
  if (linked === prods.length) return { label: 'Seguiu protocolo', ok: true };
  if (linked === 0) return { label: 'Sem vínculo ao protocolo', ok: false };
  return { label: 'Parcial ao protocolo', ok: false };
}

function ProtocolProductsTable({
  products,
  accent,
}: {
  products: NonNullable<TreatmentProtocolSideJson['products']>;
  accent: string;
}) {
  if (!products.length) return <p className="text-xs text-slate-500">Nenhum produto no plano.</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[280px] text-left text-xs">
        <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-2 py-2">Produto</th>
            <th className="px-2 py-2">Ingrediente</th>
            <th className="px-2 py-2">Dose</th>
            <th className="px-2 py-2">R$/ha</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, j) => (
            <tr key={j} className="border-t border-slate-100" style={{ borderLeftWidth: 3, borderLeftColor: accent }}>
              <td className="px-2 py-2 font-semibold text-slate-900">{p.name}</td>
              <td className="px-2 py-2 text-slate-600">{p.active_ingredient || '—'}</td>
              <td className="px-2 py-2 tabular-nums text-slate-700">
                {p.dose != null ? String(p.dose) : p.dose_value != null ? String(p.dose_value) : '—'}
                {p.dose_unit ? ` ${p.dose_unit}` : ''}
              </td>
              <td className="px-2 py-2 tabular-nums text-slate-800">
                {p.cost_per_ha != null ? `R$ ${formatNumber(p.cost_per_ha, { decimals: 2 })}` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ApplicationBlock({ ev }: { ev: ReportApplicationEventV2Json }) {
  const c = ev.climate;
  const t = ev.applicationTech;
  const badge = protocolBadge(ev);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-bold text-slate-900">{ev.date ? formatDate(ev.date) : '—'}</span>
        {ev.daa != null ? <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold">{ev.daa} DAA</span> : null}
        <span className="text-[10px] font-bold uppercase text-slate-500">{ev.type || 'Aplicação'}</span>
      </div>
      {c && (c.temperature != null || c.humidity != null || c.wind != null) ? (
        <p className="mt-2 text-[11px] text-slate-600">
          Clima:{' '}
          {[c.temperature != null ? `${c.temperature}°C` : null, c.humidity != null ? `${c.humidity}%` : null, c.wind != null ? `Vento ${formatWind(c.wind)}` : null]
            .filter(Boolean)
            .join(' · ')}
        </p>
      ) : null}
      {(t?.bico != null || t?.vazao != null || t?.pressao != null) && (
        <p className="mt-1 text-[11px] text-slate-600">
          Equipamento:{' '}
          {[t?.bico && `Bico ${t.bico}`, t?.vazao != null && `Vazão ${t.vazao} L/min`, t?.pressao != null && `Pressão ${t.pressao}`].filter(Boolean).join(' · ')}
        </p>
      )}
      {ev.products && ev.products.length > 0 ? (
        <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2 text-[11px]">
          {ev.products.map((p, j) => (
            <li key={j} className="text-slate-800">
              <span className="font-semibold">{p.nomeComercial || 'Produto'}</span>
              {p.nomeAtivo ? <span className="text-slate-500"> ({p.nomeAtivo})</span> : null}
              <span className="text-slate-600">
                {' '}
                · dose {p.dose != null ? p.dose : '—'}
                {p.unidade ? ` ${p.unidade}` : ''}
                {p.custoHa != null ? ` · R$ ${formatNumber(p.custoHa, { decimals: 2 })}/ha` : ''}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-2">
        <span
          className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.ok ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}`}
        >
          {badge.ok ? '✓' : '⚠'} {badge.label}
        </span>
      </div>
    </motion.div>
  );
}

export default function TreatmentExecutionCombinedSection({ data }: { data: SideBySideReportData }) {
  const sides = [...(data.treatment_protocol?.sides ?? [])].sort((a, b) => (a.side === 'A' ? -1 : b.side === 'A' ? 1 : 0));
  const apps = data.applications ?? [];
  const legacy = data.aplicacoes ?? [];

  if (sides.length === 0 && apps.length === 0 && legacy.length === 0) return null;

  if (apps.length === 0 && legacy.length > 0) {
    return (
      <PremiumSectionShell
        id="tratamento-execucao-premium"
        eyebrow="Protocolo e execução"
        title="Tratamento e aplicações"
        subtitle="Registros em formato resumido. Para detalhe completo (clima, bico, DAA, vínculo ao protocolo), publique o array applications no relatório."
      >
        <ul className="grid gap-3 md:grid-cols-2">
          {legacy.map((a, i) => (
            <li key={i} className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
              <span className="font-semibold text-slate-900">{a.data ? formatDate(a.data) : '—'}</span>
              <span className="text-slate-600"> · {a.tipo || 'Aplicação'}</span>
              {a.produtos ? <p className="mt-1 text-slate-700">{a.produtos}</p> : null}
            </li>
          ))}
        </ul>
      </PremiumSectionShell>
    );
  }

  const sortedApps = [...apps].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  return (
    <PremiumSectionShell
      id="tratamento-execucao-premium"
      eyebrow="Protocolo e execução"
      title="Tratamento planejado e aplicações em campo"
      subtitle="Plano por manejo (produtos e doses) e, abaixo, as aplicações realizadas com data, DAA, clima, equipamento e produtos aplicados — alinhado ao registo detalhado no app."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {(['A', 'B'] as const).map((sideKey) => {
          const side = sides.find((s) => s.side === sideKey);
          const name = sideKey === 'A' ? data.sideA?.name || 'Manejo A' : data.sideB?.name || 'Manejo B';
          const headerBg = sideKey === 'A' ? 'bg-blue-800' : 'bg-emerald-800';
          const ring = sideKey === 'A' ? 'ring-blue-100' : 'ring-emerald-100';
          const accent = sideKey === 'A' ? COLOR_SIDE_A : COLOR_SIDE_B;
          const sideApps = sortedApps.filter((e) => e.side === sideKey);

          return (
            <motion.div
              key={sideKey}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`flex flex-col gap-4 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm ring-2 ${ring}`}
            >
              <div className={`${headerBg} text-white px-4 py-3 text-center`}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-95">Manejo {sideKey}</p>
                <p className="font-bold text-lg">{side?.name ?? name}</p>
                <p className="text-[11px] opacity-85">Plano e execução</p>
              </div>
              <div className="space-y-4 px-4 pb-4 pt-2 sm:px-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Plano (protocolo)</p>
                  {side ? (
                    <div className="mt-2 space-y-2 text-sm text-slate-700">
                      {side.objective ? (
                        <p>
                          <span className="text-xs font-semibold text-slate-500">Objetivo</span>
                          <br />
                          {side.objective}
                        </p>
                      ) : null}
                      {side.expected_result ? (
                        <p>
                          <span className="text-xs font-semibold text-slate-500">Resultado esperado</span>
                          <br />
                          {side.expected_result}
                        </p>
                      ) : null}
                      <ProtocolProductsTable products={side.products ?? []} accent={accent} />
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">Sem protocolo publicado para este lado.</p>
                  )}
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Aplicações realizadas</p>
                  {sideApps.length === 0 ? (
                    <p className="mt-2 text-xs text-slate-500">Nenhuma aplicação com este manejo no período publicado.</p>
                  ) : (
                    <div className="mt-2 space-y-3">
                      {sideApps.map((ev, i) => (
                        <ApplicationBlock key={ev.id || `${ev.date}-${ev.daa}-${i}`} ev={ev} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </PremiumSectionShell>
  );
}
