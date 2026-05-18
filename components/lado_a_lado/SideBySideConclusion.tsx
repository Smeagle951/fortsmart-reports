'use client';

import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { displayWinnerLetter } from '@/components/lado_a_lado/premium/premiumInference';
import { sideLabel } from '@/lib/lado-a-lado-official/selectors';
import { FS } from '@/lib/lado-a-lado-official/theme';

export default function SideBySideConclusion({ data }: { data: SideBySideReportData }) {
  const c = data.conclusion;
  const winner = displayWinnerLetter(data);
  const summary = c?.summary?.trim() || c?.headline?.trim();
  const recs = c?.recommendations ?? [];
  const sig = c?.signature;

  if (!summary && recs.length === 0) return null;

  return (
    <section className="fs-section">
      <div
        className="fs-official-card overflow-hidden"
        style={{ borderTop: `4px solid ${FS.green}` }}
      >
        <div className="p-6">
          <h2 className="fs-official-section-title">Conclusão Técnica</h2>
          {summary ? (
            <p className="mt-3 text-sm leading-relaxed text-[#374151]">{summary}</p>
          ) : null}
          {winner ? (
            <p className="mt-4 rounded-xl bg-[#E8F5E9] px-4 py-3 text-sm font-semibold text-[#1B5E20]">
              Decisão recomendada: adotar {sideLabel(data, winner)} (Lado {winner}) com base nos
              indicadores publicados.
            </p>
          ) : (
            <p className="mt-4 text-sm text-[#6B7280]">
              Decisão recomendada: repetir ensaio ou validar em nova safra — dados insuficientes
              para recomendação definitiva.
            </p>
          )}
          {recs.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs font-bold uppercase text-[#6B7280]">Recomendações</p>
              <ul className="mt-2 list-inside list-disc text-sm text-[#374151]">
                {recs.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {sig?.name ? (
            <p className="mt-6 border-t border-[#EEF2F7] pt-4 text-sm text-[#111827]">
              {sig.name}
              {sig.crea ? ` · CREA ${sig.crea}` : ''}
              {sig.city ? ` · ${sig.city}` : ''}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
