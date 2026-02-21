import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', maxWidth: 640 }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>FortSmart Reports</h1>
        <p style={{ color: '#6b7280', marginBottom: 12 }}>
          Esta aplicação serve apenas para exibir relatórios públicos. Para visualizar um relatório, acesse o link compartilhado no formato <code>/r/&lt;token&gt;</code>.
        </p>
        <p style={{ color: '#6b7280' }}>
          Exemplo: <Link href="/r/your-token-here">/r/your-token-here</Link>
        </p>
      </div>
    </main>
  );
}
