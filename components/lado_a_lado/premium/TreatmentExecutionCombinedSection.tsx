'use client';

import { motion } from 'framer-motion';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import type { ReportApplicationEventV2Json, TreatmentProtocolSideJson } from '@/types/side-by-side-report';
import { formatWind } from '@/components/lado_a_lado/ladoALadoHelpers';
import { formatDate, formatNumber } from '@/utils/format';
import PremiumSectionShell from './PremiumSectionShell';

/** Título do teste: nome definido na criação da avaliação (sideA/sideB), não o rótulo do plano de protocolo isolado. */
function sideDisplayTitle(
  sideKey: 'A' | 'B',
  protocolSide: TreatmentProtocolSideJson | undefined,
  data: SideBySideReportData,
): string {
  const user = (sideKey === 'A' ? data.sideA?.name : data.sideB?.name)?.trim();
  if (user) return user;
  const fromProtocol = protocolSide?.name?.trim();
  if (fromProtocol) return fromProtocol;
  return `Manejo ${sideKey}`;
}

function sideRoleLine(sideKey: 'A' | 'B', data: SideBySideReportData): string {
  const lab = (sideKey === 'A' ? data.sideA?.label : data.sideB?.label)?.trim();
  if (lab) return lab;
  return `Tratamento ${sideKey}`;
}

function protocolBadge(ev: ReportApplicationEventV2Json): { label: string; ok: boolean } {
  const prods = ev.products ?? [];
  if (prods.length === 0) return { label: 'Sem produtos no registro', ok: true };
  const linked = prods.filter((p) => p.linkedProtocolItemId?.trim()).length;
  if (linked === prods.length) return { label: 'Seguiu protocolo', ok: true };
  if (linked === 0) return { label: 'Sem vínculo ao protocolo', ok: false };
  return { label: 'Parcial ao protocolo', ok: false };
}

