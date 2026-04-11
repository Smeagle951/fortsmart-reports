'use client';

import React from 'react';

type Props = { children: React.ReactNode };

type State = { error?: Error };

/** Isola falhas do react-leaflet para não derrubar o relatório inteiro. */
export default class SaasLeafletErrorBoundary extends React.Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-6 text-center text-sm text-amber-900">
          <p className="font-medium">Mapa satélite não pôde ser exibido neste dispositivo ou navegador.</p>
          <p className="mt-1 text-xs text-amber-800/90">O restante do relatório permanece disponível.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
