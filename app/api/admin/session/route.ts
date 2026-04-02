import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd || pwd.length < 8) {
    return NextResponse.json(
      { error: 'ADMIN_PASSWORD não configurada no servidor' },
      { status: 503 },
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
  const store = await cookies();
  store.set('fs_admin', '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const store = await cookies();
  store.delete('fs_admin');
  return NextResponse.json({ ok: true });
}
