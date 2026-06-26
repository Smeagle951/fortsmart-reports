import { NextResponse } from 'next/server';

/**
 * GET /api/health — resposta mínima (sem vazar stack, R2 ou nomes internos).
 */
export async function GET() {
  return NextResponse.json({ ok: true });
}
