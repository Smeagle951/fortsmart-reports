'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';

import { useCloudMonitoring } from '@/hooks/useCloudMonitoring';

import { CloudMonitoringDashboard } from './CloudMonitoringDashboard';
import { CloudMonitoringMap } from './CloudMonitoringMap';
import { CloudMonitoringTimeline } from './CloudMonitoringTimeline';

export type MonitoramentoCloudPageProps = {
  farmCloudId: string | null;
  legacyFallback?: ReactNode;
  allowLegacyMock?: boolean;
  legacyMock?: ReactNode;
};

function hasCloudPayload(n: ReturnType<typeof useCloudMonitoring>['normalized']) {
  return n.plots.length > 0 || n.summary.total_reports > 0;
}

export function MonitoramentoCloudPage({
  farmCloudId,
  legacyFallback,
  allowLegacyMock,
  legacyMock,
}: MonitoramentoCloudPageProps) {
  const farm = farmCloudId?.trim() ?? '';
  const hasFarm = !!farm;
  const {
    normalized,
    loading,
    error,
    lastSync,
    fromSnapshot,
    fetchFromCloud,
    clear,
  } = useCloudMonitoring(farm || null);

  const [showLegacyPanel, setShowLegacyPanel] = useState(false);
  const cloudHasData = hasCloudPayload(normalized);
  const showAutoMock = !hasFarm && !!allowLegacyMock;

  /** Sem farm: mostrar legado/instruções. Com farm: só após pedido explícito (não domina o cloud). */
  const legacyVisible = !!legacyFallback && (!hasFarm || showLegacyPanel);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#0c1629] to-[#070d18] px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-3 border-b border-sky-900/40 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Monitoramento (cloud-first)</h1>
            <p className="mt-1 max-w-2xl text-sm text-sky-200/80">
              Fonte: <code className="rounded bg-black/30 px-1">GET /windows/monitoring/:farmId</code> via proxy
              Next. Snapshot em{' '}
              <code className="rounded bg-black/30 px-1">localStorage.cloudMonitoringSnapshots</code>. O fluxo por
              token do mapa/relatório mantém-se em paralelo.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!hasFarm || loading}
              onClick={() => void fetchFromCloud()}
              className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'A carregar…' : 'Carregar dados cloud'}
            </button>
            {hasFarm ? (
              <button
                type="button"
                onClick={() => clear()}
                className="rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
              >
                Limpar snapshot local
              </button>
            ) : null}
          </div>
        </header>

        {!hasFarm ? (
          <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4 text-sm text-amber-100">
            Use <code className="mx-1 rounded bg-black/30 px-1">?farm=&lt;uuid&gt;</code> na URL para o modo
            cloud-first. Com fazenda definida, não há mock automático. Fluxo legado:{' '}
            <Link className="text-sky-300 underline" href="/dashboard/mapa">
              mapa (token)
            </Link>{' '}
            ·{' '}
            <Link className="text-sky-300 underline" href="/monitoramento/preview">
              preview relatório
            </Link>
            .
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-100">{error}</div>
        ) : null}

        {hasFarm && lastSync ? (
          <p className="text-xs text-sky-300/70">
            Último GET: {new Date(lastSync).toLocaleString('pt-BR')}
            {fromSnapshot ? ' · a mostrar snapshot local' : ''}
          </p>
        ) : null}

        {hasFarm && !cloudHasData && !loading ? (
          <div className="rounded-xl border border-sky-800/40 bg-slate-950/40 p-4 text-sm text-sky-100/90">
            Sem dados na cache cloud. Carregue da API (Bearer no servidor) ou use o legado com token no mapa.
          </div>
        ) : null}

        {hasFarm && legacyFallback ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowLegacyPanel((v) => !v)}
              className="text-sm text-sky-300 underline hover:text-sky-200"
            >
              {showLegacyPanel ? 'Ocultar painel legado' : 'Mostrar painel legado (fallback)'}
            </button>
          </div>
        ) : null}

        {cloudHasData ? (
          <>
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">Painel</h2>
              <CloudMonitoringDashboard data={normalized} />
            </section>
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">Timeline</h2>
              <CloudMonitoringTimeline data={normalized} />
            </section>
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">Mapa</h2>
              <CloudMonitoringMap data={normalized} />
            </section>
          </>
        ) : null}

        {legacyVisible && legacyFallback ? (
          <section className="space-y-2 border-t border-sky-900/35 pt-8">
            <h2 className="text-lg font-semibold text-amber-100/90">Legado / fallback</h2>
            <div className="rounded-xl border border-amber-900/30 bg-black/25 p-4 text-sm text-slate-200/90">
              {legacyFallback}
            </div>
          </section>
        ) : null}

        {showAutoMock && legacyMock ? (
          <section className="space-y-2 border-t border-sky-900/35 pt-8">
            <h2 className="text-lg font-semibold text-slate-200">Demonstração</h2>
            {legacyMock}
          </section>
        ) : null}
      </div>
    </div>
  );
}
