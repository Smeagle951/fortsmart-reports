'use client';

import { useState } from 'react';
import FortSmartLogo from '@/components/FortSmartLogo';

export type StatusGeral = 'Saudável' | 'Atenção' | 'Crítico';

interface HeaderSectionProps {
  cliente?: string;
  fazenda?: string;
  talhao?: string;
  cultura?: string;
  dataAvaliacao?: string;
  responsavel?: string;
  status?: StatusGeral;
  onExportPdf?: () => void;
  onCompartilhar?: () => void;
}

const statusConfig: Record<StatusGeral, { bg: string; text: string; label: string }> = {
  Saudável: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Saudável' },
  Atenção: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Atenção' },
  Crítico: { bg: 'bg-red-100', text: 'text-red-800', label: 'Crítico' },
};

export default function HeaderSection({
  cliente = '—',
  fazenda = '—',
  talhao = '—',
  cultura = '—',
  dataAvaliacao = '—',
  responsavel = '—',
  status = 'Saudável',
  onExportPdf,
  onCompartilhar,
}: HeaderSectionProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Relatório Agronômico - ${talhao}`,
        url: window.location.href,
        text: `Relatório ${talhao} - ${cultura}`,
      }).catch(() => onCompartilhar?.());
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCompartilhar?.();
    }
  };

  const sc = statusConfig[status] || statusConfig.Saudável;

  return (
    <header className="saas-header sticky top-0 z-40 border-b border-slate-200 bg-white/98 backdrop-blur-md shadow-sm print:static print:bg-white">
      <div className="h-0.5 bg-gradient-to-r from-emerald-600 to-emerald-500" aria-hidden />
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
              <FortSmartLogo size={32} className="shrink-0" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 tracking-tight truncate">FortSmart Agro</p>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Relatório Técnico de Visita</p>
            </div>
          </div>

          <div className="hidden md:flex flex-1 justify-center min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
              <span className="text-slate-500 font-medium">Fazenda</span>
              <span className="text-slate-800 font-semibold truncate max-w-[140px]" title={fazenda}>{fazenda}</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-medium">Talhão</span>
              <span className="text-slate-800 font-semibold truncate max-w-[120px]" title={talhao}>{talhao}</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-medium">Cultura</span>
              <span className="text-slate-800 font-semibold truncate max-w-[120px]" title={cultura}>{cultura}</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-medium">Data</span>
              <span className="text-slate-800 font-semibold">{dataAvaliacao}</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-medium">Técnico</span>
              <span className="text-slate-800 font-semibold truncate max-w-[100px]" title={responsavel}>{responsavel}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${sc.bg} ${sc.text}`}>
              {sc.label}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onExportPdf}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
                title="Exportar PDF"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
                title="Compartilhar"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Compartilhar'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
