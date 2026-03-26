import type { AmostragemObservacao } from './payload';
import { computeCompactacaoAnalytics } from './compactacaoAnalytics';

export type TalhaoRankingItem = {
  talhaoId: string;
  talhaoNome: string;
  nObs: number;
  icMedio: number | null;
  pctAltaCritica: number;
  confiabilidade: number;
  tendenciaSlope: number | null;
};

function reliabilityScore(obs: AmostragemObservacao[]): number {
  if (obs.length === 0) return 0;
  let validGeo = 0;
  let goodAccuracy = 0;
  let withIc = 0;
  for (const o of obs) {
    const hasGeo = Number.isFinite(o.lat) && Number.isFinite(o.lng);
    if (hasGeo) validGeo++;
    if (o.gps_accuracy_m != null && Number(o.gps_accuracy_m) <= 8) goodAccuracy++;
    if (o.compactacao != null && Number.isFinite(Number(o.compactacao))) withIc++;
  }
  const geoPart = validGeo / obs.length;
  const icPart = withIc / obs.length;
  const accPart = goodAccuracy / Math.max(1, validGeo);
  return Math.round((geoPart * 0.45 + icPart * 0.35 + accPart * 0.2) * 1000) / 10;
}

function trendSlope(obs: AmostragemObservacao[]): number | null {
  const pts = obs
    .map((o, idx) => ({ x: Number(o.numero ?? idx + 1), y: Number(o.compactacao) }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  if (pts.length < 3) return null;
  const n = pts.length;
  let sx = 0;
  let sy = 0;
  let sxy = 0;
  let sx2 = 0;
  for (const p of pts) {
    sx += p.x;
    sy += p.y;
    sxy += p.x * p.y;
    sx2 += p.x * p.x;
  }
  const den = n * sx2 - sx * sx;
  if (den === 0) return null;
  return (n * sxy - sx * sy) / den;
}

export function buildTalhaoRanking(obs: AmostragemObservacao[]): TalhaoRankingItem[] {
  const byTalhao = new Map<string, AmostragemObservacao[]>();
  for (const o of obs) {
    const id = String(o.talhao_id ?? 'sem-talhao');
    const arr = byTalhao.get(id) ?? [];
    arr.push(o);
    byTalhao.set(id, arr);
  }
  const out: TalhaoRankingItem[] = [];
  for (const [talhaoId, items] of byTalhao.entries()) {
    const an = computeCompactacaoAnalytics(items);
    const talhaoNome =
      items.find((x) => x.talhao_nome && String(x.talhao_nome).trim())?.talhao_nome ??
      talhaoId;
    out.push({
      talhaoId,
      talhaoNome: String(talhaoNome),
      nObs: an.nObservacoesComIc,
      icMedio: an.icMedia != null ? Math.round(an.icMedia * 100) / 100 : null,
      pctAltaCritica: an.pctCamadasAltaCritica,
      confiabilidade: reliabilityScore(items),
      tendenciaSlope: trendSlope(items),
    });
  }
  return out;
}

