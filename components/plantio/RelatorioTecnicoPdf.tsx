'use client';

import EstandeChart from './EstandeChart';
import LinhaPlantioVisualizer from './LinhaPlantioVisualizer';
import FitossanidadeResumo from './FitossanidadeResumo';
import GaleriaImagens from './GaleriaImagens';
import FortSmartLogo from '@/components/FortSmartLogo';
import { formatArea, formatDate } from '@/utils/format';
import type { RelatorioPlantioData } from './DashboardTalhao';

interface RelatorioTecnicoPdfProps {
  data: RelatorioPlantioData;
  meta?: { dataGeracao?: string; safra?: string };
  assinaturaTecnica?: { nome?: string; crea?: string; dataAssinatura?: string; cidade?: string };
  relatorioId?: string;
}

export default function RelatorioTecnicoPdf({
  data,
  meta = {},
  assinaturaTecnica = {},
  relatorioId,
}: RelatorioTecnicoPdfProps) {
  const talhao = data.talhao || {};
  const iat = data.indiceAgronomicoTalhao || {};
  const evolucao = data.evolucaoCultura || {};
  const plantabilidade = data.plantabilidade || {};
  const estande = data.estande || {};
  const fitossanidade = data.fitossanidade || {};
  const diag = data.diagnosticoIntegrado || {};
  const planoAcao = data.planoAcao || {};

  return (
    <section className="space-y-8 print:space-y-6 print:break-inside-avoid">
      {/* Header estilo multinacional */}
      <div className="border-b-2 border-slate-800 pb-4">
        <div className="flex flex-col items-center gap-3">
          <FortSmartLogo size={64} />
          <h1 className="text-center text-2xl font-bold tracking-wider text-slate-800">
            F O R T S M A R T &nbsp;&nbsp; A G R O
          </h1>
        </div>
        <p className="mt-2 text-center text-sm font-medium uppercase tracking-widest text-slate-600">
          Relatório Agronômico – Safra {meta.safra ?? '2025'}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-slate-700">
          <span><strong>Talhão:</strong> {talhao.nome ?? '—'}</span>
          <span>|</span>
          <span><strong>Cultura:</strong> {talhao.cultura ?? '—'}</span>
          <span>|</span>
          <span><strong>Área:</strong> {formatArea(talhao.area)}</span>
        </div>
      </div>

      {/* IAT */}
      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase text-slate-600">
          Índice Agronômico do Talhão: {iat.valor ?? '—'}/100
        </h3>
        {iat.status != null && iat.status !== '' ? (
          <p className="text-slate-700">
            Status: {iat.status}. Pontos de atenção no talhão.
          </p>
        ) : null}
      </div>

      {/* Evolução de Estande */}
      {estande.registros && estande.registros.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase text-slate-600">
            Evolução de Estande (Plantas/m)
          </h3>
          <EstandeChart
            registros={estande.registros}
            perdaTotalPct={estande.perdaTotalPct}
            perdaSemanalPct={estande.perdaSemanalPct}
          />
          <p className="mt-2 text-sm text-slate-600">
            Perda Total: {estande.perdaTotalPct ?? '—'}%
          </p>
        </div>
      )}

      {/* Distribuição Longitudinal: trena com linha real ou simulada a partir das % */}
      {((plantabilidade.linha && plantabilidade.linha.length > 0) ||
        plantabilidade.okPct != null || plantabilidade.duplasPct != null ||
        plantabilidade.triplasPct != null || plantabilidade.falhasPct != null) && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase text-slate-600">
            Visualização da qualidade do plantio
          </h3>
          <LinhaPlantioVisualizer
            linha={plantabilidade.linha || []}
            okPct={plantabilidade.okPct}
            duplasPct={plantabilidade.duplasPct}
            triplasPct={plantabilidade.triplasPct}
            falhasPct={plantabilidade.falhasPct}
            espacamentosIndividuais={plantabilidade.espacamentosIndividuais}
          />
          <p className="mt-2 text-sm text-slate-600">
            OK: {plantabilidade.okPct ?? 0}% | Duplas: {plantabilidade.duplasPct ?? 0}% | Triplas: {plantabilidade.triplasPct ?? 0}% | Falhas: {plantabilidade.falhasPct ?? 0}%
          </p>
        </div>
      )}

      {/* Fenologia - só exibe quando houver pelo menos um dado */}
      {(evolucao.estadioAtual != null && evolucao.estadioAtual !== '') ||
       (evolucao.estadioPrevisto != null && evolucao.estadioPrevisto !== '') ||
       (evolucao.atrasoFenologico != null) ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase text-slate-600">
            Fenologia
          </h3>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-700">
            <span><strong>Atual:</strong> {evolucao.estadioAtual ?? '—'}</span>
            <span><strong>Previsto:</strong> {evolucao.estadioPrevisto ?? '—'}</span>
            <span><strong>Atraso Fenológico:</strong> {evolucao.atrasoFenologico != null ? `${evolucao.atrasoFenologico} folha(s)` : '—'}</span>
          </div>
        </div>
      ) : null}

      {/* Fitossanidade */}
      <FitossanidadeResumo
        lagarta={fitossanidade.lagarta}
        percevejo={fitossanidade.percevejo}
        ferrugem={fitossanidade.ferrugem}
        ipe={fitossanidade.ipe}
        ipeStatus={fitossanidade.ipeStatus}
      />

      {/* Diagnóstico Integrado */}
      {diag.resumo && diag.resumo.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase text-slate-600">
            Diagnóstico Integrado – IA
          </h3>
          <p className="text-slate-700">
            {diag.resumo.join(' ')}
          </p>
        </div>
      )}

      {/* Registros fotográficos */}
      {data.imagens && data.imagens.length > 0 && (
        <GaleriaImagens imagens={data.imagens} relatorioId={relatorioId} variant="print" />
      )}

      {/* Recomendações (sempre do agrônomo - planoAcao.acoes) */}
      {((planoAcao.acoes || []).filter((a: { acao?: string }) => a.acao?.trim()).length > 0) && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase text-slate-600">
            Recomendações Técnicas
          </h3>
          {planoAcao.objetivoManejo && (
            <p className="mb-2 text-sm text-slate-600"><strong>Objetivo:</strong> {planoAcao.objetivoManejo}</p>
          )}
          <ul className="list-inside list-disc space-y-1 text-slate-700">
            {(planoAcao.acoes || [])
              .filter((a: { acao?: string }) => a.acao?.trim())
              .sort((a: { prioridade?: string | number }, b: { prioridade?: string | number }) =>
                (Number(a.prioridade) || 999) - (Number(b.prioridade) || 999)
              )
              .map((a: { acao?: string; prazo?: string }, i: number) => (
                <li key={i}>
                  {a.acao}
                  {a.prazo && <span className="text-slate-500"> — Prazo: {a.prazo}</span>}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Assinatura */}
      {(assinaturaTecnica.nome || assinaturaTecnica.crea) && (
        <div className="mt-12 border-t border-slate-300 pt-6">
          <div className="assinatura-box">
            <div className="font-bold text-slate-800">{assinaturaTecnica.nome}</div>
            {assinaturaTecnica.crea && (
              <div className="text-sm text-slate-600">CREA: {assinaturaTecnica.crea}</div>
            )}
            {assinaturaTecnica.dataAssinatura && (
              <div className="text-sm text-slate-600">{formatDate(assinaturaTecnica.dataAssinatura)}</div>
            )}
            {assinaturaTecnica.cidade && (
              <div className="text-sm text-slate-600">{assinaturaTecnica.cidade}</div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
