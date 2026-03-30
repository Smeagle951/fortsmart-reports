/**
 * Dados e helpers para o relatório comparativo de talhões (plantio_multi).
 */

import { getStoragePublicUrl } from '@/lib/supabase';

export type UnknownRec = Record<string, unknown>;

export function str(v: unknown): string {
  if (v == null) return '';
  return String(v).trim();
}

export function num(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

export function resolvePlantioAssetUrl(
  entry: { url?: string; path?: string; localPath?: string },
  relatorioId?: string,
): string | undefined {
  if (entry.url && String(entry.url).startsWith('http')) return entry.url;
  const p = (entry.path || entry.localPath || '').trim();
  if (relatorioId && p) {
    const u = getStoragePublicUrl(relatorioId, p);
    if (u) return u;
  }
  return undefined;
}

/** Primeira imagem HTTP ou via storage para cabeçalho visual do talhão. */
export function heroUrlForSnapshot(snapshot: UnknownRec, relatorioId?: string): string | undefined {
  const imgs = snapshot.imagens as Array<{ url?: string; path?: string; localPath?: string }> | undefined;
  if (imgs?.length) {
    for (const i of imgs) {
      const u = resolvePlantioAssetUrl(i, relatorioId);
      if (u) return u;
    }
  }
  const fen = snapshot.fenologia as UnknownRec | undefined;
  const tl = Array.isArray(fen?.timeline) ? (fen.timeline as UnknownRec[]) : [];
  for (const row of tl) {
    const fotos = Array.isArray(row.fotos) ? (row.fotos as UnknownRec[]) : [];
    for (const f of fotos) {
      const u = resolvePlantioAssetUrl(
        {
          url: f.url as string | undefined,
          localPath: f.localPath as string | undefined,
          path: f.path as string | undefined,
        },
        relatorioId,
      );
      if (u) return u;
    }
  }
  return undefined;
}

/** Converte estádio textual em valor numérico para eixo Y (linhas V·, R·). */
export function parseStageToY(estagioRaw: string): number | null {
  const s = estagioRaw.trim().toUpperCase();
  const v = /^V\s*(\d+)/i.exec(s);
  if (v) return parseInt(v[1], 10);
  const r = /^R\s*(\d+)/i.exec(s);
  if (r) return 5.5 + parseInt(r[1], 10) * 0.5;
  const ve = /\bVE\b/i.exec(s);
  if (ve) return 1;
  const vc = /\bVC\b|\bV6\b/i.exec(s);
  if (vc) return 6;
  return null;
}

export function formatEficienciaEmergencia(pct: number | undefined): string | undefined {
  if (pct == null || !Number.isFinite(pct)) return undefined;
  const p = pct <= 1 && pct > 0 ? pct * 100 : pct;
  return `${p.toFixed(0)}%`;
}

export type SnapshotMetricas = {
  popReal?: number;
  cvPct?: number;
  emergenciaStr?: string;
  estagio: string;
  iqi?: number;
  iqiLabel: string;
  badgeClass: 'ok' | 'warn' | 'bad';
};

/** Badge por rótulo/classificação IQI (PT). */
export function iqiBadgeClass(label: string, classificacao?: string): 'ok' | 'warn' | 'bad' {
  const t = `${label} ${classificacao ?? ''}`.toLowerCase();
  if (t.includes('crít') || t.includes('crit') || t.includes('grave')) return 'bad';
  if (t.includes('regular') || t.includes('moder') || t.includes('monitor') || t.includes('atenção'))
    return 'warn';
  if (t.includes('adequ') || t.includes('excel')) return 'ok';
  return 'warn';
}

export function metricasDoSnapshot(snapshot: UnknownRec): SnapshotMetricas {
  const pop = (snapshot.populacao || {}) as UnknownRec;
  const plantab = (snapshot.plantabilidade || {}) as UnknownRec;
  const fen = (snapshot.fenologia || {}) as UnknownRec;
  const iqiB = (snapshot.indiceQualidadeImplantacao || {}) as UnknownRec;
  const ef = num(pop.eficienciaPct);
  const emergenciaStr = formatEficienciaEmergencia(ef);
  const iqiLabel = str(iqiB.label) || '—';
  return {
    popReal: num(pop.estandeEfetivoPlHa),
    cvPct: num(plantab.cvPercentual),
    emergenciaStr,
    estagio: str(fen.estadio ?? fen.estagio) || '—',
    iqi: num(iqiB.iqi),
    iqiLabel,
    badgeClass: iqiBadgeClass(iqiLabel, str(iqiB.classificacao)),
  };
}

export type FenologiaPonto = { dae: number; y: number; label: string };

export function serieFenologia(snapshot: UnknownRec): FenologiaPonto[] {
  const fen = (snapshot.fenologia || {}) as UnknownRec;
  const tl = Array.isArray(fen.timeline) ? (fen.timeline as UnknownRec[]) : [];
  const out: FenologiaPonto[] = [];
  for (const row of tl) {
    const dae = num(row.dae);
    const label = str(row.estagio ?? row.descricaoEstagio);
    const y = parseStageToY(label);
    if (dae == null || y == null) continue;
    out.push({ dae, y, label: label || '—' });
  }
  return out.sort((a, b) => a.dae - b.dae);
}

/** Média IQI → classe de badge (resumo). */
export function classificarIqiMedio(iqi: number): { label: string; badgeClass: 'ok' | 'warn' | 'bad' } {
  if (iqi >= 85) return { label: 'ADEQUADO', badgeClass: 'ok' };
  if (iqi >= 70) return { label: 'REGULAR', badgeClass: 'warn' };
  return { label: 'CRÍTICO', badgeClass: 'bad' };
}

export function classificarCvMedio(cv: number): { label: string; badgeClass: 'ok' | 'warn' | 'bad' } {
  if (cv <= 15) return { label: 'BOM', badgeClass: 'ok' };
  if (cv <= 25) return { label: 'MODERADO', badgeClass: 'warn' };
  return { label: 'ALTO', badgeClass: 'bad' };
}
