import type { Metadata } from 'next';
import { Suspense } from 'react';

import { MapaTalhoesClient } from '@/components/mapa-talhoes/MapaTalhoesClient';

import './mapa-talhoes.css';

export const metadata: Metadata = {
  title: 'Mapa de talhões | FortSmart',
  description:
    'Talhões, subáreas e calculadora de sementes. Dados por ?file= (R2/CDN), ?id= snapshot, ou importação GeoJSON.',
};

function Fallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
      A carregar mapa de talhões…
    </div>
  );
}

/**
 * Prioridade na query: `?file=` URL pública GeoJSON → `?id=` snapshot → `?d=` legado —
 * implementação em [MapaTalhoesClient].
 */
export default function MapaTalhoesPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <MapaTalhoesClient />
    </Suspense>
  );
}
