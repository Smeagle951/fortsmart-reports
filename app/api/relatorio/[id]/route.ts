import { NextRequest, NextResponse } from 'next/server';
import { getRelatorioByIdForOwner } from '@/lib/supabase';

/**
 * GET /api/relatorio/[id]
 * Relatório privado: só retorna se owner_firebase_uid corresponder ao dono.
 * O app deve enviar o Firebase UID em cookie (firebase_uid) ou header (X-Firebase-UID).
 * Nunca confie em device_id ou app_id para autorização — apenas owner_firebase_uid.
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
