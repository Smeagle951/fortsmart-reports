import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { insertReportAnalyticsEvent, insertReportViewEvent } from '@/lib/log-report-view-event';
import { getRelatorioByTokenHybrid } from '@/lib/get-relatorio-by-token-hybrid';
import { type RelatorioRow } from '@/lib/supabase';
import RelatorioContent from '@/components/RelatorioContent';
import RelatorioFitossanitarioContent from '@/components/RelatorioFitossanitarioContent';
import RelatorioResearchProContent from '@/components/research/RelatorioResearchProContent';
import SideBySideReportContent, { type SideBySideReportData } from '@/components/SideBySideReportContent';
import RelatorioPlantio from '@/components/RelatorioPlantio';
import RelatorioPlantioMultiContent from '@/components/plantio/RelatorioPlantioMultiContent';
import RelatorioAmostragemSoloContent from '@/components/amostragem-solo/RelatorioAmostragemSoloContent';
import RelatorioVisitaTecnicaContent from '@/components/RelatorioVisitaTecnicaContent';
import { normalizeRelatorioVisitaTecnica } from '@/lib/normalize-relatorio-visita-tecnica';
import PrintBar from '@/components/PrintBar';
import ErrorBoundary from '@/components/ErrorBoundary';
import type { ResearchProReportPayload } from '@/types/research-report';
import type { PayloadVisitaTecnica } from '@/types/payload-visita-tecnica';
import { calcularEstatisticaFromAvaliacoes } from '@/lib/research-pro/anova-tukey';
import { extractTalhaoChave, parseAiSnapshotFromRelatorio } from '@/lib/ai-intelligence-snapshot';
import { buildAiTemporalViewerPayload } from '@/lib/inteligencia-temporal';
import { fetchPreviousRelatorioForTemporal } from '@/lib/server/fetch-previous-relatorio-temporal';

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

/**
 * Garante objeto 100% serializável para RSC (evita erro genérico em produção).
 * Remove undefined, converte Date/BigInt para string.
 */
function sanitizeForRSC(obj: unknown): unknown {
  if (obj === null || obj === undefined) return null;
  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') return obj;
  if (typeof obj === 'bigint') return String(obj);
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForRSC(item));
  }
  if (typeof obj === 'object' && obj !== null) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined) continue;
      const key = typeof k === 'string' ? k : String(k);
      out[key] = sanitizeForRSC(v);
    }
    return out;
  }
  return null;
}

function ErroServidor({ mensagem, stack }: { mensagem: string; stack?: string }) {
  return (
    <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', maxWidth: 640 }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Erro ao abrir o relatório</h1>
        <p style={{ color: '#6b7280', marginBottom: 16 }}>Ocorreu um erro no servidor ao carregar este relatório.</p>
        {mensagem && (
          <details style={{ textAlign: 'left', marginTop: 16 }}>
            <summary style={{ cursor: 'pointer', fontSize: 14, color: '#6b7280' }}>Detalhes do erro (para diagnóstico)</summary>
            <pre style={{ fontSize: 11, background: '#fef2f2', color: '#991b1b', padding: 12, marginTop: 8, borderRadius: 8, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {mensagem}
              {stack ? `\n\n${stack}` : ''}
            </pre>
          </details>
        )}
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 20 }}>
          Confira na Vercel as variáveis <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> e <code>SUPABASE_SERVICE_ROLE_KEY</code>. Depois faça Redeploy.
        </p>
      </div>
    </main>
  );
}

