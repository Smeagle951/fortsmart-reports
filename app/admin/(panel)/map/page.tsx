'use client';

import { useEffect, useState } from 'react';

export default function MapPage() {
  const [byEstado, setByEstado] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/metrics', { credentials: 'include' });
      const j = await res.json();
      if (res.ok) setByEstado(j.byEstado ?? []);
    })();
  }, []);

  const max = Math.max(1, ...byEstado.map((x) => x.count));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Mapa de dados (agregado)</h1>
      <p className="text-sm text-slate-400">
        Contagens por UF/região (sem coordenadas finas — dados agregados do dataset).
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {byEstado.map((x) => (
          <div
            key={x.name}
            className="rounded-lg border border-slate-700 bg-slate-900/60 p-3"
            style={{
              opacity: 0.25 + (0.75 * x.count) / max,
            }}
          >
            <p className="text-lg font-medium text-emerald-400">{x.name}</p>
            <p className="text-2xl font-semibold text-slate-100">{x.count}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
