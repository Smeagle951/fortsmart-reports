'use client';

import type { SideBySideReportData } from '@/components/SideBySideReportContent';

/**
 * Alertas agronómicos a partir de `ocorrencias`, `quality_check`, `diagnostics` e alertas FortSmart AI — sem texto inventado.
 */
export default function AgronomicAlertBanner({ data }: { data: SideBySideReportData }) {
  const lines: { title: string; body: string; key: string }[] = [];

  const ocs = data.ocorrencias ?? [];
  for (let i = 0; i < Math.min(ocs.length, 3); i++) {
    const o = ocs[i];
    const nome = o?.nomeAlvo?.trim() || o?.tipo?.trim();
    if (!nome) continue;
    const sev = o?.severidade?.trim();
    const inc = o?.incidenciaPct != null ? `${formatPct(o.incidenciaPct)}% incidência` : null;
    const rec = o?.recomendacao?.trim();
    lines.push({
      key: `occ-${i}`,
      title: nome,
      body: [sev, inc, rec].filter(Boolean).join(' · ') || 'Registo fitossanitário no relatório.',
    });
  }

  const warns = data.quality_check?.warnings ?? [];
  for (let i = 0; i < Math.min(warns.length, 2); i++) {
    const w = warns[i]?.trim();
    if (!w) continue;
    lines.push({ key: `qc-${i}`, title: 'Qualidade dos dados', body: w });
  }

  const fito = data.diagnostics?.standImpactScHa;
  if (data.diagnostics?.standLoss != null && data.diagnostics.standLoss > 0) {
    lines.push({
      key: 'stand',
      title: 'Estande',
      body: `Perda declarada: ${formatPct(data.diagnostics.standLoss)}%${fito != null ? ` · impacto estimado ${formatNum(fito)} sc/ha` : ''}.`,
    });
  }

  const aiAlerts = data.decision_layer?.fortsmart_ai?.motor_alertas ?? [];
  for (let i = 0; i < Math.min(aiAlerts.length, 2); i++) {
    const a = aiAlerts[i];
    const t = a?.titulo?.trim();
    const m = a?.mensagem?.trim();
    if (!t && !m) continue;
    lines.push({
      key: `ai-${i}`,
      title: t || 'FortSmart AI',
      body: m || '',
    });
  }

  if (lines.length === 0) return null;

  return (
    <div className="mx-auto max-w-[1140px] px-4 sm:px-6 pb-4">
      <div className="rounded-lg border-l-4 border-amber-500 bg-[#fff4e5] px-4 py-3 sm:px-5 sm:py-4 text-sm text-amber-950 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Alertas agronómicos e de dados</p>
        <ul className="mt-2 space-y-2">
          {lines.map((l) => (
            <li key={l.key}>
              <span className="font-semibold">{l.title}: </span>
              <span className="text-amber-950/90">{l.body}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function formatPct(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function formatNum(n: number): string {
  return Math.abs(n - Math.round(n)) < 0.05 ? String(Math.round(n)) : n.toFixed(1);
}
