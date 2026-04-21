'use client';

function ratio(a: number, b: number): string {
  if (b <= 0) return '—';
  return (a / b).toFixed(2);
}

export function BalancePanel({ normalized }: { normalized: Record<string, unknown> | null | undefined }) {
  if (!normalized) return <p className="text-sm text-slate-500">—</p>;
  const ca = Number(normalized.ca_cmol) || 0;
  const mg = Number(normalized.mg_cmol) || 0;
  const kMg = Number(normalized.k_mg_kg) || 0;
  const kCmol = normalized.k_cmol != null ? Number(normalized.k_cmol) : kMg / 391;
  const caMg = ratio(ca, mg);
  const kMgR = ratio(kCmol, mg);

  return (
    <div className="space-y-2 text-sm">
      <div className="rounded border border-slate-200 bg-white p-3">
        <div className="font-semibold text-slate-800">Ca / Mg</div>
        <div className="font-mono text-slate-700">{caMg}</div>
        <div className="text-xs text-slate-500">Valores em cmol/dm³ (aprox.)</div>
      </div>
      <div className="rounded border border-slate-200 bg-white p-3">
        <div className="font-semibold text-slate-800">K / Mg</div>
        <div className="font-mono text-slate-700">{kMgR}</div>
        {Number(kMgR) > 2.5 && (
          <div className="mt-1 text-xs font-medium text-amber-700">Relação K/Mg elevada — ver antagonismo.</div>
        )}
      </div>
    </div>
  );
}
