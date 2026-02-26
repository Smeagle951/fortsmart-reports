import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getRelatorioByIdForOwner } from '@/lib/supabase';
import RelatorioContent from '@/components/RelatorioContent';
import PrintBar from '@/components/PrintBar';

type Props = { params: Promise<{ id: string }> };

export default async function RelatorioPrivadoPage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const uid = cookieStore.get('firebase_uid')?.value;

  if (!uid) {
    return (
      <main className="cliente-page">
        <div className="cliente-inner">
          <p className="cliente-empty">
            Acesso restrito. Faça login no app e abra o relatório a partir dele, ou use o link compartilhado (Compartilhar).
          </p>
        </div>
      </main>
    );
  }

  const row = await getRelatorioByIdForOwner(id, uid);
  if (!row?.dados) notFound();

  const relatorio = row.dados as Record<string, unknown>;

  return (
    <>
      <PrintBar />
      <article className="relatorio">
        <RelatorioContent
          relatorio={relatorio}
          reportId={id}
          relatorioUuid={row.id}
        />
      </article>
    </>
  );
}