/** Rota pública /r/[token]: share_token ou, se UUID, fallback por `relatorios.id` (links antigos / cópia errada do id). */
export default async function RelatorioCompartilhadoPage(props: Props) {
  try {
    const resolvedParams = await props.params;
    const token = resolvedParams?.token ?? '';
    const sp = props.searchParams ? await props.searchParams : {};

  const debug = sp?.debug === '1' || sp?.debug === 'true';
  const debugPayload = sp?.debug === '2' || sp?.debug === 'payload';
  /** Logs no servidor: `?debug=vt-flow` ou env `FORTSMART_VT_DEBUG=1` */
  const vtFlowTrace =
    sp?.debug === 'vt-flow' || sp?.debug === 'vtflow' || process.env.FORTSMART_VT_DEBUG === '1';
  console.log('[fortsmart-reports] /r/[token] token recebido:', token);
  if (debug) {
    return <div style={{ padding: 20, fontFamily: 'sans-serif' }}><h1>Token (roteamento OK)</h1><pre>{token}</pre></div>;
  }

  let row: RelatorioRow | null = null;

  try {
    const hybrid = await getRelatorioByTokenHybrid(token);
    if (hybrid.ok) {
      row = hybrid.row;
      console.log('[fortsmart-reports] /r/[token] carregado', {
        origem_dados: hybrid.origem,
        supabase_mode: hybrid.supabaseMode,
        circuit_skipped: hybrid.circuitSkipped ?? false,
        postgres_http_status: hybrid.postgresHttpStatus,
        postgres_error: hybrid.postgresError ?? null,
      });
    }

    if (!hybrid.ok && hybrid.reason === 'postgres_forbidden') {
      return (
        <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
          <div style={{ textAlign: 'center', maxWidth: 560 }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Relatório não disponível</h1>
            <p style={{ color: '#6b7280' }}>
              Este link não está partilhado publicamente na base principal, ou a partilha foi revogada.{' '}
              <span style={{ fontSize: 13 }}>Se acredita que isto é um erro, contacte quem enviou o link.</span>
            </p>
          </div>
        </main>
      );
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
    const parsed = parsePayload(rawPayload);
    if (!parsed) {
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
    let relatorio: Record<string, unknown>;
    try {
      const cloned = JSON.parse(JSON.stringify(parsed)) as Record<string, unknown>;
      const sanitized = sanitizeForRSC(cloned);
      relatorio =
        sanitized != null && typeof sanitized === 'object' && !Array.isArray(sanitized)
          ? (sanitized as Record<string, unknown>)
          : cloned ?? {};
    } catch (_) {
      console.warn('[fortsmart-reports] /r/[token] payload não serializável ao normalizar');
      return (
        <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
          <div style={{ textAlign: 'center', maxWidth: 560 }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Relatório inválido</h1>
            <p style={{ color: '#6b7280' }}>Os dados deste relatório não puderam ser preparados para exibição.</p>
          </div>
        </main>
      );
    }
    if (debugPayload) {
      const tipo = relatorio?.tipo;
      const tipoRelatorio = relatorio?.tipoRelatorio;
      const hasTalhoes = Array.isArray(relatorio?.talhoes) && (relatorio?.talhoes?.length ?? 0) > 0;
      const hasTalhaoSingular =
        relatorio?.talhao != null && typeof relatorio.talhao === 'object';
      let vtNormalized: Record<string, unknown> | null = null;
      if (tipo === 'visita_tecnica') {
        try {
          vtNormalized = normalizeRelatorioVisitaTecnica(relatorio as Record<string, unknown>) as Record<string, unknown>;
        } catch {
          vtNormalized = null;
        }
      }
      const hasTalhoesAfterVt =
        vtNormalized != null &&
        Array.isArray(vtNormalized.talhoes) &&
        (vtNormalized.talhoes as unknown[]).length > 0;
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
            <div><strong>hasTalhoes (array)</strong></div><div>{String(hasTalhoes)}</div>
            <div><strong>hasTalhao (objeto único)</strong></div><div>{String(hasTalhaoSingular)}</div>
            <div style={{ gridColumn: '1 / -1', fontSize: 11, color: '#64748b', marginTop: 4 }}>
              Acima: objeto como veio do DB (após <code>sanitizeForRSC</code>). Visita técnica V1 costuma ter só <code>talhao</code> — <code>hasTalhoes</code> false é normal antes do normalize.
            </div>
            {tipo === 'visita_tecnica' ? (
              <>
                <div><strong>hasTalhoes após normalizeRelatorioVisitaTecnica</strong></div>
                <div>
                  {vtNormalized ? String(hasTalhoesAfterVt) : 'erro ao normalizar'}
                  {vtNormalized && Array.isArray(vtNormalized.talhoes)
                    ? ` (length=${(vtNormalized.talhoes as unknown[]).length})`
                    : ''}
                </div>
                <div style={{ gridColumn: '1 / -1', fontSize: 11, color: '#64748b' }}>
                  Após <code>normalizeRelatorioVisitaTecnica</code> + <code>sanitizeVisitaTecnicaPayload</code>:{' '}
                  <code>talhoes[]</code> preenchido e <code>talhao</code> removido.
                  {vtNormalized && 'talhao' in vtNormalized ? ' (aviso: talhao ainda presente no objeto)' : ''}
                </div>
              </>
            ) : null}
            <div><strong>topKeys (payload RSC — antes de normalize VT)</strong></div>
            <div>{relatorio ? Object.keys(relatorio).slice(0, 25).join(', ') : '—'}</div>
            {tipo === 'visita_tecnica' && vtNormalized ? (
              <>
                <div><strong>topKeys (após normalizeRelatorioVisitaTecnica)</strong></div>
                <div>{Object.keys(vtNormalized).slice(0, 25).join(', ')}</div>
                <div><strong>tem talhao na raiz após normalize?</strong></div>
                <div>{String('talhao' in vtNormalized)}</div>
              </>
            ) : null}
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

    // Detecta tipo via V1 (campo raiz) e V2 (core.reportType)
    const core = relatorio.core as Record<string, unknown> | undefined;
    const reportTypeV2 = typeof core?.reportType === 'string' ? core.reportType : undefined;
    const tipo = (relatorio.tipo as string | undefined) ?? reportTypeV2;
    const tipoRelatorio = (relatorio.tipoRelatorio as string | undefined) ?? reportTypeV2;

    const isSideBySide = tipo === 'avaliacao_lado_a_lado';
    const isPlantioMulti =
      tipo === 'plantio_multi' || tipoRelatorio === 'plantio_multi';
    const isPlantio =
      !isPlantioMulti && (tipo === 'plantio' || tipoRelatorio === 'plantio');
    /** Alguns registros usam só `tipoRelatorio` (sem `tipo` no raiz). */
    const isVisitaTecnica =
      tipo === 'visita_tecnica' || tipoRelatorio === 'visita_tecnica';
    const hasTalhoes = Array.isArray(relatorio.talhoes) && (relatorio.talhoes as unknown[]).length > 0;
    const talhoesArray = Array.isArray(relatorio.talhoes) ? relatorio.talhoes : (relatorio.talhao != null && typeof relatorio.talhao === 'object' ? [relatorio.talhao] : []);
    const hasTalhoesValid = talhoesArray.length > 0 && talhoesArray.every((t: unknown) => t != null && typeof t === 'object');
    const isMonitoramento = (tipo === 'monitoramento') && hasTalhoesValid;
    const isResearchPro =
      tipo === 'RESEARCH_PRO' ||
      reportTypeV2 === 'RESEARCH_PRO' ||
      (core?.report_type as string) === 'RESEARCH_PRO';
    const isAmostragemSolo = tipo === 'amostragem_solo';

    // Research Pro: se houver avaliacoes e estatística vazia/ausente, calcular ANOVA e Tukey no servidor
    if (isResearchPro) {
      const av = relatorio.avaliacoes as ResearchProReportPayload['avaliacoes'] | undefined;
      const est = relatorio.estatistica as ResearchProReportPayload['estatistica'] | undefined;
      const precisaCalcular =
        Array.isArray(av) &&
        av.length > 0 &&
        (!est || !Array.isArray(est.variaveis) || est.variaveis.length === 0);
      if (precisaCalcular) {
        try {
          const estatistica = calcularEstatisticaFromAvaliacoes(av);
          relatorio = { ...relatorio, estatistica };
        } catch (err) {
          console.warn('[fortsmart-reports] /r/[token] cálculo ANOVA/Tukey falhou:', err);
        }
      }
    }

    console.log('[fortsmart-reports] /r/[token] roteamento:', { tipo, tipoRelatorio, reportTypeV2, isPlantio, isPlantioMulti, isSideBySide, isVisitaTecnica, isMonitoramento, isResearchPro, isAmostragemSolo, topKeys: Object.keys(relatorio).slice(0, 12) });

    // relatorio já é clone serializável; usar como props para Client Components
    const payloadSafe: Record<string, unknown> = relatorio;

    const sampleRaw = sp?.sample;
    const highlightSampleCode =
      typeof sampleRaw === 'string'
        ? sampleRaw
        : Array.isArray(sampleRaw)
          ? typeof sampleRaw[0] === 'string'
            ? sampleRaw[0]
            : undefined
          : undefined;

    if (!payloadSafe || typeof payloadSafe !== 'object' || Array.isArray(payloadSafe)) {
      console.warn('[fortsmart-reports] /r/[token] payloadSafe inválido antes do render');
      return (
        <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
          <div style={{ textAlign: 'center', maxWidth: 560 }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Relatório inválido</h1>
            <p style={{ color: '#6b7280' }}>Os dados do relatório não puderam ser preparados. Verifique no Supabase (tabela <code>relatorios</code>, coluna <code>dados</code>) se o registro existe e está válido.</p>
          </div>
        </main>
      );
    }

    let reportIdStr = '';
    let relatorioUuidStr = '';
    try {
      reportIdStr = String((row?.titulo ?? row?.id ?? '') ?? '');
      relatorioUuidStr = String(row?.id ?? '');
    } catch (_) {
      try {
        reportIdStr = String((row as any)?.id ?? '');
        relatorioUuidStr = String((row as any)?.id ?? '');
      } catch {
        reportIdStr = '';
        relatorioUuidStr = '';
      }
    }

    const adminTemporal = getSupabaseAdmin();
    const ownerUidTemporal = (row.owner_firebase_uid ?? '').trim();
    if (adminTemporal && ownerUidTemporal && relatorioUuidStr.length > 0) {
      try {
        // Não bloquear a página se o Supabase demorar ou ficar preso (evita "loading" infinito no browser).
        const prevRow = await Promise.race([
          fetchPreviousRelatorioForTemporal(adminTemporal, {
            currentId: relatorioUuidStr,
            ownerUid: ownerUidTemporal,
            preferTipo: typeof tipo === 'string' ? tipo : undefined,
            preferTalhaoKey: extractTalhaoChave(payloadSafe),
          }),
          new Promise<null>((resolve) => {
            setTimeout(() => resolve(null), 5000);
          }),
        ]);
        if (prevRow) {
          const currSnap = parseAiSnapshotFromRelatorio(payloadSafe);
          const prevSnap = parseAiSnapshotFromRelatorio(prevRow.dados);
          if (currSnap && prevSnap) {
            const rowUpdated = row as { updated_at?: string | null };
            const temporal = buildAiTemporalViewerPayload({
              currentSnapshot: currSnap,
              previousSnapshot: prevSnap,
              previousReportAt: prevRow.updated_at || null,
              currentReportAt: rowUpdated.updated_at != null ? String(rowUpdated.updated_at) : null,
              currentRelatorio: payloadSafe,
              previousRelatorio: prevRow.dados,
            });
            const sanitizedTemporal = sanitizeForRSC(temporal);
            if (sanitizedTemporal != null && typeof sanitizedTemporal === 'object' && !Array.isArray(sanitizedTemporal)) {
              payloadSafe.ai_temporal_viewer = sanitizedTemporal as Record<string, unknown>;
            }
          }
        }
      } catch (tempErr) {
        console.warn('[fortsmart-reports] /r/[token] inteligência temporal:', tempErr);
      }
    }

    const supabaseAdminForMetric = getSupabaseAdmin();
    if (supabaseAdminForMetric && relatorioUuidStr.length > 0) {
      const ownerUid = (row.owner_firebase_uid ?? '').trim();
      const metricUserId = ownerUid.length > 0 ? ownerUid : 'anonymous_viewer';
      const moduleMetric =
        typeof tipo === 'string' && tipo.length > 0 ? tipo : 'relatorio_web';
      const qc = (payloadSafe as { quality_check?: unknown }).quality_check;
      const warnings = qc && typeof qc === 'object' && qc !== null ? (qc as { warnings?: unknown }).warnings : null;
      // Métricas de produto: não await — a rota pública não deve depender de insert em ai_report_events (evita spinner eterno se o Supabase travar).
      void (async () => {
        try {
          await insertReportViewEvent({
            client: supabaseAdminForMetric,
            reportId: relatorioUuidStr,
            userId: metricUserId,
            module: moduleMetric,
          });
          if (Array.isArray(warnings) && warnings.length > 0) {
            await insertReportAnalyticsEvent({
              client: supabaseAdminForMetric,
              reportId: relatorioUuidStr,
              userId: metricUserId,
              module: moduleMetric,
              eventType: 'quality_check',
            });
          }
        } catch (metricErr) {
          console.warn('[fortsmart-reports] /r/[token] métricas (view/quality):', metricErr);
        }
      })();
    }

    let relatorioVisitaNormalizado: PayloadVisitaTecnica | null = null;
    if (isVisitaTecnica) {
      if (vtFlowTrace) {
        console.log('[VT] ANTES normalize — keys talh*', {
          stage: 'apos_sanitizeForRSC',
          keysTalh: Object.keys(payloadSafe).filter((k) => k.toLowerCase().includes('talh')),
          hasTalhaoRaiz: 'talhao' in payloadSafe,
          talhoesIsArray: Array.isArray(payloadSafe.talhoes),
          talhoesLen: Array.isArray(payloadSafe.talhoes) ? (payloadSafe.talhoes as unknown[]).length : 0,
        });
      }
      relatorioVisitaNormalizado = normalizeRelatorioVisitaTecnica(
        payloadSafe,
      ) as PayloadVisitaTecnica;
      if (vtFlowTrace) {
        const p = relatorioVisitaNormalizado as Record<string, unknown>;
        console.log('[VT] DEPOIS normalize+sanitize+ensure — keys talh*', {
          stage: 'pronto_para_RelatorioVisitaTecnicaContent',
          keysTalh: Object.keys(p).filter((k) => k.toLowerCase().includes('talh')),
          hasTalhaoRaiz: 'talhao' in p,
          talhoesIsArray: Array.isArray(p.talhoes),
          talhoesLen: Array.isArray(p.talhoes) ? (p.talhoes as unknown[]).length : 0,
        });
      }
    }

    return (
      <>
        {/* Lado a lado: barra própria com Imprimir + PDF dentro do dashboard (evita duplicar botão) */}
        {!isSideBySide && <PrintBar />}
        <article className={`relatorio ${isSideBySide ? 'relatorio--lado-a-lado' : ''} ${isMonitoramento ? 'relatorio--monitoramento' : ''} ${isPlantioMulti ? 'relatorio--plantio-multi' : ''}`} style={isMonitoramento ? { minHeight: '100vh', background: '#F1F5F9' } : undefined}>
          {isMonitoramento ? (
            <ErrorBoundary fallbackTitle="Erro ao renderizar o relatório de monitoramento">
              <RelatorioFitossanitarioContent
                relatorio={payloadSafe as import('@/components/RelatorioFitossanitarioContent').PayloadFitossanitario}
                reportId={reportIdStr}
                relatorioUuid={relatorioUuidStr}
                shareToken={token}
              />
            </ErrorBoundary>
          ) : isResearchPro ? (
            <ErrorBoundary fallbackTitle="Erro ao renderizar o relatório Research Pro">
              <RelatorioResearchProContent
                relatorio={payloadSafe as ResearchProReportPayload}
                reportId={reportIdStr}
                shareToken={token}
              />
            </ErrorBoundary>
          ) : isSideBySide ? (
            <SideBySideReportContent
              data={payloadSafe as SideBySideReportData}
              reportId={reportIdStr}
              shareToken={token}
            />
          ) : isPlantioMulti ? (
            <ErrorBoundary fallbackTitle="Erro ao renderizar o relatório de plantio multi-talhão">
              <RelatorioPlantioMultiContent
                relatorio={payloadSafe}
                reportId={relatorioUuidStr || reportIdStr}
              />
            </ErrorBoundary>
          ) : isPlantio ? (
            <ErrorBoundary fallbackTitle="Erro ao renderizar o relatório de plantio">
              <RelatorioPlantio
                relatorio={payloadSafe as any}
                reportId={reportIdStr}
              />
            </ErrorBoundary>
          ) : isVisitaTecnica ? (
            <ErrorBoundary fallbackTitle="Erro ao renderizar o relatório de visita técnica">
              <RelatorioVisitaTecnicaContent
                relatorio={relatorioVisitaNormalizado!}
                reportId={reportIdStr}
                relatorioUuid={relatorioUuidStr}
                shareToken={token}
              />
            </ErrorBoundary>
          ) : isAmostragemSolo ? (
            <ErrorBoundary fallbackTitle="Erro ao renderizar amostragem de solos">
              <RelatorioAmostragemSoloContent
                payload={payloadSafe}
                shareToken={token}
                highlightSampleCode={highlightSampleCode}
              />
            </ErrorBoundary>
          ) : (
            <RelatorioContent
              relatorio={payloadSafe}
              reportId={reportIdStr}
              relatorioUuid={relatorioUuidStr}
              shareToken={token}
            />
          )}
        </article>
      </>
    );
  } catch (e: any) {
    console.error('[fortsmart-reports] /r/[token] erro:', e?.message ?? e, 'digest=', e?.digest);
    const msg = e?.message ?? String(e ?? '');
    const stack = typeof e?.stack === 'string' ? e.stack : undefined;
    return <ErroServidor mensagem={msg} stack={stack} />;
  }
  } catch (e: any) {
    console.error('[fortsmart-reports] /r/[token] erro (outer):', e?.message ?? e, 'digest=', e?.digest);
    const msg = e?.message ?? String(e ?? '');
    const stack = typeof e?.stack === 'string' ? e.stack : undefined;
    return <ErroServidor mensagem={msg} stack={stack} />;
  }
}
