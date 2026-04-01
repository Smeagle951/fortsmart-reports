'use client';

export interface EstatisticaItem {
  metrica: string;
  valor: string | number;
}

interface StatisticsSectionProps {
  items: EstatisticaItem[];
  title?: string;
}

export default function StatisticsSection({ items, title = 'Estatística Avançada' }: StatisticsSectionProps) {
  if (!items?.length) return null;

  return (
    <section className="saas-section">
      <div className="mx-auto max-w-7xl">
        <h2 className="saas-section-title mb-4">{title}</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="saas-table w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="saas-th text-left">Métrica Estatística</th>
                <th className="saas-th text-left">Valor</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                  <td className="saas-td font-medium text-slate-700">{item.metrica}</td>
                  <td className="saas-td">
                    {typeof item.valor === 'number' ? item.valor.toFixed(2) : item.valor}
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
