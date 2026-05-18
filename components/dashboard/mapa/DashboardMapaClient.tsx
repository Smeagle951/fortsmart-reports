'use client';

import type { FeatureCollection } from 'geojson';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  distinctCulturasSafas,
  downloadGeoJson,
  filterByCulturaSafra,
  filterBySelectedTalhoes,
  filterByViewMode,
  listTalhoesFromFc,
  type MapaViewMode,
} from '@/components/mapa-talhoes/geojsonUtils';
import { LegendFooter } from '@/components/mapa-talhoes/LegendFooter';
import { MapSummaryBar } from '@/components/mapa-talhoes/MapSummaryBar';
import { strokeForProperties } from '@/components/mapa-talhoes/materialColor';
import { SeedCalculatorTable } from '@/components/mapa-talhoes/SeedCalculatorTable';
import { TalhaoDetailPanel } from '@/components/mapa-talhoes/TalhaoDetailPanel';
import { TalhaoSidebar } from '@/components/mapa-talhoes/TalhaoSidebar';
import { geoFileUrlFromSearchParams, useMapGeoJsonFromUrl } from '@/components/mapa-talhoes/useMapGeoJsonFromUrl';
import { talhoesFromApi } from '@/lib/dashboard-mapa/adapters/talhoesFromApi';
import {
  buildMonitoramentoMapBundle,
  type MonitoramentoMapDisplayMeta,
} from '@/lib/dashboard-mapa/monitoramento-map-bundle';
import {
  DEMO_FEATURE_COLLECTION,
  DEMO_MONITOR_EVENTS,
  DEMO_PROPERTY_ALERTS,
} from '@/lib/dashboard-mapa/mock';
import { propertySummaryFromFeatureCollection } from '@/lib/dashboard-mapa/summary-from-geojson';
import type { MapEventMarker } from '@/components/mapa-talhoes/MapView';

import { DashboardMapHeader } from './DashboardMapHeader';
import { DashboardPlantioToolbar } from './DashboardPlantioToolbar';
import { EventTimeline } from './EventTimeline';
import { MapFloatingFilters } from './MapFloatingFilters';
import { MapLegendAndLayers } from './MapLegendAndLayers';
import { RightEventPanel } from './RightEventPanel';
import { SidebarFarm } from './SidebarFarm';

const FieldMap = dynamic(() => import('./FieldMap').then((m) => m.FieldMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[400px] items-center justify-center bg-slate-800 text-slate-400">
      Carregando mapa…
    </div>
  ),
});

function hasUrlGeoIntent(sp: URLSearchParams | null): boolean {
  if (!sp) return false;
  return !!(geoFileUrlFromSearchParams(sp) || sp.get('id')?.trim() || sp.get('d'));
}

type Props = {
  initialFeatureCollection?: FeatureCollection | null;
  initialMonitoramentoPayload?: Record<string, unknown> | null;
  serverError?: string | null;
};

