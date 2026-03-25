'use client';

import React from 'react';

type Props = {
  children: React.ReactNode;
  fallbackTitle?: string;
};

type State = {
  error?: Error;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] erro ao renderizar:', error);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', maxWidth: 900 }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>
            {this.props.fallbackTitle ?? 'Erro ao renderizar a página'}
          </h1>
          <p style={{ color: '#6b7280' }}>
            Ocorreu um erro ao montar o relatório no navegador. Tente outro navegador ou atualize a página. Em ambiente de desenvolvimento ou com{' '}
            <code>ALLOW_R_ROUTE_DEBUG=1</code> na Vercel, use <code>?debug=payload</code> na URL para inspecionar o JSON bruto.
          </p>
          <pre style={{ textAlign: 'left', fontSize: 11, background: '#0b1020', color: '#d1d5db', padding: 12, marginTop: 16, borderRadius: 8, overflowX: 'auto' }}>
            {error.message}
            {'\n'}
            {error.stack ?? ''}
          </pre>
        </div>
      </main>
    );
  }
}

