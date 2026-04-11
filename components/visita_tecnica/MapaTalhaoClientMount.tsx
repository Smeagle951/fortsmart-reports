'use client';

import React, { useEffect, useState } from 'react';

/** Props alinhadas a `MapaTalhao` (só o que o relatório VT usa). */
export type MapaTalhaoClientMountProps = {
  polygon?: number[][];
  pontos?: Array<{
    id?: string;
    latitude: number;
    longitude: number;
    titulo?: string;
    descricao?: string;
    estagio?: string;
    data?: string;
  }>;
  centro?: [number, number];
  zoom?: number;
  hideSectionTitle?: boolean;
};

/**
 * Carrega `MapaTalhao` só no cliente via `import()` — sem `next/dynamic`.
 * Evita o erro minificado "TypeError: r is not a function" do runtime loadable em alguns builds.
 */
export default function MapaTalhaoClientMount(props: MapaTalhaoClientMountProps) {
  const [Comp, setComp] = useState<React.ComponentType<MapaTalhaoClientMountProps> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void import('@/components/MapaTalhao')
      .then((m) => {
        if (!alive) return;
        const Def = m.default;
        if (typeof Def !== 'function') {
          console.error('[VT MapaTalhaoClientMount] export default não é função:', typeof Def, m);
          setLoadError('Mapa indisponível (módulo inválido).');
          return;
        }
        setComp(() => Def);
      })
      .catch((err: unknown) => {
        console.error('[VT MapaTalhaoClientMount] falha ao carregar chunk MapaTalhao', err);
        if (alive) setLoadError('Mapa indisponível (rede ou build).');
      });
    return () => {
      alive = false;
    };
  }, []);

  if (loadError != null) {
    return (
      <div
        style={{
          height: 360,
          width: '100%',
          background: '#fef2f2',
          borderRadius: 8,
          padding: 16,
          fontSize: 13,
          color: '#991b1b',
        }}
        role="alert"
      >
        {loadError}
      </div>
    );
  }

  if (Comp == null) {
    return (
      <div
        style={{ height: 360, width: '100%', background: '#f1f5f9', borderRadius: 8 }}
        aria-busy="true"
        aria-label="A carregar mapa"
      />
    );
  }
  return <Comp {...props} />;
}
