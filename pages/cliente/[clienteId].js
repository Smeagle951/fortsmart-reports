import Head from 'next/head';
import Link from 'next/link';
import { getRelatoriosByClienteId } from '../../lib/supabaseClient';
import { formatDate } from '../../lib/formatters';

export async function getServerSideProps(context) {
  const { clienteId } = context.params;
  let relatorios = [];

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    relatorios = await getRelatoriosByClienteId(clienteId);
  }

  const nomeCliente = relatorios[0]?.cliente
    || relatorios[0]?.json_data?.propriedade?.fazenda
    || decodeURIComponent(clienteId).replace(/-/g, ' ') || clienteId;

  return { props: { relatorios, clienteId, nomeCliente } };
}

export default function ClienteHistoricoPage({ relatorios, clienteId, nomeCliente }) {
  return (
    <>
      <Head>
        <title>Histórico — {nomeCliente} | FortSmart</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="cliente-page">
        <div className="cliente-inner">
          <Link href="/" className="back-link">← Voltar</Link>
          <h1 className="cliente-title">Histórico de relatórios</h1>
          <p className="cliente-subtitle">{nomeCliente}</p>

          {relatorios.length === 0 ? (
            <p className="cliente-empty">Nenhum relatório encontrado para este cliente.</p>
          ) : (
            <ul className="relatorios-list">
              {relatorios.map((r) => {
                const meta = r.json_data?.meta || {};
                const prop = r.json_data?.propriedade || {};
                const talhao = r.json_data?.talhao || {};
                const titulo = `${talhao.nome || r.id} — ${meta.safra || ''} (${prop.fazenda || ''})`;
                return (
                  <li key={r.id} className="relatorio-item">
                    <Link href={`/relatorio/${r.id}`} className="relatorio-link">
                      <span className="relatorio-titulo">{titulo}</span>
                      <span className="relatorio-meta">
                        {formatDate(r.data_relatorio || meta.dataGeracao)} • ID: {r.id}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
