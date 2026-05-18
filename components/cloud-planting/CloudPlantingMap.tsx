'use client';

import dynamic from 'next/dynamic';

import type { CloudPlantingNormalized } from '@/lib/cloud-planting/adapter';

const Inner = dynamic(() => import('./CloudPlantingMapClient').then((m) => m.CloudPlantingMapClient), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[200px] items-center justify-center rounded-xl bg-emerald-950/40 text-emerald-200/80">
      A carregar mapa…
    </div>
  ),
});

type Props = {
  data: CloudPlantingNormalized;
};

export function CloudPlantingMap(props: Props) {
  return <Inner {...props} />;
}
