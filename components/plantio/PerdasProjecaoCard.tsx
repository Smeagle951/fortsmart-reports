'use client';

interface PerdasProjecaoCardProps {
  perdaTotalPct?: number;
  perdaSemanalPct?: number;
  estandeAtual?: number;
  registros?: Array<{ plantasPorMetro: number }>;
}

export default function PerdasProjecaoCard({
  perdaTotalPct,
  perdaSemanalPct,
  estandeAtual,
  registros = [],
}: PerdasProjecaoCardProps) {
  const ultimo = estandeAtual ?? (registros.length > 0 ? registros[registros.length - 1].plantasPorMetro : null);
  const perdaDiaria = perdaSemanalPct != null ? perdaSemanalPct / 7 : null;
  const estandeProjetado = ultimo != null && perdaSemanalPct != null
    ? ultimo * (1 + perdaSemanalPct / 100)
    : null;

  if (perdaTotalPct == null && perdaSemanalPct == null) return null;

  return (
    <div className="plantio-card">
      <h3 className="plantio-card-title">
        Projeção para 7 dias
      </h3>
      <div className="text-center">
        <div className="text-3xl font-bold text-amber-600">
          {perdaSemanalPct != null ? `${perdaSemanalPct > 0 ? '+' : ''}${perdaSemanalPct.toFixed(1)}%` : '—'}
        </div>
        <p className="mt-1 text-xs text-slate-500">Perda estimada</p>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-slate-700">
        {perdaTotalPct != null && (
          <li>• Perda acumulada: {perdaTotalPct > 0 ? '+' : ''}{perdaTotalPct.toFixed(1)}%</li>
        )}
        {perdaDiaria != null && (
          <li>• Perda diária: {perdaDiaria > 0 ? '+' : ''}{perdaDiaria.toFixed(1)}% / dia</li>
        )}
        {estandeProjetado != null && (
          <li>• Estande projetado: {estandeProjetado.toFixed(1)} plantas/m</li>
        )}
      </ul>
    </div>
  );
}
