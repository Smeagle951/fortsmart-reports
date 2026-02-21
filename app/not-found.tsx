import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        background: '#f3f4f6',
        color: '#1f2937',
      }}
    >
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        404 — Esta página não foi encontrada
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem', textAlign: 'center', maxWidth: '420px' }}>
        O link do relatório pode estar incorreto ou o relatório não está mais disponível.
      </p>
      <ul style={{ textAlign: 'left', color: '#4b5563', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        <li>Use o <strong>link completo</strong> que o app mostra após publicar (ex.: …/r/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).</li>
        <li>No Vercel defina <code>SUPABASE_URL</code> e <code>SUPABASE_SERVICE_ROLE_KEY</code> (mesmo projeto do app). Supabase → Settings → API → service_role.</li>
        <li>Faça <strong>Redeploy</strong> após alterar variáveis.</li>
      </ul>
      <Link
        href="/"
        style={{
          color: '#1b5e20',
          fontWeight: 600,
          textDecoration: 'underline',
        }}
      >
        Voltar ao início
      </Link>
    </div>
  );
}