function dedupeProtocolProducts(
  products: NonNullable<TreatmentProtocolSideJson['products']>,
): NonNullable<TreatmentProtocolSideJson['products']> {
  const seen = new Set<string>();
  const out: NonNullable<TreatmentProtocolSideJson['products']> = [];
  for (const p of products) {
    const key = [
      (p.name ?? '').toLowerCase().trim(),
      String(p.dose ?? p.dose_value ?? '').trim(),
      (p.dose_unit ?? '').toLowerCase().trim(),
      (p.active_ingredient ?? '').toLowerCase().trim(),
    ].join('\u0001');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

function ProtocolProductsTable({
  products,
  accent,
}: {
  products: NonNullable<TreatmentProtocolSideJson['products']>;
  accent: string;
}) {
  const list = dedupeProtocolProducts(products);
  if (!list.length) return <p className="text-xs text-slate-500">Nenhum produto no plano.</p>;
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
          {list.map((p, j) => (
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

function ApplicationBlock({ ev, accent }: { ev: ReportApplicationEventV2Json; accent: string }) {
  const c = ev.climate;
  const t = ev.applicationTech;
  const badge = protocolBadge(ev);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm"
    >
      <span className="absolute inset-y-2 left-0 w-1 rounded-r-full" style={{ backgroundColor: accent }} aria-hidden />
      <div className="flex flex-wrap items-center gap-2 pl-2">
        <span className="font-bold text-slate-900">{ev.date ? formatDate(ev.date) : '—'}</span>
        {ev.daa != null ? (
          <span
            className="rounded-md px-2 py-0.5 text-[10px] font-black tabular-nums text-white"
            style={{ backgroundColor: accent }}
          >
            {ev.daa} DAA
          </span>
        ) : null}
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{ev.type || 'Aplicação'}</span>
        <span
          className={`ml-auto inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.ok ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}`}
        >
          {badge.ok ? '✓' : '⚠'} {badge.label}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 border-y border-slate-100 py-1.5 pl-2 text-[11px]">
        {c?.temperature != null ? (
          <p>
            <span className="text-slate-500">Temp.:</span> <span className="font-semibold text-slate-800">{c.temperature}°C</span>
          </p>
        ) : null}
        {c?.humidity != null ? (
          <p>
            <span className="text-slate-500">U.R.:</span> <span className="font-semibold text-slate-800">{c.humidity}%</span>
          </p>
        ) : null}
        {c?.wind != null ? (
          <p>
            <span className="text-slate-500">Vento:</span> <span className="font-semibold text-slate-800">{formatWind(c.wind)}</span>
          </p>
        ) : null}
        {t?.bico ? (
          <p>
            <span className="text-slate-500">Bico:</span> <span className="font-semibold text-slate-800">{t.bico}</span>
          </p>
        ) : null}
        {t?.vazao != null ? (
          <p>
            <span className="text-slate-500">Vazão:</span> <span className="font-semibold text-slate-800">{t.vazao} L/min</span>
          </p>
        ) : null}
        {t?.pressao != null ? (
          <p>
            <span className="text-slate-500">Pressão:</span> <span className="font-semibold text-slate-800">{t.pressao}</span>
          </p>
        ) : null}
      </div>

      {ev.products && ev.products.length > 0 ? (
        <ul className="mt-2 space-y-1 pl-2 text-[11px]">
          {ev.products.map((p, j) => (
            <li key={j} className="flex flex-wrap items-baseline gap-x-2 text-slate-800">
              <span className="font-bold">{p.nomeComercial || 'Produto'}</span>
              {p.nomeAtivo ? <span className="text-slate-500">({p.nomeAtivo})</span> : null}
              <span className="text-slate-600">
                · {p.dose != null ? p.dose : '—'}
                {p.unidade ? ` ${p.unidade}` : ''}
                {p.custoHa != null ? ` · R$ ${formatNumber(p.custoHa, { decimals: 2 })}/ha` : ''}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-2 border-t border-slate-100 pl-2 pt-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Observações (técnico)</p>
        {ev.notes?.trim() ? (
          <p className="mt-0.5 whitespace-pre-wrap text-[11px] leading-snug text-slate-800">{ev.notes.trim()}</p>
        ) : (
          <p className="mt-0.5 text-[11px] italic text-amber-900">Sem observação nesta aplicação — complete no registro e publique de novo.</p>
        )}
      </div>
    </motion.div>
  );
}

/** A = esmeralda, B = azul (alinhado ao painel executivo e à secção combinada no deploy). */
const ACCENT: Record<'A' | 'B', string> = { A: '#15803d', B: '#1e40af' };

export default function TreatmentExecutionCombinedSection({
  data,
  embedded,
}: {
  data: SideBySideReportData;
  /** Sem capa PremiumSectionShell — para encaixar no relatório agronómico único. */
  embedded?: boolean;
}) {
  const sides = [...(data.treatment_protocol?.sides ?? [])].sort((a, b) => (a.side === 'A' ? -1 : b.side === 'A' ? 1 : 0));
  const apps = data.applications ?? [];
  const legacy = data.aplicacoes ?? [];

  if (sides.length === 0 && apps.length === 0 && legacy.length === 0) return null;

  if (apps.length === 0 && legacy.length > 0) {
    const legacyBody = (
      <ul className="grid gap-3 md:grid-cols-2">
        {legacy.map((a, i) => (
          <li key={i} className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
            <span className="font-semibold text-slate-900">{a.data ? formatDate(a.data) : '—'}</span>
            <span className="text-slate-600"> · {a.tipo || 'Aplicação'}</span>
            {a.produtos ? <p className="mt-1 text-slate-700">{a.produtos}</p> : null}
          </li>
        ))}
      </ul>
    );
    if (embedded) return <div className="space-y-3">{legacyBody}</div>;
    return (
      <PremiumSectionShell
        id="tratamento-execucao-premium"
        eyebrow="Protocolo e execução"
        title="Tratamento e aplicações"
        subtitle="Registros em formato resumido. Para detalhe completo (clima, bico, DAA, vínculo ao protocolo), publique o array applications no relatório."
      >
        {legacyBody}
      </PremiumSectionShell>
    );
  }

  const sortedApps = [...apps].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const grid = (
    <div className="grid grid-cols-2 gap-4 overflow-x-auto pb-1 lg:gap-6" dir="ltr">
      {(['A', 'B'] as const).map((sideKey) => {
        const side = sides.find((s) => s.side === sideKey);
        const displayName = sideDisplayTitle(sideKey, side, data);
        const roleLine = sideRoleLine(sideKey, data);
        const headerBg = sideKey === 'A' ? 'bg-emerald-800' : 'bg-blue-900';
        const ring = sideKey === 'A' ? 'ring-emerald-100' : 'ring-blue-100';
        const accent = ACCENT[sideKey];
        const sideApps = sortedApps.filter((e) => e.side === sideKey);
        const planCount = dedupeProtocolProducts(side?.products ?? []).length;

        return (
          <motion.div
            key={sideKey}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`min-w-[340px] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md ring-2 ${ring}`}
          >
            <div className={`${headerBg} px-4 py-3 text-center text-white`}>
              <p className="text-lg font-black leading-tight">{displayName}</p>
              <p className="mt-1 text-[11px] opacity-90">{roleLine}</p>
              <p className="mt-0.5 text-[11px] opacity-85">
                {planCount} produto{planCount === 1 ? '' : 's'} no plano · {sideApps.length} aplicação{sideApps.length === 1 ? '' : 'ões'} em
                campo
              </p>
            </div>

              {(side?.objective || side?.expected_result) && (
                <div className="space-y-2 border-b border-slate-100 bg-slate-50/60 px-4 py-3 text-[12px] leading-snug text-slate-700 sm:px-5">
                  {side?.objective ? (
                    <p>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Objetivo: </span>
                      {side.objective}
                    </p>
                  ) : null}
                  {side?.expected_result ? (
                    <p>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Resultado esperado: </span>
                      {side.expected_result}
                    </p>
                  ) : null}
                </div>
              )}

              <div className="grid gap-4 px-4 py-4 sm:px-5 xl:grid-cols-2">
                <div className="min-w-0">
                  <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-slate-900/5 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-700">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
                    Plano (protocolo)
                  </p>
                  {side ? (
                    <ProtocolProductsTable products={side.products ?? []} accent={accent} />
                  ) : (
                    <p className="text-xs text-slate-500">Sem protocolo publicado para este lado.</p>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-slate-900/5 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                    Aplicações realizadas
                  </p>
                  {sideApps.length === 0 ? (
                    <p className="text-xs text-slate-500">Nenhuma aplicação com este manejo no período publicado.</p>
                  ) : (
                    <div className="space-y-2">
                      {sideApps.map((ev, i) => (
                        <ApplicationBlock key={ev.id || `${ev.date}-${ev.daa}-${i}`} ev={ev} accent={accent} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
        );
      })}
    </div>
  );

  if (embedded) return <div className="space-y-2">{grid}</div>;

  return (
    <PremiumSectionShell
      id="tratamento-execucao-premium"
      eyebrow="Protocolo e execução"
      title="Tratamento planejado e aplicações em campo"
      subtitle="Nomes dos manejos refletem os testes definidos na criação da avaliação. O plano mostra o protocolo; ao lado, as aplicações realizadas com detalhe de clima e equipamento."
    >
      {grid}
    </PremiumSectionShell>
  );
}
