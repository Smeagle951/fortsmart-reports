import type { Metadata } from 'next';
import { Suspense } from 'react';

import { DashboardMapaClient } from '@/components/dashboard/mapa/DashboardMapaClient';
import { loadMonitoramentoPayloadForMapToken } from '@/lib/dashboard-mapa/load-monitoramento-token';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mapa de talhões (GIS) | FortSmart',
  description:
    'Dashboard GIS com dados reais: ?token= (mesmo token do relatório /r/[token] de monitoramento), ?file= GeoJSON, ?id= snapshot, ou ?source=api.',
};

function Fallback() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#0f291e] text-emerald-100/90">
      A carregar dashboard do mapa…
    </div>
  );
}

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function DashboardMapaPage({ searchParams }: PageProps) {
  const tokenRaw = searchParams.token;
  const token = typeof tokenRaw === 'string' ? tokenRaw.trim() : '';

  let initialMonitoramentoPayload: Record<string, unknown> | null = null;
  let serverError: string | null = null;

  if (token) {
    const r = await loadMonitoramentoPayloadForMapToken(token);
    initialMonitoramentoPayload = r.payload;
    serverError = r.error;
    if (r.payload) {
      try {
        initialMonitoramentoPayload = JSON.parse(JSON.stringify(r.payload)) as Record<string, unknown>;
      } catch {
        initialMonitoramentoPayload = r.payload;
      }
    }
  }

  return (
    <Suspense fallback={<Fallback />}>
      <DashboardMapaClient
        initialMonitoramentoPayload={initialMonitoramentoPayload}
        serverError={serverError}
      />
    </Suspense>
  );
}
