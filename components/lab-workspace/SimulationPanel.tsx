'use client';

export function SimulationPanel({ insight }: { insight: Record<string, unknown> | null | undefined }) {
  const ctx = (insight?.contexto_dinamico as Record<string, unknown> | undefined) ?? undefined;
  const sim = (ctx?.simulacao as Record<string, unknown> | undefined) ?? undefined;
  const antes = (sim?.antes as Record<string, unknown> | undefined)?.produtividade_estimada_sc_ha;
  const depois = (sim?.depois as Record<string, unknown> | undefined)?.produtividade_estimada_sc_ha;
  if (antes == null && depois == null) {
    return <p className="text-sm text-slate-500">Sem simulação no payload (meta ou ações planeadas ausentes).</p>;
  }
  const a = Number(antes);
  const d = Number(depois);
  const diff = Number.isFinite(a) && Number.isFinite(d) ? d - a : null;
  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-4 text-sm">
      <div className="font-semibold text-slate-800">Simulação produtividade</div>
      <div className="mt-2 font-mono text-slate-900">
        Atual: <strong>{antes != null ? String(antes) : '—'}</strong> sc/ha → Corrigido:{' '}
        <strong>{depois != null ? String(depois) : '—'}</strong> sc/ha
      </div>
      {diff != null && (
        <div className="mt-1 font-mono text-emerald-700">
          Diferença: {diff > 0 ? '+' : ''}
          {diff.toFixed(1)} sc/ha
        </div>
      )}
    </div>
  );
}
