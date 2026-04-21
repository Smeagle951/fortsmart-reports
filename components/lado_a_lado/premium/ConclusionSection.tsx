'use client';

import { motion } from 'framer-motion';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { formatNumber } from '@/utils/format';
import { heroFinancialSnapshot, scoresFromJson, winnerFromJson } from './premiumInference';
import PremiumSectionShell from './PremiumSectionShell';

export default function ConclusionSection({ data }: { data: SideBySideReportData }) {
  const summary = data.conclusion?.summary?.trim() || data.resumo?.conclusaoCurta?.trim();
  const recs = (data.conclusion?.recommendations ?? []).map((r) => r?.trim()).filter(Boolean) as string[];
  const winner = winnerFromJson(data);
  const fin = heroFinancialSnapshot(data);
  const { a: sa, b: sb } = scoresFromJson(data);
  const nameA = data.sideA?.name || 'Manejo A';
  const nameB = data.sideB?.name || 'Manejo B';
  const winnerName = winner === 'A' ? nameA : winner === 'B' ? nameB : null;

  const deltaPct =
    sa != null && sb != null && Math.max(sa, sb) > 0
      ? ((Math.max(sa, sb) - Math.min(sa, sb)) / Math.max(sa, sb)) * 100
      : null;

  const recommendationLead =
    recs[0] ||
    (winnerName ? `Indicação do relatório: priorizar ${winnerName} na decisão de manejo.` : null);

  const motiveBlock = summary?.trim() || null;
  const furtherSteps = recs.length > 1 ? recs.slice(1) : [];

  const hasChips =
    (deltaPct != null && deltaPct >= 1) ||
    (fin.deltaScHa != null && Math.abs(fin.deltaScHa) >= 0.05);

  if (
    !recommendationLead &&
    !motiveBlock &&
    !winnerName &&
    !hasChips &&
    furtherSteps.length === 0 &&
    !data.conclusion?.signature?.name
  ) {
    return null;
  }

  return (
    <PremiumSectionShell
      id="conclusao-premium"
      eyebrow="Encerramento"
      title="Conclusão e recomendação"
      subtitle="Síntese e próximos passos conforme publicados no relatório — base para decisão técnica e comercial."
      tone="dark"
      className="pb-2"
    >
      <div className="grid md:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-white p-6 sm:p-8 shadow-sm"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-800">Recomendação</p>
          <p className="mt-4 text-lg sm:text-xl font-bold text-slate-900 leading-snug">
            {recommendationLead ||
              (motiveBlock ? 'Ver motivo ao lado' : 'Complete a conclusão no app para reforçar a decisão.')}
          </p>
          {winnerName && recs.length === 0 ? (
            <p className="mt-3 text-sm font-semibold text-emerald-900">Manejo indicado: {winnerName}</p>
          ) : null}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Motivo / síntese</p>
          <p className="mt-4 text-slate-700 leading-relaxed">
            {motiveBlock ||
              (furtherSteps.length === 0 && recommendationLead && recommendationLead.length > 48
                ? recommendationLead
                : null) ||
              (furtherSteps.length > 0
                ? 'Detalhamento nas ações abaixo.'
                : 'Publique um resumo no relatório para contextualizar a decisão.')}
          </p>
          <ul className="mt-5 flex flex-wrap gap-2 text-xs text-slate-600">
            {deltaPct != null && deltaPct >= 1 ? (
              <li className="rounded-full bg-slate-100 px-3 py-1 font-medium">
                Diferença de score: ~{formatNumber(deltaPct, { decimals: 0 })}%
              </li>
            ) : null}
            {fin.deltaScHa != null && Math.abs(fin.deltaScHa) >= 0.05 ? (
              <li className="rounded-full bg-slate-100 px-3 py-1 font-medium">
                Colheita: Δ {formatNumber(fin.deltaScHa, { decimals: 1 })} sc/ha (B − A)
              </li>
            ) : null}
          </ul>
        </motion.div>
      </div>

      {furtherSteps.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-6"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Próximos passos</p>
          <ol className="mt-3 list-decimal list-inside space-y-2 text-sm text-slate-800">
            {furtherSteps.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ol>
        </motion.div>
      ) : null}

      {data.conclusion?.signature?.name ? (
        <div className="mt-8 pt-6 border-t border-slate-200 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">{data.conclusion.signature.name}</p>
          {data.conclusion.signature.crea ? <p>CREA {data.conclusion.signature.crea}</p> : null}
          {data.conclusion.signature.city ? <p>{data.conclusion.signature.city}</p> : null}
        </div>
      ) : null}
    </PremiumSectionShell>
  );
}
