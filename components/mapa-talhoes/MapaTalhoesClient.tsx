'use client';

import type { FeatureCollection } from 'geojson';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  decodeGeoJsonFromQuery,
  distinctCulturasSafas,
  downloadGeoJson,
  filterByCulturaSafra,
  filterBySelectedTalhoes,
  listTalhoesFromFc,
  parseJsonFileText,
} from './geojsonUtils';
import { MapSummaryBar } from './MapSummaryBar';
import { strokeForProperties } from './materialColor';
import { SeedCalculatorTable } from './SeedCalculatorTable';

const MapView = dynamic(
  () => import('./MapView').then((m) => m.MapView),
  { ssr: false, loading: () => <div className="flex h-full min-h-[360px] items-center justify-center bg-slate-800 text-slate-400">Carregando mapa…</div> }
);

/** Base64-URL, compatível com `dart:convert` base64Url (Flutter). */
function utf8ToB64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function MapaTalhoesClient() {
  const sp = useSearchParams();
  const [raw, setRaw] = useState<FeatureCollection | null>(null);
  const [cultura, setCultura] = useState('all');
  const [safra, setSafra] = useState('all');
  const [search, setSearch] = useState('');
  const [staged, setStaged] = useState<Set<string>>(new Set());
  const [onMap, setOnMap] = useState<Set<string>>(new Set());
  const [err, setErr] = useState<string | null>(null);
  const [paste, setPaste] = useState('');

  // Query ?d= (base64url GeoJSON) — p.ex. a partir do app Flutter
  useEffect(() => {
    const d = sp.get('d');
    if (!d) return;
    const fc = decodeGeoJsonFromQuery(d);
    if (fc) {
      setRaw(fc);
      setErr(null);
    } else {
      setErr('Parâmetro d= inválido ou payload demasiado grande. Use ficheiro ou export do app com partilha.');
    }
  }, [sp]);

  const baseFiltered = useMemo(() => {
    if (!raw) return null;
    return filterByCulturaSafra(raw, cultura, safra);
  }, [raw, cultura, safra]);

  const { culturas, safras } = useMemo(
    () => (raw ? distinctCulturasSafas(raw) : { culturas: ['all'] as string[], safras: ['all'] as string[] }),
    [raw]
  );

  const talhoes = useMemo(() => (baseFiltered ? listTalhoesFromFc(baseFiltered) : []), [baseFiltered]);

  const listFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return talhoes;
    return talhoes.filter((t) => t.label.toLowerCase().includes(q) || t.talhaoId.toLowerCase().includes(q));
  }, [talhoes, search]);

  // Ao mudar o conjunto filtrado (cultura/safra / ficheiro), re-seleccionar todos
  useEffect(() => {
    if (!baseFiltered) {
      setStaged(new Set());
      setOnMap(new Set());
      return;
    }
    const list = listTalhoesFromFc(baseFiltered);
    if (list.length === 0) {
      setStaged(new Set());
      setOnMap(new Set());
      return;
    }
    const s = new Set(list.map((t) => t.talhaoId));
    setStaged(s);
    setOnMap(s);
  }, [baseFiltered]);

  const mapData = useMemo(() => {
    if (!baseFiltered) return null;
    return filterBySelectedTalhoes(baseFiltered, onMap);
  }, [baseFiltered, onMap]);

  const tableData = useMemo(() => {
    if (!mapData) return null;
    if (mapData.features.length === 0) return null;
    return mapData;
  }, [mapData]);

  const materialsLegend = useMemo(() => {
    if (!mapData) return [] as { k: string; c: string }[];
    const m = new Set<string>();
    for (const f of mapData.features) {
      const p = f.properties as Record<string, unknown> | null | undefined;
      if (!p) continue;
      const mat = p.material != null ? String(p.material) : null;
      if (mat) m.add(mat);
    }
    return Array.from(m)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((k) => ({ k, c: strokeForProperties({ material: k }) }));
  }, [mapData]);

  const toggle = useCallback((id: string) => {
    setStaged((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);

  const selectAll = useCallback(() => {
    setStaged(new Set(talhoes.map((t) => t.talhaoId)));
  }, [talhoes]);

  const clearStaged = useCallback(() => setStaged(new Set()), []);

  const aplicarMapa = useCallback(() => {
    setOnMap(new Set(staged));
  }, [staged]);

  const onFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const t = r.result;
      if (typeof t !== 'string') {
        setErr('Ficheiro inválido.');
        return;
      }
      const fc = parseJsonFileText(t);
      if (fc) {
        setRaw(fc);
        setErr(null);
      } else {
        setErr('JSON não é um FeatureCollection GeoJSON válido.');
      }
    };
    r.readAsText(f);
    e.target.value = '';
  }, []);

  const aplicarColar = useCallback(() => {
    const fc = parseJsonFileText(paste);
    if (fc) {
      setRaw(fc);
      setErr(null);
    } else {
      setErr('Cola um GeoJSON FeatureCollection JSON válido.');
    }
  }, [paste]);

  const copiarLink = useCallback(() => {
    if (!raw) return;
    const str = JSON.stringify(raw);
    const b64 = utf8ToB64Url(str);
    if (b64.length > 100_000) {
      setErr('GeoJSON acima de ~100k caracteres no link — partilhe o ficheiro ou reabra a exportação do app (modo ficheiro).');
      return;
    }
    const u = new URL(window.location.origin + window.location.pathname);
    u.searchParams.set('d', b64);
    setErr(null);
    void navigator.clipboard.writeText(u.toString());
  }, [raw]);

  return (
    <div className="mapa-talhoes-root flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 px-4 py-3 shadow-lg backdrop-blur">
        <div className="mx-auto flex max-w-[1920px] flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="font-['Poppins'] text-lg font-bold tracking-tight text-white md:text-xl">
              FortSmart Agrointeligência — Mapa de talhões
            </h1>
            <p className="text-xs text-slate-400">GeoJSON a partir do app (plantio, estande, subáreas)</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <a
              className="rounded-md border border-slate-600 px-2 py-1.5 text-slate-200 hover:bg-slate-800"
              href="https://fortsmart-agro.com.br"
              rel="noreferrer"
              target="_blank"
            >
              Abrir site
            </a>
            {raw && (
              <>
                <button
                  className="rounded-md border border-slate-600 px-2 py-1.5 text-slate-200 hover:bg-slate-800"
                  type="button"
                  onClick={() => downloadGeoJson(raw, 'fortsmart-mapa-talhoes.geojson')}
                >
                  Exportar GeoJSON
                </button>
                <button
                  className="rounded-md border border-slate-600 px-2 py-1.5 text-slate-200 hover:bg-slate-800"
                  type="button"
                  onClick={copiarLink}
                >
                  Copiar link
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1920px] flex-1 flex-col gap-2 p-2 md:flex-row md:p-3">
        {/* Painel esquerdo */}
        <aside className="order-2 flex w-full max-w-md flex-col gap-2 md:order-1">
          <div className="rounded-lg border border-slate-700/80 bg-slate-900/70 p-3 shadow-inner">
            <h2 className="mb-2 text-sm font-semibold text-slate-200">Dados</h2>
            {err && <p className="mb-2 rounded border border-amber-700/50 bg-amber-900/20 px-2 py-1 text-xs text-amber-200">{err}</p>}
            <label className="mb-2 block text-xs text-slate-400">
              Carregar ficheiro .geojson
              <input
                accept=".json,.geojson,application/geo+json,application/json"
                className="mt-1 block w-full text-xs text-slate-300"
                type="file"
                onChange={onFile}
              />
            </label>
            <div className="mb-2">
              <p className="text-xs text-slate-500">ou colar JSON</p>
              <textarea
                className="mt-1 h-20 w-full rounded border border-slate-600 bg-slate-950/80 p-1.5 text-[11px] text-slate-200"
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                placeholder="FeatureCollection…"
              />
              <button
                className="mt-1 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-200"
                type="button"
                onClick={aplicarColar}
              >
                Aplicar
              </button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <label className="text-slate-400">
                Cultura
                <select
                  className="mt-0.5 w-full rounded border border-slate-600 bg-slate-950 px-1 py-1 text-slate-200"
                  value={cultura}
                  onChange={(e) => setCultura(e.target.value)}
                >
                  {culturas.map((c) => (
                    <option key={c} value={c}>
                      {c === 'all' ? 'Todas' : c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-slate-400">
                Safra
                <select
                  className="mt-0.5 w-full rounded border border-slate-600 bg-slate-950 px-1 py-1 text-slate-200"
                  value={safra}
                  onChange={(e) => setSafra(e.target.value)}
                >
                  {safras.map((s) => (
                    <option key={s} value={s}>
                      {s === 'all' ? 'Todas' : s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-slate-700/80 bg-slate-900/70 p-2 shadow-inner">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200">Talhões</h2>
              <span className="text-xs text-emerald-400/90">{onMap.size} no mapa</span>
            </div>
            <input
              className="mb-2 w-full rounded border border-slate-600 bg-slate-950/80 px-2 py-1 text-xs text-slate-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar…"
            />
            <div className="mb-1 flex gap-1 text-[10px]">
              <button
                className="rounded border border-slate-600 px-1.5 py-0.5"
                type="button"
                onClick={selectAll}
              >
                Todos
              </button>
              <button
                className="rounded border border-slate-600 px-1.5 py-0.5"
                type="button"
                onClick={clearStaged}
              >
                Limpar
              </button>
            </div>
            <ul className="max-h-56 flex-1 space-y-1 overflow-y-auto pr-0.5 text-xs md:max-h-96">
              {listFiltered.map((t) => (
                <li
                  key={t.talhaoId}
                  className="flex items-center justify-between gap-1 rounded border border-slate-700/40 bg-slate-950/40 px-1.5 py-0.5"
                >
                  <label className="flex flex-1 cursor-pointer items-center gap-2 text-slate-200">
                    <input
                      checked={staged.has(t.talhaoId)}
                      className="rounded border-slate-500"
                      type="checkbox"
                      onChange={() => toggle(t.talhaoId)}
                    />
                    <span className="truncate">{t.label}</span>
                    <span className="shrink-0 text-slate-500">
                      {t.areaHa != null
                        ? `${t.areaHa.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} ha`
                        : ''}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            {search.trim() !== '' && (
              <p className="pt-1 text-center text-[10px] text-slate-500">({listFiltered.length} resultados)</p>
            )}
            <button
              className="mt-2 w-full rounded-md bg-[#2E7D32] py-2.5 text-sm font-semibold text-white shadow hover:bg-[#1B5E20]"
              type="button"
              onClick={aplicarMapa}
            >
              Visualizar no mapa
            </button>
          </div>
        </aside>

        {/* Mapa + legenda + calculadora */}
        <div className="order-1 flex min-h-0 flex-1 flex-col gap-2 md:order-2">
          <div className="relative min-h-[44vh] flex-1 overflow-hidden rounded-lg border border-slate-700/60 bg-slate-900/40 shadow-inner">
            {mapData && mapData.features.length > 0 ? <MapSummaryBar data={mapData} /> : null}
            {mapData && mapData.features.length > 0 ? (
              <MapView data={mapData} />
            ) : (
              <div className="flex h-full min-h-[360px] items-center justify-center text-sm text-slate-500">
                Carregue ou receba um GeoJSON (app → export / parâmetro d=) e clique &quot;Visualizar no mapa&quot;.
              </div>
            )}
            {materialsLegend.length > 0 && (
              <div className="pointer-events-none absolute bottom-2 left-2 max-w-sm rounded border border-slate-600/80 bg-slate-950/90 p-2 text-[10px] text-slate-200 shadow">
                <p className="mb-1 font-semibold text-slate-100">Híbrido / material (contorno talhão)</p>
                <ul className="flex flex-wrap gap-2">
                  {materialsLegend.map(({ k, c }) => (
                    <li key={k} className="flex items-center gap-1">
                      <span className="h-2 w-4 rounded-sm" style={{ background: c }} />
                      {k}
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-slate-500">Subáreas: hachurado 4×4, preenchimento 25&nbsp;%</p>
              </div>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-700/60 bg-slate-900/50 p-3">
            <SeedCalculatorTable data={tableData} />
          </div>
        </div>
      </div>
    </div>
  );
}
