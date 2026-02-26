'use client';

interface FitossanidadeResumoProps {
  lagarta?: string;
  percevejo?: string;
  ferrugem?: string;
  ipe?: number;
  ipeStatus?: string;
}

export default function FitossanidadeResumo({
  lagarta,
  percevejo,
  ferrugem,
  ipe,
  ipeStatus,
}: FitossanidadeResumoProps) {
  if (!lagarta && !percevejo && !ferrugem && ipe == null) return null;

  const nivelClass = (n?: string) => {
    const s = (n || '').toLowerCase();
    if (s === 'baixa' || s === 'baixo') return 'bg-emerald-100 text-emerald-800';
    if (s === 'moderada' || s === 'moderado') return 'bg-amber-100 text-amber-800';
    if (s === 'alta' || s === 'alto') return 'bg-red-100 text-red-800';
    return 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">
        🪱 Fitossanidade
      </h3>
      <div className="flex flex-wrap gap-3">
        {lagarta && (
          <span className={`rounded px-2 py-1 text-sm font-medium ${nivelClass(lagarta)}`}>
            Lagarta: {lagarta}
          </span>
        )}
        {percevejo && (
          <span className={`rounded px-2 py-1 text-sm font-medium ${nivelClass(percevejo)}`}>
            Percevejo: {percevejo}
          </span>
        )}
        {ferrugem && (
          <span className={`rounded px-2 py-1 text-sm font-medium ${nivelClass(ferrugem)}`}>
            Ferrugem: {ferrugem}
          </span>
        )}
      </div>
      {(ipe != null || ipeStatus) && (
        <div className="mt-3 rounded-lg bg-slate-50 p-2 text-sm">
          <span className="font-medium text-slate-600">Pressão Entomológica (IPE): </span>
          <span className="font-bold text-slate-800">{ipe ?? '—'}</span>
          {ipeStatus && (
            <span className="ml-2 text-slate-600">({ipeStatus})</span>
          )}
        </div>
      )}
    </div>
  );
}
