'use client';

import { useEffect } from 'react';

const isProd = process.env.NODE_ENV === 'production';

export default function RelatorioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[fortsmart-reports] /r/[token] erro capturado:', error?.message, error?.digest);
  }, [error]);

  const msg = error?.message ?? '';

  return (
    <main
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: 'Segoe UI, system-ui, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 12 }}>Erro ao abrir o relatório</h1>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>
          Não foi possível carregar este relatório. Verifique se o link está correto ou tente novamente
          mais tarde.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: '10px 20px',
            background: '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Tentar novamente
        </button>
        {!isProd && msg && (
          <details style={{ textAlign: 'left', marginTop: 20 }}>
            <summary style={{ cursor: 'pointer', fontSize: 14, color: '#6b7280' }}>
              Detalhes (somente desenvolvimento)
            </summary>
            <pre
              style={{
                fontSize: 11,
                background: '#f3f4f6',
                padding: 12,
                marginTop: 8,
                borderRadius: 8,
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {msg}
            </pre>
          </details>
        )}
      </div>
    </main>
  );
}
