'use client';

import { useEffect, useMemo, useState } from 'react';

import { BalancePanel } from '../../../components/lab-workspace/BalancePanel';
import { hydrateItemsFromStorage, Sidebar } from '../../../components/lab-workspace/Sidebar';
import { InsightPanel } from '../../../components/lab-workspace/InsightPanel';
import { SimulationPanel } from '../../../components/lab-workspace/SimulationPanel';
import { SoilChart } from '../../../components/lab-workspace/SoilChart';
import type { WorkspaceItem } from '../../../components/lab-workspace/Sidebar';

export default function LabWorkspacePage() {
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setItems(hydrateItemsFromStorage());
  }, []);

  const selected = useMemo(
    () => items.find((x) => x.id === selectedId) ?? items[0] ?? null,
    [items, selectedId],
  );

  useEffect(() => {
    if (!selectedId && items.length) setSelectedId(items[0].id);
  }, [items, selectedId]);

  const norm = selected?.payload?.normalized as Record<string, unknown> | undefined;
  const insight = selected?.payload?.insight as Record<string, unknown> | undefined;

  return (
    <div className="grid h-screen grid-cols-12 bg-slate-100 text-slate-900">
      <div className="col-span-12 border-b border-slate-200 bg-white px-4 py-3 md:col-span-12">
        <h1 className="text-lg font-bold text-slate-900">Análise de Solo — Deep Analysis</h1>
        <p className="text-xs text-slate-500">
          Importe o JSON exportado pelo app (sem Supabase). Estado guardado só no navegador (localStorage).
        </p>
      </div>
      <div className="col-span-12 md:col-span-2 h-[calc(100vh-52px)] min-h-0">
        <Sidebar
          items={items}
          onItemsChange={setItems}
          selectedId={selected?.id ?? null}
          onSelect={(id) => setSelectedId(id)}
        />
      </div>
      <main className="col-span-12 md:col-span-7 h-[calc(100vh-52px)] overflow-y-auto border-r border-slate-200 bg-white p-4 md:min-h-0">
        {!selected ? (
          <p className="text-sm text-slate-500">Importe uma análise para visualizar gráficos e equilíbrio.</p>
        ) : (
          <>
            <h2 className="text-sm font-semibold text-slate-800">Gráfico solo (referência vs atual)</h2>
            <SoilChart normalized={norm} />
            <h2 className="mt-6 text-sm font-semibold text-slate-800">Equilíbrio químico</h2>
            <div className="mt-2 max-w-md">
              <BalancePanel normalized={norm} />
            </div>
            <h2 className="mt-6 text-sm font-semibold text-slate-800">Simulação</h2>
            <div className="mt-2 max-w-lg">
              <SimulationPanel insight={insight} />
            </div>
          </>
        )}
      </main>
      <aside className="col-span-12 md:col-span-3 h-[calc(100vh-52px)] overflow-y-auto bg-slate-50 p-4 md:min-h-0">
        <h2 className="text-sm font-semibold text-slate-800">Insight &amp; ação</h2>
        <div className="mt-2">
          <InsightPanel payload={selected?.payload ?? null} />
        </div>
      </aside>
    </div>
  );
}
