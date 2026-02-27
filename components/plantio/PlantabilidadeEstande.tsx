'use client';

import LinhaPlantioVisualizer from './LinhaPlantioVisualizer';
import EstandeChart from './EstandeChart';
import QualidadePlantio from './QualidadePlantio';
import type { RelatorioPlantioData } from './DashboardTalhao';

function formatDate(s: string | undefined | null): string {
  if (!s || typeof s !== 'string') return '—';
  return s.trim() || '—';
}

export default function PlantabilidadeEstande({ data }: { data: RelatorioPlantioData }) {
  const plantabilidade = data.plantabilidade || {};
  const estande = data.estande || {};
  const contextoSafra = data.contextoSafra || {};
  const talhao = data.talhao || {};
  const populacao = data.populacao || {};
  const fenologia = data.fenologia || {};
  const evolucaoCultura = data.evolucaoCultura || {};

  const espacamentoIdeal = plantabilidade.espacamentoIdealCm ?? contextoSafra.espacamentoCm;
  const espacamentoReal = plantabilidade.espacamentoRealCm;
  const dae = contextoSafra.dae;
  const dap = contextoSafra.dap;
  const estadio = evolucaoCultura.estadioAtual ?? fenologia.estadio;
  const plantasHa = populacao.plantasHa ?? (estande.registros?.length ? estande.registros[estande.registros.length - 1]?.plantasHa : undefined);
  const plantasPorMetro = populacao.plantasPorMetro ?? (estande.registros?.length ? estande.registros[estande.registros.length - 1]?.plantasPorMetro : undefined);
  const populacaoAlvo = contextoSafra.populacaoAlvoPlHa;

  return (
    <article className="plantio-rtv-article space-y-6 print:break-inside-avoid" aria-labelledby="plantabilidade-titulo">
      <h2 id="plantabilidade-titulo" className="plantio-card-title text-base">
        Análise de Plantabilidade + Estande (Unificada)
      </h2>

      <section className="plantio-card" aria-labelledby="qualidade-linha-titulo">
        <h3 id="qualidade-linha-titulo" className="plantio-card-title">
          Qualidade da Linha de Plantio
        </h3>

        <dl className="plantio-data-list">
          <div className="plantio-data-row">
            <dt>Espaçamento Ideal</dt>
            <dd>{espacamentoIdeal != null ? `${espacamentoIdeal} cm` : '—'}</dd>
          </div>
          <div className="plantio-data-row">
            <dt>Espaçamento Real Médio</dt>
            <dd>{espacamentoReal != null ? `${espacamentoReal} cm` : '—'}</dd>
          </div>
          <div className="plantio-data-row">
            <dt>DAE</dt>
            <dd>{dae != null && Number.isFinite(dae) ? `${dae} dias` : '—'}</dd>
          </div>
          <div className="plantio-data-row">
            <dt>DAP</dt>
            <dd>{dap != null && Number.isFinite(dap) ? `${dap} dias` : '—'}</dd>
          </div>
          <div className="plantio-data-row">
            <dt>Estádio</dt>
            <dd>{estadio || '—'}</dd>
          </div>
          <div className="plantio-data-row">
            <dt>Data do plantio</dt>
            <dd>{formatDate(talhao.dataPlantio)}</dd>
          </div>
          <div className="plantio-data-row">
            <dt>População alvo</dt>
            <dd>{populacaoAlvo != null ? `${Number(populacaoAlvo).toLocaleString('pt-BR')} pl/ha` : '—'}</dd>
          </div>
          <div className="plantio-data-row">
            <dt>População atual (pl/ha)</dt>
            <dd>{plantasHa != null ? `${Number(plantasHa).toLocaleString('pt-BR')}` : '—'}</dd>
          </div>
          <div className="plantio-data-row">
            <dt>Plantas/metro</dt>
            <dd>{plantasPorMetro != null ? `${Number(plantasPorMetro).toFixed(2)}` : '—'}</dd>
          </div>
          {populacao.eficienciaPct != null && (
            <div className="plantio-data-row">
              <dt>Eficiência estande</dt>
              <dd>{Number(populacao.eficienciaPct).toFixed(1)}%</dd>
            </div>
          )}
        </dl>

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
      </section>

      {estande.registros && estande.registros.length > 0 && (
        <EstandeChart
          registros={estande.registros}
          perdaTotalPct={estande.perdaTotalPct}
          perdaSemanalPct={estande.perdaSemanalPct}
        />
      )}

      <QualidadePlantio
        espacamentoIdealCm={plantabilidade.espacamentoIdealCm ?? contextoSafra.espacamentoCm}
        espacamentoRealCm={plantabilidade.espacamentoRealCm ?? contextoSafra.espacamentoCm}
        cvPercentual={plantabilidade.cvPercentual}
        duplasPct={plantabilidade.duplasPct}
        triplasPct={plantabilidade.triplasPct}
        falhasPct={plantabilidade.falhasPct}
        okPct={plantabilidade.okPct}
        indicePlantabilidade={plantabilidade.indicePlantabilidade}
      />
    </article>
  );
}
