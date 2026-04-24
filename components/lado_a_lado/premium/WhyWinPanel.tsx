'use client';

import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { buildEvidenceRows } from './ExecutiveDeckSection';

/**
 * Evidências que sustentam a decisão — a partir de `decision_layer.decisionReasons` e primeiras linhas de evidência estatística/plantas.
 */
export default function WhyWinPanel({ data }: { data: SideBySideReportData }) {
  const reasons = (data.decision_layer?.decisionReasons ?? []).map((r) => r?.trim()).filter(Boolean) as string[];
  const evidence = buildEvidenceRows(data);
  const bullets: string[] = [...reasons];
  for (const row of evidence) {
    const w = row.winner === 'B' ? 'B' : row.winner === 'A' ? 'A' : null;
    if (!w) continue;
    const line = `${row.label}: lado ${w} à frente (${row.aValue} vs ${row.bValue})`;
    if (!bullets.includes(line)) bullets.push(line);
    if (bullets.length >= 6) break;
  }

  if (bullets.length === 0) return null;

  return (
    <div className="mx-auto max-w-[1140px] px-4 sm:px-6 pb-6">
      <div className="rounded-[var(--fs-r,10px)] border border-[var(--fs-border,rgba(0,0,0,0.08))] bg-white p-5 sm:p-6 shadow-sm">
        <h2 className="premium-font-serif text-lg sm:text-xl text-[var(--fs-ink,#1a1a18)] font-semibold">
          Por que um manejo se destaca?
        </h2>
        <p className="mt-1 text-xs text-[var(--fs-ink-md,#4a4a46)]">
          Lista derivada de motivos do motor e de critérios quantitativos publicados no JSON.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-[var(--fs-ink-md,#4a4a46)]">
          {bullets.slice(0, 6).map((b, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-[var(--fs-forest-md,#2d6a4f)] font-bold">✓</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
