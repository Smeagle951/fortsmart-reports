/**
 * Derivação de dados para o relatório lado a lado estilo apresentação SaaS.
 * Tudo baseado no JSON real (sem inventar séries temporais).
 */

import type { SideBySideReportData } from '@/components/SideBySideReportContent';

export type ComparativeKpiRow = {
  label: string;
  valueA: number;
  valueB: number;
  /** Escala visual 0–100 (maior “melhor” para barras) */
  pctA: number;
  pctB: number;
  unit?: string;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

/** Normaliza par A/B para barras 0–100 usando o máximo do par. */
function pairToPct(a: number, b: number): { pctA: number; pctB: number } {
  const m = Math.max(Math.abs(a), Math.abs(b), 1e-6);
  return { pctA: clamp((a / m) * 100, 0, 100), pctB: clamp((b / m) * 100, 0, 100) };
}

export function buildComparativeKpis(data: SideBySideReportData): ComparativeKpiRow[] {
  const rows: ComparativeKpiRow[] = [];
  const crit = data.criteriosEstatistica || [];
  for (const c of crit) {
    const a = c.mediaA;
    const b = c.mediaB;
    if (a == null && b == null) continue;
    const na = a ?? 0;
    const nb = b ?? 0;
    const { pctA, pctB } = pairToPct(na, nb);
    rows.push({
      label: (c.criterio || 'Critério').slice(0, 42),
      valueA: na,
      valueB: nb,
      pctA,
      pctB,
      unit: c.unidade,
    });
  }
  if (rows.length > 0) return rows.slice(0, 6);

  const kpA = data.sideA?.kpis;
  const kpB = data.sideB?.kpis;
  const push = (
    label: string,
    va: number | null | undefined,
    vb: number | null | undefined,
    unit?: string
  ) => {
    if (va == null && vb == null) return;
    const na = va ?? 0;
    const nb = vb ?? 0;
    const { pctA, pctB } = pairToPct(na, nb);
    rows.push({ label, valueA: na, valueB: nb, pctA, pctB, unit });
  };
  push('Eficiência estande %', kpA?.eficienciaPct, kpB?.eficienciaPct, '%');
  push('População (pl/ha)', kpA?.finalPopulationPlHa, kpB?.finalPopulationPlHa);
  push('Altura (cm)', kpA?.avgHeightCm, kpB?.avgHeightCm, 'cm');
  push('Prof. raiz (cm)', kpA?.profundidadeRaizCm, kpB?.profundidadeRaizCm, 'cm');
  push('Prod. est. (kg/ha)', kpA?.estimatedYieldKgHa, kpB?.estimatedYieldKgHa, 'kg/ha');
  const ra = kpA?.rootRating?.score;
  const rb = kpB?.rootRating?.score;
  const maxR = kpA?.rootRating?.max ?? kpB?.rootRating?.max ?? 5;
  if (ra != null || rb != null) {
    const na = ((ra ?? 0) / maxR) * 100;
    const nb = ((rb ?? 0) / maxR) * 100;
    const { pctA, pctB } = pairToPct(na, nb);
    rows.push({
      label: 'Sanidade / raiz (score)',
      valueA: ra ?? 0,
      valueB: rb ?? 0,
      pctA,
      pctB,
      unit: `/${maxR}`,
    });
  }
  return rows.slice(0, 6);
}

export function deriveWinner(
  sideAName: string,
  sideBName: string,
  data: SideBySideReportData
): 'A' | 'B' | 'tie' {
  const ka = data.sideA?.kpis;
  const kb = data.sideB?.kpis;
  const ya = ka?.estimatedYieldKgHa ?? 0;
  const yb = kb?.estimatedYieldKgHa ?? 0;
  if (ya > 0 || yb > 0) {
    const diff = ya > 0 ? ((yb - ya) / ya) * 100 : yb > ya ? 100 : 0;
    if (diff > 2) return 'B';
    if (diff < -2) return 'A';
  }
  let winsA = 0;
  let winsB = 0;
  for (const c of data.criteriosEstatistica || []) {
    if (c.mediaA == null || c.mediaB == null) continue;
    if (c.mediaB > c.mediaA) winsB++;
    else if (c.mediaA > c.mediaB) winsA++;
  }
  if (winsB > winsA) return 'B';
  if (winsA > winsB) return 'A';
  return 'tie';
}

export function buildInsightParagraph(data: SideBySideReportData, sideAName: string, sideBName: string): string {
  const w = deriveWinner(sideAName, sideBName, data);
  const parts: string[] = [];
  if (w === 'B') {
    parts.push(
      `O manejo ${sideBName} apresentou indicadores mais favoráveis no conjunto analisado em relação a ${sideAName}.`
    );
  } else if (w === 'A') {
    parts.push(
      `O manejo ${sideAName} apresentou indicadores mais favoráveis no conjunto analisado em relação a ${sideBName}.`
    );
  } else {
    parts.push('Os dois manejos apresentaram desempenho técnico próximo nos critérios disponíveis.');
  }
  return parts.join(' ');
}

export function climateLineFromApplications(data: SideBySideReportData): string | null {
  const apps = Array.isArray(data.applications) ? data.applications : [];
  const ev = apps[0];
  if (!ev?.climate) return null;
  const c = ev.climate;
  const bits: string[] = [];
  if (c.temperature != null) bits.push(`${c.temperature}°C`);
  if (c.humidity != null) bits.push(`Umidade ${c.humidity}%`);
  if (c.wind != null) bits.push(`Vento ${c.wind} km/h`);
  if (c.derivaRisco) bits.push(`Deriva: ${c.derivaRisco}`);
  return bits.length ? bits.join(' · ') : null;
}

export function techLineFromApplications(data: SideBySideReportData): string | null {
  const apps = Array.isArray(data.applications) ? data.applications : [];
  const ev = apps[0];
  if (!ev?.applicationTech) return null;
  const t = ev.applicationTech;
  const bits: string[] = [];
  if (t.bico) bits.push(`Bico ${t.bico}`);
  if (t.vazao != null) bits.push(`Vazão ${t.vazao} L/min`);
  if (t.pressao != null) bits.push(`${t.pressao} bar`);
  return bits.length ? bits.join(' · ') : null;
}

export function severityTone(sev?: string): 'green' | 'amber' | 'red' | 'slate' {
  const s = (sev || '').toLowerCase();
  if (s.includes('baix')) return 'green';
  if (s.includes('méd') || s.includes('med')) return 'amber';
  if (s.includes('alt')) return 'red';
  return 'slate';
}

/** Dados para gráfico de linha: eixo X = critérios, séries A e B. */
export function buildCriteriaLineData(data: SideBySideReportData) {
  const crit = data.criteriosEstatistica || [];
  return crit
    .filter((c) => c.mediaA != null || c.mediaB != null)
    .slice(0, 12)
    .map((c) => ({
      name: (c.criterio || '—').slice(0, 18),
      A: c.mediaA ?? 0,
      B: c.mediaB ?? 0,
    }));
}

export function applicationEventTotalCusto(ev: NonNullable<SideBySideReportData['applications']>[0]): number {
  let t = 0;
  for (const p of ev.products || []) {
    if (p.custoHa != null) t += p.custoHa;
  }
  return t;
}

/** Marcos para linha do tempo DAE (plantio → aplicações → coleta). */
export type DaaTimelineItem = {
  key: string;
  badge: string;
  title: string;
  subtitle?: string;
  variant: 'slate' | 'sky' | 'amber' | 'emerald';
};

export function buildDaaTimelineItems(data: SideBySideReportData): DaaTimelineItem[] {
  const items: DaaTimelineItem[] = [];
  const coleta = data.coleta;

  if (coleta?.dataPlantio) {
    items.push({
      key: 'plantio',
      badge: 'D0',
      title: 'Plantio',
      subtitle: coleta.dataPlantio,
      variant: 'slate',
    });
  }

  const seen = new Set<string>();

  const apps = [...(data.applications || [])].sort((a, b) => {
    const ta = a.date ? Date.parse(a.date) : NaN;
    const tb = b.date ? Date.parse(b.date) : NaN;
    if (!Number.isNaN(ta) && !Number.isNaN(tb)) return ta - tb;
    return (a.daa ?? 0) - (b.daa ?? 0);
  });

  for (const ev of apps) {
    const k = ev.id || `${ev.date || ''}-${ev.side || ''}-${ev.type || ''}-${ev.stage || ''}`;
    if (seen.has(k)) continue;
    seen.add(k);
    const badge =
      ev.daa != null ? `DAA ${ev.daa}` : ev.date ? 'Aplicação' : 'App';
    const title = [ev.type, ev.stage].filter(Boolean).join(' · ') || 'Aplicação';
    const sub = [ev.date, ev.side ? `Lado ${ev.side}` : '', ev.responsible].filter(Boolean).join(' · ');
    items.push({
      key: k,
      badge,
      title,
      subtitle: sub || undefined,
      variant: 'sky',
    });
  }

  for (const leg of data.aplicacoes || []) {
    const dataIso = leg.data as string | undefined;
    const tipo = (leg.tipo as string) || 'Aplicação';
    const k = `leg:${dataIso || ''}-${tipo}-${leg.produtos || ''}`;
    if (seen.has(k)) continue;
    seen.add(k);
    const sub = [dataIso, leg.produtos as string, leg.doseResumo as string].filter(Boolean).join(' · ');
    items.push({
      key: k,
      badge: dataIso ? 'Data' : 'Registro',
      title: tipo,
      subtitle: sub || undefined,
      variant: 'amber',
    });
  }

  const dae = coleta?.dae ?? coleta?.dap;
  if (dae != null) {
    items.push({
      key: 'coleta-atual',
      badge: coleta?.dae != null ? `DAE ${dae}` : `DAP ${dae}`,
      title: 'Coleta deste relatório',
      subtitle: coleta?.ensaioName || undefined,
      variant: 'emerald',
    });
  }

  return items;
}
