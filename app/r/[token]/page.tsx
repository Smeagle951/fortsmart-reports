import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getRelatorioByShareToken, type RelatorioRow } from '@/lib/supabase';
import RelatorioContent from '@/components/RelatorioContent';
import RelatorioFitossanitarioContent from '@/components/RelatorioFitossanitarioContent';
import RelatorioResearchProContent from '@/components/research/RelatorioResearchProContent';
import SideBySideReportContent, { type SideBySideReportData } from '@/components/SideBySideReportContent';
import RelatorioPlantio from '@/components/RelatorioPlantio';
import PrintBar from '@/components/PrintBar';
import ErrorBoundary from '@/components/ErrorBoundary';
import type { ResearchProReportPayload } from '@/types/research-report';

// Disable Vercel's SSR cache so the latest Supabase data is always served
export const dynamic = 'force-dynamic';


type Awaitable<T> = T | Promise<T>;
type Props = { params: Awaitable<{ token: string }>; searchParams?: Awaitable<{ [key: string]: string | string[] | undefined }> };

function parsePayload(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
  return null;
}

/** Rota pública /r/[token]: usa SERVICE_ROLE se configurado; senão anon. Só filtra por share_token (não por publicado). */
export default async function RelatorioCompartilhadoPage(props: Props) {
  const resolvedParams = await props.params;
  const token = resolvedParams?.token ?? '';
  const sp = props.searchParams ? await props.searchParams : {};

  const debug = sp?.debug === '1' || sp?.debug === 'true';
  const debugPayload = sp?.debug === '2' || sp?.debug === 'payload';
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
      const diagnosticUrl = `/api/relatorio-public?token=${encodeURIComponent(token)}`;
      return (
        <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
          <div style={{ textAlign: 'center', maxWidth: 560 }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Relatório não encontrado</h1>
            <p style={{ color: '#6b7280', marginBottom: 16 }}>O relatório solicitado não está disponível. Verifique o link ou tente novamente mais tarde.</p>
            <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: 8 }}>Causas comuns: variáveis do Supabase não configuradas na Vercel; token não publicado no mesmo projeto; <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>is_public = false</code>.</p>
            <a href={diagnosticUrl} style={{ fontSize: '0.875rem', color: '#166534', textDecoration: 'underline' }}>Ver diagnóstico técnico (JSON)</a>
          </div>
        </main>
      );
    }

    const rawPayload = row.dados ?? (row as RelatorioRow & { json_data?: unknown; dados_json?: unknown }).json_data ?? (row as RelatorioRow & { dados_json?: unknown }).dados_json;
    const relatorio = parsePayload(rawPayload);
    if (debugPayload) {
      const tipo = relatorio?.tipo;
      const tipoRelatorio = relatorio?.tipoRelatorio;
      const hasTalhoes = Array.isArray(relatorio?.talhoes) && (relatorio?.talhoes?.length ?? 0) > 0;
      return (
        <main style={{ padding: 20, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
          <h1 style={{ fontSize: 18, marginBottom: 12 }}>Debug payload</h1>
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 8, fontSize: 12 }}>
            <div><strong>token</strong></div><div>{token}</div>
            <div><strong>row.id</strong></div><div>{String(row.id ?? '')}</div>
            <div><strong>row.is_public</strong></div><div>{String((row as any).is_public)}</div>
            <div><strong>row.share_expires_at</strong></div><div>{String((row as any).share_expires_at ?? '')}</div>
            <div><strong>rawPayload typeof</strong></div><div>{typeof rawPayload}</div>
            <div><strong>payload ok</strong></div><div>{String(!!relatorio)}</div>
            <div><strong>tipo</strong></div><div>{String(tipo ?? '')}</div>
            <div><strong>tipoRelatorio</strong></div><div>{String(tipoRelatorio ?? '')}</div>
            <div><strong>hasTalhoes</strong></div><div>{String(hasTalhoes)}</div>
            <div><strong>topKeys</strong></div><div>{relatorio ? Object.keys(relatorio).slice(0, 25).join(', ') : '—'}</div>
          </div>
          <h2 style={{ fontSize: 14, marginTop: 16 }}>rawPayload (primeiros 2000 chars)</h2>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#0b1020', color: '#d1d5db', padding: 12, borderRadius: 8, fontSize: 11 }}>
            {(() => {
              try {
                const s = typeof rawPayload === 'string' ? rawPayload : JSON.stringify(rawPayload);
                return (s ?? '').slice(0, 2000);
              } catch {
                return String(rawPayload ?? '').slice(0, 2000);
              }
            })()}
          </pre>
        </main>
      );
    }
    if (!relatorio) {
      console.warn('[fortsmart-reports] /r/[token] notFound: payload inválido', typeof rawPayload);
      return (
        <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
          <div style={{ textAlign: 'center', maxWidth: 560 }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Relatório inválido</h1>
            <p style={{ color: '#6b7280' }}>O conteúdo do relatório está corrompido ou não pode ser exibido.</p>
            <pre style={{ textAlign: 'left', fontSize: 10, background: '#eee', padding: 10 }}>
              {(() => {
                try {
                  const s = JSON.stringify(rawPayload);
                  if (typeof s === 'string') return s.substring(0, 500);
                  const f = String(rawPayload ?? '');
                  return f.length > 500 ? f.slice(0, 500) : f;
                } catch {
                  return '';
                }
              })()}
            </pre>
          </div>
        </main>
      );
    }

    // Detecta tipo via V1 (campo raiz) e V2 (core.reportType)
    const core = relatorio.core as Record<string, unknown> | undefined;
    const reportTypeV2 = typeof core?.reportType === 'string' ? core.reportType : undefined;
    const tipo = (relatorio.tipo as string | undefined) ?? reportTypeV2;
    const tipoRelatorio = (relatorio.tipoRelatorio as string | undefined) ?? reportTypeV2;

    const isSideBySide = tipo === 'avaliacao_lado_a_lado';
    const isPlantio = tipo === 'plantio' || tipoRelatorio === 'plantio';
    const isVisitaTecnica = tipo === 'visita_tecnica';
    const hasTalhoes = Array.isArray(relatorio.talhoes) && (relatorio.talhoes as unknown[]).length > 0;
    const isMonitoramento = (tipo === 'monitoramento') && hasTalhoes;
    const isResearchPro =
      tipo === 'RESEARCH_PRO' ||
      reportTypeV2 === 'RESEARCH_PRO' ||
      (core?.report_type as string) === 'RESEARCH_PRO';

    console.log('[fortsmart-reports] /r/[token] roteamento:', { tipo, tipoRelatorio, reportTypeV2, isPlantio, isSideBySide, isVisitaTecnica, isMonitoramento, isResearchPro, topKeys: Object.keys(relatorio).slice(0, 12) });

    return (
      <>
        <PrintBar />
        <article className={`relatorio ${isSideBySide ? 'relatorio--lado-a-lado' : ''} ${isMonitoramento ? 'relatorio--monitoramento' : ''}`} style={isMonitoramento ? { minHeight: '100vh', background: '#F1F5F9' } : undefined}>
          {isMonitoramento ? (
            <ErrorBoundary fallbackTitle="Erro ao renderizar o relatório de monitoramento">
              <RelatorioFitossanitarioContent
                relatorio={relatorio as import('@/components/RelatorioFitossanitarioContent').PayloadFitossanitario}
                reportId={row.titulo || row.id}
                relatorioUuid={row.id}
              />
            </ErrorBoundary>
          ) : isResearchPro ? (
            <ErrorBoundary fallbackTitle="Erro ao renderizar o relatório Research Pro">
              <RelatorioResearchProContent
                relatorio={relatorio as ResearchProReportPayload}
                reportId={row.titulo || row.id}
              />
            </ErrorBoundary>
          ) : isSideBySide ? (
            <SideBySideReportContent
              data={relatorio as SideBySideReportData}
              reportId={row.titulo || row.id}
            />
          ) : isPlantio ? (
            <ErrorBoundary fallbackTitle="Erro ao renderizar o relatório de plantio">
              <RelatorioPlantio
                relatorio={relatorio as any}
                reportId={row.titulo || row.id}
              />
            </ErrorBoundary>
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
  } catch (e: any) {
    console.error('[fortsmart-reports] /r/[token] erro:', e);
    return (
      <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', maxWidth: 860 }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Erro ao carregar o relatório</h1>
          <p style={{ color: '#6b7280' }}>Ocorreu um erro inesperado ao carregar o relatório. Tente novamente mais tarde.</p>
          <pre style={{ textAlign: 'left', fontSize: 10, background: '#f8d7da', color: '#721c24', padding: 10, marginTop: 20, overflowX: 'auto' }}>
            {e?.message || String(e)}
            {'\n'}
            {e?.stack || ''}
          </pre>
        </div>
      </main>
    );
  }
}
