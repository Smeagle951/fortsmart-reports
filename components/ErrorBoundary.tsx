'use client';

import React from 'react';

const isProd = process.env.NODE_ENV === 'production';

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
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>
            {this.props.fallbackTitle ?? 'Erro ao renderizar a página'}
          </h1>
          <p style={{ color: '#6b7280' }}>
            Ocorreu um erro ao exibir este relatório. Atualize a página ou tente novamente mais tarde.
          </p>
          {!isProd && (
            <pre style={{ textAlign: 'left', fontSize: 11, background: '#0b1020', color: '#d1d5db', padding: 12, marginTop: 16, borderRadius: 8, overflowX: 'auto' }}>
              {error.message}
              {'\n'}
              {error.stack ?? ''}
            </pre>
          )}
        </div>
      </main>
    );
  }
}
