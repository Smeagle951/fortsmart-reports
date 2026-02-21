import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getRelatorioByShareToken } from '@/lib/supabase';

/** Causas possíveis do 404 (em ordem de prioridade) */
export type Causa404 =
  | 'token_nao_encontrado'
  | 'projeto_errado'
  | 'is_public_false'
  | 'rota_nextjs'
  | 'query_falhou'
  | 'config_faltando';

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
  opts: { error?: string; hasConfig?: boolean; isPublic?: boolean; tokenExiste?: boolean }
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
        'O token não foi encontrado. Pode ser: (a) nunca foi publicado, (b) Vercel está em outro projeto Supabase.',
      solucao:
        'Confira no Supabase (mesmo projeto do .env do app) se o token existe com o SQL abaixo. Se existir lá mas a Vercel não acha, defina SUPABASE_URL igual ao do app na Vercel e faça redeploy.',
    },
    projeto_errado: {
      descricao: 'Vercel provavelmente aponta para outro projeto Supabase.',
      solucao:
        'Vercel → Settings → Environment Variables: defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY do MESMO projeto do app (ex: qnujboesewzikwypidja.supabase.co). Redeploy após alterar.',
    },
    is_public_false: {
      descricao: 'O registro existe mas is_public = false. O código ignora para links públicos.',
      solucao: `No Supabase SQL Editor: UPDATE relatorios SET is_public = true WHERE share_token = '<seu_token>';`,
    },
    rota_nextjs: {
      descricao: 'A rota /r/[token] pode não estar sendo servida corretamente.',
      solucao: 'Teste /r/TOKEN?debug=1 — se mostrar "Token (roteamento OK)", a rota está OK. Confira Root Directory na Vercel (deve ser ./ ou o diretório do Next).',
    },
    query_falhou: {
      descricao: 'A query ao Supabase retornou erro.',
      solucao: opts.error
        ? `Corrija o erro: ${opts.error}. Confira políticas RLS e se a tabela relatorios existe.`
        : 'Verifique logs na Vercel e no Supabase.',
    },
    config_faltando: {
      descricao: 'Variáveis de ambiente não configuradas na Vercel.',
      solucao:
        'Vercel → Settings → Environment Variables: adicione SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. Faça redeploy.',
    },
  };

  const { descricao, solucao } = map[causa];
  return { causa_probavel: causa, descricao, solucao, checks };
}

/**
 * GET /api/relatorio-public?token=UUID
 * Diagnóstico: tenta buscar o relatório por share_token e detecta a causa do 404.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token || token.length < 10) {
    return NextResponse.json(
      { ok: false, error: 'Passe ?token=UUID do link (ex: /r/9283926a-31c1-4bb4-9d46-43e740492ba2)' },
      { status: 400 }
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

  // Extrair project ref para conferência (ex: qnujboesewzikwypidja)
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.URL_SUPABASE || '';
  const projectRef = supabaseUrl.includes('supabase.co') ? supabaseUrl.replace(/https?:\/\/([^.]+)\.supabase\.co.*/, '$1') : '(não configurado)';

  let source: 'admin' | 'anon' | null = null;
  let row: { id?: string; share_token?: string; titulo?: string; is_public?: boolean } | null = null;
  let errorMsg: string | null = null;

  const supabaseAdmin = getSupabaseAdmin();
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('relatorios')
      .select('id, share_token, titulo, is_public, created_at')
      .eq('share_token', token)
      .maybeSingle();

    console.log('[fortsmart-reports] /api/relatorio-public:', {
      token: token.slice(0, 8) + '…',
      error: error?.message ?? null,
      hasData: !!data,
      is_public: data?.is_public,
    });

    if (error) {
      errorMsg = error.message;
    } else if (data) {
      source = 'admin';
      row = data as any;
    }
  }

  if (!row && !errorMsg) {
    const fromAnon = await getRelatorioByShareToken(token);
    if (fromAnon) {
      source = 'anon';
      row = { id: fromAnon.id, share_token: fromAnon.share_token || undefined, titulo: fromAnon.titulo || undefined, is_public: true };
    }
  }

  // Encontrou registro
  if (row) {
    const isPublic = row.is_public === true;
    if (!isPublic) {
      const diagnostico = buildDiagnostico('is_public_false', {
        hasConfig: configOk,
        tokenExiste: true,
        isPublic: false,
      });
      diagnostico.checks.supabase_project = projectRef;
      return NextResponse.json(
        {
          ok: false,
          found: false,
          error: 'Registro existe mas is_public = false',
          diagnostico,
          env: { hasSupabaseUrl, hasServiceKey, hasAnonKey, projectRef },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      found: true,
      source,
      relatorio: row,
      env: { hasSupabaseUrl, hasServiceKey, hasAnonKey, projectRef },
    });
  }

  // Não encontrou — determinar causa
  let causa: Causa404 = 'token_nao_encontrado';
  if (errorMsg) {
    causa = 'query_falhou';
  } else if (!configOk) {
    causa = 'config_faltando';
  } else if (configOk && !row) {
    // Pode ser token nunca inserido OU projeto Supabase diferente
    causa = 'token_nao_encontrado';
  }

  const diagnostico = buildDiagnostico(causa, {
    hasConfig: configOk,
    tokenExiste: row ? true : false,
    error: errorMsg || undefined,
  });
  diagnostico.checks.supabase_project = projectRef;

  const hint =
    causa === 'config_faltando'
      ? 'Adicione SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Vercel.'
      : causa === 'query_falhou'
        ? `Erro Supabase: ${errorMsg}`
        : 'Token não encontrado. Confira se Vercel usa o mesmo projeto Supabase do app.';

  return NextResponse.json(
    {
      ok: false,
      found: false,
      error: errorMsg || 'Nenhum registro com este share_token.',
      hint,
      diagnostico,
      env: { hasSupabaseUrl, hasServiceKey, hasAnonKey, projectRef },
    },
    { status: 404 }
  );
}
