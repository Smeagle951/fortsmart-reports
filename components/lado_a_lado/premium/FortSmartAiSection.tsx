'use client';

import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import type { FortsmartAiEconomicSideBlock } from '@/lib/decisionLayer';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ScoreGauge from './ScoreGauge';
import PremiumSectionShell from './PremiumSectionShell';

function levelColor(lvl: string | undefined): string {
  switch ((lvl || '').toLowerCase()) {
    case 'critico':
      return 'border-rose-200 bg-rose-50 text-rose-950';
    case 'atencao':
      return 'border-orange-200 bg-orange-50 text-orange-950';
    case 'monitorar':
      return 'border-amber-200 bg-amber-50 text-amber-950';
    case 'ok':
      return 'border-emerald-200 bg-emerald-50 text-emerald-950';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-900';
  }
}

function safeNum(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return null;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
}

function confidenceLabelPt(label: string | undefined): string {
  const l = (label || '').toLowerCase();
  if (l === 'alta') return 'Alta';
  if (l === 'media') return 'Média';
  if (l === 'baixa') return 'Baixa';
  return label?.trim() || '—';
}

function EconomicMarginChart({
  sides,
  nameA,
  nameB,
}: {
  sides: Record<string, FortsmartAiEconomicSideBlock>;
  nameA: string;
  nameB: string;
}) {
  const rows: { key: string; label: string; margin: number }[] = [];
  const a = sides.A;
  const b = sides.B;
  const mA = a && typeof a.margin === 'number' && Number.isFinite(a.margin) ? a.margin : null;
  const mB = b && typeof b.margin === 'number' && Number.isFinite(b.margin) ? b.margin : null;
  if (mA != null) rows.push({ key: 'A', label: nameA.trim() || 'Lado A', margin: mA });
  if (mB != null) rows.push({ key: 'B', label: nameB.trim() || 'Lado B', margin: mB });
  if (rows.length === 0) return null;

  return (
    <div className="h-56 w-full min-w-0 mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-slate-600" />
          <YAxis
            tick={{ fontSize: 11 }}
            className="text-slate-600"
            tickFormatter={(v) => `R$ ${Number(v).toFixed(0)}`}
          />
          <Tooltip
            formatter={(value: number) => [`R$ ${value.toFixed(1)}/ha`, 'Margem']}
            labelFormatter={(_, p) => (p?.[0]?.payload as { label?: string })?.label ?? ''}
            contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }}
          />
          <Bar dataKey="margin" fill="#059669" radius={[8, 8, 0, 0]} name="Margem (R$/ha)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function FortSmartAiSection({ data }: { data: SideBySideReportData }) {
  const ai = data.decision_layer?.fortsmart_ai;
  if (!ai) return null;

  const v2 = ai.fortsmart_ai_v2;
  const nm = v2?.numeric_model;
  const showV2 = Boolean(v2?.kb_v2_loaded && nm && typeof nm === 'object');

  const score = safeNum(ai.score?.total);
  const klass = ai.score?.class || '';
  const sub = ai.subscores || {};
  const alerts = Array.isArray(ai.motor_alertas) ? ai.motor_alertas : [];
  const kb = ai.kb_snapshot || {};
  const explanations = asStringArray(ai.explanations);
  const conf = ai.confidence;
  const confScore = conf && typeof conf.score === 'number' && Number.isFinite(conf.score) ? conf.score : null;
  const economicSides = ai.economic?.sides;
  const nameA = data.sideA?.name ?? 'Lado A';
  const nameB = data.sideB?.name ?? 'Lado B';

  const subRows = [
    { key: 'fenologia', label: 'Fenologia', v: safeNum(sub.fenologia) },
    { key: 'doencas', label: 'Doenças', v: safeNum(sub.doencas) },
    { key: 'pragas', label: 'Pragas', v: safeNum(sub.pragas) },
    { key: 'estande', label: 'Estande', v: safeNum(sub.estande) },
    { key: 'nutricao', label: 'Nutrição', v: safeNum(sub.nutricao) },
  ].filter((r) => r.v != null);

  return (
    <PremiumSectionShell
      id="fortsmart-ai-premium"
      eyebrow="Motor de síntese"
      title="FortSmart AI"
      subtitle="Score, subscores e alertas calculados no dispositivo a partir dos dados publicados e da base de conhecimento versionada — sem chamadas a API externa nesta visualização."
    >
      <div className="grid lg:grid-cols-[240px_1fr] gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Sanidade (0–100)</p>
          <div className="mt-4 flex items-center justify-center">
            {score != null ? <ScoreGauge value={score} max={100} size={180} /> : <div className="text-slate-500">—</div>}
          </div>
          <p className="mt-3 text-center text-sm font-semibold text-slate-800">
            {klass?.trim() ? klass : score != null ? '—' : 'Sem dado'}
          </p>
        </div>

        <div className="space-y-5">
          {explanations.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">Porquê este score</p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700 leading-relaxed">
                {explanations.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {confScore != null ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">Confiança do modelo</p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-800">
                  {confidenceLabelPt(conf?.label)}
                </span>
                <span className="text-sm text-slate-600 tabular-nums">
                  cobertura agregada ~{(confScore * 100).toFixed(0)}%
                </span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-2 bg-sky-600"
                  style={{ width: `${Math.max(0, Math.min(100, confScore * 100))}%` }}
                />
              </div>
            </div>
          ) : null}

          {economicSides && Object.keys(economicSides).length > 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">Contexto económico (resumo)</p>
              <p className="text-xs text-slate-500 mb-2">
                Valores espelhados do motor de decisão quando o relatório inclui ROI por lado.
              </p>
              <EconomicMarginChart sides={economicSides} nameA={nameA} nameB={nameB} />
              <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
                {(['A', 'B'] as const).map((side) => {
                  const block = economicSides[side];
                  if (!block) return null;
                  const roi = safeNum(block.roiPct);
                  const cost = safeNum(block.cost);
                  const margin = safeNum(block.margin);
                  if (roi == null && cost == null && margin == null) return null;
                  const title = side === 'A' ? nameA : nameB;
                  return (
                    <div key={side} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{title}</p>
                      {margin != null ? (
                        <p className="mt-1 text-slate-800">
                          Margem: <span className="font-semibold tabular-nums">R$ {margin.toFixed(1)}/ha</span>
                        </p>
                      ) : null}
                      {cost != null ? (
                        <p className="text-slate-800">
                          Custo: <span className="font-semibold tabular-nums">R$ {cost.toFixed(1)}/ha</span>
                        </p>
                      ) : null}
                      {roi != null ? (
                        <p className="text-slate-800">
                          ROI: <span className="font-semibold tabular-nums">{roi.toFixed(1)}%</span>
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {showV2 ? (
            <div className="rounded-2xl border border-sky-200 bg-sky-50/40 p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-widest text-sky-800 mb-1">
                Motor quantitativo (V2)
              </p>
              <p className="text-xs text-slate-600 mb-4">
                Estimativa de produtividade, fatores limitantes e economia quando a base V2 está carregada no relatório.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                {nm?.culture ? (
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Cultura (modelo)</span>
                    <p className="mt-1 font-semibold text-slate-900">{String(nm.culture)}</p>
                  </div>
                ) : null}
                {nm?.region != null && String(nm.region).trim().length > 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Região</span>
                    <p className="mt-1 font-semibold text-slate-900">{String(nm.region)}</p>
                  </div>
                ) : null}
                {safeNum(nm?.yield_estimate) != null ? (
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Produtividade estimada</span>
                    <p className="mt-1 font-semibold tabular-nums text-slate-900">
                      {safeNum(nm?.yield_estimate)!.toFixed(0)} kg/ha
                    </p>
                  </div>
                ) : null}
                {safeNum(nm?.yield_target) != null ? (
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Meta / referência</span>
                    <p className="mt-1 font-semibold tabular-nums text-slate-900">
                      {safeNum(nm?.yield_target)!.toFixed(0)} kg/ha
                    </p>
                  </div>
                ) : null}
                {safeNum(nm?.yield_gap) != null ? (
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Gap produtivo</span>
                    <p className="mt-1 font-semibold tabular-nums text-slate-900">
                      {safeNum(nm?.yield_gap)!.toFixed(0)} kg/ha
                    </p>
                  </div>
                ) : null}
                {safeNum(nm?.interaction_factor) != null ? (
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Fator de interação</span>
                    <p className="mt-1 font-semibold tabular-nums text-slate-900">
                      {safeNum(nm?.interaction_factor)!.toFixed(2)}
                    </p>
                  </div>
                ) : null}
                {safeNum(nm?.lime_t_ha) != null ? (
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Calagem (t/ha)</span>
                    <p className="mt-1 font-semibold tabular-nums text-slate-900">
                      {safeNum(nm?.lime_t_ha)!.toFixed(2)}
                    </p>
                  </div>
                ) : null}
              </div>
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                {[
                  { key: 'solo', label: 'Solo', v: safeNum(nm?.soil_score) },
                  { key: 'nut', label: 'Nutrição', v: safeNum(nm?.nutrition_score) },
                  { key: 'cli', label: 'Clima', v: safeNum(nm?.climate_score) },
                  { key: 'fin', label: 'Score final', v: safeNum(nm?.final_score) },
                ]
                  .filter((r) => r.v != null)
                  .map((r) => (
                    <div key={r.key} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-slate-800">{r.label}</span>
                        <span className="text-sm font-bold tabular-nums text-slate-900">{r.v!.toFixed(0)}</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-2 bg-sky-600" style={{ width: `${Math.max(0, Math.min(100, r.v!))}%` }} />
                      </div>
                    </div>
                  ))}
              </div>
              {Array.isArray(nm?.limiting_factors) && nm!.limiting_factors!.length > 0 ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2">
                  <p className="text-xs font-bold text-amber-900 uppercase tracking-wide mb-1">Fatores limitantes</p>
                  <ul className="list-disc pl-5 text-sm text-amber-950 space-y-1">
                    {nm.limiting_factors!.slice(0, 8).map((x: string, idx: number) => (
                      <li key={idx}>{x}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {nm?.economic &&
              (safeNum(nm.economic.revenue) != null ||
                safeNum(nm.economic.roi) != null ||
                safeNum(nm.economic.cost_brl_ha) != null ||
                typeof nm.economic.viable === 'boolean') ? (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 px-3 py-3 text-sm">
                  <p className="text-xs font-bold text-emerald-900 uppercase tracking-wide mb-2">Economia (V2)</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-800">
                    {safeNum(nm.economic.revenue) != null ? (
                      <span>
                        Receita:{' '}
                        <span className="font-semibold tabular-nums">R$ {safeNum(nm.economic.revenue)!.toFixed(0)}/ha</span>
                      </span>
                    ) : null}
                    {safeNum(nm.economic.cost_brl_ha) != null ? (
                      <span>
                        Custo:{' '}
                        <span className="font-semibold tabular-nums">R$ {safeNum(nm.economic.cost_brl_ha)!.toFixed(0)}/ha</span>
                      </span>
                    ) : null}
                    {safeNum(nm.economic.roi) != null ? (
                      <span>
                        ROI: <span className="font-semibold tabular-nums">{safeNum(nm.economic.roi)!.toFixed(1)}%</span>
                      </span>
                    ) : null}
                    {typeof nm.economic.viable === 'boolean' ? (
                      <span className="font-semibold">{nm.economic.viable ? 'Viável' : 'Baixa viabilidade'}</span>
                    ) : null}
                  </div>
                </div>
              ) : null}
              {Array.isArray(nm?.recommendations) && nm!.recommendations!.length > 0 ? (
                <div className="mt-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Recomendações (V2)</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                    {nm.recommendations!.slice(0, 12).map((line: string, idx: number) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          {subRows.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">Subscores</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {subRows.map((r) => (
                  <div key={r.key} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-800">{r.label}</span>
                      <span className="text-sm font-bold tabular-nums text-slate-900">{r.v!.toFixed(0)}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-2 bg-emerald-600" style={{ width: `${Math.max(0, Math.min(100, r.v!))}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {alerts.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">Alertas</p>
              <div className="space-y-3">
                {alerts.slice(0, 12).map((a, i) => {
                  const id = (a as any)?.id as string | undefined;
                  const titulo = (a as any)?.titulo as string | undefined;
                  const msg = (a as any)?.mensagem as string | undefined;
                  const nivel = (a as any)?.nivel as string | undefined;
                  const actions = Array.isArray((a as any)?.acao_sugerida) ? ((a as any).acao_sugerida as string[]) : [];
                  return (
                    <div key={`${id || 'a'}_${i}`} className={`rounded-xl border px-4 py-3 ${levelColor(nivel)}`}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-sm">{titulo || 'Alerta'}</p>
                        <span className="text-[11px] font-bold uppercase tracking-widest opacity-70">{id || nivel || ''}</span>
                      </div>
                      {msg ? <p className="mt-1 text-sm opacity-90">{msg}</p> : null}
                      {actions.length > 0 ? (
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {actions.map((x, idx) => (
                            <li
                              key={idx}
                              className="rounded-full border border-black/10 bg-white/40 px-3 py-1 text-xs font-semibold"
                            >
                              {x}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Base utilizada</p>
            <p className="text-sm text-slate-800">
              {[kb.cultura, kb.versao, kb.safra].filter(Boolean).join(' · ') || '—'}
            </p>
            {Array.isArray(kb.fontes) && kb.fontes.length > 0 ? (
              <ul className="mt-2 list-disc pl-5 text-xs text-slate-600 space-y-1">
                {kb.fontes.slice(0, 6).map((f: any, idx: number) => (
                  <li key={idx}>{String(f)}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </PremiumSectionShell>
  );
}

