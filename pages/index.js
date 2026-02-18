import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>FortSmart — Relatórios Técnicos</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="home">
        <div className="home-inner">
          <div className="brand">
            <h1>FortSmart Agro</h1>
            <p className="subtitle">Relatórios de Visita Técnica</p>
          </div>
          <p className="lead">
            Acesse seu relatório pelo link compartilhado ou use o exemplo abaixo.
          </p>
          <div className="actions">
            <Link href="/relatorio/exemplo" className="btn btn-primary">
              Ver relatório de exemplo
            </Link>
            <Link href="/cliente/boa-esperanca" className="btn btn-secondary">
              Histórico por cliente
            </Link>
          </div>
          <p className="note">
            URL do relatório: <code>/relatorio/[id]</code> — Ex.:{' '}
            <code>/relatorio/2026-01-25-talhao16</code>
          </p>
        </div>
      </main>
    </>
  );
}
