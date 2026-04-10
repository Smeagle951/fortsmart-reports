'use client';

import { useEffect, useState } from 'react';

type Metrics = {
  total: number;
  last7Days: number;
  sampleSize: number;
  topCultures: { name: string; count: number }[];
  topProblems: { name: string; count: number }[];
  byModule: { name: string; count: number }[];
  quality: { pctResult: number; pctAcao: number; pctFullCycle: number };
  funnel: { withProblem: number; withAcao: number; withResult: number };
  byDay: { date: string; count: number }[];
  byEstado: { name: string; count: number }[];
};

export default function AdminDashboardPage() {
  const [m, setM] = useState<Metrics | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/metrics', { credentials: 'include' });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error ?? 'Erro');
        if (!cancelled) setM(j);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) {
    return (
      <div className="rounded-lg border border-red-700 bg-red-950/50 p-4 text-red-200">
        <p className="font-medium">Erro ao carregar métricas</p>
        <p className="text-sm opacity-90">{err}</p>
        <p className="mt-2 text-sm text-slate-400">
          Confirme SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Vercel (servidor).
        </p>
      </div>
    );
  }

  if (!m) {
    return <p className="text-slate-400">A carregar…</p>;
  }

  const pct = (n: number) => (m.sampleSize ? Math.round((100 * n) / m.sampleSize) : 0);

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-semibold text-slate-100">Dashboard dataset</h1>
        <p className="text-slate-400">Schema `ai` — amostra até {m.sampleSize} linhas recentes.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
            <p className="text-sm text-slate-400">Total (Supabase)</p>
            <p className="text-2xl font-semibold text-emerald-400">{m.total.toLocaleString('pt-BR')}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
            <p className="text-sm text-slate-400">Últimos 7 dias</p>
            <p className="text-2xl font-semibold text-slate-100">+{m.last7Days.toLocaleString('pt-BR')}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
            <p className="text-sm text-slate-400">Com resultado</p>
            <p className="text-2xl font-semibold text-slate-100">{m.quality.pctResult}%</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
            <p className="text-sm text-slate-400">Ciclo completo</p>
            <p className="text-2xl font-semibold text-slate-100">{m.quality.pctFullCycle}%</p>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-medium text-slate-200">Top culturas</h2>
          <ul className="mt-2 space-y-1 text-slate-300">
            {m.topCultures.slice(0, 8).map((x) => (
              <li key={x.name} className="flex justify-between text-sm">
                <span>{x.name}</span>
                <span className="text-slate-500">{x.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-medium text-slate-200">Top problemas</h2>
          <ul className="mt-2 space-y-1 text-slate-300">
            {m.topProblems.slice(0, 10).map((x) => (
              <li key={x.name} className="flex justify-between text-sm">
                <span className="truncate pr-2">{x.name}</span>
                <span className="text-slate-500">{x.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium text-slate-200">Crescimento (registos por dia, amostra)</h2>
        <div className="mt-2 flex max-h-40 flex-wrap gap-1 overflow-auto">
          {m.byDay.map((d) => (
            <div
              key={d.date}
              title={d.date}
              className="flex flex-col items-center rounded bg-slate-800 px-1 py-1 text-[10px] text-slate-400"
            >
              <span className="text-emerald-400">{d.count}</span>
              <span className="rotate-0 truncate">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium text-slate-200">Por módulo</h2>
        <ul className="mt-2 space-y-1 text-sm text-slate-300">
          {m.byModule.map((x) => (
            <li key={x.name} className="flex justify-between">
              <span>{x.name || '(vazio)'}</span>
              <span className="text-slate-500">{x.count}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-medium text-slate-200">Qualidade (sobre amostra)</h2>
        <ul className="mt-2 space-y-2 text-sm text-slate-300">
          <li>Com ação registada: {m.quality.pctAcao}%</li>
          <li>Com resultado: {m.quality.pctResult}%</li>
          <li>Ciclo completo (problema + ação + resultado): {m.quality.pctFullCycle}%</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-medium text-slate-200">Funil ocorrência → ação → resultado</h2>
        <ul className="mt-2 space-y-1 text-sm text-slate-300">
          <li>Com problema: {pct(m.funnel.withProblem)}% — {m.funnel.withProblem}</li>
          <li>Com ação: {pct(m.funnel.withAcao)}% — {m.funnel.withAcao}</li>
          <li>Com resultado: {pct(m.funnel.withResult)}% — {m.funnel.withResult}</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-medium text-slate-200">Densidade por UF (extra_json.geo / region)</h2>
        <ul className="mt-2 flex flex-wrap gap-2 text-sm">
          {m.byEstado.slice(0, 16).map((x) => (
            <span
              key={x.name}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-slate-300"
            >
              {x.name}: {x.count}
            </span>
          ))}
        </ul>
      </section>

      <section className="flex flex-wrap gap-3">
        <a
          href="/api/admin/export?format=json"
          className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          Export JSON (amostra)
        </a>
        <a
          href="/api/admin/export?format=csv"
          className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          Export CSV (amostra)
        </a>
      </section>
    </div>
  );
}
