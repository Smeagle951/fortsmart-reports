'use client';

interface IATItem {
  label: string;
  valor: string;
}

interface IndiceAgronomicoTalhaoProps {
  valor: number;
  maximo?: number;
  status: string;
  itens?: IATItem[];
}

const statusColors: Record<string, string> = {
  Saudável: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Atenção: 'bg-amber-100 text-amber-800 border-amber-200',
  Crítico: 'bg-red-100 text-red-800 border-red-200',
};

export default function IndiceAgronomicoTalhao({ valor, maximo = 100, status, itens = [] }: IndiceAgronomicoTalhaoProps) {
  const pct = Math.min(100, Math.max(0, (valor / maximo) * 100));
  const statusClass = statusColors[status] || statusColors.Saudável;

  return (
    <div className="plantio-card">
      <h3 className="plantio-card-title">
        Índice Agronômico do Talhão (IAT)
      </h3>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          {status === 'Saudável' && (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-7 w-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          <div className="relative h-14 w-14">
            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeDasharray={`${pct}, 100`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-700">
              {valor}
            </span>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-800">{valor}/{maximo}</span>
            <span className={`ml-2 rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass}`}>
              {status}
            </span>
          </div>
        </div>
        {itens.length > 0 && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
            {itens.map((item, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <span className="text-slate-400">•</span>
                <span className="font-medium">{item.label}:</span>
                <span>{item.valor}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
