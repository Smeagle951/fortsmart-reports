'use client';

import type { FeatureCollection } from 'geojson';
import { useMemo, useState } from 'react';

import { subareasForTalhaoId } from './geojsonUtils';
import { diasDesdePlantio, parsePlantioDate } from './plantioDate';
import { strokeForProperties } from './materialColor';

type Tab = 'info' | 'atividades';

type Props = {
  properties: Record<string, unknown> | null;
  /** Coleção completa (filtrada por talhões no mapa) para listar subáreas do talhão. */
  fullCollection: FeatureCollection | null;
  onClose: () => void;
  onGerarRelatorioPdf: () => void;
};

function fmt(n: unknown, digits = 0): string {
  if (typeof n === 'number' && !Number.isNaN(n)) {
    return n.toLocaleString('pt-BR', { maximumFractionDigits: digits, minimumFractionDigits: digits });
  }
  return '—';
}

function labelSubtipo(st: string): string {
  const s = st.toLowerCase();
  if (s === 'experimento') return 'Experimento';
  if (s === 'tratamento') return 'Tratamento';
  return st;
}

export function TalhaoDetailPanel({
  properties,
  fullCollection,
  onClose,
  onGerarRelatorioPdf,
}: Props) {
  const [tab, setTab] = useState<Tab>('info');

  const subCards = useMemo(() => {
    if (!properties || !fullCollection) return [];
    const tipo = String(properties.tipo ?? 'talhao');
    if (tipo !== 'talhao') return [];
    const tid = String(properties.talhao_id ?? '');
    if (!tid) return [];
    return subareasForTalhaoId(fullCollection, tid).map((f) => {
      const p = (f.properties ?? {}) as Record<string, unknown>;
      const nome =
        p.name != null
          ? String(p.name)
          : p.label_manejo != null
            ? String(p.label_manejo)
            : 'Subárea';
      const st = p.tipo_manejo != null ? String(p.tipo_manejo) : '';
      const area = p.area_ha;
      const ah = typeof area === 'number' && !Number.isNaN(area) ? area : null;
      const mat = p.material != null ? String(p.material) : '—';
      return { nome, st, ah, mat };
    });
  }, [properties, fullCollection]);

  if (!properties) {
    return (
      <div className="flex h-full min-h-[220px] flex-col rounded-xl border border-slate-700/70 bg-slate-900/85 p-4 text-sm text-slate-500 shadow-inner print:hidden">
        <p className="font-semibold text-slate-200">Detalhe</p>
        <p className="mt-3 text-xs leading-relaxed text-slate-400">
          Selecione um <strong className="text-slate-300">talhão</strong> ou{' '}
          <strong className="text-slate-300">subárea</strong> no mapa. Os dados vêm do GeoJSON
          exportado pelo app (cultura, híbrido, estande, safra).
        </p>
      </div>
    );
  }

  const tipo = String(properties.tipo ?? 'talhao');
  const isSub = tipo === 'subarea';
  const nome = String(properties.talhao ?? properties.name ?? '—');
  const parentNome =
    properties.parent_talhao_nome != null ? String(properties.parent_talhao_nome) : '';
  const cultura = String(properties.cultura ?? '—');
  const material = String(
    (properties.material as string) ??
      (properties.variedade as string) ??
      (properties.tipo_manejo as string) ??
      '—',
  );
  const stroke = isSub
    ? '#38bdf8'
    : strokeForProperties({
        material: properties.material as string,
        kml_style_key: properties.kml_style_key as string,
      });
  const est = properties.estande_pl_ha ?? properties.plantas_por_ha;
  const areaH = properties.area_ha;
  const dpRaw = properties.data_plantio != null ? String(properties.data_plantio) : null;
  const dpDisplay = dpRaw ?? '—';
  const sa = String(properties.safra ?? '—');
  const subtipo = isSub && properties.tipo_manejo != null ? String(properties.tipo_manejo) : '';
  const dias = diasDesdePlantio(dpRaw);
  const parsedDp = parsePlantioDate(dpRaw);
  const dpFmt = parsedDp != null ? parsedDp.toLocaleDateString('pt-BR') : dpDisplay;

  const atividades = properties.atividades;
  const atividadesList = Array.isArray(atividades) ? (atividades as unknown[]) : [];

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-700/70 bg-slate-900/90 shadow-inner print:border print:bg-white">
      <div className="flex items-start justify-between gap-2 border-b border-slate-700/60 px-3 py-2.5 print:border-slate-300">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400/90 print:text-emerald-800">
            {isSub ? 'Subárea de manejo' : 'Talhão'}
          </p>
          <h2 className="truncate text-base font-bold text-white print:text-slate-900">{nome}</h2>
          {isSub && parentNome ? (
            <p className="mt-0.5 truncate text-[11px] text-slate-400 print:text-slate-600">
              Talhão: {parentNome}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2 print:hidden">
          <span
            className="h-3 w-10 rounded border-2 border-white/20"
            style={{ background: 'transparent', borderColor: stroke }}
            title="Cor no mapa"
          />
          <button
            type="button"
            className="rounded-lg p-1.5 text-lg leading-none text-slate-400 hover:bg-slate-800 hover:text-white"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-700/60 print:border-slate-300">
        <button
          type="button"
          className={`flex-1 px-2 py-2 text-xs font-semibold print:hidden ${
            tab === 'info'
              ? 'border-b-2 border-emerald-500 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          onClick={() => setTab('info')}
        >
          Informações
        </button>
        <button
          type="button"
          className={`flex-1 px-2 py-2 text-xs font-semibold print:hidden ${
            tab === 'atividades'
              ? 'border-b-2 border-emerald-500 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          onClick={() => setTab('atividades')}
        >
          Atividades
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 text-xs text-slate-200 print:text-slate-800">
        {tab === 'info' ? (
          <div className="space-y-4">
            {isSub && subtipo ? (
              <p className="rounded-md bg-amber-950/40 px-2 py-1 text-amber-100/90 print:bg-amber-50 print:text-amber-900">
                Tipo: <strong>{labelSubtipo(subtipo)}</strong>
              </p>
            ) : null}

            <dl className="grid gap-3">
              <div className="rounded-lg bg-slate-950/50 p-2.5 print:bg-slate-50">
                <dt className="text-[10px] font-medium uppercase text-slate-500 print:text-slate-600">Cultura</dt>
                <dd className="mt-0.5 text-sm font-semibold text-white print:text-slate-900">{cultura}</dd>
              </div>
              <div className="rounded-lg bg-slate-950/50 p-2.5 print:bg-slate-50">
                <dt className="text-[10px] font-medium uppercase text-slate-500 print:text-slate-600">Híbrido</dt>
                <dd className="mt-0.5 text-sm font-semibold text-white print:text-slate-900">{material}</dd>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-slate-950/50 p-2.5 print:bg-slate-50">
                  <dt className="text-[10px] font-medium uppercase text-slate-500 print:text-slate-600">Área</dt>
                  <dd className="mt-0.5 font-semibold text-white print:text-slate-900">
                    {typeof areaH === 'number' ? `${fmt(areaH, 1)} ha` : '—'}
                  </dd>
                </div>
                <div className="rounded-lg bg-slate-950/50 p-2.5 print:bg-slate-50">
                  <dt className="text-[10px] font-medium uppercase text-slate-500 print:text-slate-600">Estande</dt>
                  <dd className="mt-0.5 font-semibold text-white print:text-slate-900">
                    {typeof est === 'number' && !Number.isNaN(est) ? `${fmt(est, 0)} pl/ha` : '—'}
                  </dd>
                </div>
              </div>
              <div className="rounded-lg bg-slate-950/50 p-2.5 print:bg-slate-50">
                <dt className="text-[10px] font-medium uppercase text-slate-500 print:text-slate-600">Data de plantio</dt>
                <dd className="mt-0.5 font-semibold text-white print:text-slate-900">{dpFmt}</dd>
              </div>
              <div className="rounded-lg bg-slate-950/50 p-2.5 print:bg-slate-50">
                <dt className="text-[10px] font-medium uppercase text-slate-500 print:text-slate-600">Dias de vida</dt>
                <dd className="mt-0.5 font-semibold text-white print:text-slate-900">
                  {dias != null ? `${fmt(dias, 0)} dias` : '—'}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-950/50 p-2.5 print:bg-slate-50">
                <dt className="text-[10px] font-medium uppercase text-slate-500 print:text-slate-600">Safra</dt>
                <dd className="mt-0.5 font-semibold text-white print:text-slate-900">{sa}</dd>
              </div>
            </dl>

            {!isSub && subCards.length > 0 ? (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 print:text-slate-600">
                  Subáreas
                </p>
                <ul className="space-y-2">
                  {subCards.map((s) => (
                    <li
                      key={s.nome + s.st}
                      className="rounded-lg border border-slate-600/60 bg-slate-950/60 p-2.5 print:border-slate-300 print:bg-white"
                    >
                      <p className="font-semibold text-white print:text-slate-900">{s.nome}</p>
                      {s.st ? (
                        <p className="mt-0.5 text-[11px] text-amber-200/90 print:text-amber-800">
                          {labelSubtipo(s.st)}
                        </p>
                      ) : null}
                      <p className="mt-1 text-[11px] text-slate-400 print:text-slate-600">
                        Área: {s.ah != null ? `${fmt(s.ah, 1)} ha` : '—'} · Híbrido: {s.mat}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex flex-col gap-2 border-t border-slate-700/50 pt-3 print:hidden">
              <button
                type="button"
                className="w-full rounded-lg border border-slate-500 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
                onClick={() =>
                  document.getElementById('mapa-sementes')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              >
                Ver calculadora de sementes
              </button>
              <button
                type="button"
                className="w-full rounded-lg bg-[#2E7D32] py-2.5 text-xs font-bold text-white shadow hover:bg-[#1B5E20]"
                onClick={onGerarRelatorioPdf}
              >
                Gerar relatório (PDF)
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {atividadesList.length > 0 ? (
              <ul className="space-y-2 border-l-2 border-emerald-600/50 pl-3">
                {atividadesList.map((a, i) => (
                  <li key={i} className="text-[11px] text-slate-300">
                    {typeof a === 'object' && a != null && 'descricao' in (a as object)
                      ? String((a as { descricao?: string }).descricao)
                      : JSON.stringify(a)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="leading-relaxed text-slate-400">
                O GeoJSON exportado pelo app <strong className="text-slate-300">não inclui</strong> ainda o histórico
                de aplicações e pulverizações. Consulte <strong className="text-slate-300">Aplicações</strong> e{' '}
                <strong className="text-slate-300">Plantio</strong> no FortSmart móvel para o registo completo.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
