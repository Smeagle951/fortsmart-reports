'use client';

import { Trophy } from 'lucide-react';
import { formatNumber } from '@/utils/format';

/** Mesma forma de retorno de [heroFinancialSnapshot] em `premiumInference` (evita import só por tipo). */
export type HeroFinancialFin = {
  deltaScHa: number | null;
  gainBrlHa: number | null;
  precoSaca: number | null;
};

export type DecisionLayerHeroProps = {
  /** Nome do manejo (A ou B) em destaque, ou null se indeterminado. */
  winnerName: string | null;
  dKg: number | null;
  fin: HeroFinancialFin;
};

/**
 * Bloco-herói em gradiente: síntese técnica/económica (equivalente ao “Decision layer” do mock enterprise).
 * Mantém apresentação isolada; os dados vêm do payload já interpretado no pai.
 */
export default function DecisionLayerHero({ winnerName, dKg, fin }: DecisionLayerHeroProps) {
  return (
    <div
      className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 mb-4 text-white shadow-[0_12px_40px_-8px_rgba(15,23,42,0.35)] print:break-inside-avoid overflow-hidden"
      style={{
        background: 'linear-gradient(115deg, #047857 0%, #0d9488 42%, #1d4ed8 100%)',
      }}
    >
      <p className="text-xs sm:text-sm font-medium text-white/85 uppercase tracking-wider">
        Resultado técnico e econômico
      </p>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">
            {winnerName
              ? `${winnerName} com melhor leitura agregada`
              : 'Comparativo A/B (sem vencedor único)'}
          </h3>
          <p className="text-sm text-white/90 mt-2 flex flex-wrap gap-x-2 gap-y-0.5">
            {fin.deltaScHa != null && Math.abs(fin.deltaScHa) >= 0.01 && (
              <span>
                {fin.deltaScHa > 0 ? '+' : ''}
                {formatNumber(fin.deltaScHa, { decimals: 1 })} sc/ha
              </span>
            )}
            {fin.gainBrlHa != null && Math.abs(fin.gainBrlHa) >= 0.5 && (
              <span>
                {fin.deltaScHa != null ? '·' : ''} receita bruta est. {fin.gainBrlHa > 0 ? '+' : ''}R${' '}
                {formatNumber(fin.gainBrlHa, { decimals: 0 })}/ha
              </span>
            )}
            {dKg != null && Math.abs(dKg) >= 0.5 && fin.deltaScHa == null && (
              <span>
                Δ produtiv. est. (KPI) {dKg > 0 ? '+' : ''}
                {formatNumber(dKg, { decimals: 0 })} kg/ha
              </span>
            )}
          </p>
        </div>
        {winnerName ? (
          <div className="shrink-0 flex items-center gap-2 self-start sm:self-end rounded-full bg-white/15 pl-1 pr-3 py-1 text-xs sm:text-sm font-semibold text-white">
            <Trophy className="h-4 w-4" />
            Destaque: {winnerName}
          </div>
        ) : null}
      </div>
    </div>
  );
}
