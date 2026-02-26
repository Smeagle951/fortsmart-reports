'use client';

export interface ComparativoItem {
  metrica: string;
  avaliacao1: string | number;
  avaliacao2: string | number;
  variacao: string | number;
}

interface ComparisonSectionProps {
  items: ComparativoItem[];
  labelAvaliacao1?: string;
  labelAvaliacao2?: string;
}

export default function ComparisonSection({
  items,
  labelAvaliacao1 = 'Avaliação 1',
  labelAvaliacao2 = 'Avaliação 2',
}: ComparisonSectionProps) {
  if (!items?.length) return null;

  const formatVal = (v: string | number): string => {
    if (typeof v === 'number') return v.toFixed(1);
    return String(v);
  };

  const variacaoColor = (v: string | number) => {
    const s = String(v);
    if (s.startsWith('+')) return 'text-emerald-600';
    if (s.startsWith('-')) return 'text-red-600';
    return 'text-slate-600';
  };

  return (
    <section className="saas-section">
      <div className="mx-auto max-w-7xl">
        <h2 className="saas-section-title mb-4">Comparativo Entre Avaliações</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="saas-table w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="saas-th text-left">Métrica</th>
                <th className="saas-th text-left">{labelAvaliacao1}</th>
                <th className="saas-th text-left">{labelAvaliacao2}</th>
                <th className="saas-th text-left">Variação</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                  <td className="saas-td font-medium text-slate-700">{item.metrica}</td>
                  <td className="saas-td">{formatVal(item.avaliacao1)}</td>
                  <td className="saas-td">{formatVal(item.avaliacao2)}</td>
                  <td className={`saas-td font-medium ${variacaoColor(item.variacao)}`}>
                    {formatVal(item.variacao)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
