'use client';

import { useState } from 'react';

type Tendencia = 'up' | 'neutral' | 'down';
type Classificacao = 'Excelente' | 'Bom' | 'Moderado' | 'Atenção' | 'Crítico';

interface KpiCard {
  id: string;
  indicador: string;
  valor: string | number;
  classificacao: Classificacao;
  tendencia?: Tendencia;
  tooltip?: string;
  historico?: Array<{ data: string; valor: string | number }>;
}

const classColors: Record<Classificacao, string> = {
  Excelente: 'border-emerald-500 bg-emerald-50 text-emerald-800',
  Bom: 'border-emerald-400 bg-emerald-50/70 text-emerald-700',
  Moderado: 'border-amber-400 bg-amber-50 text-amber-800',
  Atenção: 'border-amber-500 bg-amber-50 text-amber-900',
  Crítico: 'border-red-500 bg-red-50 text-red-800',
};

const tendenciaIcon: Record<Tendencia, string> = {
  up: '↑',
  neutral: '→',
  down: '↓',
};

interface KpiCardsSectionProps {
  cards: KpiCard[];
}

export default function KpiCardsSection({ cards }: KpiCardsSectionProps) {
  const [modalCard, setModalCard] = useState<KpiCard | null>(null);

  return (
    <section className="saas-section">
      <h2 className="saas-section-title">Resumo Executivo</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((card) => {
          const colors = classColors[card.classificacao] || classColors.Moderado;
          const tend = card.tendencia || 'neutral';
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => card.historico && card.historico.length > 0 && setModalCard(card)}
              className={`saas-kpi-card group relative flex flex-col items-start rounded-xl border-l-4 p-4 text-left shadow-sm transition-all hover:shadow-md ${colors} ${!card.historico?.length ? 'cursor-default' : 'cursor-pointer'}`}
              title={card.tooltip}
            >
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {card.indicador}
              </span>
              <div className="mt-1 flex w-full items-center justify-between">
                <span className="text-2xl font-bold">{card.valor}</span>
                <span className="text-lg opacity-70">{tendenciaIcon[tend]}</span>
              </div>
              <span className="mt-1 text-xs font-medium">{card.classificacao}</span>
              {card.historico && card.historico.length > 0 && (
                <span className="mt-2 text-xs text-slate-500 group-hover:text-slate-700">
                  Clique para histórico
                </span>
              )}
            </button>
          );
        })}
      </div>

      {modalCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setModalCard(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            className="max-h-[80vh] w-full max-w-md overflow-auto rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="modal-title" className="text-lg font-semibold text-slate-800">
              Histórico — {modalCard.indicador}
            </h3>
            <div className="mt-4 space-y-2">
              {modalCard.historico?.map((h, i) => (
                <div key={i} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-sm text-slate-600">{h.data}</span>
                  <span className="font-medium">{h.valor}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setModalCard(null)}
              className="mt-4 w-full rounded-lg bg-slate-200 py-2 text-sm font-medium hover:bg-slate-300"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
