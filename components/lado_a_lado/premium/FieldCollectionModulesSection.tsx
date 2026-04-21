'use client';

import React, { useMemo } from 'react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';

/** Rótulos de coluna (PT-BR) para chaves comuns de coleta em campo. */
const KEY_LABELS: Record<string, string> = {
  data: 'Data',
  dose: 'Dose',
  estadio: 'Estádio',
  produto: 'Produto',
  categoria: 'Categoria',
  tipo: 'Tipo',
  alvo: 'Alvo',
  incidencia: 'Incidência',
  severidade: 'Severidade',
  observacao: 'Observação',
  observacoes: 'Observações',
  nota: 'Nota',
  unidade: 'Unidade',
  valor: 'Valor',
  descricao: 'Descrição',
  nome: 'Nome',
  quantidade: 'Quantidade',
  status: 'Status',
  pressao: 'Pressão (hPa)',
  ur: 'U.R. (%)',
  temperatura: 'Temp. (°C)',
  vento: 'Vento',
  chuva: 'Chuva',
  solo_umidade: 'Solo (umid.)',
  compactacao: 'Compactação',
};

/** Títulos quando `module_labels` não vem do app. */
const SECTION_ID_FALLBACK: Record<string, string> = {
  aplicacoes: 'Aplicações',
  identificacao: 'Identificação',
  fenologia: 'Fenologia',
  ocorrencias: 'Ocorrências',
  observacoes: 'Observações',
  condicoes_ambientais: 'Condições ambientais',
  nutricao_solo: 'Nutrição e solo',
  pragas_detalhe: 'Pragas',
  doencas_detalhe: 'Doenças',
  plantas_daninhas: 'Plantas daninhas',
};

function titleForSection(secId: string, moduleLabels: Record<string, string>): string {
  if (moduleLabels[secId]) return moduleLabels[secId];
  if (SECTION_ID_FALLBACK[secId]) return SECTION_ID_FALLBACK[secId];
  return secId
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

const COLUMN_PRIORITY = [
  'data',
  'produto',
  'categoria',
  'tipo',
  'estadio',
  'dose',
  'alvo',
  'severidade',
  'incidencia',
  'observacao',
  'unidade',
] as const;

type FcmPoint = {
  point_id?: string;
  index?: number;
  status?: string;
  sides?: Record<string, Record<string, unknown>>;
};

function hasFieldCollectionData(data: SideBySideReportData): boolean {
  const fcm = data.field_collection_modules;
  if (fcm == null || typeof fcm !== 'object' || Array.isArray(fcm)) return false;
  const pts = (fcm as { points?: unknown }).points;
  return Array.isArray(pts) && pts.length > 0;
}

function formatCellValue(raw: unknown): string {
  if (raw == null) return '—';
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (/^\d{4}-\d{2}-\d{2}T/.test(t)) {
      const d = new Date(t);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      }
    }
    return t;
  }
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) return '—';
    return Number.isInteger(raw) ? String(raw) : String(Math.round(raw * 1000) / 1000);
  }
  if (typeof raw === 'boolean') return raw ? 'Sim' : 'Não';
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  if (Array.isArray(raw)) return raw.map((x) => formatCellValue(x)).filter(Boolean).join(' · ') || '—';
  if (typeof raw === 'object') {
    const keys = Object.keys(raw as object);
    if (keys.length <= 3) {
      return keys
        .map((k) => {
          const v = (raw as Record<string, unknown>)[k];
          return `${KEY_LABELS[k] ?? k}: ${formatCellValue(v)}`;
        })
        .join('; ');
    }
    return '…';
  }
  return String(raw);
}

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object' && !Array.isArray(x);
}

function collectKeysFromRows(rows: Record<string, unknown>[]): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    for (const k of Object.keys(row)) {
      if (k === '_id' || k === 'id' || k.startsWith('_')) continue;
      set.add(k);
    }
  }
  const prioritySet = new Set(COLUMN_PRIORITY as readonly string[]);
  const rest = [...set].filter((k) => !prioritySet.has(k));
  rest.sort((a, b) => a.localeCompare(b, 'pt'));
  const ordered = (COLUMN_PRIORITY as readonly string[]).filter((k) => set.has(k));
  return [...ordered, ...rest];
}

