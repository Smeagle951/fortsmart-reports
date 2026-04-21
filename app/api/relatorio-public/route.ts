import { NextRequest, NextResponse } from 'next/server';
import { getRelatorioByTokenHybrid, getRelatorioReadCutoverSnapshot } from '@/lib/get-relatorio-by-token-hybrid';
import { resolveFortsmartApiBase } from '@/lib/fortsmart-api-base';

/** Causas possíveis do 404 (em ordem de prioridade) */
export type Causa404 =
  | 'token_nao_encontrado'
  | 'projeto_errado'
  | 'is_public_false'
  | 'rota_nextjs'
  | 'query_falhou'
  | 'config_faltando'
  | 'postgres_bloqueado';

type Diagnostico = {
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

function buildDiagnostico(
  causa: Causa404,
  opts: { error?: string; hasConfig?: boolean; isPublic?: boolean; tokenExiste?: boolean },
): Diagnostico {
  const checks = {
    config_ok: opts.hasConfig ?? false,
    token_no_banco: opts.tokenExiste ?? null,
    is_public_true: opts.isPublic ?? null,
    query_erro: opts.error ?? null,
    supabase_project: '(verificar se é o mesmo do app)',
  };

  const map: Record<Causa404, { descricao: string; solucao: string }> = {
    token_nao_encontrado: {
      descricao:
        'O token não foi encontrado. Pode ser: (a) nunca foi publicado, (b) Vercel está em outro projeto Supabase, (c) ainda não migrado para o Neon.',
      solucao:
        'Confira no Supabase (mesmo projeto do .env) ou em `fortsmart_web_relatorios` no Neon. Na Vercel, confira FORTSMART_API_URL (backend) e variáveis Supabase. Redeploy após alterar.',
    },
    projeto_errado: {
      descricao: 'A Vercel provavelmente aponta para outro projeto Supabase.',
      solucao:
        'Vercel → Environment Variables: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY do mesmo projeto do app. Redeploy.',
    },
    is_public_false: {
      descricao: 'O registo existe (Supabase) mas is_public = false. O link público ignora o registo.',
      solucao: `No Supabase SQL Editor: UPDATE relatorios SET is_public = true WHERE share_token = '<seu_token>';`,
    },
    rota_nextjs: {
      descricao: 'A rota /r/[token] pode não estar a ser servida corretamente.',
      solucao:
        'Teste /r/TOKEN?debug=1 — se mostrar o token, a rota está OK. Confira o Root Directory na Vercel.',
    },
    query_falhou: {
      descricao: 'A query ao Supabase retornou erro (modo legado de diagnóstico).',
      solucao: opts.error
        ? `Corrija o erro: ${opts.error}. Confira RLS e a tabela relatorios.`
        : 'Verifique logs na Vercel e no Supabase.',
    },
    config_faltando: {
      descricao: 'Variáveis de ambiente em falta na Vercel (Supabase e/ou API).',
      solucao:
        'Defina FORTSMART_API_URL (backend com Neon) e, para o legado, SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY. Redeploy.',
    },
    postgres_bloqueado: {
      descricao: 'O relatório existe no PostgreSQL (Neon) mas está privado (is_public = false).',
      solucao:
        'Atualize a linha em fortsmart_web_relatorios: is_public = true, ou reabra a partilha a partir do app. Não existe fallback no Supabase para este caso (fonte canónica: Neon).',
    },
  };

  const { descricao, solucao } = map[causa];
  return { causa_probavel: causa, descricao, solucao, checks };
}

/**
 * GET /api/relatorio-public?token=UUID
 * Diagnóstico alinhado à mesma cadeia que /r/[token]: primeiro backend (Neon), depois Supabase.
 * Opcional: `&with_cutover=1` inclui snapshot in-process de `postgres_success_rate` e `cutover_ready_candidate` (métricas do runtime).
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const withCutover = request.nextUrl.searchParams.get('with_cutover') === '1';
  if (!token || token.length < 10) {
    return NextResponse.json(
      { ok: false, error: 'Passe ?token=UUID do link (ex: /r/9283926a-31c1-4bb4-9d46-43e740492ba2)' },
      { status: 400 },
    );
  }

  const hasSupabaseUrl = !!(
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.URL_SUPABASE
  );
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const configOk = hasSupabaseUrl && (hasServiceKey || hasAnonKey);
  const apiBasePreview = resolveFortsmartApiBase();

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.URL_SUPABASE || '';
  const projectRef = supabaseUrl.includes('supabase.co')
    ? supabaseUrl.replace(/https?:\/\/([^.]+)\.supabase\.co.*/, '$1')
    : '(não configurado)';

  const hybrid = await getRelatorioByTokenHybrid(token);

  console.log('[fortsmart-reports] /api/relatorio-public', {
    token: token.slice(0, 8) + '…',
    ok: hybrid.ok,
    origem: hybrid.ok ? hybrid.origem : hybrid.reason,
    postgres_http: hybrid.postgresHttpStatus,
  });

  const env = {
    hasSupabaseUrl,
    hasServiceKey,
    hasAnonKey,
    hasApiBase: !!process.env.FORTSMART_API_URL?.trim(),
    fortsmart_api_base_resolvida: apiBasePreview,
    projectRef,
  };

  const cutoverSnapshot = withCutover ? getRelatorioReadCutoverSnapshot() : undefined;
  const migracaoCommon = (h: {
    postgresHttpStatus: number | null;
    postgresError?: string;
    circuitSkipped?: boolean;
    postgresFailureClass?: string;
    negativeCacheHit?: boolean;
  }) => ({
    postgres_http_status: h.postgresHttpStatus,
    postgres_error: h.postgresError ?? null,
    circuit_skipped: h.circuitSkipped ?? false,
    postgres_failure_class: h.postgresFailureClass ?? null,
    negative_cache_hit: h.negativeCacheHit ?? false,
    ...(withCutover && cutoverSnapshot ? { cutover: cutoverSnapshot } : {}),
  });

  if (hybrid.ok) {
    const r = hybrid.row;
    const row = {
      id: r.id,
      share_token: r.share_token ?? undefined,
      titulo: r.titulo ?? undefined,
      is_public: r.is_public !== false,
      created_at: r.created_at,
    };
    return NextResponse.json({
      ok: true,
      found: true,
      /** Fonte canónica do registo (`postgres` | `supabase`). */
      source: hybrid.origem,
      /** Quando `source === 'supabase'`: `admin` (service role) ou `anon`. Com `source === 'postgres'`, sempre `null`. */
      supabase_mode: hybrid.supabaseMode,
      relatorio: row,
      migracao: {
        ...migracaoCommon({
          postgresHttpStatus: hybrid.postgresHttpStatus,
          postgresError: hybrid.postgresError,
          circuitSkipped: hybrid.circuitSkipped,
          negativeCacheHit: hybrid.negativeCacheHit,
        }),
      },
      env,
    });
  }

  if (hybrid.reason === 'postgres_forbidden') {
    const diagnostico = buildDiagnostico('postgres_bloqueado', {
      hasConfig: configOk,
      tokenExiste: true,
      isPublic: false,
    });
    diagnostico.checks.supabase_project = projectRef;
    return NextResponse.json(
      {
        ok: false,
        found: false,
        error: 'Registo no PostgreSQL (Neon) com is_public = false',
        source: 'postgres' as const,
        supabase_mode: null,
        reason: 'postgres_forbidden' as const,
        migracao: {
          ...migracaoCommon(hybrid),
        },
        diagnostico,
        env,
      },
      { status: 403 },
    );
  }

  let causa: Causa404 = 'token_nao_encontrado';
  if (hybrid.reason === 'invalid_token') {
    return NextResponse.json(
      { ok: false, error: 'Token inválido', env },
      { status: 400 },
    );
  }
  if (!configOk) {
    causa = 'config_faltando';
  } else {
    const pe = hybrid.postgresError;
    if (pe && (hybrid.postgresHttpStatus === 503 || /fetch|abort|Failed/i.test(String(pe)))) {
      causa = 'query_falhou';
    }
  }

  const diagnostico = buildDiagnostico(causa, {
    hasConfig: configOk,
    tokenExiste: false,
    error: hybrid.postgresError ?? (causa === 'query_falhou' ? 'API backend indisponível ou timeout' : undefined),
  });
  diagnostico.checks.supabase_project = projectRef;

  const hint =
    causa === 'config_faltando'
      ? 'Defina FORTSMART_API_URL, SUPABASE_URL e chaves na Vercel.'
      : causa === 'query_falhou'
        ? `Erro/timeout na API: ${hybrid.postgresError}`
        : 'Token não encontrado no backend nem no Supabase (ou migração incompleta).';

  return NextResponse.json(
    {
      ok: false,
      found: false,
      error: hybrid.postgresError || 'Nenhum registo com este share_token.',
      hint,
      migracao: {
        ...migracaoCommon(hybrid),
        fortsmart_api_base_resolvida: apiBasePreview,
      },
      diagnostico,
      env,
    },
    { status: 404 },
  );
}
