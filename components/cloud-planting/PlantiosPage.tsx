'use client';

import type { ReactNode } from 'react';

import { useCloudPlanting } from '@/hooks/useCloudPlanting';
import {
  imageDisplayUrl,
  imageIsCloudExpired,
  imageUploadPending,
  type CloudPlantingNormalized,
} from '@/lib/cloud-planting/adapter';

import { CloudPlantingDashboard } from './CloudPlantingDashboard';
import { CloudPlantingMap } from './CloudPlantingMap';
import { CloudPlantingTimeline } from './CloudPlantingTimeline';

export type PlantiosPageProps = {
  /** UUID da fazenda na cloud — obrigatório para fluxo cloud-first. */
  farmCloudId: string | null;
  /**
   * Conteúdo legado (Supabase/local) só depois da secção cloud.
   * Não altera hooks existentes noutros módulos — injeta-se aqui como filho opcional.
   */
  legacyFallback?: ReactNode;
  /**
   * Mock/dados de demonstração: **nunca** em modo automático quando `farmCloudId` está definido.
   * Só renderiza se `allowLegacyMock===true` (ex.: query explícita) **e** não houver farm cloud.
   */
  allowLegacyMock?: boolean;
  legacyMock?: ReactNode;
};

function hasCloudPayload(d: CloudPlantingNormalized) {
  return d.plots.length > 0 || d.summary.total_plantings > 0;
}

function CloudImages({ data }: { data: CloudPlantingNormalized }) {
  const imgs: { key: string; url: string | null; caption: string; flags: string[] }[] = [];
  for (const plot of data.plots) {
    for (const sub of plot.subareas) {
      for (const rec of sub.records) {
        for (let i = 0; i < rec.images.length; i++) {
          const im = rec.images[i];
          const id = im.id ?? im.local_id ?? `${plot.plot_name}-${i}`;
          const flags: string[] = [];
          if (imageUploadPending(im)) flags.push('upload pendente');
          if (imageIsCloudExpired(im)) flags.push('URL cloud pode estar expirada');
          imgs.push({
            key: String(id),
            url: imageDisplayUrl(im),
            caption: im.caption?.trim() || im.file_name?.trim() || 'Imagem',
            flags,
          });
        }
      }
    }
  }
  if (!imgs.length) {
    return <p className="text-sm text-emerald-200/70">Sem imagens na janela.</p>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {imgs.map((im) => (
        <figure
          key={im.key}
          className="overflow-hidden rounded-lg border border-emerald-900/40 bg-emerald-950/30"
        >
          {im.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={im.url} alt={im.caption} className="h-40 w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-40 items-center justify-center bg-black/30 px-2 text-center text-xs text-amber-200/90">
              Sem URL pública — ficheiro local ou ainda não sincronizado para cloud.
            </div>
          )}
          <figcaption className="space-y-1 p-2 text-xs text-emerald-100/90">
            <div>{im.caption}</div>
            {im.flags.length ? (
              <div className="text-amber-200/90">{im.flags.join(' · ')}</div>
            ) : null}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export function PlantiosPage({ farmCloudId, legacyFallback, allowLegacyMock, legacyMock }: PlantiosPageProps) {
  const farm = farmCloudId?.trim() ?? '';
  const hasFarm = !!farm;
  const { data, load, fetchFromCloud, fromSnapshot } = useCloudPlanting(farm || null);

  const showAutoMock = !hasFarm && !!allowLegacyMock;
  const cloudHasData = hasCloudPayload(data);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#0a1f16] to-[#06120c] px-4 py-8 text-emerald-50">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-3 border-b border-emerald-900/40 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Plantio (cloud-first)</h1>
            <p className="mt-1 max-w-2xl text-sm text-emerald-200/80">
              Fonte: <code className="rounded bg-black/30 px-1">GET /windows/planting/:farmId</code> via proxy
              seguro. Ao carregar, o payload é guardado em{' '}
              <code className="rounded bg-black/30 px-1">localStorage.cloudPlantingSnapshots</code>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!hasFarm || load.loading}
              onClick={() => void fetchFromCloud()}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {load.loading ? 'A carregar…' : 'Carregar dados cloud'}
            </button>
          </div>
        </header>

        {!hasFarm ? (
          <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4 text-sm text-amber-100">
            Passe o UUID da fazenda na query <code className="mx-1 rounded bg-black/30 px-1">?farm=</code> na URL.
            Com fazenda cloud configurada, não se usam dados mock automáticos.
          </div>
        ) : null}

        {load.error ? (
          <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-100">
            {load.error}
          </div>
        ) : null}

        {hasFarm && load.lastFetchedAt ? (
          <p className="text-xs text-emerald-300/70">
            Último GET: {new Date(load.lastFetchedAt).toLocaleString('pt-BR')}
            {fromSnapshot ? ' · a mostrar snapshot local (carregue cloud para atualizar)' : ''}
          </p>
        ) : null}

        {hasFarm && !cloudHasData && !load.loading ? (
          <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/25 p-4 text-sm text-emerald-100/90">
            Ainda sem dados na cache cloud para esta fazenda. Use &quot;Carregar dados cloud&quot; (requer{' '}
            <code className="rounded bg-black/30 px-1">FORTSMART_WINDOWS_API_BEARER</code> no servidor).
          </div>
        ) : null}

        {cloudHasData ? (
          <>
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">Painel</h2>
              <CloudPlantingDashboard data={data} />
            </section>
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">Timeline</h2>
              <CloudPlantingTimeline data={data} />
            </section>
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">Mapa e tabela</h2>
              <CloudPlantingMap data={data} />
            </section>
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">Imagens</h2>
              <CloudImages data={data} />
            </section>
          </>
        ) : null}

        {legacyFallback ? (
          <section className="space-y-2 border-t border-emerald-900/35 pt-8">
            <h2 className="text-lg font-semibold text-amber-100/90">Legado (Supabase / local)</h2>
            <div className="rounded-xl border border-amber-900/30 bg-black/20 p-4 text-sm text-emerald-100/85">
              {legacyFallback}
            </div>
          </section>
        ) : null}

        {showAutoMock && legacyMock ? (
          <section className="space-y-2 border-t border-emerald-900/35 pt-8">
            <h2 className="text-lg font-semibold text-slate-200">Demonstração (opcional)</h2>
            {legacyMock}
          </section>
        ) : null}
      </div>
    </div>
  );
}
