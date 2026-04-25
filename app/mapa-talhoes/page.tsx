import type { Metadata } from 'next';
import { Suspense } from 'react';

import { MapaTalhoesClient } from '@/components/mapa-talhoes/MapaTalhoesClient';

import './mapa-talhoes.css';

export const metadata: Metadata = {
  title: 'Mapa de talhões | FortSmart',
  description:
    'Visualização de talhões, subáreas e calculadora de sementes (GeoJSON do app: ?d=, link curto /m/… ou ficheiro).',
};

function Fallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
      A carregar mapa de talhões…
    </div>
  );
}

/**
 * Mapa principal: lê `?d=` (base64url UTF-8), partilha `/mapa-talhoes/m/:token` (SSR no child)
 * e importação de ficheiro — toda a lógica em [MapaTalhoesClient].
 */
export default function MapaTalhoesPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <MapaTalhoesClient />
    </Suspense>
  );
}
