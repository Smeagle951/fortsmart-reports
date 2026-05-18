import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import type { ReportApplicationEventV2Json } from '@/types/side-by-side-report';

export type DaaAssessmentNode = {
  id: string;
  label: string;
  kind: 'application' | 'daa' | 'harvest' | 'other';
  date?: string;
  stage?: string;
  daa?: number;
  completed: boolean;
  criteria?: string[];
  notes?: string;
};

/** Avaliações sequenciais / DAA a partir do payload atual (sem quebrar relatórios antigos). */
export function buildDaaTimeline(data: SideBySideReportData): DaaAssessmentNode[] {
  const nodes: DaaAssessmentNode[] = [];
  const seen = new Set<string>();

  const published = (data as { daa_assessments?: Array<{ daa?: number; date?: string; stage?: string; notes?: string }> })
    .daa_assessments;
  if (Array.isArray(published) && published.length > 0) {
    for (const a of published) {
      const label = a.daa != null ? `${a.daa} DAA` : a.stage || 'Avaliação';
      nodes.push({
        id: `pub-${a.daa ?? label}`,
        label,
        kind: 'daa',
        date: a.date,
        stage: a.stage,
        daa: a.daa,
        completed: true,
        notes: a.notes,
      });
    }
    return nodes;
  }

  const push = (n: DaaAssessmentNode) => {
    const key = `${n.kind}:${n.label}:${n.date ?? ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    nodes.push(n);
  };

  const apps = data.applications ?? [];
  if (apps.length) {
    const first = [...apps].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))[0];
    push({
      id: 'app-first',
      label: 'Aplicação',
      kind: 'application',
      date: first?.date,
      stage: first?.stage,
      daa: first?.daa,
      completed: true,
    });
  }

  for (const ev of data.applications ?? []) {
    if (ev.daa != null && Number.isFinite(ev.daa)) {
      push({
        id: `daa-app-${ev.id ?? ev.daa}`,
        label: `${ev.daa} DAA`,
        kind: 'daa',
        date: ev.date,
        stage: ev.stage,
        daa: ev.daa,
        completed: true,
      });
    }
  }

  for (const pt of data.evaluation_points_geo ?? []) {
    const m = pt as Record<string, unknown>;
    const lbl = typeof m.daa_label === 'string' ? m.daa_label.trim() : '';
    if (lbl) {
      push({
        id: `pt-${m.index ?? lbl}`,
        label: lbl,
        kind: 'daa',
        completed: true,
      });
    }
  }

  for (const ev of data.timeline_events ?? []) {
    const desc = ev.description?.trim();
    if (!desc) continue;
    const daaMatch = desc.match(/(\d+)\s*DAA/i);
    push({
      id: `tl-${ev.date ?? desc.slice(0, 12)}`,
      label: daaMatch ? `${daaMatch[1]} DAA` : desc.slice(0, 40),
      kind: daaMatch ? 'daa' : 'other',
      date: ev.date,
      completed: true,
      notes: desc,
    });
  }

  const colheita = data.colheita;
  if (colheita?.sides?.length) {
    push({
      id: 'harvest',
      label: 'Pré-colheita / Colheita',
      kind: 'harvest',
      completed: true,
    });
  }

  const defaultDaa = [7, 14, 21, 28, 35];
  for (const d of defaultDaa) {
    const has = nodes.some((n) => n.daa === d || n.label.includes(`${d} DAA`));
    if (!has && nodes.some((n) => n.kind === 'application')) {
      push({
        id: `placeholder-${d}`,
        label: `${d} DAA`,
        kind: 'daa',
        daa: d,
        completed: false,
      });
    }
  }

  nodes.sort((a, b) => {
    if (a.kind === 'application' && b.kind !== 'application') return -1;
    if (b.kind === 'application' && a.kind !== 'application') return 1;
    if (a.kind === 'harvest') return 1;
    if (b.kind === 'harvest') return -1;
    const da = a.daa ?? 999;
    const db = b.daa ?? 999;
    return da - db;
  });

  return nodes;
}

export function applicationsBySide(
  data: SideBySideReportData,
  side: 'A' | 'B',
): ReportApplicationEventV2Json[] {
  return (data.applications ?? []).filter((e) => e.side === side);
}
