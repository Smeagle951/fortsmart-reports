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
  filterByViewMode,
  isFeatureCollectionGj,
  listTalhoesFromFc,
  type MapaViewMode,
} from './geojsonUtils';
import { FiltersHeader } from './FiltersHeader';
import { LegendFooter } from './LegendFooter';
import { MapSummaryBar } from './MapSummaryBar';
import { strokeForProperties } from './materialColor';
import { SeedCalculatorTable } from './SeedCalculatorTable';
import { TalhaoDetailPanel } from './TalhaoDetailPanel';
import { TalhaoSidebar } from './TalhaoSidebar';

const MapView = dynamic(() => import('./MapView').then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[360px] items-center justify-center bg-slate-800 text-slate-400">
      Carregando mapa…
    </div>
  ),
});

const NOVO_PLANTIO_HREF =
  process.env.NEXT_PUBLIC_FORTSMART_APP_URL?.trim() || 'https://app.fortsmart-agro.com.br';

export type MapaTalhoesClientProps = {
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
  const [viewMode, setViewMode] = useState<MapaViewMode>('talhoes_subareas');
  const [search, setSearch] = useState('');
  const [staged, setStaged] = useState<Set<string>>(new Set());
  const [onMap, setOnMap] = useState<Set<string>>(new Set());
  const [err, setErr] = useState<string | null>(null);
  const [linkBusy, setLinkBusy] = useState(false);
  const [tip, setTip] = useState<string | null>(null);
  const [loadingShare, setLoadingShare] = useState(false);
  const [selectedFeatureProps, setSelectedFeatureProps] = useState<Record<string, unknown> | null>(null);
  const [hostHint, setHostHint] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const h = window.location.hostname.toLowerCase();
    if (h.includes('fortsmart') && !h.startsWith('relatorios.') && !h.includes('localhost')) {
      setHostHint(
        'Se abriu a partir do app e o mapa fica vazio: confirme o domínio relatorios.fortsmart-agro.com.br (o mesmo do link partilhado).',
      );
    }
  }, []);

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
      raw ? distinctCulturasSafas(raw) : { culturas: ['all'] as string[], safras: ['all'] as string[] },
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
        t.label.toLowerCase().includes(q) || t.talhaoId.toLowerCase().includes(q),
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

  const mapDisplayData = useMemo(() => {
    if (!mapData) return null;
    return filterByViewMode(mapData, viewMode);
  }, [mapData, viewMode]);

  const tableData = useMemo(() => {
    if (!mapData || mapData.features.length === 0) return null;
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

  const onPrintPdf = useCallback(() => {
    window.print();
  }, []);

  const onKmlInfo = useCallback(() => {
    setTip('KML completo: no app FortSmart → Plantio → Exportar KML.');
    window.setTimeout(() => setTip(null), 6000);
  }, []);

  return (
    <div className="mapa-talhoes-root flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <FiltersHeader
        cultura={cultura}
        safra={safra}
        viewMode={viewMode}
        culturas={culturas}
        safras={safras}
        onCultura={setCultura}
        onSafra={setSafra}
        onViewMode={setViewMode}
        hasData={!!raw}
        tip={tip}
        linkBusy={linkBusy}
        onExportGeoJson={() => raw && downloadGeoJson(raw, 'fortsmart-mapa-talhoes.geojson')}
        onCopyShortLink={() => void copiarLinkCurto()}
        onPrintPdf={onPrintPdf}
        onKmlInfo={onKmlInfo}
        novoPlantioHref={NOVO_PLANTIO_HREF}
      />

      <div className="mx-auto flex w-full max-w-[1920px] flex-1 flex-col gap-2 p-2 print:block print:p-4 lg:grid lg:min-h-0 lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)_minmax(260px,300px)] lg:gap-3 lg:p-3">
        {/* Coluna esquerda: vazio OU lista */}
        <aside className="order-2 flex min-h-0 flex-col gap-2 lg:order-1 print:hidden">
          {!raw ? (
            <div className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-4 text-sm leading-relaxed text-slate-400 shadow-inner">
              {err ? (
                <p className="mb-3 rounded-lg border border-amber-700/50 bg-amber-900/20 px-2 py-1.5 text-xs text-amber-200">
                  {err}
                </p>
              ) : null}
              {hostHint ? (
                <p className="mb-3 rounded-lg border border-sky-800/50 bg-sky-950/30 px-2 py-1.5 text-xs text-sky-200">
                  {hostHint}
                </p>
              ) : null}
              {loadingShare ? (
                <p className="text-slate-200">A carregar o mapa partilhado…</p>
              ) : (
                <>
                  <p className="mb-2 text-base font-semibold text-slate-100">Sem dados nesta URL</p>
                  <p className="mb-3">
                    Esta página <strong className="text-slate-200">não</strong> lê a base de dados da fazenda.
                    Mostra apenas o GeoJSON <strong className="text-slate-200">partilhado</strong> pelo app
                    (talhões + subáreas de manejo).
                  </p>
                  <p className="mb-2 font-medium text-slate-200">Como abrir o mapa</p>
                  <ol className="list-decimal space-y-1.5 pl-4 text-slate-400">
                    <li>FortSmart → <strong className="text-slate-300">Plantio</strong>.</li>
                    <li>
                      Selecione talhões → <strong className="text-slate-300">Visualizar mapa (web)</strong> ou link{' '}
                      <code className="text-emerald-300/90">…/mapa-talhoes/m/…</code>
                    </li>
                    <li>O URL deve incluir <code className="text-emerald-300/90">?d=</code> ou o token curto.</li>
                  </ol>
                </>
              )}
            </div>
          ) : (
            <TalhaoSidebar
              listFiltered={listFiltered}
              staged={staged}
              search={search}
              onSearchChange={setSearch}
              onToggle={toggle}
              onSelectAll={selectAll}
              onClearStaged={clearStaged}
              onAplicarMapa={aplicarMapa}
              onMapCount={onMap.size}
            />
          )}
        </aside>

        {/* Centro: mapa + calculadora */}
        <div className="order-1 flex min-h-0 min-w-0 flex-col gap-2 lg:order-2">
          <div className="relative min-h-[48vh] flex-1 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/40 shadow-inner print:min-h-[70vh] print:border-slate-300">
            {mapDisplayData && mapDisplayData.features.length > 0 ? (
              <MapSummaryBar data={mapDisplayData} />
            ) : null}
            {mapDisplayData && mapDisplayData.features.length > 0 ? (
              <MapView data={mapDisplayData} onSelectFeature={setSelectedFeatureProps} />
            ) : (
              <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-2 px-4 text-center text-sm text-slate-500 print:text-slate-700">
                {loadingShare ? (
                  <p className="text-slate-300">A carregar o mapa partilhado…</p>
                ) : raw ? (
                  <p>Marque talhões na lista e use «Visualizar no mapa», ou ajuste filtros/visualização.</p>
                ) : (
                  <p className="max-w-xs text-xs leading-relaxed text-slate-500 lg:max-w-sm print:hidden">
                    Use o link do app neste domínio de relatórios — veja os passos na coluna ao lado.
                  </p>
                )}
              </div>
            )}
            <LegendFooter items={materialsLegend} showSubareaHint={viewMode !== 'talhoes'} />
          </div>
          <div id="mapa-sementes" className="max-h-96 overflow-y-auto rounded-xl border border-slate-700/60 bg-slate-900/50 p-3 print:max-h-none">
            <SeedCalculatorTable data={tableData} />
          </div>
        </div>

        {/* Direita: detalhe */}
        {mapData && mapData.features.length > 0 ? (
          <div className="order-3 min-h-0 w-full shrink-0 lg:order-3 lg:max-h-[calc(100vh-8rem)]">
            <TalhaoDetailPanel
              properties={selectedFeatureProps}
              fullCollection={mapData}
              onClose={() => setSelectedFeatureProps(null)}
              onGerarRelatorioPdf={onPrintPdf}
            />
          </div>
        ) : (
          <div className="order-3 hidden lg:block print:hidden" />
        )}
      </div>
    </div>
  );
}
