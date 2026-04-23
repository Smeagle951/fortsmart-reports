import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { MapaTalhoesClient } from '@/components/mapa-talhoes/MapaTalhoesClient';
import { getMapaTalhoesShareById } from '@/lib/mapa-talhoes-share';
import '../../mapa-talhoes.css';

export const metadata = {
  title: 'Mapa de talhões (partilha) | FortSmart',
  description: 'Visualização partilhada de talhões e subáreas (GeoJSON).',
};

type Props = { params: Promise<{ token: string }> };

function Fallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
      A carregar mapa de talhões…
    </div>
  );
}

export default async function MapaTalhoesSharePage(props: Props) {
  const { token } = await props.params;
  const fc = await getMapaTalhoesShareById(token);
  if (!fc) notFound();

  return (
    <Suspense fallback={<Fallback />}>
      <MapaTalhoesClient initialFeatureCollection={fc} />
    </Suspense>
  );
}
