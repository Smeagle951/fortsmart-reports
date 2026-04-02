'use client';

export function LogoutButton() {
  return (
    <button
      type="button"
      className="text-sm text-slate-500 hover:text-slate-300"
      onClick={async () => {
        await fetch('/api/admin/session', { method: 'DELETE', credentials: 'include' });
        window.location.href = '/admin/login';
      }}
    >
      Sair
    </button>
  );
}
