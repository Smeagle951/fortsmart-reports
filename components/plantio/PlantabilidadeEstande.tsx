'use client';

import LinhaPlantioVisualizer from './LinhaPlantioVisualizer';
import EstandeChart from './EstandeChart';
import QualidadePlantio from './QualidadePlantio';
import type { RelatorioPlantioData } from './DashboardTalhao';

interface PlantabilidadeEstandeProps {
  data: RelatorioPlantioData;
}

export default function PlantabilidadeEstande({ data }: PlantabilidadeEstandeProps) {
  const plantabilidade = data.plantabilidade || {};
  const estande = data.estande || {};
  const contextoSafra = data.contextoSafra || {};

  const espacamentoIdeal = plantabilidade.espacamentoIdealCm ?? contextoSafra.espacamentoCm;
  const espacamentoReal = plantabilidade.espacamentoRealCm;

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
        </dl>

        <LinhaPlantioVisualizer
          linha={plantabilidade.linha || []}
          okPct={plantabilidade.okPct}
          duplasPct={plantabilidade.duplasPct}
          triplasPct={plantabilidade.triplasPct}
          falhasPct={plantabilidade.falhasPct}
          indicePlantabilidade={plantabilidade.indicePlantabilidade}
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
        espacamentoIdealCm={plantabilidade.espacamentoIdealCm}
        espacamentoRealCm={plantabilidade.espacamentoRealCm}
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
