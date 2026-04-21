'use client';

import React, { useMemo } from 'react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';

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

/**
 * Tabela estilo “data grid” executivo: cabeçalho escuro, linhas alternadas, ring suave.
 */
function ItensTable({ rows }: { rows: Record<string, unknown>[] }) {
  const keys = useMemo(() => collectKeysFromRows(rows), [rows]);
  if (keys.length === 0) {
    return (
      <p className="text-sm text-slate-500 italic px-1 py-3">Nenhum campo registrado.</p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-slate-900/[0.06] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)]">
      <table className="w-full min-w-[min(100%,480px)] text-left text-[13px] border-collapse">
        <thead>
          <tr className="bg-[linear-gradient(180deg,rgb(15,23,42)_0%,rgb(30,41,59)_100%)] text-slate-100 print:!bg-slate-200 print:!text-slate-900 print:border-slate-400">
            {keys.map((k) => (
              <th
                key={k}
                className="py-2.5 px-3.5 first:pl-4 last:pr-4 font-semibold text-[0.65rem] uppercase tracking-[0.12em] whitespace-nowrap border-b border-slate-700/50"
              >
                {KEY_LABELS[k] ?? k.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className="border-b border-slate-200/70 last:border-0 even:bg-slate-50/90 odd:bg-white text-slate-800 transition-colors"
            >
              {keys.map((k) => (
                <td key={k} className="py-2.5 px-3.5 first:pl-4 last:pr-4 align-top text-[13px] leading-snug">
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {entries.map(([k, v]) => {
        if (isPlainObject(v) || Array.isArray(v)) {
          return (
            <div
              key={k}
              className="sm:col-span-2 rounded-lg bg-white/60 p-3 ring-1 ring-slate-200/80 shadow-sm"
            >
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-slate-500">
                {KEY_LABELS[k] ?? k.replace(/_/g, ' ')}
              </p>
              <div className="mt-2 pl-0 border-l-2 border-amber-500/50 pl-3">{renderValue(v, 1)}</div>
            </div>
          );
        }
        return (
          <div
            key={k}
            className="rounded-lg bg-white/90 px-3.5 py-2.5 ring-1 ring-slate-200/60 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-slate-500">
              {KEY_LABELS[k] ?? k.replace(/_/g, ' ')}
            </dt>
            <dd className="mt-1 text-sm font-medium text-slate-900 min-w-0 wrap-break-word">
              {formatCellValue(v)}
            </dd>
          </div>
        );
      })}
    </div>
  );
}

function renderValue(raw: unknown, depth: number): React.ReactNode {
  if (raw == null) return <span className="text-slate-400">—</span>;
  if (depth > 2) {
    return (
      <pre className="text-[0.7rem] font-mono leading-relaxed text-slate-600 whitespace-pre-wrap wrap-break-word max-h-40 overflow-y-auto rounded-lg border border-slate-200/80 bg-slate-100/50 p-3 print:text-xs">
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
      <ul className="space-y-2 text-sm text-slate-800">
        {raw.map((x, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
            <span>{formatCellValue(x)}</span>
          </li>
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
  return <span className="text-sm text-slate-800 font-medium">{formatCellValue(raw)}</span>;
}

function SectionBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="pt-0.5">
      <h4 className="flex items-center gap-2.5 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-slate-600 mb-2.5">
        <span
          className="inline-block h-px w-6 bg-gradient-to-r from-amber-500/80 to-amber-400/20"
          aria-hidden
        />
        {title}
      </h4>
      <div className="pl-1.5 sm:pl-2 border-l-2 border-slate-200/80 ml-0.5">
        {renderValue(value, 0)}
      </div>
    </div>
  );
}

const SIDE_SKIN: Record<string, { bar: string; panel: string; kicker: string; label: string }> = {
  A: {
    bar: 'from-blue-600 to-indigo-700',
    panel:
      'bg-gradient-to-b from-blue-50/80 via-white to-slate-50/30 ring-1 ring-blue-200/25 shadow-[0_4px_24px_-4px_rgba(30,58,138,0.12)]',
    kicker: 'text-blue-800/80',
    label: 'Referência / manejo padrão',
  },
  B: {
    bar: 'from-emerald-600 to-teal-800',
    panel:
      'bg-gradient-to-b from-emerald-50/80 via-white to-slate-50/30 ring-1 ring-emerald-200/30 shadow-[0_4px_24px_-4px_rgba(6,78,59,0.1)]',
    kicker: 'text-emerald-900/80',
    label: 'Tratamento comparado',
  },
};

function sideSkin(letter: string) {
  return SIDE_SKIN[letter] ?? {
    bar: 'from-slate-600 to-slate-800',
    panel: 'bg-gradient-to-b from-slate-50/90 to-white ring-1 ring-slate-200/50 shadow-sm',
    kicker: 'text-slate-700',
    label: 'Tratamento',
  };
}

/**
 * Bloco de coleta em campo — apresentação tipo deck executivo (não layout “CRUD básico”).
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
    <section
      id={sectionId}
      className="scroll-mt-28 print:break-inside-avoid relative isolate"
    >
      {/* Luz ambiente (só tela) */}
      <div
        className="absolute inset-0 -z-10 -mx-4 sm:-mx-6 h-[min(100%,32rem)] max-h-[50vh] opacity-70 sm:mx-0 pointer-events-none print:hidden"
        aria-hidden
      >
        <div className="absolute top-0 left-1/2 h-48 w-[min(100%,64rem)] -translate-x-1/2 bg-[radial-gradient(ellipse_80%_100%_at_50%_-20%,rgba(15,23,42,0.07),transparent_60%)]" />
      </div>

      <div
        className="relative overflow-hidden rounded-[1.25rem] sm:rounded-3xl
          border border-slate-200/70
          bg-gradient-to-b from-white via-slate-50/30 to-slate-100/20
          shadow-[0_1px_0_0_rgba(255,255,255,0.9)_inset,0_12px_40px_-12px_rgba(15,23,42,0.1)]
          print:shadow-none print:border print:rounded-lg"
      >
        {/* Capa de secção estilo apresentação */}
        <div
          className="relative overflow-hidden border-b border-slate-200/50
            bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800
            px-6 py-6 sm:px-8 sm:py-7
            print:!bg-slate-100 print:!border-slate-300 print:from-slate-100 print:via-slate-100 print:to-slate-100"
        >
          <div
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl print:hidden"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-blue-500/5 blur-2xl print:hidden"
            aria-hidden
          />
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.4em] text-slate-400 print:text-slate-600">
            Dossiê técnico
          </p>
          <h2 className="mt-2.5 text-xl sm:text-2xl font-light tracking-[-0.02em] text-white print:text-slate-900">
            Coleta em campo
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 font-light print:text-slate-700">
            Registos estruturados por ponto e por manejo, alinhados ao protocolo de avaliação. Dados
            apresentados em formato de grelha para leitura executiva.
            {schemaVersion != null && (
              <span className="text-slate-500 print:text-slate-500"> · Schema v{schemaVersion}</span>
            )}
          </p>
        </div>

        <div className="space-y-10 px-4 py-8 sm:px-8 sm:py-10">
          {points.map((pt, i) => {
            const pLabel = typeof pt.index === 'number' ? `Ponto ${pt.index}` : `Ponto ${i + 1}`;
            const sides = pt.sides && typeof pt.sides === 'object' ? pt.sides : {};
            const sideKeys = Object.keys(sides).sort();
            if (sideKeys.length === 0) return null;

            return (
              <div
                key={pt.point_id ?? `pt-${i}`}
                className="group/point"
              >
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-slate-400">
                      Amostragem
                    </p>
                    <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                      {pLabel}
                    </h3>
                  </div>
                  {pt.status ? (
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100/80 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200/60">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/90" />
                      {pt.status}
                    </div>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
                  {sideKeys.map((letter) => {
                    const secMap = sides[letter];
                    if (!secMap || typeof secMap !== 'object') return null;
                    const sectionIds = Object.keys(secMap).sort();
                    const skin = sideSkin(letter);
                    if (sectionIds.length === 0) {
                      return (
                        <div
                          key={letter}
                          className={`relative overflow-hidden rounded-2xl p-5 ${skin.panel}`}
                        >
                          <div
                            className={`absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b ${skin.bar}`}
                            aria-hidden
                          />
                          <p className={`text-xs font-bold uppercase tracking-wide ${skin.kicker}`}>
                            Tratamento {letter} · {skin.label}
                          </p>
                          <p className="mt-2 text-sm text-slate-500">Sem módulos preenchidos.</p>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={letter}
                        className={`relative overflow-hidden rounded-2xl p-5 sm:p-6 ${skin.panel}`}
                      >
                        <div
                          className={`absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b ${skin.bar}`}
                          aria-hidden
                        />
                        <div className="pl-3">
                          <p className={`text-xs font-bold uppercase tracking-[0.12em] ${skin.kicker}`}>
                            Tratamento {letter}
                          </p>
                          <p className="text-[0.7rem] text-slate-500 mt-0.5">{skin.label}</p>
                          <div className="mt-5 space-y-0 divide-y divide-slate-200/80">
                            {sectionIds.map((secId) => {
                              const title = titleForSection(secId, moduleLabels);
                              return (
                                <div key={secId} className="py-4 first:pt-0 first:mt-0">
                                  <SectionBlock title={title} value={secMap[secId]} />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
