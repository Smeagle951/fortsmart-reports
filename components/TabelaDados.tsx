import React from 'react';
import { situacaoCssClass, situacaoLabel } from '../utils/format';

interface TabelaDadosProps {
  title: string;
  headers: string[];
  rows: (string | number | React.ReactNode)[][];
  className?: string;
}

export default function TabelaDados({ title, headers, rows, className = '' }: TabelaDadosProps) {
  if (!headers?.length || !rows?.length) return null;

  return (
    <section className={`section ${className}`}>
      {title ? <h2 className="section-title">{title}</h2> : null}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h}>{h}</th>
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

  return (
    <section className={sectionClass}>
      {title && <h2 className="section-title">{title}</h2>}
      <div className="info-grid">
        {items.map(([label, value]) => (
          <div key={label} className="info-row">
            <span className="info-label">{label}</span>
            <span className="info-value">
              {value == null ? '—' : typeof value === 'object' && 'type' in value ? value : value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export { situacaoCssClass, situacaoLabel };
