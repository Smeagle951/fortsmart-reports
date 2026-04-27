'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp?.get('next') || '/admin';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr((j as { error?: string }).error ?? 'Falha no login');
        return;
      }
      router.replace(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border border-slate-700 bg-slate-900 p-8 shadow-xl"
      >
        <h1 className="text-xl font-semibold tracking-tight">FortSmart — Admin dataset</h1>
        <p className="text-sm text-slate-400">Acesso restrito. Sem utilizadores finais.</p>
        <label className="block text-sm">
          <span className="text-slate-400">Palavra-passe</span>
          <input
            type="password"
            autoComplete="current-password"
            className="mt-1 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {err ? <p className="text-sm text-red-400">{err}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-emerald-600 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? 'A entrar…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">…</div>}>
      <LoginForm />
    </Suspense>
  );
}
