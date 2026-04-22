import { Suspense } from 'react';
import { MapaTalhoesClient } from '@/components/mapa-talhoes/MapaTalhoesClient';
import './mapa-talhoes.css';

export const metadata = {
  title: 'Mapa de talhões | FortSmart',
  description: 'Visualização de talhões, subáreas e calculadora de sementes (GeoJSON do app).',
};

function Fallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
      A carregar mapa de talhões…
    </div>
  );
}

export default function MapaTalhoesPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <MapaTalhoesClient />
    </Suspense>
  );
}
