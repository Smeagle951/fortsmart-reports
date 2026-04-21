'use client';

import type { LabExportEnvelope } from './types';

const LS_KEY = 'fortsmart_lab_workspace_items';

export type WorkspaceItem = { id: string; label: string; payload: Record<string, unknown> };

function loadItems(): WorkspaceItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as WorkspaceItem[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveItems(items: WorkspaceItem[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

export function Sidebar({
  items,
  onItemsChange,
  selectedId,
  onSelect,
}: {
  items: WorkspaceItem[];
  onItemsChange: (v: WorkspaceItem[]) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const importJson = (text: string) => {
    let parsed: LabExportEnvelope | Record<string, unknown>;
    try {
      parsed = JSON.parse(text) as LabExportEnvelope | Record<string, unknown>;
    } catch {
      throw new Error('Ficheiro JSON inválido ou corrompido.');
    }
    let payload: Record<string, unknown> | null = null;
    let id = `import-${Date.now()}`;
    if ('engine_payload' in parsed && parsed.engine_payload && typeof parsed.engine_payload === 'object') {
      payload = parsed.engine_payload as Record<string, unknown>;
      if (typeof parsed.id === 'string') id = parsed.id;
    } else if ('insight' in parsed || 'normalized' in parsed) {
      payload = parsed as Record<string, unknown>;
    }
    if (!payload) throw new Error('JSON inválido: falta engine_payload ou corpo do motor.');
    const label = (parsed as LabExportEnvelope).id?.slice(0, 8) ?? id.slice(0, 8);
    const next: WorkspaceItem = { id, label, payload };
    const merged = [next, ...items.filter((x) => x.id !== id)].slice(0, 30);
    saveItems(merged);
    onItemsChange(merged);
    onSelect(id);
  };

  return (
    <aside className="flex h-full flex-col border-r border-slate-200 bg-slate-900 text-slate-100">
      <div className="p-3 text-xs font-bold uppercase tracking-wide text-slate-400">Lab workspace</div>
      <div className="px-3 pb-2">
        <label className="block cursor-pointer rounded bg-slate-800 px-2 py-2 text-center text-xs font-semibold hover:bg-slate-700">
          Importar JSON
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const text = await f.text();
              try {
                importJson(text);
              } catch (err) {
                window.alert(err instanceof Error ? err.message : String(err));
              }
              e.target.value = '';
            }}
          />
        </label>
      </div>
      <div className="px-3 pb-2">
        <button
          type="button"
          className="w-full rounded border border-slate-600 px-2 py-2 text-xs hover:bg-slate-800"
          onClick={() => {
            const t = window.prompt('Cole o JSON exportado do app:');
            if (!t?.trim()) return;
            try {
              importJson(t.trim());
            } catch (err) {
              window.alert(String(err));
            }
          }}
        >
          Colar JSON
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-1 pb-4">
        <div className="px-2 py-1 text-[10px] font-semibold uppercase text-slate-500">Análises</div>
        {items.length === 0 && <p className="px-2 text-xs text-slate-500">Nenhum ficheiro importado.</p>}
        <ul className="space-y-1">
          {items.map((it) => (
            <li key={it.id}>
              <button
                type="button"
                onClick={() => onSelect(it.id)}
                className={`w-full rounded px-2 py-2 text-left text-xs ${
                  selectedId === it.id ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {it.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export function hydrateItemsFromStorage(): WorkspaceItem[] {
  return loadItems();
}
