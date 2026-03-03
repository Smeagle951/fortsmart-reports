'use client';

import React from 'react';
import { formatDate } from '@/utils/format';
import FortSmartLogo from '@/components/FortSmartLogo';

type Meta = {
  id?: string;
  dataGeracao?: string;
  safra?: string;
  tecnico?: string;
  tecnicoCrea?: string;
  versao?: number;
  status?: string;
};

type Propriedade = {
  fazenda?: string;
  proprietario?: string;
  municipio?: string;
  estado?: string;
};

type Talhao = {
  nome?: string;
  cultura?: string;
};

type ContextoSafra = {
  materialVariedade?: string;
  empresa?: string;
};

interface HeaderInstitucionalVisitaTecnicaProps {
  meta: Meta;
  propriedade: Propriedade;
  talhao: Talhao;
  contextoSafra?: ContextoSafra;
  reportId?: string;
}

/** Cabeçalho institucional para Relatório Técnico de Visita — layout claro e hierarquia visual */
export default function HeaderInstitucionalVisitaTecnica({
  meta,
  propriedade,
  talhao,
  contextoSafra = {},
  reportId,
}: HeaderInstitucionalVisitaTecnicaProps) {
  const cliente = propriedade.proprietario;
  const culturaHibrido = [talhao.cultura, contextoSafra.materialVariedade].filter(Boolean).join(' / ');
  const status = meta.status || 'Final';
  const dataFormatada = formatDate(meta.dataGeracao) || '—';

  return (
    <header className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden print:shadow-none">
      {/* Faixa verde de identidade */}
      <div className="h-1 bg-gradient-to-r from-emerald-700 to-emerald-500" />
      <div className="p-5 sm:p-6">
        {/* Linha 1: Logo + Título */}
        <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
            <FortSmartLogo size={44} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">FortSmart Agro</h1>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Relatório Técnico de Visita</p>
          </div>
        </div>

        {/* Linha 2: Dados em grid legível */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-4 mt-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Consultor</p>
            <p className="text-sm font-medium text-slate-800 mt-0.5">
              {meta.tecnico || '—'}
              {meta.tecnicoCrea ? <span className="text-slate-500 font-normal"> · CREA {meta.tecnicoCrea}</span> : ''}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Cliente</p>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{cliente || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Fazenda</p>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{propriedade.fazenda || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Talhão</p>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{talhao.nome || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Safra</p>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{meta.safra || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Cultura / Híbrido</p>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{culturaHibrido || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Data da visita</p>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{dataFormatada}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Código do relatório</p>
            <p className="text-sm font-medium text-slate-800 mt-0.5 font-mono">{meta.id || reportId || '—'}</p>
          </div>
          {meta.versao != null && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Versão</p>
              <p className="text-sm font-medium text-slate-800 mt-0.5">{meta.versao}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Status</p>
            <p className="mt-0.5">
              <span className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800">
                {status}
              </span>
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
