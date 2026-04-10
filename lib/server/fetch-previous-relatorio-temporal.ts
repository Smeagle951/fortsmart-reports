/**
 * Server-only: busca o relatório anterior do mesmo dono para comparar snapshots.
 * Não importar em Client Components.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  extractTalhaoChave,
  parseAiSnapshotFromRelatorio,
  relatorioTipo,
} from '@/lib/ai-intelligence-snapshot';

function rowDados(r: Record<string, unknown>): Record<string, unknown> | null {
  const raw = r.dados ?? r.json_data ?? r.dados_json;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw) as unknown;
      return typeof p === 'object' && p != null && !Array.isArray(p) ? (p as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return null;
}

type RelatorioRowPartial = {
  id: string;
  updated_at?: string | null;
  dados?: unknown;
  json_data?: unknown;
  dados_json?: unknown;
};

export async function fetchPreviousRelatorioForTemporal(
  client: SupabaseClient,
  opts: {
    currentId: string;
    ownerUid: string;
    preferTipo?: string;
    preferTalhaoKey: string | null;
  },
): Promise<{ dados: Record<string, unknown>; updated_at: string } | null> {
  const { data, error } = await client
    .from('relatorios')
    .select('id, updated_at, dados, json_data, dados_json')
    .eq('owner_firebase_uid', opts.ownerUid)
    .neq('id', opts.currentId)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) {
    console.warn('[fortsmart-reports] fetchPreviousRelatorioForTemporal:', error.message);
    return null;
  }
  if (!data?.length) return null;

  const rows = data as RelatorioRowPartial[];

  const tryPick = (predicate: (dados: Record<string, unknown>) => boolean) => {
    for (const r of rows) {
      const dados = rowDados(r as unknown as Record<string, unknown>);
      if (!dados) continue;
      if (!predicate(dados)) continue;
      if (parseAiSnapshotFromRelatorio(dados) == null) continue;
      return { dados, updated_at: r.updated_at ?? '' };
    }
    return null;
  };

  const tipo = opts.preferTipo?.trim();
  const tk = opts.preferTalhaoKey;

  if (tipo && tk) {
    const hit = tryPick((d) => relatorioTipo(d) === tipo && extractTalhaoChave(d) === tk);
    if (hit) return hit;
  }
  if (tk) {
    const hit = tryPick((d) => extractTalhaoChave(d) === tk);
    if (hit) return hit;
  }
  if (tipo) {
    const hit = tryPick((d) => relatorioTipo(d) === tipo);
    if (hit) return hit;
  }
  for (const r of rows) {
    const dados = rowDados(r as unknown as Record<string, unknown>);
    if (!dados) continue;
    if (parseAiSnapshotFromRelatorio(dados)) {
      return { dados, updated_at: r.updated_at ?? '' };
    }
  }
  return null;
}
