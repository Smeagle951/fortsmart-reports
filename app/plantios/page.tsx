import type { Metadata } from 'next';

import { PlantiosPage } from '@/components/cloud-planting/PlantiosPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Plantio (cloud) | FortSmart',
  description: 'Painel cloud-first do módulo Plantio — GET /windows/planting/:farmId, cache local, mapa e timeline.',
};

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default function PlantiosRoute({ searchParams }: PageProps) {
  const raw = searchParams.farm;
  const farm = typeof raw === 'string' ? raw.trim() : '';
  const mockRaw = searchParams.demo;
  const allowLegacyMock = mockRaw === '1' || mockRaw === 'true';

  return (
    <PlantiosPage
      farmCloudId={farm || null}
      allowLegacyMock={allowLegacyMock}
      legacyMock={
        allowLegacyMock && !farm ? (
          <p className="text-emerald-200/80">
            Modo demo ativo por <code className="rounded bg-black/30 px-1">?demo=1</code> — sem UUID de fazenda
            cloud. Isto não corre quando <code className="rounded bg-black/30 px-1">farm</code> está definido.
          </p>
        ) : null
      }
    />
  );
}
