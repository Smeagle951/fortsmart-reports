'use client';

import type { FeatureCollection, GeoJsonObject } from 'geojson';
import dynamic from 'next/dynamic';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  decodeGeoJsonFromQuery,
  distinctCulturasSafas,
  downloadGeoJson,
  filterByCulturaSafra,
  filterBySelectedTalhoes,
  isFeatureCollectionGj,
  listTalhoesFromFc,
} from './geojsonUtils';
import { MapSummaryBar } from './MapSummaryBar';
import { strokeForProperties } from './materialColor';
import { SeedCalculatorTable } from './SeedCalculatorTable';
import { TalhaoDetailPanel } from './TalhaoDetailPanel';

const MapView = dynamic(
  () => import('./MapView').then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[360px] items-center justify-center bg-slate-800 text-slate-400">
        Carregando mapa…
      </div>
    ),
  },
);

export type MapaTalhoesClientProps = {
  /** Quando definido (rota /mapa-talhoes/m/[token]), ignora ?d= na primeira carga. */
  initialFeatureCollection?: FeatureCollection | null;
};

export function MapaTalhoesClient({
  initialFeatureCollection = null,
}: MapaTalhoesClientProps) {
  const sp = useSearchParams();
  const pathname = usePathname();
  const [raw, setRaw] = useState<FeatureCollection | null>(null);
  const [cultura, setCultura] = useState('all');
  const [safra, setSafra] = useState('all');
  const [search, setSearch] = useState('');
  const [staged, setStaged] = useState<Set<string>>(new Set());
  const [onMap, setOnMap] = useState<Set<string>>(new Set());
  const [err, setErr] = useState<string | null>(null);
  const [linkBusy, setLinkBusy] = useState(false);
  const [tip, setTip] = useState<string | null>(null);
  const [loadingShare, setLoadingShare] = useState(false);
  const [selectedFeatureProps, setSelectedFeatureProps] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (initialFeatureCollection != null) {
      setRaw(initialFeatureCollection);
      setErr(null);
      return;
    }
    const d = sp.get('d');
    if (!d) return;
    const fc = decodeGeoJsonFromQuery(d);
    if (fc) {
      setRaw(fc);
      setErr(null);
    } else {
      setErr(
        'O parâmetro d= na URL está incompleto ou inválido (navegadores cortam URLs muito longas). Use o link curto gerado pela app FortSmart ou exporte o .geojson.',
      );
    }
  }, [sp, initialFeatureCollection]);

  useEffect(() => {
    setSelectedFeatureProps(null);
  }, [raw]);

  /** Fallback quando o SSR não entrega GeoJSON (ex.: shell noutro host) mas a URL tem `/mapa-talhoes/m/:id`. */
  useEffect(() => {
    if (initialFeatureCollection != null) return;
    if (raw != null) return;

    const m = pathname.match(/^\/mapa-talhoes\/m\/([^/]+)\/?$/);
    const token = m?.[1]?.trim();
    if (!token) return;

    let cancelled = false;
    const ac = new AbortController();

    void (async () => {
      try {
        setLoadingShare(true);
        setErr(null);
        const res = await fetch(
          `/api/mapa-talhoes/snapshot/${encodeURIComponent(token)}`,
          { signal: ac.signal },
        );
        if (cancelled) return;
        if (!res.ok) {
          setErr(
            res.status === 404
              ? 'Link expirado ou inválido. Gere um novo mapa na app FortSmart (Plantio → Exportar KML / mapa web).'
              : `Não foi possível carregar o mapa partilhado (${res.status}).`,
          );
          return;
        }
        const data = (await res.json()) as unknown;
        if (cancelled) return;
        if (isFeatureCollectionGj(data as GeoJsonObject)) {
          setRaw(data as FeatureCollection);
          setErr(null);
        } else {
          setErr('Resposta do servidor sem GeoJSON válido.');
        }
      } catch (e) {
        if (cancelled) return;
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setErr('Falha de rede ao carregar o mapa partilhado.');
      } finally {
        if (!cancelled) setLoadingShare(false);
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [initialFeatureCollection, raw, pathname]);

  const baseFiltered = useMemo(() => {
    if (!raw) return null;
    return filterByCulturaSafra(raw, cultura, safra);
  }, [raw, cultura, safra]);

  const { culturas, safras } = useMemo(
    () =>
      raw
        ? distinctCulturasSafas(raw)
        : { culturas: ['all'] as string[], safras: ['all'] as string[] },
    [raw],
  );

  const talhoes = useMemo(
    () => (baseFiltered ? listTalhoesFromFc(baseFiltered) : []),
    [baseFiltered],
  );

  const listFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return talhoes;
    return talhoes.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        t.talhaoId.toLowerCase().includes(q),
    );
  }, [talhoes, search]);

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

  const copiarLinkCurto = useCallback(async () => {
    if (!raw) return;
    setErr(null);
    setLinkBusy(true);
    try {
      const res = await fetch('/api/mapa-talhoes/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(raw),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.url) {
        setErr(
          data.error ??
            `Não foi possível criar link curto (${res.status}). Confirme a migração Supabase e variáveis do servidor.`,
        );
        return;
      }
      await navigator.clipboard.writeText(data.url);
      setErr(null);
      setTip('Link curto copiado para a área de transferência.');
      window.setTimeout(() => setTip(null), 5000);
    } catch {
      setErr('Rede indisponível ao criar link curto.');
    } finally {
      setLinkBusy(false);
    }
  }, [raw]);

  return (
    <div className="mapa-talhoes-root flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 px-4 py-3 shadow-lg backdrop-blur">
        <div className="mx-auto flex max-w-[1920px] flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="font-['Poppins'] text-lg font-bold tracking-tight text-white md:text-xl">
              FortSmart — Mapa de talhões
            </h1>
            <p className="text-xs text-slate-400">
              Partilha web (link curto) a partir do app — GeoJSON do plantio e subáreas
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {tip ? (
              <span className="text-emerald-300">{tip}</span>
            ) : null}
            {raw && (
              <>
                <button
                  className="rounded-md border border-slate-600 px-2 py-1.5 text-slate-200 hover:bg-slate-800"
                  type="button"
                  onClick={() =>
                    downloadGeoJson(raw, 'fortsmart-mapa-talhoes.geojson')
                  }
                >
                  Exportar GeoJSON
                </button>
                <button
                  className="rounded-md border border-emerald-700/60 bg-emerald-900/30 px-2 py-1.5 text-emerald-100 hover:bg-emerald-900/50 disabled:opacity-50"
                  disabled={linkBusy}
                  type="button"
                  onClick={() => void copiarLinkCurto()}
                >
                  {linkBusy ? 'A gerar…' : 'Copiar link curto'}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1920px] flex-1 flex-col gap-2 p-2 md:flex-row md:p-3">
        <aside className="order-2 flex w-full max-w-md flex-col gap-2 md:order-1">
          {!raw && (
            <div className="rounded-lg border border-slate-700/80 bg-slate-900/70 p-4 text-sm leading-relaxed text-slate-400 shadow-inner">
              {err ? (
                <p className="mb-3 rounded border border-amber-700/50 bg-amber-900/20 px-2 py-1.5 text-xs text-amber-200">
                  {err}
                </p>
              ) : null}
              {loadingShare ? (
                <p className="text-slate-200">A carregar o link partilhado…</p>
              ) : (
                <>
                  <p className="mb-2 text-base font-medium text-slate-100">Sem dados nesta URL</p>
                  <p className="mb-3">
                    Isto <strong className="text-slate-200">não</strong> é o painel que lê a
                    base da sua fazenda. Aqui só aparecem polígonos de um ficheiro{' '}
                    <strong className="text-slate-200">gerado e partilhado</strong> pelo app
                    (GeoJSON de plantio e subáreas).
                  </p>
                  <p className="mb-2 text-slate-200">Como abrir o mapa com os talhões</p>
                  <ol className="list-decimal space-y-1.5 pl-4 text-slate-400">
                    <li>No FortSmart, vá a <strong className="text-slate-300">Plantio</strong>.</li>
                    <li>
                      Selecione os talhões e use <strong className="text-slate-300">Exportar</strong> /{' '}
                      <strong className="text-slate-300">mapa (web)</strong> (cria o link &quot;curto&quot;{' '}
                      <code className="text-emerald-300/90">…/mapa-talhoes/m/…</code>).
                    </li>
                    <li>Abra o link exatamente nesse endereço (domínio dos relatórios) — o mapa mostra contornos e uma cor por híbrido.</li>
                  </ol>
                </>
              )}
            </div>
          )}

          {raw ? (
            <div className="rounded-lg border border-slate-700/80 bg-slate-900/70 p-3 shadow-inner">
              <h2 className="mb-2 text-sm font-semibold text-slate-200">Filtros</h2>
              {err && (
                <p className="mb-2 rounded border border-amber-700/50 bg-amber-900/20 px-2 py-1 text-xs text-amber-200">
                  {err}
                </p>
              )}
              <div className="grid grid-cols-2 gap-2 text-xs">
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
          ) : null}

          {raw ? (
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
                <p className="pt-1 text-center text-[10px] text-slate-500">
                  ({listFiltered.length} resultados)
                </p>
              )}
              <button
                className="mt-2 w-full rounded-md bg-[#2E7D32] py-2.5 text-sm font-semibold text-white shadow hover:bg-[#1B5E20]"
                type="button"
                onClick={aplicarMapa}
              >
                Visualizar no mapa
              </button>
            </div>
          ) : null}
        </aside>

        <div className="order-1 flex min-h-0 flex-1 flex-col gap-2 lg:flex-row md:order-2">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
            <div className="relative min-h-[44vh] flex-1 overflow-hidden rounded-lg border border-slate-700/60 bg-slate-900/40 shadow-inner">
              {mapData && mapData.features.length > 0 ? <MapSummaryBar data={mapData} /> : null}
              {mapData && mapData.features.length > 0 ? (
                <MapView
                  data={mapData}
                  onSelectFeature={setSelectedFeatureProps}
                />
              ) : (
                <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-2 px-4 text-center text-sm text-slate-500">
                  {loadingShare ? (
                    <p className="text-slate-300">A carregar o mapa partilhado…</p>
                  ) : raw ? (
                    <p>Marque talhões na lista e toque em «Visualizar no mapa».</p>
                  ) : (
                    <>
                      <p className="text-slate-300">Nada para desenhar ainda</p>
                      <p className="max-w-md text-xs leading-relaxed">
                        Esta vista só recebe o GeoJSON do <strong>link partilhado</strong> do app. O
                        contorno de cada talhão usa a <strong>cor do híbrido</strong> (material) —
                        toque no polígono para ver cultura, estande e safra.
                      </p>
                    </>
                  )}
                </div>
              )}
              {materialsLegend.length > 0 && (
                <div className="pointer-events-none absolute bottom-2 left-2 max-w-sm rounded border border-slate-600/80 bg-slate-950/90 p-2 text-[10px] text-slate-200 shadow">
                  <p className="mb-1 font-semibold text-slate-100">
                    Híbrido / material (contorno talhão)
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {materialsLegend.map(({ k, c }) => (
                      <li key={k} className="flex items-center gap-1">
                        <span
                          className="h-2 w-4 rounded-sm"
                          style={{ background: c }}
                        />
                        {k}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 text-slate-500">
                    Subáreas: hachurado 4×4, preenchimento 25&nbsp;%
                  </p>
                </div>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-700/60 bg-slate-900/50 p-3">
              <SeedCalculatorTable data={tableData} />
            </div>
          </div>
          {mapData && mapData.features.length > 0 ? (
            <div className="w-full shrink-0 lg:max-w-[320px]">
              <TalhaoDetailPanel
                properties={selectedFeatureProps}
                onClose={() => setSelectedFeatureProps(null)}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
