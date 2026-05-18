import type { Metadata } from 'next';
import Link from 'next/link';

import { MonitoramentoCloudPage } from '@/components/cloud-monitoring/MonitoramentoCloudPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Monitoramento (cloud) | FortSmart',
  description:
    'Painel cloud-first do monitoramento — GET /windows/monitoring/:farmId, cache local, mapa e timeline. Legado por token permanece em /dashboard/mapa.',
};

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

const defaultLegacy = (
  <div className="space-y-3">
    <p>
      O relatório HTML por token continua em <code className="rounded bg-black/40 px-1">/r/&lt;token&gt;</code> e o
      mapa GIS em{' '}
      <Link className="text-sky-400 underline" href="/dashboard/mapa">
        /dashboard/mapa
      </Link>
      . O carregamento <code className="rounded bg-black/40 px-1">loadMonitoramentoPayloadForMapToken</code> não foi
      alterado.
    </p>
    <p className="text-slate-400">
      Preview vazio do layout:{' '}
      <Link className="text-sky-400 underline" href="/monitoramento/preview">
        /monitoramento/preview
      </Link>
      .
    </p>
  </div>
);

export default function MonitoramentoIndexPage({ searchParams }: PageProps) {
  const farmRaw = searchParams.farm;
  const farm = typeof farmRaw === 'string' ? farmRaw.trim() : '';
  const demoRaw = searchParams.demo;
  const allowLegacyMock = demoRaw === '1' || demoRaw === 'true';

  return (
    <MonitoramentoCloudPage
      farmCloudId={farm || null}
      legacyFallback={defaultLegacy}
      allowLegacyMock={allowLegacyMock}
      legacyMock={
        allowLegacyMock && !farm ? (
          <p className="text-sky-200/90">
            Modo demo por <code className="rounded bg-black/40 px-1">?demo=1</code> sem UUID de fazenda. Com{' '}
            <code className="rounded bg-black/40 px-1">?farm=</code> definido, o mock automático não é usado.
          </p>
        ) : null
      }
    />
  );
}
