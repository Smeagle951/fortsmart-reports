'use client';

import IndiceAgronomicoTalhao from './IndiceAgronomicoTalhao';
import EstandeChart from './EstandeChart';
import LinhaPlantioVisualizer from './LinhaPlantioVisualizer';
import PerdasProjecaoCard from './PerdasProjecaoCard';
import GaleriaImagens from './GaleriaImagens';

function parseHipoteses(causaProvavel?: string, problemaPrincipal?: string, hipoteses?: string[]): string[] {
  if (causaProvavel || problemaPrincipal) {
    const texto = [causaProvavel, problemaPrincipal].filter(Boolean).join('. ');
    const parsed = texto.split(/[;•·]/).map((s) => s.trim()).filter(Boolean);
    if (parsed.length > 0) return parsed;
  }
  return hipoteses || [];
}

export interface RelatorioPlantioData {
  meta?: { safra?: string; dataGeracao?: string };
  propriedade?: { fazenda?: string };
  talhao?: { nome?: string; cultura?: string; area?: number; dataPlantio?: string };
  contextoSafra?: { espacamentoCm?: number; dae?: number; dap?: number; populacaoAlvoPlHa?: number; materialVariedade?: string; empresa?: string };
  populacao?: { plantasHa?: number; plantasPorMetro?: number; estandeEfetivoPlHa?: number; eficienciaPct?: number; situacao?: string };
  fenologia?: { estadio?: string; dataUltimaAvaliacao?: string; ultimaAvaliacaoDias?: number };
  indiceAgronomicoTalhao?: {
    valor?: number;
    maximo?: number;
    status?: string;
    itens?: Array<{ label: string; valor: string }>;
  };
  evolucaoCultura?: {
    estadioAtual?: string;
    estadioPrevisto?: string;
    somaTermica?: number;
    atrasoFenologico?: number;
  };
  plantabilidade?: {
    espacamentoIdealCm?: number;
    espacamentoRealCm?: number;
    cvPercentual?: number;
    duplasPct?: number;
    triplasPct?: number;
    falhasPct?: number;
    okPct?: number;
    indicePlantabilidade?: number;
    linha?: Array<{ tipo: 'ok' | 'dupla' | 'tripla' | 'falha'; posicao?: number }>;
    espacamentosIndividuais?: Array<{ cm?: number; tipo: string }>;
  };
  estande?: {
    registros?: Array<{ data: string; plantasPorMetro: number; plantasHa?: number }>;
    perdaTotalPct?: number;
    perdaSemanalPct?: number;
  };
  fitossanidade?: {
    lagarta?: string;
    percevejo?: string;
    ferrugem?: string;
    ipe?: number;
    ipeStatus?: string;
  };
  diagnosticoIntegrado?: {
    resumo?: string[];
    spt?: number;
    hipoteses?: string[];
  };
  diagnostico?: {
    problemaPrincipal?: string;
    causaProvavel?: string;
    nivelRisco?: string;
    urgenciaAcao?: string;
  };
  planoAcao?: {
    objetivoManejo?: string;
    acoes?: Array<{ prioridade?: string | number; acao?: string; prazo?: string }>;
  };
  imagens?: Array<{ url?: string; path?: string; descricao?: string; data?: string; categoria?: string }>;
  assinaturaTecnica?: { nome?: string; crea?: string; dataAssinatura?: string; cidade?: string };
}

interface DashboardTalhaoProps {
  data: RelatorioPlantioData;
  relatorioId?: string;
}

export default function DashboardTalhao({ data, relatorioId }: DashboardTalhaoProps) {
  const talhao = data.talhao || {};
  const iat = data.indiceAgronomicoTalhao || {};
  const plantabilidade = data.plantabilidade || {};
  const estande = data.estande || {};
  const diagnostico = data.diagnostico || {};
  const diagnosticoIntegrado = data.diagnosticoIntegrado || {};
  const planoAcao = data.planoAcao || {};

  const hipoteses = parseHipoteses(
    diagnostico.causaProvavel,
    diagnostico.problemaPrincipal,
    diagnosticoIntegrado.hipoteses
  );
  const acoesAgronomo = (planoAcao.acoes || [])
    .filter((a) => a.acao?.trim())
    .sort((a, b) => (Number(a.prioridade) || 999) - (Number(b.prioridade) || 999));

  return (
    <section className="space-y-6 print:break-inside-avoid">
      {/* Layout 2 colunas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        {/* Coluna esquerda */}
        <div className="space-y-6">
          {/* IAT */}
          <IndiceAgronomicoTalhao
            valor={iat.valor ?? 0}
            maximo={iat.maximo ?? 100}
            status={iat.status ?? 'Saudável'}
            itens={iat.itens}
          />

          {/* Evolução do Estande */}
          {estande.registros && estande.registros.length > 0 && (
            <EstandeChart
              registros={estande.registros}
              perdaTotalPct={estande.perdaTotalPct}
              perdaSemanalPct={estande.perdaSemanalPct}
              talhaoNome={talhao.nome as string}
              showStats
            />
          )}

          {/* Distribuição Longitudinal + Índice Plantabilidade */}
          <div className="plantio-card">
            <h3 className="plantio-card-title">
              Qualidade do Plantio (CV%) e distribuição
            </h3>
            <LinhaPlantioVisualizer
              linha={plantabilidade.linha || []}
              okPct={plantabilidade.okPct}
              duplasPct={plantabilidade.duplasPct}
              triplasPct={plantabilidade.triplasPct}
              falhasPct={plantabilidade.falhasPct}
              indicePlantabilidade={plantabilidade.indicePlantabilidade}
              espacamentosIndividuais={plantabilidade.espacamentosIndividuais}
              embedded
            />
            {plantabilidade.indicePlantabilidade != null && (
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-slate-600">
                  <span>Índice de Plantabilidade</span>
                  <span className="font-semibold">{plantabilidade.indicePlantabilidade}/100</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${plantabilidade.indicePlantabilidade}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Coluna direita */}
        <div className="space-y-6">
          {/* Perdas e Projeção - Numérico */}
          {estande.registros && estande.registros.length > 0 && (
            <PerdasProjecaoCard
              perdaTotalPct={estande.perdaTotalPct}
              perdaSemanalPct={estande.perdaSemanalPct}
              registros={estande.registros}
            />
          )}

          {/* Diagnóstico Agronômico */}
          {hipoteses.length > 0 && (
            <div className="plantio-card">
              <h3 className="plantio-card-title">
                Diagnóstico Agronômico
              </h3>
              <ol className="list-inside list-decimal space-y-1.5 text-sm text-slate-700">
                {hipoteses.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Recomendações Agronômicas (sempre do agrônomo) */}
          <div className="plantio-card">
            <h3 className="plantio-card-title">
              Recomendações Agronômicas
            </h3>
            {planoAcao.objetivoManejo && (
              <p className="mb-2 text-sm text-slate-600">
                <strong>Objetivo:</strong> {planoAcao.objetivoManejo}
              </p>
            )}
            {acoesAgronomo.length > 0 ? (
              <ul className="list-inside list-disc space-y-1.5 text-sm text-slate-700">
                {acoesAgronomo.map((a, i) => (
                  <li key={i}>
                    {a.prioridade != null && <span className="font-medium">[{a.prioridade}] </span>}
                    {a.acao}
                    {a.prazo && <span className="text-slate-500"> — {a.prazo}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Aguardando recomendações do agrônomo.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Galeria de imagens - largura total */}
      {data.imagens && data.imagens.length > 0 && (
        <GaleriaImagens imagens={data.imagens} relatorioId={relatorioId} />
      )}
    </section>
  );
}
