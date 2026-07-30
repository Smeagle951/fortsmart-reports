'use client';

import dynamic from 'next/dynamic';
import { labelClassificacao } from '@/lib/calculations';
import type {
  MonitoringPlotAssessment,
  MonitoringPriorityAction,
} from '@/lib/monitoring-report/professional';
import {
  collectPlotImages,
  formatNullableMetric,
} from '@/lib/monitoring-report/professional';
import type { OrganismoContextoWeb } from '@/lib/types/monitoring';
import IndicesPorPonto from '@/components/IndicesPorPonto';
import TabelaDetalhada from '@/components/TabelaDetalhada';
import { calcularMetricasPorPonto } from '@/lib/calculations';
import MonitoringEvidenceGrid from './MonitoringEvidenceGrid';
import MonitoringNdeTable from './MonitoringNdeTable';
import MonitoringOccurrenceTable from './MonitoringOccurrenceTable';

const MapaInterativo = dynamic(() => import('@/components/MapaInterativo'), {
  ssr: false,
});

interface MonitoringPlotSectionProps {
  assessment: MonitoringPlotAssessment;
  index: number;
  total: number;
  reportDate: string;
  actions: MonitoringPriorityAction[];
  ndeRows: OrganismoContextoWeb[];
}

const decimal = (value: number) =>
  value.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
