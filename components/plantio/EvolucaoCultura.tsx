'use client';

interface EvolucaoCulturaProps {
  estadioAtual?: string;
  estadioPrevisto?: string;
  somaTermica?: number;
  atrasoFenologico?: number;
}

export default function EvolucaoCultura({
  estadioAtual,
  estadioPrevisto,
  somaTermica,
  atrasoFenologico,
}: EvolucaoCulturaProps) {
  if (!estadioAtual && !somaTermica) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">
        🌱 Evolução da Cultura
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-slate-50 p-4">
          <div className="text-xs font-medium text-slate-500">📈 Estádio Atual</div>
          <div className="mt-1 text-xl font-bold text-slate-800">{estadioAtual || '—'}</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-4">
          <div className="text-xs font-medium text-slate-500">🌡️ Soma Térmica</div>
          <div className="mt-1 text-xl font-bold text-slate-800">
            {somaTermica != null ? `${somaTermica} ºC` : '—'}
          </div>
        </div>
        <div className="rounded-lg bg-slate-50 p-4">
          <div className="text-xs font-medium text-slate-500">📉 Estágio Previsto</div>
          <div className="mt-1 text-xl font-bold text-slate-800">{estadioPrevisto || '—'}</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-4">
          <div className="text-xs font-medium text-slate-500">🕒 Atraso Fenológico</div>
          <div className="mt-1 text-xl font-bold text-slate-800">
            {atrasoFenologico != null
              ? atrasoFenologico < 0
                ? `${atrasoFenologico} folha(s)`
                : atrasoFenologico === 0
                  ? 'Em dia'
                  : `+${atrasoFenologico} folha(s)`
              : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}
