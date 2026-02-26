import { getSupabaseAdmin } from '../../../lib/supabase-admin';
import { getRelatorioByShareToken, type RelatorioRow } from '../../../lib/supabase';
import { parsePayload } from '../../../utils/parsePayload';
import RelatorioContent from '../../../components/RelatorioContent';
import RelatorioMonitoramento, { MonitoramentoJson } from '../../../components/RelatorioMonitoramento';
import RelatorioPlantio, { PlantioJson } from '../../../components/RelatorioPlantio';
import SideBySideReportContent, { type SideBySideReportData } from '../../../components/SideBySideReportContent';
import PrintBar from '../../../components/PrintBar';

type Props = { params: { token: string }; searchParams?: { [key: string]: string | string[] | undefined } };

/** Rota pública /r/[token]: usa SERVICE_ROLE se configurado; senão anon. Só filtra por share_token (não por publicado). */
export default async function RelatorioCompartilhadoPage({ params, searchParams }: Props) {
  const { token } = params;
  const sp = searchParams;
  const debug = sp?.debug === '1' || sp?.debug === 'true';
  console.log('[fortsmart-reports] /r/[token] token recebido:', token);
  if (debug) {
    return <div style={{ padding: 20, fontFamily: 'sans-serif' }}><h1>Token (roteamento OK)</h1><pre>{token}</pre></div>;
  }

  let row: RelatorioRow | null = null;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('relatorios')
        .select('*')
        .eq('share_token', token)
        .maybeSingle();
      console.log('[fortsmart-reports] /r/[token] admin query:', { error: error?.message ?? null, hasData: !!data, is_public: data?.is_public });
      if (error) {
        console.warn('[fortsmart-reports] /r/[token] admin error:', error.message);
      } else if (data) {
        if (data.is_public !== false && (!data.share_expires_at || new Date(data.share_expires_at) >= new Date())) {
          const r = data as RelatorioRow & { json_data?: unknown; dados_json?: unknown };
          const raw = r.dados ?? r.json_data ?? r.dados_json;
          if (!r.dados && raw != null) {
            const parsed = parsePayload(raw);
            if (parsed) r.dados = parsed;
          }
          row = r;
        } else {
          console.warn('[fortsmart-reports] /r/[token] registro ignorado: is_public=', data.is_public, 'share_expires_at=', data.share_expires_at);
        }
      }
    } else {
      console.warn('[fortsmart-reports] /r/[token] supabaseAdmin null (SUPABASE_SERVICE_ROLE_KEY ou URL?)');
    }

    if (!row) {
      row = await getRelatorioByShareToken(token);
      console.log('[fortsmart-reports] /r/[token] fallback anon:', row ? 'encontrado' : 'não encontrado');
    }

    if (!row) {
      console.warn('[fortsmart-reports] /r/[token] notFound: nenhum registro para token', token);
      return (
        <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
          <div style={{ textAlign: 'center', maxWidth: 560 }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Relatório não encontrado</h1>
            <p style={{ color: '#6b7280' }}>O relatório solicitado não está disponível. Verifique o link ou tente novamente mais tarde.</p>
          </div>
        </main>
      );
    }

    const rawPayload = row.dados ?? (row as RelatorioRow & { json_data?: unknown; dados_json?: unknown }).json_data ?? (row as RelatorioRow & { dados_json?: unknown }).dados_json;
    const relatorio = parsePayload(rawPayload);
    if (!relatorio) {
      console.warn('[fortsmart-reports] /r/[token] notFound: payload inválido', typeof rawPayload);
      return (
        <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
          <div style={{ textAlign: 'center', maxWidth: 560 }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Relatório inválido</h1>
            <p style={{ color: '#6b7280' }}>O conteúdo do relatório está corrompido ou não pode ser exibido.</p>
          </div>
        </main>
      );
    }

    const tipo = relatorio.tipo as string | undefined;
    const isSideBySide = tipo === 'avaliacao_lado_a_lado';
    const isMonitoramento = tipo === 'monitoramento';
    const isPlantio = tipo === 'plantio' || relatorio.tipoRelatorio === 'plantio';

    return (
      <>
        <PrintBar />
        <article className="relatorio">
          {isSideBySide ? (
            <SideBySideReportContent
              data={relatorio as SideBySideReportData}
              reportId={row.titulo || row.id}
            />
          ) : isMonitoramento ? (
            <RelatorioMonitoramento
              relatorio={relatorio as MonitoramentoJson}
              reportId={row.titulo || row.id}
            />
          ) : isPlantio ? (
            <RelatorioPlantio
              relatorio={relatorio as PlantioJson}
              reportId={row.titulo || row.id}
            />
          ) : (
            <RelatorioContent
              relatorio={relatorio}
              reportId={row.titulo || row.id}
              relatorioUuid={row.id}
            />
          )}
        </article>
      </>
    );
  } catch (e) {
    console.error('[fortsmart-reports] /r/[token] erro:', e);
    return (
      <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', maxWidth: 560 }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Erro ao carregar o relatório</h1>
          <p style={{ color: '#6b7280' }}>Ocorreu um erro inesperado ao carregar o relatório. Tente novamente mais tarde.</p>
        </div>
      </main>
    );
  }
}
