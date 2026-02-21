'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Causa404 =
  | 'token_nao_encontrado'
  | 'projeto_errado'
  | 'is_public_false'
  | 'rota_nextjs'
  | 'query_falhou'
  | 'config_faltando';

type ApiResult = {
  ok: boolean;
  found?: boolean;
  error?: string;
  hint?: string;
  diagnostico?: {
    causa_probavel: Causa404;
    descricao: string;
    solucao: string;
    checks: {
      config_ok: boolean;
      token_no_banco: boolean | null;
      is_public_true: boolean | null;
      query_erro: string | null;
      supabase_project: string;
    };
  };
  env?: {
    hasSupabaseUrl?: boolean;
    hasServiceKey?: boolean;
    hasAnonKey?: boolean;
    projectRef?: string;
  };
  source?: string;
};

const CAUSAS: { id: Causa404; label: string }[] = [
  { id: 'token_nao_encontrado', label: '1. Token não encontrado no banco' },
  { id: 'projeto_errado', label: '2. Projeto Supabase diferente (Vercel vs app)' },
  { id: 'is_public_false', label: '3. Filtro is_public = false' },
  { id: 'rota_nextjs', label: '4. Rota Next.js' },
  { id: 'query_falhou', label: '5. Query falhando silenciosamente' },
];

