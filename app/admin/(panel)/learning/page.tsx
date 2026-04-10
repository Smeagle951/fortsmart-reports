'use client';

import { useEffect, useState } from 'react';

type Row = {
  cultura: string | null;
  problema: string | null;
  estagio_fenologico: string | null;
  regiao: string | null;
  acao: string | null;
  total_registros: number;
  avg_severidade: number | null;
  last_record_at: string | null;
};

export default function LearningPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/refresh-learning', { method: 'POST', credentials: 'include' });
      const j = await res.json();
      if (!res.ok) {
        setMsg(j.error ?? 'Falha ao atualizar');
        return;
      }
      setMsg('Materialized view atualizada.');
      const r2 = await fetch('/api/admin/learning', { credentials: 'include' });
      const j2 = await r2.json();
      setRows(j2.rows ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      const r2 = await fetch('/api/admin/learning', { credentials: 'include' });
      const j2 = await r2.json();
      setRows(j2.rows ?? []);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">Aprendizado (SQL)</h1>
        <button
          type="button"
          disabled={loading}
          onClick={refresh}
          className="rounded-md bg-emerald-700 px-3 py-1 text-sm text-white disabled:opacity-50"
        >
          {loading ? 'A atualizar…' : 'Recalcular agregações'}
        </button>
      </div>
      {msg ? <p className="text-sm text-emerald-400">{msg}</p> : null}
      <p className="text-sm text-slate-400">
        Tabela `ai.ai_scenario_learning` — agrupamento cultura / problema / estádio / região / ação.
      </p>
      <div className="overflow-auto rounded border border-slate-700">
        <table className="min-w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="p-2">cultura</th>
              <th className="p-2">problema</th>
              <th className="p-2">estágio</th>
              <th className="p-2">região</th>
              <th className="p-2">ação</th>
              <th className="p-2">n</th>
              <th className="p-2">severidade méd.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-slate-800">
                <td className="p-2">{r.cultura ?? ''}</td>
                <td className="p-2 max-w-xs truncate">{r.problema ?? ''}</td>
                <td className="p-2">{r.estagio_fenologico ?? ''}</td>
                <td className="p-2">{r.regiao ?? ''}</td>
                <td className="p-2 max-w-xs truncate">{r.acao ?? ''}</td>
                <td className="p-2">{r.total_registros}</td>
                <td className="p-2">
                  {r.avg_severidade != null ? r.avg_severidade.toFixed(2) : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
