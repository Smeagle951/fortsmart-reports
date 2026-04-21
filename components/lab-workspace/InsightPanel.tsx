'use client';

export function InsightPanel({ payload }: { payload: Record<string, unknown> | null | undefined }) {
  if (!payload) return <p className="text-sm text-slate-500">Importe um JSON.</p>;
  const blocked = payload.blocked === true;
  const blockReasons = Array.isArray(payload.block_reasons)
    ? (payload.block_reasons as unknown[]).map((x) => String(x))
    : [];
  const locks = Array.isArray(payload.locks) ? (payload.locks as Record<string, unknown>[]) : [];
  const alerts = Array.isArray(payload.alerts)
    ? (payload.alerts as unknown[]).map((x) => String(x))
    : [];
  const insight = payload.insight as Record<string, unknown> | undefined;
  const ctx = insight?.contexto_dinamico as Record<string, unknown> | undefined;
  const roi = ctx?.roi_analysis_auto as Record<string, unknown> | undefined;
  const motor = ctx?.motor_decisao_fontes as Record<string, unknown> | undefined;

  return (
    <div className="space-y-3 text-sm">
      {blocked && (
        <section className="rounded border border-red-300 bg-red-50 p-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-red-800">Bloqueado</h3>
          <ul className="mt-2 list-inside list-disc text-red-900">
            {blockReasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          {locks.filter((l) => l.severity == null || l.severity === 'error').length > 0 && (
            <p className="mt-2 font-mono text-[11px] text-red-800">
              {locks
                .filter((l) => l.severity == null || l.severity === 'error')
                .map((l) => String(l.code ?? ''))
                .filter(Boolean)
                .join(', ')}
            </p>
          )}
        </section>
      )}
      {locks.some((l) => l.severity === 'warning') && (
        <section className="rounded border border-amber-200 bg-amber-50 p-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-amber-900">Avisos (sanidade)</h3>
          <ul className="mt-2 list-inside list-disc text-amber-950">
            {locks
              .filter((l) => l.severity === 'warning')
              .map((l, i) => (
                <li key={i}>{String(l.message ?? l.code ?? '')}</li>
              ))}
          </ul>
        </section>
      )}
      {alerts.length > 0 && (
        <section className="rounded border border-slate-200 bg-slate-50 p-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">Alertas</h3>
          <ul className="mt-2 list-inside list-disc text-slate-800">
            {alerts.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </section>
      )}
      <section className="rounded border border-slate-200 bg-white p-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Causa raiz</h3>
        <p className="mt-1 text-slate-800">{String(insight?.causa_raiz ?? '—')}</p>
      </section>
      <section className="rounded border border-slate-200 bg-white p-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Impacto</h3>
        <p className="mt-1 text-slate-800">{String(insight?.resumo ?? '—')}</p>
      </section>
      <section className="rounded border border-slate-200 bg-white p-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Ação</h3>
        <p className="mt-1 text-slate-800">{String(insight?.acao_prioritaria ?? '—')}</p>
        {motor?.recommended_source != null && String(motor.recommended_source).length > 0 ? (
          <p className="mt-2 font-mono text-xs text-slate-600">Fonte: {String(motor.recommended_source)}</p>
        ) : null}
      </section>
      {roi && (
        <section className="rounded border border-emerald-200 bg-emerald-50 p-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-emerald-800">ROI (motor)</h3>
          <p className="mt-1 font-mono text-emerald-900">
            Lucro líquido: R$ {Number(roi.lucro_liquido).toFixed(0)}/ha
          </p>
          <p className="font-mono text-xs text-emerald-800">ROI: {Number(roi.roi).toFixed(3)}</p>
        </section>
      )}
    </div>
  );
}
