import React from 'react';
import { formatDate } from '@/utils/format';

type Aplicacao = {
  id?: string;
  data?: string;
  tipo?: string;
  produto?: string;
  dose?: string | number;
  unidade?: string;
  classe?: string;
  status?: string;
};

interface Props {
  rows: Aplicacao[];
}

export default function TabelaAplicacoes({ rows }: Props) {
  if (!rows || rows.length === 0) return null;

  function statusClass(s?: string) {
    if (!s) return 'badge-muted';
    const key = s.toLowerCase();
    if (key.includes('concl')) return 'badge-success';
    if (key.includes('pend')) return 'badge-warning';
    if (key.includes('aten')) return 'badge-danger';
    return 'badge-muted';
  }

  return (
    <section className="section">
      <h2 className="section-title">Aplicações realizadas</h2>
      <div className="table-wrap saas-table">
        <table className="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo</th>
              <th>Produto</th>
              <th>Dose</th>
              <th>Classe</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id ?? i}>
                <td>{formatDate(r.data as string)}</td>
                <td>{r.tipo || '—'}</td>
                <td>{r.produto || '—'}</td>
                <td>{r.dose != null ? `${r.dose}${r.unidade ? ` ${r.unidade}` : ''}` : '—'}</td>
                <td>{r.classe || '—'}</td>
                <td><span className={`badge ${statusClass(r.status)}`}>{r.status || '—'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

