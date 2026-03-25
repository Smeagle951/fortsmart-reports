'use client';

import React from 'react';

type Props = {
  children: React.ReactNode;
  /** Quando o mapa Leaflet falha mas há desenho vetorial (path/viewBox), mostrar esta alternativa. */
  fallback?: React.ReactNode;
};

type State = { error?: Error };

/** Isola falhas do react-leaflet para não derrubar o relatório inteiro. */
export default class SaasLeafletErrorBoundary extends React.Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return (
          <div className="space-y-3 print:break-inside-avoid">
            <div className="rounded-xl border border-amber-200/90 bg-amber-50/90 px-3 py-2.5 text-center text-xs text-amber-950">
              <p className="font-medium">Mapa interativo não carregou neste dispositivo ou navegador.</p>
              <p className="mt-0.5 text-amber-900/85">Exibindo a planta esquemática do talhão e os pontos de avaliação, quando disponíveis no relatório.</p>
            </div>
            {this.props.fallback}
          </div>
        );
      }
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-6 text-center text-sm text-amber-900">
          <p className="font-medium">Mapa não pôde ser exibido neste dispositivo ou navegador.</p>
          <p className="mt-1 text-xs text-amber-800/90">O restante do relatório permanece disponível.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
