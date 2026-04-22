'use client';

import type { Feature, FeatureCollection } from 'geojson';
import { useMemo } from 'react';
import { strokeForProperties } from './materialColor';

type Row = {
  id: string;
  talhaoLabel: string;
  material: string;
  areaHa: number;
  pph: number | null;
  espM: number | null;
  plM: string;
  totalSeeds: number | null;
  strokeHint: string;
  kind: 'talhao' | 'subarea';
};

function toRow(f: Feature, idx: number): Row | null {
  const p = f.properties as Record<string, unknown> | null | undefined;
  if (!p) return null;
  const tipo = String(p.tipo);
  if (tipo !== 'talhao' && tipo !== 'subarea') return null;
  const mat = p.material != null ? String(p.material) : '—';
  const areaH = p.area_ha;
  const areaHa = typeof areaH === 'number' && !Number.isNaN(areaH) ? areaH : 0;
  const pphRaw = p.estande_pl_ha ?? p.plantas_por_ha;
  const pph = typeof pphRaw === 'number' && pphRaw > 0 ? pphRaw : null;
  const espRaw = p.espacamento_m;
  const espM = typeof espRaw === 'number' && espRaw > 0 ? espRaw : null;
  let plM = '—';
  // Plantas por metro de fileira: plantas/ha ÷ (10 000 / espaçamento m entre linhas)
  if (pph != null && espM != null) {
    const plm = pph / (10_000 / espM);
    plM = plm.toFixed(2).replace('.', ',');
  }
  const est = p.estimativa_sementes;
  let totalSeeds: number | null = typeof est === 'number' && !Number.isNaN(est) ? Math.round(est) : null;
  if (totalSeeds == null && pph != null && areaHa > 0) {
    totalSeeds = Math.round(areaHa * pph);
  }
  const label =
    p.talhao != null
      ? String(p.talhao)
      : p.name != null
        ? String(p.name)
        : '—';
  const id = f.id != null ? String(f.id) : `row_${idx}`;
  return {
    id,
    talhaoLabel: label,
    material: mat,
    areaHa,
    pph,
    espM,
    plM,
    totalSeeds,
    strokeHint: mat,
    kind: tipo === 'subarea' ? 'subarea' : 'talhao',
  };
}

const fmtInt = (n: number) =>
  n.toLocaleString('pt-BR', { maximumFractionDigits: 0, minimumFractionDigits: 0 });
const fmtDec = (n: number) =>
  n.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const fmtPph = (n: number | null) =>
  n == null
    ? '—'
    : n.toLocaleString('pt-BR', { maximumFractionDigits: 0, minimumFractionDigits: 0 });

export function SeedCalculatorTable({ data }: { data: FeatureCollection | null }) {
  const { rows, areaTotal, seedsTotal, mediaHa } = useMemo(() => {
    if (!data?.features?.length) {
      return { rows: [] as Row[], areaTotal: 0, seedsTotal: 0, mediaHa: 0 };
    }
    const list: Row[] = [];
    data.features.forEach((f, i) => {
      const r = toRow(f, i);
      if (r) list.push(r);
    });
    const areaTotal = list.reduce((s, r) => s + (r.areaHa > 0 ? r.areaHa : 0), 0);
    const seedsTotal = list.reduce((s, r) => s + (r.totalSeeds != null ? r.totalSeeds : 0), 0);
    const mediaHa = areaTotal > 0 ? seedsTotal / areaTotal : 0;
    return { rows: list, areaTotal, seedsTotal, mediaHa };
  }, [data]);

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700/80 bg-slate-900/40 p-4 text-sm text-slate-400">
        Carregue um GeoJSON para ver a <strong className="text-slate-200">Calculadora de sementes</strong> (área, estande e totais).
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-100">Calculadora de sementes (estimativa a partir do estande)</h3>
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-md border border-slate-600/60 bg-slate-800/60 p-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Área total</p>
          <p className="text-lg font-semibold text-white">{fmtDec(areaTotal)} ha</p>
        </div>
        <div className="rounded-md border border-slate-600/60 bg-slate-800/60 p-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Sementes totais</p>
          <p className="text-lg font-semibold text-white">{fmtInt(seedsTotal)}</p>
        </div>
        <div className="rounded-md border border-slate-600/60 bg-slate-800/60 p-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Média sementes/ha</p>
          <p className="text-lg font-semibold text-white">{areaTotal > 0 ? fmtInt(Math.round(mediaHa)) : '—'}</p>
        </div>
      </div>
      <p className="text-xs text-slate-400">
        Necessidade total: <span className="text-slate-200">{fmtInt(seedsTotal)}</span> sementes para{' '}
        <span className="text-slate-200">{fmtDec(areaTotal)}</span> hectares
        {areaTotal > 0 ? '.' : ''}
      </p>
      <div className="max-h-56 overflow-auto rounded-md border border-slate-600/50">
        <table className="w-full min-w-[520px] border-collapse text-left text-xs">
          <thead>
            <tr className="sticky top-0 bg-slate-800/95 text-[10px] font-semibold uppercase text-slate-400">
              <th className="p-1.5">Talhão / parcela</th>
              <th className="p-1.5">Material</th>
              <th className="p-1.5 text-right">Área (ha)</th>
              <th className="p-1.5 text-right">Estande (pl/m)</th>
              <th className="p-1.5 text-right">Plantas/ha</th>
              <th className="p-1.5 text-right">Total sementes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const dot = strokeForProperties({ material: r.material });
              return (
                <tr
                  key={r.id}
                  className="border-t border-slate-700/60 hover:bg-slate-800/50"
                >
                  <td className="p-1.5 text-slate-200">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: dot }} />{' '}
                    {r.talhaoLabel}
                    {r.kind === 'subarea' && (
                      <span className="ml-1 text-[10px] text-amber-400/90">(sub)</span>
                    )}
                  </td>
                  <td className="p-1.5 text-slate-300">{r.material}</td>
                  <td className="p-1.5 text-right tabular-nums text-slate-200">{fmtDec(r.areaHa)}</td>
                  <td className="p-1.5 text-right tabular-nums text-slate-200">{r.plM}</td>
                  <td className="p-1.5 text-right tabular-nums text-slate-200">{fmtPph(r.pph)}</td>
                  <td className="p-1.5 text-right tabular-nums text-slate-100">
                    {r.totalSeeds != null ? fmtInt(r.totalSeeds) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
