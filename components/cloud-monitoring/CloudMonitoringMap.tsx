'use client';

import dynamic from 'next/dynamic';

import type { CloudMonitoringNormalized } from '@/lib/cloud-monitoring/types';

const Inner = dynamic(() => import('./CloudMonitoringMapClient').then((m) => m.CloudMonitoringMapClient), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[200px] items-center justify-center rounded-xl bg-slate-950/50 text-sky-200/80">
      A carregar mapa…
    </div>
  ),
});

type Props = {
  data: CloudMonitoringNormalized;
};

export function CloudMonitoringMap(props: Props) {
  return <Inner {...props} />;
}
