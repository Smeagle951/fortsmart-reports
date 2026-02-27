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
    <header className="saas-header sticky top-0 z-40 border-b border-slate-200 bg-white/97 backdrop-blur-sm shadow-sm print:static print:bg-white">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-4">
          {/* Left: brand */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[--plantio-card-bg] border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
              <FortSmartLogo size={40} className="shrink-0" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-700">FortSmart Agro</div>
              <div className="text-xs text-slate-500">Relatório Técnico — Visita</div>
            </div>
          </div>

          {/* Middle: meta */}
          <div className="hidden md:flex md:flex-1 md:justify-center">
            <div className="grid grid-cols-3 gap-x-8 text-sm text-slate-600">
              <div>
                <div className="text-xs text-slate-500">Fazenda</div>
                <div className="font-medium text-slate-800">{fazenda}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Talhão / Cultura</div>
                <div className="font-medium text-slate-800">{talhao} • {cultura}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Data / Técnico</div>
                <div className="font-medium text-slate-800">{dataAvaliacao} • {responsavel}</div>
              </div>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${sc.bg} ${sc.text}`}>
              {sc.label}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onExportPdf}
                className="saas-btn saas-btn-secondary inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium"
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
                className="saas-btn saas-btn-primary inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white"
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
