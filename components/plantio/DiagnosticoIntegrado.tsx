'use client';

import type { RelatorioPlantioData } from './DashboardTalhao';

interface DiagnosticoIntegradoProps {
  data: RelatorioPlantioData;
}

/** Extrai hipóteses do diagnóstico do agrônomo (causaProvavel pode ter múltiplos itens separados por ; ou •) */
function parseHipotesesAgronomo(causaProvavel?: string, problemaPrincipal?: string): string[] {
  if (!causaProvavel && !problemaPrincipal) return [];
  const texto = [causaProvavel, problemaPrincipal].filter(Boolean).join('. ');
  return texto
    .split(/[;•·]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default function DiagnosticoIntegrado({ data }: DiagnosticoIntegradoProps) {
  const diag = data.diagnosticoIntegrado || {};
  const diagnostico = data.diagnostico || {};
  const planoAcao = data.planoAcao || {};
  const resumo = diag.resumo || [];
  const spt = diag.spt;
  const evolucao = data.evolucaoCultura || {};
  const plantabilidade = data.plantabilidade || {};
  const estande = data.estande || {};
  const fitossanidade = data.fitossanidade || {};

  // Hipóteses: prioridade para dados do agrônomo (diagnostico.causaProvavel)
  const hipotesesAgronomo = parseHipotesesAgronomo(
    diagnostico.causaProvavel,
    diagnostico.problemaPrincipal
  );
  const hipoteses = hipotesesAgronomo.length > 0
    ? hipotesesAgronomo
    : (diag.hipoteses || []);

  // Recomendações: SEMPRE do agrônomo (planoAcao.acoes) — nunca IA
  const acoesAgronomo = (planoAcao.acoes || [])
    .filter((a) => a.acao?.trim())
    .sort((a, b) => {
      const pa = Number(a.prioridade) || 999;
      const pb = Number(b.prioridade) || 999;
      return pa - pb;
    });

  return (
    <section className="space-y-6 print:break-inside-avoid">
      <div className="plantio-card">
        <h2 className="plantio-card-title mb-4">
          Diagnóstico Agronômico Integrado
        </h2>

        {resumo.length > 0 && (
          <div className="mb-6">
            <h3 className="plantio-card-title mb-2">
              Resumo Geral
            </h3>
            <ul className="list-inside list-disc space-y-1 text-slate-700">
              {resumo.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            {spt != null && (
              <div className="mt-3 rounded-lg bg-slate-100 p-3">
                <span className="font-medium text-slate-600">SPT – Score de Precisão do Talhão: </span>
                <span className="text-xl font-bold text-slate-800">{spt}/100</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4 border-t border-slate-200 pt-6">
          <h3 className="plantio-card-title">
            Análise Detalhada
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-4">
              <h4 className="mb-2 font-medium text-slate-700">Fenologia</h4>
              <p className="text-sm text-slate-600">
                Estágio Atual: {evolucao.estadioAtual ?? '—'}
                <br />
                Estágio Esperado: {evolucao.estadioPrevisto ?? '—'}
                <br />
                Atraso: {evolucao.atrasoFenologico != null
                  ? `${evolucao.atrasoFenologico} folha(s)`
                  : '—'}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <h4 className="mb-2 font-medium text-slate-700">Estande</h4>
              <p className="text-sm text-slate-600">
                {estande.registros?.length
                  ? `Estande Atual: ${estande.registros[0].plantasPorMetro} plantas/m`
                  : '—'}
                <br />
                Perda Total: {estande.perdaTotalPct != null ? `${estande.perdaTotalPct}%` : '—'}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <h4 className="mb-2 font-medium text-slate-700">Plantabilidade</h4>
              <p className="text-sm text-slate-600">
                Espaçamento ideal: {plantabilidade.espacamentoIdealCm ?? '—'} cm
                <br />
                Espaçamento real: {plantabilidade.espacamentoRealCm ?? '—'} cm
                <br />
                Falhas críticas &gt; 20 cm: {plantabilidade.falhasPct ?? '—'}%
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <h4 className="mb-2 font-medium text-slate-700">Fitossanidade</h4>
              <p className="text-sm text-slate-600">
                Pressão atual: {fitossanidade.lagarta ?? '—'} a {fitossanidade.percevejo ?? '—'}
                <br />
                IPE: {fitossanidade.ipe ?? '—'}
              </p>
            </div>
          </div>
        </div>

        {hipoteses.length > 0 && (
          <div className="mt-6 border-t border-slate-200 pt-6">
            <h3 className="plantio-card-title mb-3">
              Hipóteses Prováveis
            </h3>
            <ol className="list-inside list-decimal space-y-2 text-slate-700">
              {hipoteses.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Recomendações: SEMPRE do agrônomo (planoAcao.acoes) */}
        <div className="mt-6 border-t border-slate-200 pt-6">
          <h3 className="plantio-card-title mb-3">
            Recomendações Agronômicas
          </h3>
          {planoAcao.objetivoManejo && (
            <p className="mb-3 text-sm text-slate-600">
              <strong>Objetivo:</strong> {planoAcao.objetivoManejo}
            </p>
          )}
          {acoesAgronomo.length > 0 ? (
            <ul className="list-inside list-disc space-y-2 text-slate-700">
              {acoesAgronomo.map((a, i) => (
                <li key={i}>
                  {a.prioridade != null && (
                    <span className="font-medium text-slate-600">[{a.prioridade}] </span>
                  )}
                  {a.acao}
                  {a.prazo && (
                    <span className="ml-1 text-slate-500">— Prazo: {a.prazo}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Aguardando recomendações do agrônomo. As recomendações devem ser inseridas no Plano de Ação pelo responsável técnico.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
