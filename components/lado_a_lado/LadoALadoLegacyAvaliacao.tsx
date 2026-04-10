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
import { formatNumber, formatPercent, situacaoLabel } from '@/utils/format';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';

type SideData = NonNullable<SideBySideReportData['sideA']>;

type Props = {
  data: SideBySideReportData;
  sideAName: string;
  sideBName: string;
};

/** Blocos analíticos densos (gráficos + tabelas) — aba Avaliação. */
export default function LadoALadoLegacyAvaliacao({ data, sideAName, sideBName }: Props) {
  const coleta = data.coleta;
  const sideA = data.sideA || ({} as SideData);
  const sideB = data.sideB || ({} as SideData);
  const kpisA = sideA.kpis || {};
  const kpisB = sideB.kpis || {};
  const phenology = data.phenology;
  const points = data.points || [];
  const ocorrencias = data.ocorrencias || [];

  const vigorNum = (v: string | undefined) =>
    v === 'Alto' || v === 'alto' ? 100 : v === 'Médio' || v === 'medio' ? 60 : v ? 30 : 0;
  const radarData = [
    {
      subject: 'Vigor',
      A: vigorNum(phenology?.sideA?.vigor) || (kpisA.vigorRating?.score ?? 0) * 25,
      B: vigorNum(phenology?.sideB?.vigor) || (kpisB.vigorRating?.score ?? 0) * 25,
      fullMark: 100,
    },
    {
      subject: 'Uniformidade',
      A: vigorNum(phenology?.sideA?.uniformidade),
      B: vigorNum(phenology?.sideB?.uniformidade),
      fullMark: 100,
    },
    {
      subject: 'Raiz',
      A: (kpisA.rootRating?.score ?? 0) * 20,
      B: (kpisB.rootRating?.score ?? 0) * 20,
      fullMark: 100,
    },
    {
      subject: 'Altura',
      A: Math.min(100, (kpisA.avgHeightCm ?? 0) * 2),
      B: Math.min(100, (kpisB.avgHeightCm ?? 0) * 2),
      fullMark: 100,
    },
    {
      subject: 'Estande',
      A: kpisA.eficienciaPct ?? 0,
      B: kpisB.eficienciaPct ?? 0,
      fullMark: 100,
    },
    {
      subject: 'Sanidade',
      A: (kpisA.rootRating?.score ?? 0) * 20,
      B: (kpisB.rootRating?.score ?? 0) * 20,
      fullMark: 100,
    },
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

  return (
    <>
      {Array.isArray(data.criteriosEstatistica) && data.criteriosEstatistica.length > 0 && (
        <section className="bg-amber-50/90 border border-amber-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Critérios numéricos (entre pontos)</h2>
          <p className="text-xs text-slate-600 mb-4">
            Média, desvio padrão e CV% por lado; diferença indicativa não substitui delineamento experimental formal.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-amber-300/80 text-left text-slate-600">
                  <th className="py-2 pr-3">Critério</th>
                  <th className="py-2 pr-3">Média A</th>
                  <th className="py-2 pr-3">Média B</th>
                  <th className="py-2 pr-3">DP A</th>
                  <th className="py-2 pr-3">DP B</th>
                  <th className="py-2 pr-3">CV% A</th>
                  <th className="py-2 pr-3">CV% B</th>
                  <th className="py-2 pr-3">Destaque</th>
                </tr>
              </thead>
              <tbody>
                {data.criteriosEstatistica!.map((row, i) => (
                  <tr key={i} className="border-b border-amber-200/60">
                    <td className="py-2 pr-3 font-medium text-slate-800">
                      {row.criterio || '—'}
                      {row.unidade ? <span className="text-slate-500 font-normal"> ({row.unidade})</span> : null}
                    </td>
                    <td className="py-2 pr-3">{row.mediaA != null ? formatNumber(row.mediaA, { decimals: 2 }) : '—'}</td>
                    <td className="py-2 pr-3">{row.mediaB != null ? formatNumber(row.mediaB, { decimals: 2 }) : '—'}</td>
                    <td className="py-2 pr-3">{row.dpA != null ? formatNumber(row.dpA, { decimals: 2 }) : '—'}</td>
                    <td className="py-2 pr-3">{row.dpB != null ? formatNumber(row.dpB, { decimals: 2 }) : '—'}</td>
                    <td className="py-2 pr-3">{row.cvPctA != null ? `${row.cvPctA.toFixed(1)}%` : '—'}</td>
                    <td className="py-2 pr-3">{row.cvPctB != null ? `${row.cvPctB.toFixed(1)}%` : '—'}</td>
                    <td className="py-2 pr-3">
                      {row.diferencaIndicativa ? (
                        <span className="text-amber-800 font-semibold">Sim</span>
                      ) : (
                        <span className="text-slate-500">Não</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Indicadores agronômicos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Altura média (cm)', a: kpisA.avgHeightCm, b: kpisB.avgHeightCm },
            { label: 'População final (pl/ha)', a: kpisA.finalPopulationPlHa, b: kpisB.finalPopulationPlHa },
            { label: 'Estande efetivo', a: kpisA.estandeEfetivo, b: kpisB.estandeEfetivo },
            { label: 'Eficiência (%)', a: kpisA.eficienciaPct, b: kpisB.eficienciaPct },
            { label: 'Profundidade raiz (cm)', a: kpisA.profundidadeRaizCm, b: kpisB.profundidadeRaizCm },
            { label: 'Peso raiz (g)', a: kpisA.pesoRaizG, b: kpisB.pesoRaizG },
            {
              label: 'Vigor',
              a: phenology?.sideA?.vigor || kpisA.vigorRating?.label,
              b: phenology?.sideB?.vigor || kpisB.vigorRating?.label,
              isText: true,
            },
            { label: 'Produtividade est. (kg/ha)', a: kpisA.estimatedYieldKgHa, b: kpisB.estimatedYieldKgHa },
          ]
            .filter((r) => r.a != null || r.b != null)
            .map((item, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <p className="text-xs font-medium text-slate-500 mb-2">{item.label}</p>
                {'isText' in item && item.isText ? (
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
                      <p className="text-xs text-slate-400 mt-1">Δ {(((item.b - item.a) / item.a) * 100).toFixed(1)}%</p>
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

      {radarData.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm overflow-hidden">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Radar agronômico</h2>
          <div className="h-64 min-h-[240px] sm:h-80 w-full" style={{ minHeight: 240 }}>
            <ResponsiveContainer width="100%" height={240} minHeight={240}>
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

      {(coleta?.espacamento != null ||
        coleta?.populacaoAlvo != null ||
        kpisA.finalPopulationPlHa != null ||
        kpisB.finalPopulationPlHa != null) && (
        <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Contexto de plantio</h2>
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

      {points.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Pontos de avaliação</h2>
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
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          (p.status || '').toLowerCase() === 'ok'
                            ? 'bg-emerald-100 text-emerald-800'
                            : (p.status || '').toLowerCase() === 'monitorar'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
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

      {phenology && (phenology.sideA || phenology.sideB) && (
        <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Fenologia da cultura</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {phenology.sideA && (
              <div className="border border-emerald-100 rounded-lg p-4 bg-emerald-50/50">
                <p className="font-medium text-emerald-800 mb-2">{sideAName}</p>
                <ul className="text-sm space-y-1">
                  {phenology.sideA.estadio && (
                    <li>
                      <span className="text-slate-500">Estádio:</span> {phenology.sideA.estadio}
                    </li>
                  )}
                  {phenology.sideA.vigor && (
                    <li>
                      <span className="text-slate-500">Vigor:</span> {phenology.sideA.vigor}
                    </li>
                  )}
                  {phenology.sideA.uniformidade && (
                    <li>
                      <span className="text-slate-500">Uniformidade:</span> {phenology.sideA.uniformidade}
                    </li>
                  )}
                  {phenology.sideA.observacao && (
                    <li>
                      <span className="text-slate-500">Obs.:</span> {phenology.sideA.observacao}
                    </li>
                  )}
                </ul>
              </div>
            )}
            {phenology.sideB && (
              <div className="border border-blue-100 rounded-lg p-4 bg-blue-50/50">
                <p className="font-medium text-blue-800 mb-2">{sideBName}</p>
                <ul className="text-sm space-y-1">
                  {phenology.sideB.estadio && (
                    <li>
                      <span className="text-slate-500">Estádio:</span> {phenology.sideB.estadio}
                    </li>
                  )}
                  {phenology.sideB.vigor && (
                    <li>
                      <span className="text-slate-500">Vigor:</span> {phenology.sideB.vigor}
                    </li>
                  )}
                  {phenology.sideB.uniformidade && (
                    <li>
                      <span className="text-slate-500">Uniformidade:</span> {phenology.sideB.uniformidade}
                    </li>
                  )}
                  {phenology.sideB.observacao && (
                    <li>
                      <span className="text-slate-500">Obs.:</span> {phenology.sideB.observacao}
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {(kpisA.profundidadeRaizCm != null ||
        kpisB.profundidadeRaizCm != null ||
        kpisA.pesoRaizG != null ||
        kpisB.pesoRaizG != null ||
        kpisA.rootRating ||
        kpisB.rootRating) && (
        <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Sistema radicular</h2>
          {barKpis.filter((r) => r.name.includes('Raiz') || r.name.includes('Peso')).length > 0 ? (
            <div className="h-56 min-h-[200px] sm:h-64 w-full overflow-x-auto" style={{ minHeight: 200 }}>
              <ResponsiveContainer width="100%" height={200} minWidth={280}>
                <BarChart
                  data={barKpis.filter((r) => r.name.includes('Raiz') || r.name.includes('Peso'))}
                  layout="vertical"
                  margin={{ left: 80 }}
                >
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
              <div>
                <span className="text-slate-500 text-sm">Sanidade raiz {sideAName}:</span> {kpisA.rootRating.label} (
                {kpisA.rootRating.score}/{kpisA.rootRating.max})
              </div>
            )}
            {kpisB.rootRating && (
              <div>
                <span className="text-slate-500 text-sm">Sanidade raiz {sideBName}:</span> {kpisB.rootRating.label} (
                {kpisB.rootRating.score}/{kpisB.rootRating.max})
              </div>
            )}
          </div>
        </section>
      )}

      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Ocorrências — detalhamento</h2>
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
              <div className="h-44 min-h-[160px] sm:h-48 w-full overflow-x-auto" style={{ minHeight: 160 }}>
                <ResponsiveContainer width="100%" height={160} minWidth={260}>
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
    </>
  );
}
