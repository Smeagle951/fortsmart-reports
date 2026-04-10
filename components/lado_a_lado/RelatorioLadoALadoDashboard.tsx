'use client';

import React from 'react';
import { formatDate } from '@/utils/format';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { postReportAnalytics } from '@/lib/report-analytics-client';
import InteligenciaAgronomicaPanel from '@/components/InteligenciaAgronomicaPanel';
import PremiumComparativo from '@/components/lado_a_lado/premium/PremiumComparativo';
import PremiumInsight from '@/components/lado_a_lado/premium/PremiumInsight';
import PremiumEvolucao from '@/components/lado_a_lado/premium/PremiumEvolucao';
import PremiumTratamentoProtocolo from '@/components/lado_a_lado/premium/PremiumTratamentoProtocolo';
import PremiumAplicacoes from '@/components/lado_a_lado/premium/PremiumAplicacoes';
import PremiumFitossanidade from '@/components/lado_a_lado/premium/PremiumFitossanidade';
import PremiumEvidencias from '@/components/lado_a_lado/premium/PremiumEvidencias';
import PremiumDiagnosticoBlock from '@/components/lado_a_lado/premium/PremiumDiagnosticoBlock';
import PremiumColheitaCusto from '@/components/lado_a_lado/premium/PremiumColheitaCusto';
import PremiumProdutosEnsaio from '@/components/lado_a_lado/premium/PremiumProdutosEnsaio';
import PremiumResumoVenda from '@/components/lado_a_lado/premium/PremiumResumoVenda';
import PremiumDaaTimeline from '@/components/lado_a_lado/premium/PremiumDaaTimeline';
import PremiumResumoEnsaio from '@/components/lado_a_lado/premium/PremiumResumoEnsaio';
import PremiumLadoALadoLayout from '@/components/lado_a_lado/premium/PremiumLadoALadoLayout';
import LadoALadoLegacyAvaliacao from '@/components/lado_a_lado/LadoALadoLegacyAvaliacao';

type SideData = NonNullable<SideBySideReportData['sideA']>;

interface RelatorioLadoALadoDashboardProps {
  data: SideBySideReportData;
  reportId?: string;
  shareToken?: string;
}

export default function RelatorioLadoALadoDashboard({ data, reportId, shareToken }: RelatorioLadoALadoDashboardProps) {
  const meta = data.meta || {};
  const sideA = data.sideA || ({} as SideData);
  const sideB = data.sideB || ({} as SideData);
  const conclusion = data.conclusion || {};
  const aplicacoes = data.aplicacoes || [];
  const applicationsV2 = Array.isArray(data.applications) ? data.applications : [];
  const sideAName = sideA.name || 'Lado A';
  const sideBName = sideB.name || 'Lado B';

  const handlePrint = () => window.print();
  const handleExportPdf = async () => {
    const el = document.getElementById('relatorio-lado-a-lado-content');
    if (!el) {
      window.print();
      return;
    }
    try {
      const { default: html2pdf } = await import('html2pdf.js');
      await html2pdf()
        .set({
          margin: 10,
          filename: `relatorio-lado-a-lado-${meta.reportId || reportId || 'report'}.pdf`,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(el)
        .save();
      if (shareToken?.trim()) {
        void postReportAnalytics({
          shareToken: shareToken.trim(),
          eventType: 'download',
          module: 'avaliacao_lado_a_lado',
        });
      }
    } catch {
      window.print();
    }
  };

  const execucaoLegado =
    applicationsV2.length === 0 && aplicacoes.length > 0 ? (
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Histórico de aplicações (registro legado)</h2>
        <div className="space-y-3">
          {aplicacoes.map((a, i) => (
            <div key={i} className="flex gap-4 items-start border-l-2 border-slate-200 pl-4 py-2">
              <div className="text-sm font-medium text-slate-600 shrink-0">{formatDate(a.data)}</div>
              <div className="text-sm min-w-0">
                <span className="font-medium text-slate-800">{a.tipo || 'Aplicação'}</span>
                {a.classe && <span className="text-slate-500"> • {a.classe}</span>}
                {a.doseResumo && <span className="text-slate-600 ml-1"> • Dose: {a.doseResumo}</span>}
                <p className="text-slate-600 mt-0.5 break-words">{a.produtos || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    ) : null;

  const conclusaoBlock = (
    <>
      <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Conclusão técnica</h2>
        {conclusion.summary && <p className="text-slate-700 mb-4 leading-relaxed">{conclusion.summary}</p>}
        {conclusion.recommendations && conclusion.recommendations.length > 0 && (
          <div className="mb-4">
            <p className="font-medium text-slate-700 mb-2">Recomendações</p>
            <ol className="list-decimal list-inside text-slate-700 space-y-1">
              {conclusion.recommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ol>
          </div>
        )}
        {conclusion.signature && (conclusion.signature.name || conclusion.signature.crea || conclusion.signature.city) && (
          <div className="pt-4 border-t border-slate-200">
            <p className="font-semibold text-slate-900">{conclusion.signature.name}</p>
            {conclusion.signature.crea && <p className="text-sm text-slate-600">CREA: {conclusion.signature.crea}</p>}
            {conclusion.signature.city && <p className="text-sm text-slate-600">{conclusion.signature.city}</p>}
          </div>
        )}
      </section>
      <footer className="text-center text-sm text-slate-500 py-6 border-t border-slate-200">
        <p>Relatório gerado pelo FortSmart Agro</p>
        <p className="mt-1">
          {formatDate(meta.createdAt)} • {meta.appVersion || '—'} • ID: {meta.reportId || reportId || '—'}
        </p>
      </footer>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-800 print:bg-white">
      <div className="max-w-7xl mx-auto px-4 pt-3 print:hidden">
        <InteligenciaAgronomicaPanel
          relatorio={Object.assign({}, data as object, { tipo: 'avaliacao_lado_a_lado' }) as Record<string, unknown>}
          variant="default"
        />
      </div>
      <div id="relatorio-lado-a-lado-content">
        <PremiumLadoALadoLayout
          data={data}
          onExportPdf={handleExportPdf}
          onPrint={handlePrint}
          slots={{
            resumo: (
              <>
                <PremiumResumoEnsaio data={data} sideAName={sideAName} sideBName={sideBName} />
                <PremiumDaaTimeline data={data} />
                <PremiumComparativo data={data} sideAName={sideAName} sideBName={sideBName} />
              </>
            ),
            tratamento: <PremiumTratamentoProtocolo data={data} />,
            execucao: (
              <>
                <PremiumAplicacoes data={data} sideAName={sideAName} sideBName={sideBName} />
                {execucaoLegado}
              </>
            ),
            avaliacao: (
              <>
                <PremiumEvolucao data={data} sideAName={sideAName} sideBName={sideBName} />
                <PremiumFitossanidade data={data} />
                <PremiumEvidencias data={data} sideAName={sideAName} sideBName={sideBName} />
                <LadoALadoLegacyAvaliacao data={data} sideAName={sideAName} sideBName={sideBName} />
              </>
            ),
            economico: (
              <>
                <PremiumProdutosEnsaio data={data} />
                <PremiumColheitaCusto data={data} />
                <PremiumResumoVenda data={data} sideAName={sideAName} sideBName={sideBName} />
              </>
            ),
            conclusao: (
              <>
                <PremiumInsight data={data} sideAName={sideAName} sideBName={sideBName} />
                <PremiumDiagnosticoBlock data={data} />
                {conclusaoBlock}
              </>
            ),
          }}
        />
      </div>
    </div>
  );
}
