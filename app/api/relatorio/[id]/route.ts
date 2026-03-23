import { NextRequest, NextResponse } from 'next/server';
import { getRelatorioByIdForOwner } from '../../../../lib/supabase';

/**
 * GET /api/relatorio/[id]
 * Legado / integração: não faz parte do fluxo público dos relatórios web (/r/[token]),
 * que funciona sem login (Supabase service_role ou anon + is_public), como os outros modelos.
 *
 * Esta rota filtra por owner_firebase_uid usando header/cookie — o valor não é provado aqui;
 * não usar como substituto de autenticação forte na internet aberta.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
  }

  const uid =
    request.headers.get('X-Firebase-UID') ||
    request.cookies.get('firebase_uid')?.value;

  if (!uid) {
    return NextResponse.json(
      { error: 'Acesso restrito. Identifique-se (Firebase UID).' },
      { status: 401 }
    );
  }

  const row = await getRelatorioByIdForOwner(id, uid);
  if (!row) {
    return NextResponse.json(
      { error: 'Relatório não encontrado ou você não tem permissão.' },
      { status: 404 }
    );
  }

  return NextResponse.json(row);
}
