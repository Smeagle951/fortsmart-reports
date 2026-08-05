import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SEC,
  createAdminSessionToken,
} from '@/lib/security/admin-session';

/** Rate limit simples em memória (por instância serverless). */
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;

function clientKey(request: Request): string {
  const xf = request.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0]?.trim() || 'unknown';
  return request.headers.get('x-real-ip') || 'unknown';
}

function allowLoginAttempt(key: string): boolean {
  const now = Date.now();
  const row = loginAttempts.get(key);
  if (!row || row.resetAt < now) {
    loginAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (row.count >= MAX_ATTEMPTS) return false;
  row.count += 1;
  return true;
}

export async function POST(request: Request) {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd || pwd.length < 8) {
    return NextResponse.json(
      { error: 'ADMIN_PASSWORD não configurada no servidor' },
      { status: 503 },
    );
  }

  const key = clientKey(request);
  if (!allowLoginAttempt(key)) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde alguns minutos.' },
      { status: 429 },
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }
  if (body.password !== pwd) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
  }

  let token: string;
  try {
    token = createAdminSessionToken();
  } catch {
    return NextResponse.json(
      { error: 'Não foi possível criar sessão admin' },
      { status: 503 },
    );
  }

  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE_SEC,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const store = await cookies();
  store.delete(ADMIN_SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
