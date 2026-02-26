'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { use } from 'react';

/** Decodifica slug (ex: "exemplo-max") para nome de exibição ("Exemplo Max"). */
function slugToNome(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Ficha técnica do produto.
 * Os dados vêm exclusivamente das aplicações do relatório de visita técnica
 * (módulo Prescrições Premium). Nada é fictício — tudo é preenchido a partir
 * da tela de visita técnica / prescrições.
 */
export default function ProdutoFichaPage({ params }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { slug } = use(params);
  const nome = slugToNome(slug);
  const data = searchParams.get('data') ?? '';
  const dose = searchParams.get('dose') ?? '';
  const classe = searchParams.get('classe') ?? '';
  const alvo = searchParams.get('alvo') ?? '';
  const talhao = searchParams.get('talhao') ?? '';
  const responsavel = searchParams.get('responsavel') ?? '';
  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Ficha técnica
          </p>
          <h1 className="text-2xl font-bold text-slate-800">{nome}</h1>
          <p className="mt-3 text-sm text-slate-600">
            Dados desta aplicação conforme <strong>relatório de visita técnica</strong> — 
            origem: módulo <strong>Prescrições Premium</strong> (aba Aplicações da visita). 
            Nenhum dado fictício.
          </p>

          {(data || dose || classe || alvo || talhao || responsavel) && (
            <div className="mt-6 overflow-hidden rounded-lg border border-slate-100">
              <table className="w-full text-sm">
                <tbody>
                  {data && (
                    <tr className="border-b border-slate-100">
                      <th className="w-40 py-3 pr-4 text-left font-medium text-slate-500">Data</th>
                      <td className="py-3 text-slate-800">{data}</td>
                    </tr>
                  )}
                  {dose && (
                    <tr className="border-b border-slate-100">
                      <th className="w-40 py-3 pr-4 text-left font-medium text-slate-500">Dose</th>
                      <td className="py-3 text-slate-800">{dose}</td>
                    </tr>
                  )}
                  {classe && (
                    <tr className="border-b border-slate-100">
                      <th className="w-40 py-3 pr-4 text-left font-medium text-slate-500">Classe</th>
                      <td className="py-3">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {classe}
                        </span>
                      </td>
                    </tr>
                  )}
                  {alvo && (
                    <tr className="border-b border-slate-100">
                      <th className="w-40 py-3 pr-4 text-left font-medium text-slate-500">Alvo</th>
                      <td className="py-3 text-slate-800">{alvo}</td>
                    </tr>
                  )}
                  {talhao && (
                    <tr className="border-b border-slate-100">
                      <th className="w-40 py-3 pr-4 text-left font-medium text-slate-500">Talhão</th>
                      <td className="py-3 text-slate-800">{talhao}</td>
                    </tr>
                  )}
                  {responsavel && (
                    <tr className="border-b border-slate-100">
                      <th className="w-40 py-3 pr-4 text-left font-medium text-slate-500">Responsável</th>
                      <td className="py-3 text-slate-800">{responsavel}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-emerald-600 hover:underline"
            >
              ← Voltar ao relatório
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
