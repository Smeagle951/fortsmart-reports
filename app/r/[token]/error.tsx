'use client';

import { useEffect } from 'react';

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
  const isLikelyConfig =
    /supabase|SUPABASE|env|environment|service_role|anon/i.test(msg) ||
    msg.includes('fetch') ||
    msg.includes('Invalid API key');

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
      <div style={{ textAlign: 'center', maxWidth: 560 }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 12 }}>Erro ao abrir o relatório</h1>
        <p style={{ color: '#6b7280', marginBottom: 16 }}>
          Ocorreu um erro no servidor ao carregar este relatório. Em produção a mensagem exata é ocultada pelo Next.js.
        </p>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
          Para ver o erro real: Vercel → seu projeto → <strong>Deployments</strong> → último deploy → <strong>Functions</strong> ou <strong>Logs</strong>. Ali pode aparecer: <code>relation "relatorios" does not exist</code>, <code>permission denied</code>, <code>Cannot read properties of null</code> ou mensagem de variável de ambiente.
        </p>
        <details style={{ textAlign: 'left', marginBottom: 16, fontSize: 13, color: '#6b7280' }}>
          <summary style={{ cursor: 'pointer' }}>Diagnóstico rápido (Supabase + rota)</summary>
          <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
            <li>Esta rota usa a tabela <strong>relatorios</strong> (não <code>reports</code>).</li>
            <li>A busca é por <strong>share_token</strong> (não por <code>id</code>). A URL é <code>/r/[token]</code>.</li>
            <li>No Supabase: Table Editor → <strong>relatorios</strong> → confira se existe um registro com o <code>share_token</code> do link. Se não existir, o relatório não abre.</li>
            <li>RLS: com <code>SUPABASE_SERVICE_ROLE_KEY</code> a leitura ignora RLS. Sem ela, a chave anon precisa de política que permita <code>select</code> por <code>share_token</code>.</li>
          </ul>
        </details>
        {isLikelyConfig && (
          <div
            style={{
              textAlign: 'left',
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            <strong>Possível causa: variáveis de ambiente na Vercel</strong>
            <p style={{ margin: '8px 0 0' }}>
              Em <strong>Settings → Environment Variables</strong>, confira:
            </p>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
              <li><code>NEXT_PUBLIC_SUPABASE_URL</code></li>
              <li><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
              <li><code>SUPABASE_SERVICE_ROLE_KEY</code></li>
            </ul>
            <p style={{ margin: '8px 0 0' }}>Use os valores do mesmo projeto Supabase do app. Depois faça <strong>Redeploy</strong>.</p>
          </div>
        )}
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
        {msg && (
          <details style={{ textAlign: 'left', marginTop: 20 }}>
            <summary style={{ cursor: 'pointer', fontSize: 14, color: '#6b7280' }}>Detalhes do erro</summary>
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
