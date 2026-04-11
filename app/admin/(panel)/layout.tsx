import Link from 'next/link';
import { LogoutButton } from './LogoutButton';

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <Link href="/admin" className="font-semibold text-emerald-400">
            AgroIntelige Admin
          </Link>
          <nav className="flex flex-wrap gap-3 text-sm text-slate-400">
            <Link href="/admin" className="hover:text-slate-200">
              Dashboard
            </Link>
            <Link href="/admin/explorer" className="hover:text-slate-200">
              Explorador
            </Link>
            <Link href="/admin/map" className="hover:text-slate-200">
              Mapa / regiões
            </Link>
            <Link href="/admin/learning" className="hover:text-slate-200">
              Aprendizado
            </Link>
          </nav>
          <div className="ml-auto">
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