export function DashboardMapaClient({
  initialFeatureCollection = null,
  initialMonitoramentoPayload = null,
  serverError = null,
}: Props) {
  const sp = useSearchParams();
  const { raw, err, loadingShare, hostHint } = useMapGeoJsonFromUrl({
    initialFeatureCollection,
    searchParams: sp,
    pathname: null,
    legacyTokenPathRegex: null,
  });

  const wantApi = sp?.get('source') === 'api';
  const urlIntent = hasUrlGeoIntent(sp);
  const allowDemo =
    process.env.NEXT_PUBLIC_DASHBOARD_MAPA_DEMO === 'true' || sp?.get('demo') === '1';

  const monBundle = useMemo(
    () => (initialMonitoramentoPayload ? buildMonitoramentoMapBundle(initialMonitoramentoPayload) : null),
    [initialMonitoramentoPayload],
  );

  const [apiFc, setApiFc] = useState<FeatureCollection | null>(null);
  const [apiErr, setApiErr] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(false);

  useEffect(() => {
    if (!wantApi) {
      setApiFc(null);
      setApiErr(null);
      setApiLoading(false);
      return;
    }
    let cancelled = false;
    setApiLoading(true);
    setApiErr(null);
    void (async () => {
      try {
        const r = await fetch('/api/talhoes', { cache: 'no-store' });
        const j = (await r.json()) as unknown;
        if (cancelled) return;
        const fc = talhoesFromApi(j);
        if (fc && fc.features.length > 0) {
          setApiFc(fc);
          setApiErr(null);
        } else {
          setApiFc(null);
          setApiErr(
            r.ok
              ? 'Resposta de /api/talhoes sem talhões georreferenciados reconhecíveis (esperado GeoJSON ou lista com polígonos).'
              : `API retornou ${r.status}. Verifique FORTSMART_API_URL e o backend.`,
          );
        }
      } catch {
        if (!cancelled) {
          setApiFc(null);
          setApiErr('Falha de rede ao obter /api/talhoes.');
        }
      } finally {
        if (!cancelled) setApiLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [wantApi]);

  const showDemoFallback =
    allowDemo &&
    !monBundle &&
    !urlIntent &&
    !wantApi &&
    !loadingShare &&
    raw == null &&
    !err &&
    !initialMonitoramentoPayload;

  const baseFc = useMemo(() => {
    if (monBundle?.featureCollection?.features?.length) return monBundle.featureCollection;
    if (raw) return raw;
    if (wantApi && apiFc) return apiFc;
    if (showDemoFallback) return DEMO_FEATURE_COLLECTION;
    return null;
  }, [monBundle, raw, wantApi, apiFc, showDemoFallback]);

  const monitorEvents = useMemo(() => {
    if (monBundle?.events?.length) return monBundle.events;
    if (showDemoFallback) return DEMO_MONITOR_EVENTS;
    return [];
  }, [monBundle, showDemoFallback]);

  const displayMeta: MonitoramentoMapDisplayMeta | null = monBundle?.meta ?? null;

  const alerts = useMemo(() => {
    if (monBundle?.alerts?.length) return monBundle.alerts;
    if (showDemoFallback) return DEMO_PROPERTY_ALERTS;
    return [];
  }, [monBundle, showDemoFallback]);

  /** Mesmas funções que `/mapa-talhoes`: lista, calculadora, painel de detalhe, export — sem token de monitoramento. */
  const usePlantioLayout = useMemo(
    () =>
      !monBundle &&
      !!baseFc &&
      baseFc.features.length > 0 &&
      (urlIntent || wantApi || showDemoFallback),
    [monBundle, baseFc, urlIntent, wantApi, showDemoFallback],
  );

  const plantioGeoOnlyLegend = usePlantioLayout && monitorEvents.length === 0;

  const [cultura, setCultura] = useState('all');
  const [safra, setSafra] = useState('all');
  const [camadaUi, setCamadaUi] = useState('satellite');
  const [layerTalhoes, setLayerTalhoes] = useState(true);
  const [layerSubareas, setLayerSubareas] = useState(true);
  const [layerEvents, setLayerEvents] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [staged, setStaged] = useState<Set<string>>(new Set());
  const [onMap, setOnMap] = useState<Set<string>>(new Set());
  const [selectedFeatureProps, setSelectedFeatureProps] = useState<Record<string, unknown> | null>(null);
  const [plantioTip, setPlantioTip] = useState<string | null>(null);

  useEffect(() => {
    if (monitorEvents.length === 0) {
      setSelectedEventId(null);
      return;
    }
    setSelectedEventId((prev) =>
      prev && monitorEvents.some((e) => e.id === prev) ? prev : monitorEvents[0].id,
    );
  }, [monitorEvents]);

  useEffect(() => {
    setSelectedFeatureProps(null);
  }, [baseFc]);

  const { culturas, safras } = useMemo(
    () => (baseFc ? distinctCulturasSafas(baseFc) : { culturas: ['all'] as string[], safras: ['all'] as string[] }),
    [baseFc],
  );

  const culturaChoices = useMemo(() => culturas.filter((c) => c !== 'all'), [culturas]);
  const safraChoices = useMemo(() => safras.filter((s) => s !== 'all'), [safras]);

  const filteredByMeta = useMemo(() => {
    if (!baseFc) return null;
    return filterByCulturaSafra(baseFc, cultura, safra);
  }, [baseFc, cultura, safra]);

  const talhoes = useMemo(
    () => (filteredByMeta ? listTalhoesFromFc(filteredByMeta) : []),
    [filteredByMeta],
  );

  const listFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return talhoes;
    return talhoes.filter(
      (t) => t.label.toLowerCase().includes(q) || t.talhaoId.toLowerCase().includes(q),
    );
  }, [talhoes, search]);

  useEffect(() => {
    if (!usePlantioLayout || !filteredByMeta) return;
    const list = listTalhoesFromFc(filteredByMeta);
    if (list.length === 0) {
      setStaged(new Set());
      setOnMap(new Set());
      return;
    }
    const s = new Set(list.map((t) => t.talhaoId));
    setStaged(s);
    setOnMap(s);
  }, [usePlantioLayout, filteredByMeta]);

  const mapWorkflowSource = useMemo(() => {
    if (!filteredByMeta) return null;
    if (usePlantioLayout) return filterBySelectedTalhoes(filteredByMeta, onMap);
    return filteredByMeta;
  }, [filteredByMeta, usePlantioLayout, onMap]);

  const mapViewMode: MapaViewMode = useMemo(() => {
    if (layerTalhoes && layerSubareas) return 'talhoes_subareas';
    if (layerTalhoes && !layerSubareas) return 'talhoes';
    if (!layerTalhoes && layerSubareas) return 'subareas';
    return 'talhoes';
  }, [layerTalhoes, layerSubareas]);

  const mapDisplayData = useMemo(() => {
    if (!mapWorkflowSource) return null;
    return filterByViewMode(mapWorkflowSource, mapViewMode);
  }, [mapWorkflowSource, mapViewMode]);

  const tableData = useMemo(() => {
    if (!mapWorkflowSource || mapWorkflowSource.features.length === 0) return null;
    return mapWorkflowSource;
  }, [mapWorkflowSource]);

  const materialsLegend = useMemo(() => {
    if (!mapWorkflowSource) return [] as { k: string; c: string }[];
    const m = new Set<string>();
    for (const f of mapWorkflowSource.features) {
      const p = f.properties as Record<string, unknown> | null | undefined;
      if (!p) continue;
      const mat = p.material != null ? String(p.material) : null;
      if (mat) m.add(mat);
    }
    return Array.from(m)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((k) => ({ k, c: strokeForProperties({ material: k }) }));
  }, [mapWorkflowSource]);

  const toggleStaged = useCallback((id: string) => {
    setStaged((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);

  const selectAllStaged = useCallback(() => {
    setStaged(new Set(talhoes.map((t) => t.talhaoId)));
  }, [talhoes]);

  const clearStaged = useCallback(() => setStaged(new Set()), []);

  const aplicarMapa = useCallback(() => {
    setOnMap(new Set(staged));
  }, [staged]);

  const eventMarkers: MapEventMarker[] = useMemo(
    () =>
      layerEvents && monitorEvents.length
        ? monitorEvents.map((e) => ({
            id: e.id,
            lat: e.lat,
            lng: e.lng,
            pinKind: e.pinKind,
          }))
        : [],
    [layerEvents, monitorEvents],
  );

  const selectedEvent = useMemo(
    () => (selectedEventId ? monitorEvents.find((e) => e.id === selectedEventId) ?? null : null),
    [monitorEvents, selectedEventId],
  );

  const summary = useMemo(() => {
    const src = mapWorkflowSource ?? filteredByMeta;
    if (!src) {
      return { totalHa: 0, talhaoCount: 0, subareaCount: 0, eventsLast7Days: monitorEvents.length };
    }
    return propertySummaryFromFeatureCollection(src, monitorEvents.length);
  }, [mapWorkflowSource, filteredByMeta, monitorEvents.length]);

  const classicMapHref = useMemo(() => {
    const q = sp?.toString();
    return q ? `/mapa-talhoes?${q}` : '/mapa-talhoes';
  }, [sp]);

  const exportGeoJsonSource = useMemo(() => raw ?? apiFc ?? baseFc, [raw, apiFc, baseFc]);

  const onExportGeoJson = useCallback(() => {
    if (exportGeoJsonSource) downloadGeoJson(exportGeoJsonSource, 'fortsmart-mapa-talhoes.geojson');
  }, [exportGeoJsonSource]);

  const onCopyLink = useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setPlantioTip('Link atual copiado para a área de transferência.');
      window.setTimeout(() => setPlantioTip(null), 5000);
    } catch {
      setPlantioTip('Não foi possível copiar o link.');
      window.setTimeout(() => setPlantioTip(null), 5000);
    }
  }, []);

  const onPrintPdf = useCallback(() => {
    window.print();
  }, []);

  const safraBadge =
    displayMeta?.safra && safra === 'all'
      ? displayMeta.safra
      : safra === 'all'
        ? (safraChoices[0] ?? '—')
        : safra;

  const periodLabel = displayMeta?.data
    ? String(displayMeta.data)
    : new Date().toLocaleDateString('pt-BR');

  const onSelectEventMarker = useCallback((id: string) => {
    setSelectedEventId(id);
  }, []);

  const onSelectMapFeature = useCallback((p: Record<string, unknown> | null) => {
    setSelectedEventId(null);
    setSelectedFeatureProps(p);
  }, []);

  const mapLoading =
    (urlIntent && loadingShare && !raw && !err) || (wantApi && apiLoading && !raw && !apiFc);

  const geoErr = err ?? (wantApi ? apiErr : null);
  const tokenErrVisible = serverError && !raw && !monBundle;

  const mapShellClass = 'relative min-h-0 flex-1 overflow-hidden rounded-none border border-slate-300/80 bg-slate-900/20 shadow-inner';

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-100 print:block print:h-auto">
      <SidebarFarm
        activeNav="talhoes"
        summary={summary}
        alerts={alerts}
        classicMapHref={classicMapHref}
        fazendaNome={displayMeta?.fazenda}
        usuarioNome={displayMeta?.usuario}
      />

      <div className="flex min-w-0 flex-1 flex-col print:w-full">
        <DashboardMapHeader
          safraBadge={safraBadge}
          fazendaNome={displayMeta?.fazenda}
          usuarioNome={displayMeta?.usuario}
          tecnicoNome={displayMeta?.tecnico}
        />

        {hostHint ? (
          <p className="border-b border-sky-200 bg-sky-50 px-4 py-1.5 text-center text-xs text-sky-900">{hostHint}</p>
        ) : null}
        {tokenErrVisible ? (
          <p className="border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-950">{serverError}</p>
        ) : null}
        {geoErr ? (
          <p className="border-b border-red-200 bg-red-50 px-4 py-1.5 text-center text-xs text-red-900">{geoErr}</p>
        ) : null}

        <div className="relative flex min-h-0 flex-1 flex-col bg-slate-200 print:bg-white">
          <MapFloatingFilters
            safra={safra}
            cultura={cultura}
            camada={camadaUi}
            dateRangeLabel={periodLabel}
            onSafra={setSafra}
            onCultura={setCultura}
            onCamada={setCamadaUi}
            safraChoices={safraChoices}
            culturaChoices={culturaChoices}
          />

          {usePlantioLayout && exportGeoJsonSource ? (
            <DashboardPlantioToolbar
              onExportGeoJson={onExportGeoJson}
              onCopyLink={onCopyLink}
              onPrint={onPrintPdf}
              tip={plantioTip}
            />
          ) : null}

          {mapLoading ? (
            <div className="flex flex-1 items-center justify-center bg-slate-800 text-slate-300">
              A carregar dados do mapa…
            </div>
          ) : mapDisplayData && mapDisplayData.features.length > 0 ? (
            usePlantioLayout ? (
              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2 lg:flex-row lg:gap-3 print:block">
                <aside className="order-2 flex max-h-64 min-h-0 w-full shrink-0 overflow-hidden lg:order-1 lg:max-h-none lg:w-[260px] print:hidden">
                  <TalhaoSidebar
                    listFiltered={listFiltered}
                    staged={staged}
                    search={search}
                    onSearchChange={setSearch}
                    onToggle={toggleStaged}
                    onSelectAll={selectAllStaged}
                    onClearStaged={clearStaged}
                    onAplicarMapa={aplicarMapa}
                    onMapCount={onMap.size}
                  />
                </aside>
                <div className="order-1 flex min-h-0 min-w-0 flex-1 flex-col gap-2 lg:order-2 print:order-1">
                  <div className={`${mapShellClass} flex min-h-[48vh] flex-1 flex-col`}>
                    <MapSummaryBar data={mapDisplayData} />
                    <FieldMap
                      data={mapDisplayData}
                      mapClassName="h-full min-h-[320px] w-full flex-1 rounded-none"
                      eventMarkers={eventMarkers}
                      selectedEventMarkerId={selectedEventId}
                      onSelectEventMarker={onSelectEventMarker}
                      showEventMarkers={layerEvents && monitorEvents.length > 0}
                      onSelectFeature={onSelectMapFeature}
                    />
                    <LegendFooter items={materialsLegend} showSubareaHint={mapViewMode !== 'talhoes'} />
                  </div>
                  <div
                    id="mapa-sementes"
                    className="max-h-72 shrink-0 overflow-y-auto rounded-lg border border-slate-300/80 bg-slate-900/90 p-2 print:max-h-none print:border-slate-300 print:bg-white"
                  >
                    <SeedCalculatorTable data={tableData} />
                  </div>
                </div>
                <aside className="order-3 w-full min-w-0 shrink-0 lg:max-h-[calc(100dvh-12rem)] lg:w-[300px] lg:overflow-y-auto print:hidden">
                  <TalhaoDetailPanel
                    properties={selectedFeatureProps}
                    fullCollection={mapWorkflowSource}
                    onClose={() => setSelectedFeatureProps(null)}
                    onGerarRelatorioPdf={onPrintPdf}
                  />
                </aside>
              </div>
            ) : (
              <div className={`${mapShellClass} min-h-[50vh] flex-1`}>
                <FieldMap
                  data={mapDisplayData}
                  mapClassName="h-full min-h-[50vh] w-full rounded-none"
                  eventMarkers={eventMarkers}
                  selectedEventMarkerId={selectedEventId}
                  onSelectEventMarker={onSelectEventMarker}
                  showEventMarkers={layerEvents && monitorEvents.length > 0}
                  onSelectFeature={() => setSelectedEventId(null)}
                />
              </div>
            )
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-8 text-center text-sm text-slate-600">
              <p className="font-medium text-slate-800">Sem dados de mapa para mostrar</p>
              <ul className="max-w-md list-disc space-y-1 text-left text-xs text-slate-600">
                <li>
                  <strong>Monitoramento (recomendado):</strong> use o mesmo token do relatório web —{' '}
                  <code className="rounded bg-slate-200 px-1">/dashboard/mapa?token=SEU_TOKEN</code>
                </li>
                <li>
                  <strong>GeoJSON / plantio:</strong>{' '}
                  <code className="rounded bg-slate-200 px-1">?file=</code>, <code className="rounded bg-slate-200 px-1">?id=</code> —{' '}
                  mesmas funções que o{' '}
                  <a href="/mapa-talhoes" className="text-emerald-700 underline">
                    mapa clássico
                  </a>
                  .
                </li>
                <li>
                  <strong>API (opcional):</strong> <code className="rounded bg-slate-200 px-1">?source=api</code>
                </li>
                {!allowDemo ? (
                  <li>
                    Ambiente de demonstração desligado. Para ativar mock local:{' '}
                    <code className="rounded bg-slate-200 px-1">NEXT_PUBLIC_DASHBOARD_MAPA_DEMO=true</code> ou{' '}
                    <code className="rounded bg-slate-200 px-1">?demo=1</code>.
                  </li>
                ) : null}
              </ul>
            </div>
          )}

          <MapLegendAndLayers
            layerTalhoes={layerTalhoes}
            layerSubareas={layerSubareas}
            layerEvents={layerEvents}
            onLayerTalhoes={setLayerTalhoes}
            onLayerSubareas={setLayerSubareas}
            onLayerEvents={setLayerEvents}
            plantioGeoOnly={plantioGeoOnlyLegend}
          />

          <RightEventPanel event={selectedEvent} onClose={() => setSelectedEventId(null)} />
        </div>

        {monitorEvents.length > 0 ? (
          <EventTimeline events={monitorEvents} selectedId={selectedEventId} onSelect={(id) => setSelectedEventId(id)} />
        ) : null}
      </div>
    </div>
  );
}
