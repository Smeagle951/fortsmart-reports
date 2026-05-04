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
import { buildOperationalTimeline } from '@/lib/dashboard-mapa/timeline';
import {
  DEMO_FEATURE_COLLECTION,
  DEMO_MONITOR_EVENTS,
  DEMO_PROPERTY_ALERTS,
} from '@/lib/dashboard-mapa/mock';
import {
  countGeoJsonFeatures,
  getRecommendedRenderMode,
  shouldSimplifyGeoJson,
} from '@/lib/dashboard-mapa/performance';
import { propertySummaryFromFeatureCollection } from '@/lib/dashboard-mapa/summary-from-geojson';
import type { MapEventMarker } from '@/components/mapa-talhoes/MapView';
import { cn } from '@/lib/utils';

import type { DashboardNavId } from '@/lib/dashboard-mapa/types';

import { DashboardMapHeader } from './DashboardMapHeader';
import { DashboardNavOverlay } from './DashboardNavOverlay';
import { DashboardPlantioToolbar } from './DashboardPlantioToolbar';
import { EventTimeline } from './EventTimeline';
import { MapFiltersSheet } from './MapFiltersSheet';
import { MapLegendAndLayers } from './MapLegendAndLayers';
import { PremiumOverviewPanel } from './PremiumOverviewPanel';
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

  const reportToken = useMemo(() => sp?.get('token')?.trim() || null, [sp]);

  const fazendaNomeResolved = useMemo(() => {
    if (displayMeta?.fazenda?.trim()) return displayMeta.fazenda.trim();
    const first = baseFc?.features?.[0]?.properties as Record<string, unknown> | undefined;
    const nome = first?.fazenda ?? first?.nome_fazenda ?? first?.property_name ?? first?.farm_name;
    if (nome != null && String(nome).trim()) return String(nome).trim();
    return null;
  }, [displayMeta?.fazenda, baseFc]);

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
      (urlIntent || wantApi),
    [monBundle, baseFc, urlIntent, wantApi],
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
  const [activeNav, setActiveNav] = useState<DashboardNavId>('talhoes');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [plantioPanel, setPlantioPanel] = useState<'detail' | 'sementes'>('detail');

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

  const heatmapMode = camadaUi === 'heat';

  const operationalTimeline = useMemo(
    () => buildOperationalTimeline({ events: monitorEvents, featureCollection: mapWorkflowSource ?? filteredByMeta }),
    [monitorEvents, mapWorkflowSource, filteredByMeta],
  );

  const renderRecommendation = useMemo(
    () =>
      getRecommendedRenderMode({
        eventsCount: monitorEvents.length,
        featuresCount: countGeoJsonFeatures(mapDisplayData),
      }),
    [monitorEvents.length, mapDisplayData],
  );

  const performanceWarning = useMemo(() => {
    const featureCount = countGeoJsonFeatures(mapDisplayData);
    if (renderRecommendation === 'heatmap_or_cluster' || renderRecommendation === 'cluster') {
      return 'Muitos eventos carregados. Para melhor desempenho, use mapa térmico ou filtros.';
    }
    if (shouldSimplifyGeoJson(featureCount)) {
      return 'GeoJSON muito detalhado. Simplificação de geometria será recomendada em versões futuras.';
    }
    return null;
  }, [mapDisplayData, renderRecommendation]);

  const handleCamadaChange = useCallback((v: string) => {
    setCamadaUi(v);
    if (v === 'events') {
      setLayerEvents(true);
      setLayerTalhoes(true);
      setLayerSubareas(true);
    } else if (v === 'heat') {
      setLayerEvents(false);
      setLayerTalhoes(true);
      setLayerSubareas(true);
      if (monitorEvents.length === 0) {
        setPlantioTip('Mapa térmico indisponível: nenhum evento de monitoramento carregado.');
        window.setTimeout(() => setPlantioTip(null), 4500);
      }
    } else {
      setLayerTalhoes(true);
      setLayerSubareas(true);
    }
  }, [monitorEvents.length]);

  const handleHeatmapLayer = useCallback((enabled: boolean) => {
    handleCamadaChange(enabled ? 'heat' : 'events');
  }, [handleCamadaChange]);

  const handleNavChange = useCallback((id: DashboardNavId) => {
    setActiveNav(id);
    if (id === 'monitoramento') {
      setCamadaUi('events');
      setLayerEvents(true);
      setLayerTalhoes(true);
      setLayerSubareas(true);
      setSelectedEventId((prev) => prev ?? monitorEvents[0]?.id ?? null);
    }
  }, [monitorEvents]);

  const onUploadHeader = useCallback(() => {
    const url = process.env.NEXT_PUBLIC_FORTSMART_APP_URL?.trim();
    if (typeof window !== 'undefined') {
      window.open(url && url.length > 0 ? url : '/', '_blank', 'noopener,noreferrer');
    }
  }, []);

  const hideTimelineOverlayNav: DashboardNavId[] = ['resumo', 'relatorios', 'atividades', 'insumos', 'clima', 'config'];
  const showEventTimeline =
    operationalTimeline.length > 0 && !hideTimelineOverlayNav.includes(activeNav);

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
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#F4F7F4] print:block print:h-auto">
      <DashboardMapHeader
          safraBadge={safraBadge}
          fazendaNome={fazendaNomeResolved ?? displayMeta?.fazenda}
          usuarioNome={displayMeta?.usuario}
          tecnicoNome={displayMeta?.tecnico}
          notificationCount={alerts.length}
          notificationsTitle={`${alerts.length} alerta(s) no relatório`}
          alerts={alerts}
          onShare={onCopyLink}
          onUpload={onUploadHeader}
        />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <SidebarFarm
          activeNav={activeNav}
          onNav={handleNavChange}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
          summary={summary}
          alerts={alerts}
          classicMapHref={classicMapHref}
          fazendaNome={fazendaNomeResolved ?? displayMeta?.fazenda}
          usuarioNome={displayMeta?.usuario}
        />

        <div className="flex min-w-0 flex-1 flex-col print:w-full">
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
          <MapFiltersSheet
            safra={safra}
            cultura={cultura}
            camada={camadaUi}
            dateRangeLabel={periodLabel}
            onSafra={setSafra}
            onCultura={setCultura}
            onCamada={handleCamadaChange}
            safraChoices={safraChoices}
            culturaChoices={culturaChoices}
          />

          {performanceWarning ? (
            <div className="pointer-events-none absolute left-2 right-2 top-14 z-[1040] flex justify-center print:hidden">
              <p className="pointer-events-auto max-w-xl rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-center text-[11px] text-sky-950 shadow-md sm:text-xs">
                {performanceWarning}
              </p>
            </div>
          ) : null}

          {showDemoFallback ? (
            <div className="pointer-events-none absolute left-4 top-20 z-[1040] print:hidden">
              <p className="pointer-events-auto rounded-xl border border-emerald-200 bg-white/95 px-3 py-2 text-[11px] font-medium text-emerald-950 shadow-md">
                Visualização demonstrativa automática. Abra com <code className="rounded bg-emerald-50 px-1">?token=</code> para dados reais do relatório.
              </p>
            </div>
          ) : null}

          {activeNav === 'monitoramento' && monitorEvents.length === 0 ? (
            <div className="pointer-events-none absolute left-4 top-20 z-[1040] print:hidden">
              <p className="pointer-events-auto max-w-md rounded-xl border border-amber-200 bg-white/95 px-3 py-2 text-[11px] font-medium text-amber-950 shadow-md">
                Monitoramento não carregado neste link. Abra um relatório com <code className="rounded bg-amber-50 px-1">?token=</code> para visualizar pins, imagens e ocorrências georreferenciadas.
              </p>
            </div>
          ) : null}

          {heatmapMode && monitorEvents.length === 0 ? (
            <div className="pointer-events-none absolute left-2 right-2 top-28 z-[1040] flex justify-center print:hidden">
              <p className="pointer-events-auto max-w-xl rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-center text-[11px] text-amber-950 shadow-md sm:text-xs">
                Mapa térmico indisponível: nenhum evento de monitoramento carregado.
              </p>
            </div>
          ) : null}

          {activeNav === 'resumo' ? (
            <DashboardNavOverlay title="Resumo geral" onClose={() => setActiveNav('talhoes')}>
              <div className="mx-auto w-full max-w-6xl">
                <PremiumOverviewPanel
                  summary={summary}
                  alerts={alerts}
                  events={monitorEvents}
                  featureCollection={mapWorkflowSource ?? filteredByMeta}
                  hasMonitoramentoPayload={!!monBundle}
                />
              </div>
            </DashboardNavOverlay>
          ) : null}

          {activeNav === 'relatorios' ? (
            <DashboardNavOverlay title="Relatórios agronómicos" onClose={() => setActiveNav('talhoes')}>
              <div className="mx-auto max-w-lg space-y-4 text-sm text-slate-700">
                <p>
                  O relatório detalhado é o mesmo fluxo do módulo «Relatório agronómico» na web. No mapa, ative a camada{' '}
                  <strong>Eventos</strong> na legenda para ver as infestações por talhão (pins).
                </p>
                {reportToken ? (
                  <a
                    href={`/r/${reportToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-800"
                  >
                    Abrir relatório agronómico completo
                  </a>
                ) : (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950">
                    Sem token na URL. Publique o relatório na app e abra esta página com{' '}
                    <code className="rounded bg-white px-1 text-xs">?token=…</code>.
                  </p>
                )}
              </div>
            </DashboardNavOverlay>
          ) : null}

          {activeNav === 'atividades' ? (
            <DashboardNavOverlay title="Atividades" onClose={() => setActiveNav('talhoes')}>
              <p className="mx-auto max-w-md text-center text-sm text-slate-600">
                Módulo de atividades em <strong>desenvolvimento</strong>.
              </p>
            </DashboardNavOverlay>
          ) : null}

          {activeNav === 'insumos' ? (
            <DashboardNavOverlay title="Insumos" onClose={() => setActiveNav('talhoes')}>
              <p className="mx-auto max-w-md text-center text-sm text-slate-600">
                Gestão de insumos em <strong>desenvolvimento</strong>.
              </p>
            </DashboardNavOverlay>
          ) : null}

          {activeNav === 'clima' ? (
            <DashboardNavOverlay title="Clima" onClose={() => setActiveNav('talhoes')}>
              <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
                Dados climáticos da fazenda entram aqui quando o módulo estiver vinculado ao relatório.
              </div>
            </DashboardNavOverlay>
          ) : null}

          {activeNav === 'config' ? (
            <DashboardNavOverlay title="Configurações" onClose={() => setActiveNav('talhoes')}>
              <div className="mx-auto max-w-md space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
                <p className="text-xs text-slate-500">
                  Preferências do painel web (expansível). Por agora utilize filtros e legenda no próprio mapa.
                </p>
                <ul className="list-inside list-disc space-y-2 text-xs text-slate-600">
                  <li>Filtros: botão «Filtros» no canto superior direito do mapa.</li>
                  <li>Camadas de talhões, subáreas e eventos: legenda inferior.</li>
                  <li>Relatório completo: menu «Relatórios» ou link com token.</li>
                </ul>
              </div>
            </DashboardNavOverlay>
          ) : null}

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
                    <MapSummaryBar data={mapDisplayData} placement="bottom" />
                    <FieldMap
                      data={mapDisplayData}
                      mapClassName="h-full min-h-[320px] w-full flex-1 rounded-none"
                      eventMarkers={eventMarkers}
                      selectedEventMarkerId={selectedEventId}
                      onSelectEventMarker={onSelectEventMarker}
                      showEventMarkers={layerEvents && !heatmapMode && monitorEvents.length > 0}
                      heatmapEvents={monitorEvents}
                      showHeatmap={heatmapMode && monitorEvents.length > 0}
                      onSelectFeature={onSelectMapFeature}
                    />
                    <LegendFooter items={materialsLegend} showSubareaHint={mapViewMode !== 'talhoes'} />
                  </div>
                </div>
                <aside className="order-3 flex min-h-[280px] w-full min-w-0 shrink-0 flex-col lg:max-h-[calc(100dvh-12rem)] lg:w-[300px] print:hidden">
                  <div className="flex shrink-0 gap-1 rounded-t-xl border border-b-0 border-slate-700/70 bg-slate-950/95 p-1">
                    <button
                      type="button"
                      className={cn(
                        'flex-1 rounded-md px-2 py-2 text-xs font-semibold transition-colors',
                        plantioPanel === 'detail'
                          ? 'bg-emerald-700 text-white shadow-sm'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white',
                      )}
                      onClick={() => setPlantioPanel('detail')}
                    >
                      Detalhe
                    </button>
                    <button
                      type="button"
                      className={cn(
                        'flex-1 rounded-md px-2 py-2 text-xs font-semibold transition-colors',
                        plantioPanel === 'sementes'
                          ? 'bg-emerald-700 text-white shadow-sm'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white',
                      )}
                      onClick={() => setPlantioPanel('sementes')}
                    >
                      Calculadora
                    </button>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-b-xl border border-t-0 border-slate-700/70 bg-slate-900/85">
                    {plantioPanel === 'detail' ? (
                      <TalhaoDetailPanel
                        properties={selectedFeatureProps}
                        fullCollection={mapWorkflowSource}
                        onClose={() => setSelectedFeatureProps(null)}
                        onGerarRelatorioPdf={onPrintPdf}
                      />
                    ) : (
                      <div
                        id="mapa-sementes"
                        className="flex min-h-0 flex-1 flex-col overflow-y-auto p-2 print:border-slate-300 print:bg-white"
                      >
                        <SeedCalculatorTable data={tableData} />
                      </div>
                    )}
                  </div>
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
                  showEventMarkers={layerEvents && !heatmapMode && monitorEvents.length > 0}
                  heatmapEvents={monitorEvents}
                  showHeatmap={heatmapMode && monitorEvents.length > 0}
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
            layerHeatmap={heatmapMode}
            onLayerTalhoes={setLayerTalhoes}
            onLayerSubareas={setLayerSubareas}
            onLayerEvents={setLayerEvents}
            onLayerHeatmap={handleHeatmapLayer}
            plantioGeoOnly={plantioGeoOnlyLegend}
          />

          <RightEventPanel event={selectedEvent} onClose={() => setSelectedEventId(null)} />
        </div>

        {showEventTimeline ? (
          <EventTimeline events={operationalTimeline} selectedId={selectedEventId} onSelect={(id) => setSelectedEventId(id)} />
        ) : null}
      </div>
    </div>
    </div>
  );
}
