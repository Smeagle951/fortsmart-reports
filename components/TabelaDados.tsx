import React from 'react';
import { situacaoCssClass, situacaoLabel } from '@/utils/format';

interface TabelaDadosProps {
  title: string;
  headers: string[];
  rows: (string | number | React.ReactNode)[][];
  className?: string;
}

export default function TabelaDados({ title, headers, rows, className = '' }: TabelaDadosProps) {
  if (!headers?.length || !rows?.length) return null;

  const tableId = title ? `table-${title.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase()}` : undefined;
  return (
    <section className={`section ${className}`} aria-labelledby={tableId}>
      {title ? <h2 id={tableId} className="section-title">{title}</h2> : null}
      <div className="table-wrap" role="region" aria-label={title || 'Tabela de dados'}>
        <table className="table">
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h} scope="col">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function InfoGrid({
  items,
  title,
  className = '',
}: {
  items: [string, string | number | React.ReactNode | null | undefined][];
  title?: string;
  className?: string;
}) {
  if (!items?.length) return null;

  const sectionClass = `section ${className} ${title === 'Identificação' ? 'info-grid-identificacao' : ''}`;
  const sectionId = title ? `section-${title.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase()}` : undefined;

  return (
    <section className={sectionClass} aria-labelledby={sectionId} id={sectionId}>
      {title && <h2 id={sectionId} className="section-title">{title}</h2>}
      <dl className="info-grid">
        {items.map(([label, value]) => (
          <React.Fragment key={label}>
            <dt className="info-label">{label}</dt>
            <dd className="info-value">
              {value == null ? '—' : typeof value === 'object' && 'type' in value ? value : value}
            </dd>
          </React.Fragment>
        ))}
      </dl>
    </section>
  );
}

export { situacaoCssClass, situacaoLabel };