const percent = (value: number) =>
  `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;

function normalizedName(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

export default function MonitoringPlotSection({
  assessment,
  index,
  total,
  reportDate,
  actions,
  ndeRows,
}: MonitoringPlotSectionProps) {
  const { talhao } = assessment;
  const status = assessment.classificacao
    ? labelClassificacao(assessment.classificacao)
    : 'Sem dados';
  const plotActions = actions.filter((action) => action.talhaoId === talhao.id);
  const occurrenceNames = new Set(
    assessment.ocorrencias.map((occurrence) =>
      normalizedName(occurrence.organismo),
    ),
  );
  const matchingNdeRows = ndeRows.filter((row) =>
    occurrenceNames.has(normalizedName(row.nome)),
  );
  const images = collectPlotImages(assessment);
  const hasMap =
    talhao.pontos.some(
      (point) =>
        Number.isFinite(point.lat) &&
        Number.isFinite(point.lng) &&
        (point.lat !== 0 || point.lng !== 0),
    ) ||
    talhao.poligono_geojson.geometry.coordinates.length > 0;

  const context = [
    {
      label: 'Temperatura',
      value:
        talhao.disponibilidade.temperatura === 'not_informed'
          ? '—'
          : `${decimal(talhao.condicoes_climaticas?.temperatura ?? 0)} °C`,
    },
    {
      label: 'Umidade',
      value:
        talhao.disponibilidade.umidade === 'not_informed'
          ? '—'
          : percent(talhao.condicoes_climaticas?.umidade ?? 0),
    },
    {
      label: 'Chuva',
      value:
        talhao.disponibilidade.chuva === 'not_informed'
          ? '—'
          : talhao.condicoes_climaticas?.chuva || '—',
    },
    { label: 'Estágio', value: talhao.estagio || '—' },
    {
      label: 'DAE',
      value:
        talhao.dae !== undefined && Number.isFinite(talhao.dae)
          ? String(talhao.dae)
          : '—',
    },
    {
      label: 'Estande',
      value:
        talhao.populacao_estande !== undefined &&
        Number.isFinite(talhao.populacao_estande)
          ? decimal(talhao.populacao_estande)
          : '—',
    },
  ];

  return (
    <article
      id={`talhao-${talhao.id}`}
      className="mr-plot"
      aria-labelledby={`talhao-title-${talhao.id}`}
    >
      <header className="mr-plot__header report-section-title">
        <div>
          <p className="mr-eyebrow">
            Talhão {index} de {total}
          </p>
          <h2 id={`talhao-title-${talhao.id}`}>{talhao.nome}</h2>
        </div>
        <dl className="mr-plot__identity">
          <div>
            <dt>Cultura</dt>
            <dd>{talhao.cultura || 'Não informado'}</dd>
          </div>
          <div>
            <dt>Variedade</dt>
            <dd>{talhao.variedade || 'Não informado'}</dd>
          </div>
          <div>
            <dt>Estágio / DAE</dt>
            <dd>
              {[talhao.estagio, talhao.dae !== undefined ? `DAE ${talhao.dae}` : null]
                .filter(Boolean)
                .join(' · ') || 'Não informado'}
            </dd>
          </div>
          <div>
            <dt>Área</dt>
            <dd>
              {talhao.disponibilidade.area === 'not_informed'
                ? 'Não informado'
                : `${decimal(talhao.area_ha)} ha`}
            </dd>
          </div>
          <div>
            <dt>Monitoramento</dt>
            <dd>{reportDate || 'Não informado'}</dd>
          </div>
          <div>
            <dt>Situação</dt>
            <dd>
              <span
                className={`mr-status mr-status--${assessment.classificacao?.toLocaleLowerCase('pt-BR') ?? 'unknown'}`}
              >
                {status}
              </span>
            </dd>
          </div>
        </dl>
      </header>

      <div className="mr-plot__analysis report-keep-together">
        <section className="mr-plot__map" aria-labelledby={`map-title-${talhao.id}`}>
          <h3 id={`map-title-${talhao.id}`} className="mr-subtitle">
            Mapa e pontos amostrados
          </h3>
          {hasMap ? (
            <MapaInterativo
              pontos={talhao.pontos}
              poligono={talhao.poligono_geojson}
              talhaoId={talhao.id}
              hideHeader
              mapHeight={450}
            />
          ) : (
            <div className="mr-map-empty">
              Mapa indisponível: coordenadas ou polígono não informados.
            </div>
          )}
          <p className="mr-map-description">
            O mapa representa o polígono e os pontos presentes no payload deste
            monitoramento. A cor dos pontos indica a classificação calculada
            para cada amostra.
          </p>
        </section>

        <section
          className="mr-plot__synthesis"
          aria-labelledby={`summary-title-${talhao.id}`}
        >
          <h3 id={`summary-title-${talhao.id}`} className="mr-subtitle">
            Síntese técnica
          </h3>
          <dl className="mr-technical-list">
            <div>
              <dt>Pontos amostrados</dt>
              <dd>{assessment.totalPontos}</dd>
            </div>
            <div>
              <dt>Pontos com ocorrência</dt>
              <dd>{assessment.pontosComOcorrencia}</dd>
            </div>
            <div>
              <dt>Índice de ocorrência</dt>
              <dd>
                {formatNullableMetric(assessment.indiceOcorrencia, percent)}
              </dd>
            </div>
            <div>
              <dt>Severidade média</dt>
              <dd>
                {formatNullableMetric(assessment.severidadeMedia, percent)}
              </dd>
            </div>
            <div>
              <dt>Total de registros</dt>
              <dd>{assessment.totalOcorrencias}</dd>
            </div>
            <div>
              <dt>Principal organismo</dt>
              <dd>{assessment.principalOcorrencia?.organismo ?? '—'}</dd>
            </div>
            <div>
              <dt>Frequência principal</dt>
              <dd>
                {formatNullableMetric(
                  assessment.principalOcorrencia?.frequencia,
                  percent,
                )}
              </dd>
            </div>
            <div>
              <dt>Classificação</dt>
              <dd>{status}</dd>
            </div>
            <div>
              <dt>Condição climática</dt>
              <dd>
                {talhao.condicoes_climaticas
                  ? [context[0].value, context[1].value, context[2].value]
                      .filter((value) => value !== '—')
                      .join(' · ') || '—'
                  : '—'}
              </dd>
            </div>
            <div>
              <dt>Estágio fenológico</dt>
              <dd>{talhao.estagio || '—'}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="mr-plot__section">
        <h3 className="mr-subtitle">Principais ocorrências</h3>
        <MonitoringOccurrenceTable
          rows={assessment.ocorrencias}
          caption={`Principais ocorrências registradas no ${talhao.nome}`}
        />
      </section>

      {matchingNdeRows.length > 0 && (
        <MonitoringNdeTable rows={matchingNdeRows} />
      )}

      <section className="mr-context report-keep-together">
        <h3 className="mr-subtitle">Condições e contexto</h3>
        <dl className="mr-context-strip">
          {context.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {plotActions.length > 0 && (
        <section className="mr-plot__section">
          <h3 className="mr-subtitle">Condutas registradas para o talhão</h3>
          <div className="mr-table-scroll">
            <table className="mr-table mr-table--compact">
              <caption>Recomendações existentes no payload do talhão</caption>
              <thead>
                <tr>
                  <th scope="col">Prioridade</th>
                  <th scope="col">Organismo</th>
                  <th scope="col">Evidência</th>
                  <th scope="col">Conduta</th>
                  <th scope="col">Produto</th>
                  <th scope="col">Dose</th>
                  <th scope="col">Prazo</th>
                </tr>
              </thead>
              <tbody>
                {plotActions.map((action) => (
                  <tr key={action.id}>
                    <td data-label="Prioridade">{action.priorityLabel}</td>
                    <th scope="row" data-label="Organismo">
                      {action.organismo}
                    </th>
                    <td data-label="Evidência">{action.evidencia ?? '—'}</td>
                    <td data-label="Conduta">{action.conduta ?? '—'}</td>
                    <td data-label="Produto">{action.produto ?? '—'}</td>
                    <td data-label="Dose">{action.dose ?? '—'}</td>
                    <td data-label="Prazo">{action.prazo ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <MonitoringEvidenceGrid images={images} />

      {(talhao.pontos.length > 0 || assessment.totalOcorrencias > 0) && (
        <details className="mr-details" open>
          <summary>Dados detalhados do talhão</summary>
          <div className="mr-details__content">
            {talhao.pontos.length > 0 && (
              <IndicesPorPonto
                metricasPorPonto={calcularMetricasPorPonto(talhao)}
                pontos={talhao.pontos}
              />
            )}
            {assessment.totalOcorrencias > 0 && (
              <TabelaDetalhada pontos={talhao.pontos} />
            )}
          </div>
        </details>
      )}
    </article>
  );
}
