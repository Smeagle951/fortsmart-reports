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

/** Normaliza path local para o bucket `relatorios/{id}/{arquivo}`. */
function normalizeStorageRelativePath(pathRaw: string, relatorioId: string): string {
  let p = pathRaw.replace(/\\/g, '/').trim();
  if (!p) return '';
  const lower = p.toLowerCase();
  const prefixRel = 'relatorios/';
  if (lower.startsWith(prefixRel)) {
    const rest = p.slice(prefixRel.length);
    const idPrefix = `${relatorioId}/`;
    if (rest.toLowerCase().startsWith(idPrefix.toLowerCase())) {
      return rest.slice(idPrefix.length);
    }
    return rest;
  }
  const idSlash = `${relatorioId}/`;
  if (p.toLowerCase().startsWith(idSlash.toLowerCase())) {
    return p.slice(idSlash.length);
  }
  return p.split('/').pop() || p;
}

export function resolvePlantioAssetUrl(
  entry: { url?: string; path?: string; localPath?: string },
  relatorioId?: string,
): string | undefined {
  if (entry.url && String(entry.url).startsWith('http')) return String(entry.url).trim();
  const raw = (entry.path || entry.localPath || '').trim();
  if (!raw) return undefined;
  if (!relatorioId) return undefined;
  const p = normalizeStorageRelativePath(raw, relatorioId);
  if (!p) return undefined;
  const u = getStoragePublicUrl(relatorioId, p);
  return u || undefined;
}

function pushImageCandidates(
  out: Array<{ url?: string; path?: string; localPath?: string }>,
  src: unknown,
): void {
  if (src == null) return;
  if (typeof src === 'string') {
    const s = src.trim();
    if (s.startsWith('http')) out.push({ url: s });
    else if (s) out.push({ localPath: s });
    return;
  }
  if (typeof src !== 'object') return;
  const o = src as UnknownRec;
  out.push({
    url: o.url as string | undefined,
    path: (o.path ?? o.caminho ?? o.uri ?? o.filePath) as string | undefined,
    localPath: (o.localPath ?? o.local_path ?? o.pathLocal) as string | undefined,
  });
}

function collectImageQueue(snapshot: UnknownRec): Array<{ url?: string; path?: string; localPath?: string }> {
  const q: Array<{ url?: string; path?: string; localPath?: string }> = [];

  const imgs = snapshot.imagens as UnknownRec[] | undefined;
  if (Array.isArray(imgs)) {
    for (const i of imgs) pushImageCandidates(q, i);
  }

  const mod = snapshot.modulos as UnknownRec | undefined;
  const mp = mod?.plantio as UnknownRec | undefined;
  if (mp && typeof mp === 'object') {
    for (const v of Object.values(mp)) {
      if (Array.isArray(v)) {
        for (const item of v) {
          if (item && typeof item === 'object') {
            const row = item as UnknownRec;
            pushImageCandidates(q, row.foto ?? row.fotoPath ?? row.imagem);
            const fs = row.fotos;
            if (Array.isArray(fs)) for (const f of fs) pushImageCandidates(q, f);
          }
        }
      } else if (v && typeof v === 'object') {
        const row = v as UnknownRec;
        pushImageCandidates(q, row.foto ?? row.fotoPath);
        const fs = row.fotos;
        if (Array.isArray(fs)) for (const f of fs) pushImageCandidates(q, f);
      }
    }
  }

  const fen = snapshot.fenologia as UnknownRec | undefined;
  const tl = Array.isArray(fen?.timeline) ? (fen.timeline as UnknownRec[]) : [];
  for (const row of tl) {
    const fotos = Array.isArray(row.fotos) ? (row.fotos as UnknownRec[]) : [];
    for (const f of fotos) pushImageCandidates(q, f);
  }

  const est = snapshot.estande as UnknownRec | undefined;
  const regs = Array.isArray(est?.registros) ? (est.registros as UnknownRec[]) : [];
  for (const r of regs) {
    pushImageCandidates(q, r.foto ?? r.fotoPath ?? r.imagem);
    const fs = r.fotos;
    if (Array.isArray(fs)) for (const f of fs) pushImageCandidates(q, f);
  }

  const analise = snapshot.analiseAgronomica as UnknownRec | undefined;
  const ev = (analise?.evidencias ?? snapshot.evidencias) as UnknownRec | undefined;
  const cats = ev?.categorias as UnknownRec | undefined;
  if (cats && typeof cats === 'object') {
    for (const arr of Object.values(cats)) {
      if (!Array.isArray(arr)) continue;
      for (const u of arr) {
        if (typeof u === 'string') pushImageCandidates(q, u);
        else pushImageCandidates(q, u);
      }
    }
  }

  return q;
}

/** Nome estável para selects e colunas (V1/V2 e fallbacks). */
export function nomeExibicaoTalhao(snap: UnknownRec, indexZeroBased: number): string {
  const th = (snap.talhao ?? {}) as UnknownRec;
  const core = (snap.core ?? {}) as UnknownRec;
  const cth = (core.talhao as UnknownRec | undefined) ?? {};
  const cands = [
    str(th.nome),
    str((th as UnknownRec).nome_talhao),
    str((th as UnknownRec).nomeTalhao),
    str((th as UnknownRec).label),
    str(cth.nome),
    str(core.talhaoNome),
    str(core.talhao_nome),
  ].filter((s) => s.length > 0);
  if (cands.length) return cands[0]!;
  const id = str(th.id) || str(core.talhaoId) || str(core.talhao_id);
  if (id) return id.length > 12 ? `Talhão (${id.slice(0, 10)}…)` : `Talhão (${id})`;
  return `Talhão ${indexZeroBased + 1}`;
}

/** Primeira imagem HTTP ou via storage para cabeçalho visual do talhão. */
export function heroUrlForSnapshot(snapshot: UnknownRec, relatorioId?: string): string | undefined {
  for (const entry of collectImageQueue(snapshot)) {
    const u = resolvePlantioAssetUrl(entry, relatorioId);
    if (u) return u;
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
