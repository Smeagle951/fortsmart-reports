'use client';

import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import ScoreGauge from './ScoreGauge';

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

export default function FortSmartAiSection({ data }: { data: SideBySideReportData }) {
  const ai = data.decision_layer?.fortsmart_ai;
  if (!ai) return null;

  const score = safeNum(ai.score?.total);
  const klass = ai.score?.class || '';
  const sub = ai.subscores || {};
  const alerts = Array.isArray(ai.motor_alertas) ? ai.motor_alertas : [];
  const kb = ai.kb_snapshot || {};

  const subRows = [
    { key: 'fenologia', label: 'Fenologia', v: safeNum(sub.fenologia) },
    { key: 'doencas', label: 'Doenças', v: safeNum(sub.doencas) },
    { key: 'pragas', label: 'Pragas', v: safeNum(sub.pragas) },
    { key: 'estande', label: 'Estande', v: safeNum(sub.estande) },
    { key: 'nutricao', label: 'Nutrição', v: safeNum(sub.nutricao) },
  ].filter((r) => r.v != null);

  return (
    <section id="fortsmart-ai-premium" className="scroll-mt-28">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          FortSmart AI (offline)
        </h2>
        <p className="mt-2 text-slate-600 text-sm max-w-2xl leading-relaxed">
          Score e alertas calculados no app a partir de dados coletados e base de conhecimento versionada.
        </p>
      </div>

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
    </section>
  );
}