function ItensTable({ rows }: { rows: Record<string, unknown>[] }) {
  const keys = useMemo(() => collectKeysFromRows(rows), [rows]);
  if (keys.length === 0) {
    return <p className="text-sm text-slate-500">Nenhum campo registrado.</p>;
  }
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-300">
            {keys.map((k) => (
              <th
                key={k}
                className="py-1.5 pr-3 font-semibold text-slate-600 text-xs uppercase tracking-wide whitespace-nowrap"
              >
                {KEY_LABELS[k] ?? k.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-slate-200/80 last:border-0">
              {keys.map((k) => (
                <td key={k} className="py-2 pr-3 align-top text-slate-800">
                  {formatCellValue(row[k])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DlBlock({ obj }: { obj: Record<string, unknown> }) {
  const entries = Object.entries(obj).filter(
    ([k, v]) => !k.startsWith('_') && v !== null && v !== undefined && v !== '',
  );
  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">—</p>;
  }
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
      {entries.map(([k, v]) => {
        if (isPlainObject(v) || Array.isArray(v)) {
          return (
            <div key={k} className="sm:col-span-2">
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-1">
                {KEY_LABELS[k] ?? k.replace(/_/g, ' ')}
              </dt>
              <dd className="text-slate-800 mt-0.5 pl-0 border-l-2 border-slate-200 pl-3">
                {renderValue(v, 1)}
              </dd>
            </div>
          );
        }
        return (
          <div key={k} className="min-w-0">
            <dt className="text-xs text-slate-500">{KEY_LABELS[k] ?? k.replace(/_/g, ' ')}</dt>
            <dd className="text-slate-900 font-medium min-w-0 wrap-break-word">{formatCellValue(v)}</dd>
          </div>
        );
      })}
    </dl>
  );
}

function renderValue(raw: unknown, depth: number): React.ReactNode {
  if (raw == null) return <span className="text-slate-400">—</span>;
  if (depth > 2) {
    return (
      <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap wrap-break-word max-h-32 overflow-y-auto border border-slate-200 bg-slate-50/80 p-2">
        {JSON.stringify(raw, null, 2)}
      </pre>
    );
  }
  if (Array.isArray(raw)) {
    if (raw.length === 0) return <span className="text-slate-400">—</span>;
    if (raw.every((x) => isPlainObject(x))) {
      return <ItensTable rows={raw as Record<string, unknown>[]} />;
    }
    return (
      <ul className="list-disc list-inside text-sm text-slate-800 space-y-0.5">
        {raw.map((x, i) => (
          <li key={i}>{formatCellValue(x)}</li>
        ))}
      </ul>
    );
  }
  if (isPlainObject(raw)) {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.itens) && o.itens.length > 0 && o.itens.every((x) => isPlainObject(x))) {
      return <ItensTable rows={o.itens as Record<string, unknown>[]} />;
    }
    return <DlBlock obj={o} />;
  }
  return <span className="text-sm text-slate-800">{formatCellValue(raw)}</span>;
}

function SectionBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-900 mb-2">{title}</h4>
      <div className="border-l-2 border-slate-300 pl-3 ml-0.5">{renderValue(value, 0)}</div>
    </div>
  );
}

/**
 * Módulos de coleta em campo (`field_collection_modules`) — apresentação tabular, sem JSON bruto.
 */
export default function FieldCollectionModulesSection({
  data,
  sectionId = 'coleta-campo-modulos',
}: {
  data: SideBySideReportData;
  sectionId?: string;
}) {
  if (!hasFieldCollectionData(data)) return null;

  const fcm = data.field_collection_modules as {
    schema_version?: number;
    module_labels?: Record<string, string>;
    points?: FcmPoint[];
  };
  const points = fcm.points ?? [];
  const moduleLabels = fcm.module_labels ?? {};
  const schemaVersion = fcm.schema_version;

  return (
    <section id={sectionId} className="scroll-mt-36 print:break-inside-avoid">
      <header className="mb-6 border-b border-slate-300 pb-3">
        <h2 className="text-base font-bold tracking-tight text-slate-900">Coleta em campo</h2>
        <p className="mt-1.5 text-sm text-slate-600 leading-relaxed max-w-3xl">
          Registros por ponto e por tratamento (A/B), no formato do protocolo de avaliação.
          {schemaVersion != null && (
            <span className="text-slate-500"> · Versão de schema {schemaVersion}</span>
          )}
        </p>
      </header>

      <div className="space-y-10">
        {points.map((pt, i) => {
          const pLabel = typeof pt.index === 'number' ? `Ponto ${pt.index}` : `Ponto ${i + 1}`;
          const sides = pt.sides && typeof pt.sides === 'object' ? pt.sides : {};
          const sideKeys = Object.keys(sides).sort();
          if (sideKeys.length === 0) return null;

          return (
            <div key={pt.point_id ?? `pt-${i}`} className="space-y-4">
              <div className="flex flex-wrap items-end gap-x-3 gap-y-1 border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">{pLabel}</h3>
                {pt.status ? (
                  <span className="text-xs text-slate-500">
                    <span className="text-slate-400">Status</span> · {pt.status}
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
                {sideKeys.map((letter) => {
                  const secMap = sides[letter];
                  if (!secMap || typeof secMap !== 'object') return null;
                  const sectionIds = Object.keys(secMap).sort();
                  if (sectionIds.length === 0) {
                    return (
                      <div key={letter} className="min-w-0">
                        <p className="text-xs font-semibold text-slate-500 mb-2">Tratamento {letter}</p>
                        <p className="text-sm text-slate-500">Sem módulos preenchidos.</p>
                      </div>
                    );
                  }
                  return (
                    <div key={letter} className="min-w-0">
                      <p className="text-xs font-semibold text-slate-500 mb-3 pb-1 border-b border-slate-200">
                        Tratamento {letter}
                      </p>
                      <div className="divide-y divide-slate-200">
                        {sectionIds.map((secId) => {
                          const title = titleForSection(secId, moduleLabels);
                          return (
                            <div key={secId} className="py-3 first:pt-0">
                              <SectionBlock title={title} value={secMap[secId]} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