export default function RelatorioNotFoundDiagnostic({ token }: { token: string }) {
  const [apiResult, setApiResult] = useState<ApiResult | null>(null);

  useEffect(() => {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    fetch(`${base}/api/relatorio-public?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => setApiResult(data))
      .catch(() => setApiResult({ ok: false, error: 'Erro ao chamar API' }));
  }, [token]);

  const d = apiResult?.diagnostico;
  const causaDetectada = d?.causa_probavel;
  const safeToken = String(token).replace(/'/g, "''");
  const sql = `SELECT id, share_token, is_public, share_expires_at, created_at
FROM relatorios
WHERE share_token = '${safeToken}'`;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem 2rem',
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        color: '#1f2937',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#92400e' }}>
        🔍 Diagnóstico 404 — Relatório não encontrado
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '1.25rem', textAlign: 'center', maxWidth: '560px' }}>
        Detectamos onde pode estar o erro. Siga a indicação abaixo.
      </p>

      {/* Causa detectada */}
      {d && (
        <section
          style={{
            background: causaDetectada ? '#fef2f2' : '#f0fdf4',
            border: `2px solid ${causaDetectada ? '#dc2626' : '#22c55e'}`,
            borderRadius: 8,
            padding: '1rem 1.5rem',
            maxWidth: 620,
            width: '100%',
            marginBottom: '1rem',
            textAlign: 'left',
          }}
        >
          <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#374151', fontWeight: 600 }}>
            🎯 Causa mais provável
          </h2>
          <p
            style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: causaDetectada ? '#b91c1c' : '#15803d',
              marginBottom: '0.5rem',
            }}
          >
            {CAUSAS.find((c) => c.id === causaDetectada)?.label ?? causaDetectada}
          </p>
          <p style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '0.5rem' }}>{d.descricao}</p>
          <p style={{ fontSize: '0.9rem', color: '#1f2937', fontWeight: 500 }}>✅ Solução: {d.solucao}</p>
          {d.checks.query_erro && (
            <p style={{ fontSize: '0.85rem', color: '#dc2626', marginTop: '0.5rem' }}>
              Erro: {d.checks.query_erro}
            </p>
          )}
        </section>
      )}

      {/* Checklist das 5 causas */}
      <section
        style={{
          background: '#fff',
          borderRadius: 8,
          padding: '1rem 1.5rem',
          maxWidth: 620,
          width: '100%',
          marginBottom: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          textAlign: 'left',
        }}
      >
        <h2 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#374151' }}>📋 Checklist das 5 causas</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {CAUSAS.map((c) => {
            const isThis = c.id === causaDetectada;
            const check = d?.checks;
            let status: string = '—';
            if (c.id === 'token_nao_encontrado' && check?.token_no_banco === false) status = '❌';
            else if (c.id === 'token_nao_encontrado' && check?.token_no_banco === true) status = '✅';
            else if (c.id === 'projeto_errado' && !check?.config_ok) status = '❌';
            else if (c.id === 'projeto_errado' && check?.config_ok && check?.token_no_banco === false)
              status = '⚠️ Possível';
            else if (c.id === 'is_public_false' && check?.is_public_true === false) status = '❌';
            else if (c.id === 'is_public_false' && check?.is_public_true === true) status = '✅';
            else if (c.id === 'rota_nextjs') status = '🧪 Teste ?debug=1';
            else if (c.id === 'query_falhou' && check?.query_erro) status = '❌';

            return (
              <li
                key={c.id}
                style={{
                  padding: '0.4rem 0',
                  fontSize: '0.9rem',
                  borderBottom: '1px solid #f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: isThis ? '#fef3c7' : undefined,
                  margin: isThis ? '0 -0.5rem' : 0,
                  paddingLeft: isThis ? '0.5rem' : 0,
                  paddingRight: isThis ? '0.5rem' : 0,
                  borderRadius: 4,
                }}
              >
                <span style={{ minWidth: 24 }}>{status}</span>
                <span style={{ color: isThis ? '#92400e' : '#4b5563', fontWeight: isThis ? 600 : 400 }}>
                  {c.label}
                </span>
              </li>
            );
          })}
        </ul>
        {d?.checks && (
          <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.75rem' }}>
            Config: {d.checks.config_ok ? '✅' : '❌'} | Projeto Supabase: {d.checks.supabase_project}
          </p>
        )}
      </section>

      {/* Token e SQL */}
      <section
        style={{
          background: '#fff',
          borderRadius: 8,
          padding: '1rem 1.5rem',
          maxWidth: 620,
          width: '100%',
          marginBottom: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          textAlign: 'left',
        }}
      >
        <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#374151' }}>🔑 Token</h2>
        <code
          style={{
            fontSize: '0.85rem',
            wordBreak: 'break-all',
            background: '#f3f4f6',
            padding: '0.25rem 0.5rem',
            borderRadius: 4,
          }}
        >
          {token}
        </code>
      </section>

      <section
        style={{
          background: '#fff',
          borderRadius: 8,
          padding: '1rem 1.5rem',
          maxWidth: 620,
          width: '100%',
          marginBottom: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          textAlign: 'left',
        }}
      >
        <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#374151' }}>📄 SQL no Supabase</h2>
        <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>
          No Supabase → SQL Editor (projeto {apiResult?.env?.projectRef ?? '?'}), execute:
        </p>
        <pre
          style={{
            fontSize: '0.8rem',
            background: '#1f2937',
            color: '#e5e7eb',
            padding: '1rem',
            borderRadius: 4,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
          }}
        >
          {sql}
        </pre>
        <ul style={{ fontSize: '0.85rem', color: '#4b5563', marginTop: '0.75rem', paddingLeft: '1.25rem' }}>
          <li>0 linhas → token não está nesse projeto (ou nunca foi publicado).</li>
          <li>
            Se <code>is_public = false</code>:{' '}
            <code>UPDATE relatorios SET is_public = true WHERE share_token = &apos;{safeToken}&apos;;</code>
          </li>
        </ul>
      </section>

      {/* Testes */}
      <section
        style={{
          background: '#fff',
          borderRadius: 8,
          padding: '1rem 1.5rem',
          maxWidth: 620,
          width: '100%',
          marginBottom: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          textAlign: 'left',
        }}
      >
        <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#374151' }}>🧪 Testes</h2>
        <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>
          Roteamento OK se mostrar o token:
        </p>
        <a
          href={`/r/${token}?debug=1`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#1b5e20', fontWeight: 600, textDecoration: 'underline', fontSize: '0.9rem' }}
        >
          /r/{token}?debug=1
        </a>
        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
          API:{' '}
          <a
            href={`/api/relatorio-public?token=${encodeURIComponent(token)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#1b5e20', textDecoration: 'underline' }}
          >
            /api/relatorio-public?token=…
          </a>
        </p>
      </section>

      {apiResult && (
        <details
          style={{
            maxWidth: 620,
            width: '100%',
            marginBottom: '1rem',
            fontSize: '0.8rem',
            color: '#6b7280',
          }}
        >
          <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>Ver JSON completo</summary>
          <pre
            style={{
              background: '#f9fafb',
              padding: '0.75rem',
              borderRadius: 4,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              fontSize: '0.75rem',
            }}
          >
            {JSON.stringify(apiResult, null, 2)}
          </pre>
        </details>
      )}

      <Link
        href="/"
        style={{
          color: '#1b5e20',
          fontWeight: 600,
          textDecoration: 'underline',
          marginTop: '0.5rem',
        }}
      >
        Voltar ao início
      </Link>
    </div>
  );
}
