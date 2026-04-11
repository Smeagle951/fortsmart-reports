'use client';

import { useEffect, useState } from 'react';

type Row = Record<string, unknown>;

export default function ExplorerPage() {
  const [cultura, setCultura] = useState('');
  const [problema, setProblema] = useState('');
  const [estado, setEstado] = useState('');
  const [daeMin, setDaeMin] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [fallback, setFallback] = useState(false);
  const [err, setErr] = useState('');

  async function load() {
    setErr('');
    const p = new URLSearchParams();
    if (cultura) p.set('cultura', cultura);
    if (problema) p.set('problema', problema);
    if (estado) p.set('estado', estado);
    if (daeMin) p.set('daeMin', daeMin);
    const res = await fetch(`/api/admin/explorer?${p.toString()}`, { credentials: 'include' });
    const j = await res.json();
    if (!res.ok) {
      setErr(j.error ?? 'Erro');
      return;
    }
    setRows(j.rows ?? []);
    setFallback(!!j.fallback);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Explorador</h1>
      {fallback ? (
        <p className="text-sm text-amber-400">
          Vista `ai_dataset_normalized` indisponível — dados crus de `ai_agronomic_dataset`.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <input
          placeholder="Cultura"
          className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm"
          value={cultura}
          onChange={(e) => setCultura(e.target.value)}
        />
        <input
          placeholder="Problema"
          className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm"
          value={problema}
          onChange={(e) => setProblema(e.target.value)}
        />
        <input
          placeholder="UF"
          className="w-20 rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
        />
        <input
          placeholder="DAE min"
          className="w-24 rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm"
          value={daeMin}
          onChange={(e) => setDaeMin(e.target.value)}
        />
        <button
          type="button"
          onClick={() => load()}
          className="rounded bg-emerald-700 px-3 py-1 text-sm text-white"
        >
          Filtrar
        </button>
      </div>
      {err ? <p className="text-red-400">{err}</p> : null}
      <div className="overflow-auto rounded border border-slate-700">
        <table className="min-w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="p-2">módulo</th>
              <th className="p-2">cultura</th>
              <th className="p-2">problema</th>
              <th className="p-2">ação</th>
              <th className="p-2">resultado</th>
              <th className="p-2">região</th>
              <th className="p-2">data</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={String(r.source_hash ?? i)} className="border-t border-slate-800">
                <td className="p-2">{String(r.source_module ?? '')}</td>
                <td className="p-2">{String(r.cultura ?? '')}</td>
                <td className="p-2 max-w-xs truncate">{String(r.problema ?? '')}</td>
                <td className="p-2 max-w-xs truncate">{String(r.acao ?? '')}</td>
                <td className="p-2 max-w-xs truncate">{String(r.resultado ?? '')}</td>
                <td className="p-2">{String(r.region ?? r.estado_uf ?? '')}</td>
                <td className="p-2 whitespace-nowrap">{String(r.recorded_at ?? '').slice(0, 16)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
