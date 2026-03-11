'use client';

import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { formatDate, formatNumber, formatPercent, situacaoLabel } from '@/utils/format';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import FortSmartLogo from '@/components/FortSmartLogo';

type SideData = NonNullable<SideBySideReportData['sideA']>;

interface RelatorioLadoALadoDashboardProps {
  data: SideBySideReportData;
  reportId?: string;
}

export default function RelatorioLadoALadoDashboard({ data, reportId }: RelatorioLadoALadoDashboardProps) {
  const meta = data.meta || {};
  const farm = data.farm || {};
  const coleta = data.coleta;
  const sideA = data.sideA || ({} as SideData);
  const sideB = data.sideB || ({} as SideData);
  const conclusion = data.conclusion || {};
  const kpisA = sideA.kpis || {};
  const kpisB = sideB.kpis || {};
  const phenology = data.phenology;
  const diagnostics = data.diagnostics;
  const diagnosis = data.diagnosis;
  const ocorrencias = data.ocorrencias || [];
  const aplicacoes = data.aplicacoes || [];
  const points = data.points || [];
  const photosA = sideA.photos || [];
  const photosB = sideB.photos || [];
  const resumo = data.resumo;

  const hasCategoryInPhotos = [...photosA, ...photosB].some((p) => p?.category);
  const categoryOrder = ['estande', 'raiz', 'sanidade', 'geral'] as const;
  const categoryLabels: Record<string, string> = { estande: 'Estande', raiz: 'Raiz', sanidade: 'Sanidade', geral: 'Geral' };
  const photosByCategory = hasCategoryInPhotos
    ? categoryOrder.map((cat) => ({
        category: cat,
        label: categoryLabels[cat] || cat,
        photosA: photosA.filter((p) => (p?.category || 'geral') === cat),
        photosB: photosB.filter((p) => (p?.category || 'geral') === cat),
      })).filter((g) => g.photosA.length > 0 || g.photosB.length > 0)
    : [];
  const sideAName = sideA.name || 'Lado A';
  const sideBName = sideB.name || 'Lado B';

  // Resumo executivo: diferenças
  const popA = kpisA.finalPopulationPlHa ?? 0;
  const popB = kpisB.finalPopulationPlHa ?? 0;
  const yieldA = kpisA.estimatedYieldKgHa ?? 0;
  const yieldB = kpisB.estimatedYieldKgHa ?? 0;
  const diffYield = yieldA > 0 ? ((yieldB - yieldA) / yieldA) * 100 : null;
  const alerts = [
    ...(diagnostics?.recommendations || []),
    ...(resumo?.conclusaoCurta ? [resumo.conclusaoCurta] : []),
  ].filter(Boolean);
  const recommendations = [
    ...(conclusion.recommendations || []),
    ...(diagnostics?.recommendations || []),
  ].filter(Boolean);
  const uniqueRecs = Array.from(new Set(recommendations)).slice(0, 8);

  // Radar: vigor, uniformidade, raiz, altura, estande, sanidade (valores 0–100 ou normalizados)
  const vigorNum = (v: string | undefined) => (v === 'Alto' || v === 'alto' ? 100 : v === 'Médio' || v === 'medio' ? 60 : v ? 30 : 0);
  const radarData = [
    { subject: 'Vigor', A: vigorNum(phenology?.sideA?.vigor) || (kpisA.vigorRating?.score ?? 0) * 25, B: vigorNum(phenology?.sideB?.vigor) || (kpisB.vigorRating?.score ?? 0) * 25, fullMark: 100 },
    { subject: 'Uniformidade', A: vigorNum(phenology?.sideA?.uniformidade), B: vigorNum(phenology?.sideB?.uniformidade), fullMark: 100 },
    { subject: 'Raiz', A: (kpisA.rootRating?.score ?? 0) * 20, B: (kpisB.rootRating?.score ?? 0) * 20, fullMark: 100 },
    { subject: 'Altura', A: Math.min(100, (kpisA.avgHeightCm ?? 0) * 2), B: Math.min(100, (kpisB.avgHeightCm ?? 0) * 2), fullMark: 100 },
    { subject: 'Estande', A: kpisA.eficienciaPct ?? 0, B: kpisB.eficienciaPct ?? 0, fullMark: 100 },
    { subject: 'Sanidade', A: (kpisA.rootRating?.score ?? 0) * 20, B: (kpisB.rootRating?.score ?? 0) * 20, fullMark: 100 },
  ].filter((r) => r.A > 0 || r.B > 0);

  const barKpis = [
    { name: 'Altura (cm)', a: kpisA.avgHeightCm ?? 0, b: kpisB.avgHeightCm ?? 0 },
    { name: 'Pop. (pl/ha)', a: kpisA.finalPopulationPlHa ?? 0, b: kpisB.finalPopulationPlHa ?? 0 },
    { name: 'Estande ef.', a: kpisA.estandeEfetivo ?? 0, b: kpisB.estandeEfetivo ?? 0 },
    { name: 'Eficiência %', a: kpisA.eficienciaPct ?? 0, b: kpisB.eficienciaPct ?? 0 },
    { name: 'Raiz (cm)', a: kpisA.profundidadeRaizCm ?? 0, b: kpisB.profundidadeRaizCm ?? 0 },
    { name: 'Peso raiz (g)', a: kpisA.pesoRaizG ?? 0, b: kpisB.pesoRaizG ?? 0 },
    { name: 'Prod. est. (kg/ha)', a: kpisA.estimatedYieldKgHa ?? 0, b: kpisB.estimatedYieldKgHa ?? 0 },
  ].filter((r) => r.a > 0 || r.b > 0);

  const ocorrenciasChart = ocorrencias.map((o, i) => ({
    name: (o.nomeAlvo || `Ocorrência ${i + 1}`).slice(0, 12),
    incidencia: o.incidenciaPct ?? 0,
  }));

  const handlePrint = () => window.print();
  const handleExportPdf = () => {
    try {
      const html2pdf = require('html2pdf.js');
      const el = document.getElementById('relatorio-lado-a-lado-content');
      if (el) html2pdf().set({ margin: 10, filename: `relatorio-lado-a-lado-${meta.reportId || 'report'}.pdf` }).from(el).save();
    } catch {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-800 print:bg-white">
      {/* Ações: imprimir / PDF — escondidas na impressão */}
      <div className="sticky top-0 z-10 flex justify-end gap-2 px-4 py-2 bg-slate-100/90 border-b border-slate-200 print:hidden">
        <button type="button" onClick={handlePrint} className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
          Imprimir
        </button>
        <button type="button" onClick={handleExportPdf} className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
          Exportar PDF
        </button>
      </div>
      <div id="relatorio-lado-a-lado-content">
      {/* 1. Header do relatório — dashboard horizontal */}
      <header className="bg-white border-b border-slate-200 shadow-sm print:shadow-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <FortSmartLogo size={48} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  FortSmart Agronomic Intelligence Report
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">Avaliação Agronômica Lado a Lado</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              {farm.culture && <span><strong>Cultura:</strong> {farm.culture}</span>}
              {farm.farmName && <span><strong>Fazenda:</strong> {farm.farmName}</span>}
              {farm.fieldName && <span><strong>Talhão:</strong> {farm.fieldName}</span>}
              {farm.city && <span><strong>Local:</strong> {farm.city}{farm.state ? ` / ${farm.state}` : ''}</span>}
              {farm.season && <span><strong>Safra:</strong> {farm.season}</span>}
              {farm.empresa && <span><strong>Empresa:</strong> {farm.empresa}</span>}
              {coleta?.ensaioName && <span><strong>Ensaio:</strong> {coleta.ensaioName}</span>}
            </div>
          </div>
          {coleta && (
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-sm">
              {coleta.dataPlantio && <div><span className="text-slate-500">Data plantio:</span> {formatDate(coleta.dataPlantio)}</div>}
              {coleta.dae != null && <div><span className="text-slate-500">DAE:</span> {coleta.dae} dias</div>}
              {coleta.dap != null && <div><span className="text-slate-500">DAP:</span> {coleta.dap} dias</div>}
              {coleta.espacamento != null && <div><span className="text-slate-500">Espaçamento:</span> {formatNumber(coleta.espacamento, { decimals: 1 })} cm</div>}
              {coleta.populacaoAlvo != null && <div><span className="text-slate-500">Pop. alvo:</span> {formatNumber(coleta.populacaoAlvo, { decimals: 0 })} pl/ha</div>}
              {coleta.pointCount != null && <div><span className="text-slate-500">Pontos:</span> {coleta.pointCount}</div>}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* 2. Resumo Executivo — 3 cards */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Resumo Executivo</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">Resultado do Ensaio</h3>
              <p className="text-slate-700 text-sm">
                {diffYield != null && Math.abs(diffYield) >= 1
                  ? diffYield > 0
                    ? `${sideBName} com produtividade estimada ${diffYield.toFixed(1)}% superior.`
                    : `${sideAName} com produtividade estimada ${(-diffYield).toFixed(1)}% superior.`
                  : 'Tratamentos com desempenho similar.'}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                População: {formatNumber(popA, { decimals: 0 })} vs {formatNumber(popB, { decimals: 0 })} pl/ha
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">Problemas Detectados</h3>
              <ul className="text-sm text-slate-700 space-y-1">
                {alerts.length ? alerts.slice(0, 3).map((a, i) => <li key={i}>• {a}</li>) : <li className="text-slate-400">Nenhum alerta principal</li>}
                {ocorrencias.length > 0 && <li>• {ocorrencias.length} ocorrência(s) fitossanitária(s)</li>}
              </ul>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">Recomendações Técnicas</h3>
              <ul className="text-sm text-slate-700 space-y-1">
                {uniqueRecs.slice(0, 4).map((r, i) => <li key={i}>• {r}</li>)}
                {uniqueRecs.length === 0 && <li className="text-slate-400">Nenhuma recomendação registrada</li>}
              </ul>
            </div>
          </div>
        </section>

        {/* 3. Painel de Indicadores Agronômicos — cards A vs B com barra */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Indicadores Agronômicos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Altura média (cm)', a: kpisA.avgHeightCm, b: kpisB.avgHeightCm },
              { label: 'População final (pl/ha)', a: kpisA.finalPopulationPlHa, b: kpisB.finalPopulationPlHa },
              { label: 'Estande efetivo', a: kpisA.estandeEfetivo, b: kpisB.estandeEfetivo },
              { label: 'Eficiência (%)', a: kpisA.eficienciaPct, b: kpisB.eficienciaPct },
              { label: 'Profundidade raiz (cm)', a: kpisA.profundidadeRaizCm, b: kpisB.profundidadeRaizCm },
              { label: 'Peso raiz (g)', a: kpisA.pesoRaizG, b: kpisB.pesoRaizG },
              { label: 'Vigor', a: phenology?.sideA?.vigor || kpisA.vigorRating?.label, b: phenology?.sideB?.vigor || kpisB.vigorRating?.label, isText: true },
              { label: 'Produtividade est. (kg/ha)', a: kpisA.estimatedYieldKgHa, b: kpisB.estimatedYieldKgHa },
            ].filter((r) => r.a != null || r.b != null).map((item, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <p className="text-xs font-medium text-slate-500 mb-2">{item.label}</p>
                {item.isText ? (
                  <div className="flex justify-between text-sm">
                    <span>{String(item.a || '—')}</span>
                    <span>{String(item.b || '—')}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-sm font-medium mb-1">
                      <span className="text-emerald-700">{item.a != null ? formatNumber(item.a, { decimals: 1 }) : '—'}</span>
                      <span className="text-blue-700">{item.b != null ? formatNumber(item.b, { decimals: 1 }) : '—'}</span>
                    </div>
                    <div className="flex gap-1 h-2 rounded overflow-hidden bg-slate-100">
                      <div
                        className="bg-emerald-500 h-full rounded-l"
                        style={{
                          width:
                            item.a != null && item.b != null
                              ? (() => {
                                  const numA = Number(item.a);
                                  const numB = Number(item.b);
                                  return numA + numB > 0 ? `${(numA / (numA + numB)) * 100}%` : '50%';
                                })()
                              : '50%',
                        }}
                      />
                      <div className="bg-blue-500 h-full rounded-r flex-1" />
                    </div>
                    {typeof item.a === 'number' && typeof item.b === 'number' && item.a > 0 && (
                      <p className="text-xs text-slate-400 mt-1">
                        Δ {((item.b - item.a) / item.a * 100).toFixed(1)}%
                      </p>
                    )}
                  </>
                )}
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>{sideAName}</span>
                  <span>{sideBName}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Gráfico Radar Agronômico */}
        {radarData.length > 0 && (
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm overflow-hidden">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Radar Agronômico</h2>
            <div className="h-64 min-h-[240px] sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name={sideAName} dataKey="A" stroke="#1B5E20" fill="#1B5E20" fillOpacity={0.3} strokeWidth={2} />
                  <Radar name={sideBName} dataKey="B" stroke="#1565C0" fill="#1565C0" fillOpacity={0.3} strokeWidth={2} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* 5. Distribuição de Plantio — simplificado (espaçamento / população) */}
        {(coleta?.espacamento != null || coleta?.populacaoAlvo != null || kpisA.finalPopulationPlHa != null || kpisB.finalPopulationPlHa != null) && (
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Contexto de Plantio</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {coleta?.espacamento != null && (
                <div>
                  <p className="text-2xl font-bold text-slate-900">{formatNumber(coleta.espacamento, { decimals: 1 })} cm</p>
                  <p className="text-xs text-slate-500">Espaçamento</p>
                </div>
              )}
              {coleta?.populacaoAlvo != null && (
                <div>
                  <p className="text-2xl font-bold text-slate-900">{formatNumber(coleta.populacaoAlvo, { decimals: 0 })}</p>
                  <p className="text-xs text-slate-500">Pop. alvo (pl/ha)</p>
                </div>
              )}
              {kpisA.finalPopulationPlHa != null && (
                <div>
                  <p className="text-2xl font-bold text-emerald-700">{formatNumber(kpisA.finalPopulationPlHa, { decimals: 0 })}</p>
                  <p className="text-xs text-slate-500">{sideAName} (pl/ha)</p>
                </div>
              )}
              {kpisB.finalPopulationPlHa != null && (
                <div>
                  <p className="text-2xl font-bold text-blue-700">{formatNumber(kpisB.finalPopulationPlHa, { decimals: 0 })}</p>
                  <p className="text-xs text-slate-500">{sideBName} (pl/ha)</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 6. Pontos de Avaliação */}
        {points.length > 0 && (
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Pontos de Avaliação</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 font-medium text-slate-600">Ponto</th>
                    <th className="text-left py-2 font-medium text-slate-600">Nome</th>
                    <th className="text-left py-2 font-medium text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((p, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2">{p.indexNo ?? i + 1}</td>
                      <td className="py-2">{p.name || '—'}</td>
                      <td className="py-2">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          (p.status || '').toLowerCase() === 'ok' ? 'bg-emerald-100 text-emerald-800' :
                          (p.status || '').toLowerCase() === 'monitorar' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {situacaoLabel(p.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 7. Fenologia da Cultura */}
        {phenology && (phenology.sideA || phenology.sideB) && (
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Fenologia da Cultura</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {phenology.sideA && (
                <div className="border border-emerald-100 rounded-lg p-4 bg-emerald-50/50">
                  <p className="font-medium text-emerald-800 mb-2">{sideAName}</p>
                  <ul className="text-sm space-y-1">
                    {phenology.sideA.estadio && <li><span className="text-slate-500">Estádio:</span> {phenology.sideA.estadio}</li>}
                    {phenology.sideA.vigor && <li><span className="text-slate-500">Vigor:</span> {phenology.sideA.vigor}</li>}
                    {phenology.sideA.uniformidade && <li><span className="text-slate-500">Uniformidade:</span> {phenology.sideA.uniformidade}</li>}
                    {phenology.sideA.observacao && <li><span className="text-slate-500">Obs.:</span> {phenology.sideA.observacao}</li>}
                  </ul>
                </div>
              )}
              {phenology.sideB && (
                <div className="border border-blue-100 rounded-lg p-4 bg-blue-50/50">
                  <p className="font-medium text-blue-800 mb-2">{sideBName}</p>
                  <ul className="text-sm space-y-1">
                    {phenology.sideB.estadio && <li><span className="text-slate-500">Estádio:</span> {phenology.sideB.estadio}</li>}
                    {phenology.sideB.vigor && <li><span className="text-slate-500">Vigor:</span> {phenology.sideB.vigor}</li>}
                    {phenology.sideB.uniformidade && <li><span className="text-slate-500">Uniformidade:</span> {phenology.sideB.uniformidade}</li>}
                    {phenology.sideB.observacao && <li><span className="text-slate-500">Obs.:</span> {phenology.sideB.observacao}</li>}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 8. Sistema Radicular — barras comparativas */}
        {(kpisA.profundidadeRaizCm != null || kpisB.profundidadeRaizCm != null || kpisA.pesoRaizG != null || kpisB.pesoRaizG != null || kpisA.rootRating || kpisB.rootRating) && (
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Sistema Radicular</h2>
            {barKpis.filter((r) => r.name.includes('Raiz') || r.name.includes('Peso')).length > 0 ? (
              <div className="h-56 min-h-[200px] sm:h-64 w-full overflow-x-auto">
                <ResponsiveContainer width="100%" height="100%" minWidth={280}>
                  <BarChart data={barKpis.filter((r) => r.name.includes('Raiz') || r.name.includes('Peso'))} layout="vertical" margin={{ left: 80 }}>
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="a" name={sideAName} fill="#1B5E20" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="b" name={sideBName} fill="#1565C0" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-4 mt-4">
              {kpisA.rootRating && (
                <div><span className="text-slate-500 text-sm">Sanidade raiz {sideAName}:</span> {kpisA.rootRating.label} ({kpisA.rootRating.score}/{kpisA.rootRating.max})</div>
              )}
              {kpisB.rootRating && (
                <div><span className="text-slate-500 text-sm">Sanidade raiz {sideBName}:</span> {kpisB.rootRating.label} ({kpisB.rootRating.score}/{kpisB.rootRating.max})</div>
              )}
            </div>
          </section>
        )}

        {/* 9. Ocorrências Fitossanitárias */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Ocorrências Fitossanitárias</h2>
          {ocorrencias.length > 0 ? (
            <>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 font-medium text-slate-600">Tipo</th>
                      <th className="text-left py-2 font-medium text-slate-600">Nome / Alvo</th>
                      <th className="text-left py-2 font-medium text-slate-600">Incidência</th>
                      <th className="text-left py-2 font-medium text-slate-600">Severidade</th>
                      <th className="text-left py-2 font-medium text-slate-600">Recomendação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ocorrencias.map((o, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-2">{o.tipo || '—'}</td>
                        <td className="py-2">{o.nomeAlvo || '—'}</td>
                        <td className="py-2">{o.incidenciaPct != null ? formatPercent(o.incidenciaPct) : '—'}</td>
                        <td className="py-2">{o.severidade || '—'}</td>
                        <td className="py-2 text-slate-600">{o.recomendacao || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {ocorrenciasChart.length > 0 && (
                <div className="h-44 min-h-[160px] sm:h-48 w-full overflow-x-auto">
                  <ResponsiveContainer width="100%" height="100%" minWidth={260}>
                    <BarChart data={ocorrenciasChart} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="incidencia" name="Incidência %" fill="#E65100" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : (
            <p className="text-slate-500 text-sm">Nenhuma ocorrência registrada.</p>
          )}
        </section>

        {/* 10. Histórico de Aplicações — timeline */}
        {aplicacoes.length > 0 && (
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Histórico de Aplicações</h2>
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
        )}

        {/* 11. Evidências Fotográficas — por categoria (Estande, Raiz, Sanidade, Geral) ou por lado */}
        {(photosA.length > 0 || photosB.length > 0) && (
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm overflow-hidden">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Evidências Fotográficas</h2>
            {photosByCategory.length > 0 ? (
              <div className="space-y-6">
                {photosByCategory.map((group) => (
                  <div key={group.category}>
                    <h3 className="text-sm font-medium text-slate-600 mb-3">{group.label}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs font-medium text-emerald-700 mb-2">{sideAName}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {group.photosA.map((ph, i) => (
                            <figure key={i} className="rounded-lg overflow-hidden border border-slate-200">
                              {ph.url ? <img src={ph.url} alt={ph.caption || 'Evidência'} className="w-full h-28 sm:h-32 object-cover" /> : <div className="w-full h-28 sm:h-32 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">Sem imagem</div>}
                              {ph.caption && <figcaption className="p-1.5 text-xs text-slate-600 truncate">{ph.caption}</figcaption>}
                            </figure>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-blue-700 mb-2">{sideBName}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {group.photosB.map((ph, i) => (
                            <figure key={i} className="rounded-lg overflow-hidden border border-slate-200">
                              {ph.url ? <img src={ph.url} alt={ph.caption || 'Evidência'} className="w-full h-28 sm:h-32 object-cover" /> : <div className="w-full h-28 sm:h-32 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">Sem imagem</div>}
                              {ph.caption && <figcaption className="p-1.5 text-xs text-slate-600 truncate">{ph.caption}</figcaption>}
                            </figure>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="font-medium text-emerald-800 mb-3">{sideAName}</p>
                  <div className="grid grid-cols-2 gap-2 overflow-x-auto">
                    {photosA.map((ph, i) => (
                      <figure key={i} className="rounded-lg overflow-hidden border border-slate-200 min-w-[120px]">
                        {ph.url ? <img src={ph.url} alt={ph.caption || 'Evidência'} className="w-full h-28 sm:h-32 object-cover" /> : <div className="w-full h-28 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">Sem imagem</div>}
                        {ph.caption && <figcaption className="p-2 text-xs text-slate-600 truncate">{ph.caption}</figcaption>}
                      </figure>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-medium text-blue-800 mb-3">{sideBName}</p>
                  <div className="grid grid-cols-2 gap-2 overflow-x-auto">
                    {photosB.map((ph, i) => (
                      <figure key={i} className="rounded-lg overflow-hidden border border-slate-200 min-w-[120px]">
                        {ph.url ? <img src={ph.url} alt={ph.caption || 'Evidência'} className="w-full h-28 sm:h-32 object-cover" /> : <div className="w-full h-28 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">Sem imagem</div>}
                        {ph.caption && <figcaption className="p-2 text-xs text-slate-600 truncate">{ph.caption}</figcaption>}
                      </figure>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* 12. Diagnóstico Agronômico — bloco completo (problema, causas, urgência, plano) ou resumo */}
        {(diagnosis?.problemaPrincipal || diagnosis?.causaProvavel || diagnosis?.urgencia || diagnosis?.planoAcao || diagnostics?.recommendations?.length || conclusion.summary || resumo?.conclusaoCurta) ? (
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Diagnóstico Agronômico</h2>
            <div className="space-y-3 text-sm">
              {diagnosis?.problemaPrincipal && <p className="text-slate-700"><strong>Problema principal:</strong> {diagnosis.problemaPrincipal}</p>}
              {diagnosis?.problemasSecundarios && diagnosis.problemasSecundarios.length > 0 && (
                <p className="text-slate-700"><strong>Problemas secundários:</strong> {diagnosis.problemasSecundarios.join('; ')}</p>
              )}
              {diagnosis?.causaProvavel && <p className="text-slate-700"><strong>Causa provável:</strong> {diagnosis.causaProvavel}</p>}
              {diagnosis?.urgencia && <p className="text-slate-700"><strong>Urgência:</strong> {diagnosis.urgencia}</p>}
              {diagnosis?.planoAcao && <p className="text-slate-700"><strong>Plano de ação:</strong> {diagnosis.planoAcao}</p>}
              {resumo?.conclusaoCurta && !diagnosis?.problemaPrincipal && <p className="text-slate-700"><strong>Conclusão:</strong> {resumo.conclusaoCurta}</p>}
              {conclusion.summary && <p className="text-slate-700">{conclusion.summary}</p>}
              {diagnostics?.recommendations && diagnostics.recommendations.length > 0 && (
                <ul className="list-disc list-inside text-slate-700 space-y-1">
                  {diagnostics.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              )}
            </div>
          </section>
        ) : null}

        {/* 13. Conclusão Técnica + Assinatura */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Conclusão Técnica</h2>
          {conclusion.summary && <p className="text-slate-700 mb-4">{conclusion.summary}</p>}
          {conclusion.recommendations && conclusion.recommendations.length > 0 && (
            <div className="mb-4">
              <p className="font-medium text-slate-700 mb-2">Recomendações</p>
              <ol className="list-decimal list-inside text-slate-700 space-y-1">
                {conclusion.recommendations.map((r, i) => <li key={i}>{r}</li>)}
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

        {/* 14. Rodapé */}
        <footer className="text-center text-sm text-slate-500 py-6 border-t border-slate-200">
          <p>Relatório gerado pelo FortSmart Agro</p>
          <p className="mt-1">
            {formatDate(meta.createdAt)} • {meta.appVersion || '—'} • ID: {meta.reportId || reportId || '—'}
          </p>
        </footer>
      </main>
      </div>
    </div>
  );
}
