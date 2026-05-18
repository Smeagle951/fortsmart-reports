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

function pointIdsLine(ids: string[] | undefined): string | null {
  if (!ids?.length) return null;
  const shown = ids.slice(0, 8);
  const more = ids.length > 8 ? ` +${ids.length - 8}` : '';
  return `${shown.join(', ')}${more}`;
}

function ApplicationBlock({ ev, accent }: { ev: ReportApplicationEventV2Json; accent: string }) {
  const c = ev.climate;
  const t = ev.applicationTech;
  const badge = protocolBadge(ev);
  const pid = ev.point_ids;
  const nPts = Array.isArray(pid) ? pid.length : 0;
  const ptsPretty = pointIdsLine(pid);
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
        {ev.stage?.trim() ? (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">{ev.stage.trim()}</span>
        ) : null}
        <span
          className={`ml-auto inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.ok ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}`}
        >
          {badge.ok ? '✓' : '⚠'} {badge.label}
        </span>
      </div>

      {(ev.scope?.trim() || nPts > 0 || ev.responsible?.trim()) && (
        <p className="mt-1.5 pl-2 text-[11px] text-slate-600">
          {ev.responsible?.trim() ? (
            <span className="font-medium text-slate-800">Resp.: {ev.responsible.trim()}</span>
          ) : null}
          {ev.responsible?.trim() && (ev.scope?.trim() || nPts > 0) ? (
            <span className="mx-1 text-slate-300">·</span>
          ) : null}
          {ev.scope?.trim() ? <span className="font-medium text-slate-800">Âmbito: {ev.scope.trim()}</span> : null}
          {ev.scope?.trim() && nPts > 0 ? <span className="mx-1 text-slate-300">·</span> : null}
          {nPts > 0 ? (
            <span>
              {nPts} ponto{nPts === 1 ? '' : 's'}
              {ptsPretty ? (
                <span className="mt-0.5 block font-mono text-[10px] text-slate-500">IDs: {ptsPretty}</span>
              ) : null}
            </span>
          ) : null}
        </p>
      )}

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
        {c?.derivaRisco?.trim() ? (
          <p className="col-span-2">
            <span className="text-slate-500">Risco deriva:</span>{' '}
            <span className="font-semibold text-slate-800">{c.derivaRisco.trim()}</span>
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
        <div className="mt-2 overflow-x-auto rounded-lg border border-slate-100 pl-2">
          <table className="w-full min-w-[260px] text-left text-[11px]">
            <thead>
              <tr className="border-b border-slate-100 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                <th className="py-1 pr-2">Produto</th>
                <th className="py-1 pr-2">Classe</th>
                <th className="py-1 pr-2">Dose</th>
                <th className="py-1">R$/ha</th>
                <th className="py-1">Prot.</th>
              </tr>
            </thead>
            <tbody>
              {ev.products.map((p, j) => (
                <tr key={j} className="border-b border-slate-50 last:border-0">
                  <td className="py-1.5 pr-2 font-semibold text-slate-900">
                    {p.nomeComercial || p.nomeAtivo || '—'}
                    {p.nomeAtivo && p.nomeComercial ? (
                      <span className="block text-[10px] font-normal text-slate-500">{p.nomeAtivo}</span>
                    ) : null}
                  </td>
                  <td className="py-1.5 pr-2 text-slate-600">{p.classe?.trim() || '—'}</td>
                  <td className="py-1.5 pr-2 tabular-nums">
                    {p.dose != null ? p.dose : '—'}
                    {p.unidade ? ` ${p.unidade}` : ''}
                  </td>
                  <td className="py-1.5 tabular-nums text-slate-800">
                    {p.custoHa != null ? `R$ ${formatNumber(p.custoHa, { decimals: 2 })}` : '—'}
                  </td>
                  <td className="py-1.5 text-center text-[10px]">
                    {p.linkedProtocolItemId?.trim() ? (
                      <span className="rounded bg-emerald-50 px-1 font-semibold text-emerald-800">Sim</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
  const protocol = data.treatment_protocol;
  const protocolNote = [protocol?.kind?.trim(), protocol?.note?.trim()].filter(Boolean).join(' — ');

  const sideModels = (['A', 'B'] as const).map((sideKey) => {
    const side = sides.find((s) => s.side === sideKey);
    const displayName = sideDisplayTitle(sideKey, side, data);
    const roleLine = sideRoleLine(sideKey, data);
    const headerBg = sideKey === 'A' ? 'bg-emerald-800' : 'bg-blue-900';
    const ring = sideKey === 'A' ? 'ring-emerald-200' : 'ring-blue-200';
    const accent = ACCENT[sideKey];
    const sideApps = sortedApps.filter((e) => e.side === sideKey);
    const planCount = dedupeProtocolProducts(side?.products ?? []).length;
    return { sideKey, side, displayName, roleLine, headerBg, ring, accent, sideApps, planCount };
  });

  const grid = (
    <div className="space-y-6" dir="ltr">
      {protocolNote ? (
        <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50/80 px-4 py-3 text-sm text-slate-700 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Planeamento (treatment_protocol)</span>
          <p className="mt-1 leading-snug text-slate-800">{protocolNote}</p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {sideModels.map((m) => (
          <motion.div
            key={`hdr-${m.sideKey}`}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md ring-2 ${m.ring}`}
          >
            <div className={`${m.headerBg} px-4 py-3 text-center text-white`}>
              <p className="text-lg font-black leading-tight tracking-tight">{m.displayName}</p>
              <p className="mt-1 text-[11px] opacity-90">{m.roleLine}</p>
              <p className="mt-0.5 text-[11px] opacity-85">
                {m.planCount} produto{m.planCount === 1 ? '' : 's'} no plano · {m.sideApps.length} aplicação
                {m.sideApps.length === 1 ? '' : 'ões'} registrada{m.sideApps.length === 1 ? '' : 's'}
              </p>
              {m.side?.is_control_side ? (
                <p className="mt-2 inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">Testemunha / controle</p>
              ) : null}
            </div>
            {m.side?.description?.trim() ? (
              <p className="border-b border-slate-100 bg-white px-4 py-2.5 text-[12px] leading-snug text-slate-600">{m.side.description!.trim()}</p>
            ) : null}
            {(m.side?.objective || m.side?.expected_result) && (
              <div className="space-y-2 bg-slate-50/70 px-4 py-3 text-[12px] leading-snug text-slate-700">
                {m.side?.objective ? (
                  <p>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Objetivo: </span>
                    {m.side.objective}
                  </p>
                ) : null}
                {m.side?.expected_result ? (
                  <p>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Resultado esperado: </span>
                    {m.side.expected_result}
                  </p>
                ) : null}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 items-start">
        {sideModels.map((m) => (
          <div
            key={`plan-${m.sideKey}`}
            className={`min-h-[120px] rounded-2xl border border-slate-200/90 bg-white p-4 shadow-md ring-2 ${m.ring} print:shadow-none`}
          >
            <p className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2 text-[10px] font-black uppercase tracking-wider text-slate-600">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: m.accent }} aria-hidden />
              Plano (protocolo) — {m.displayName}
            </p>
            {m.side ? (
              <ProtocolProductsTable products={m.side.products ?? []} accent={m.accent} />
            ) : (
              <p className="text-xs text-slate-500">Sem protocolo publicado para este lado.</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 items-start">
        {sideModels.map((m) => (
          <div
            key={`apps-${m.sideKey}`}
            className={`min-h-[160px] rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/60 p-4 shadow-md ring-1 ring-slate-200/80 print:shadow-none`}
          >
            <p className="mb-3 flex items-center gap-2 border-b border-slate-200/80 pb-2 text-[10px] font-black uppercase tracking-wider text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
              Execução em campo — {m.displayName}
            </p>
            {m.sideApps.length === 0 ? (
              <p className="text-xs text-slate-500">Nenhuma aplicação com este manejo no período publicado.</p>
            ) : (
              <div className="space-y-2.5">
                {m.sideApps.map((ev, i) => (
                  <ApplicationBlock key={ev.id || `${ev.date}-${ev.daa}-${i}`} ev={ev} accent={m.accent} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
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
