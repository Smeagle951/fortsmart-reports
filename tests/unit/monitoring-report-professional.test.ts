import { describe, expect, it } from 'vitest';
import type { OrganismoContextoWeb } from '@/lib/types/monitoring';
import {
  assessMonitoringPlot,
  assessNdeComparison,
  buildMonitoringOverview,
  buildPriorityActions,
  buildTechnicalConclusion,
  deduplicateReportImages,
  formatNullableMetric,
  sortPlotsByRisk,
} from '@/lib/monitoring-report/professional';
import {
  normalizeMonitoringPlot,
  normalizeMonitoringReport,
  type PayloadMonitoramento,
} from '@/lib/monitoring-report/normalize';

const polygon = {
  type: 'Feature' as const,
  geometry: {
    type: 'Polygon' as const,
    coordinates: [
      [
        [-48, -16],
        [-47.99, -16],
        [-47.99, -15.99],
        [-48, -15.99],
        [-48, -16],
      ],
    ],
  },
};

function rawPlot(
  id: string,
  severity: number | null,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id,
    nome: `Talhão ${id}`,
    cultura: 'Soja',
    area_ha: 10,
    poligono_geojson: polygon,
    pontos: [
      {
        id: `${id}-p1`,
        identificador: 'P01',
        lat: -16,
        lng: -48,
        infestacoes:
          severity === null
            ? []
            : [
                {
                  id: `${id}-i1`,
                  tipo: 'praga',
                  nome: 'Percevejo-marrom',
                  quantidade: 2,
                  severidade: severity,
                },
              ],
      },
    ],
    ...overrides,
  };
}

function report(talhoes: Record<string, unknown>[]): PayloadMonitoramento {
  return {
    tipo: 'monitoramento',
    fazenda: 'Fazenda Teste',
    safra: '2026/27',
    data: '30/07/2026',
    tecnico: 'Responsável técnico',
    crea: 'CREA 123',
    talhoes,
  };
}

describe('relatório profissional de monitoramento', () => {
  it('1. ordena talhões por crítico, alto, atenção e controlado', () => {
    const normalized = normalizeMonitoringReport(
      report([
        rawPlot('controlado', 4),
        rawPlot('critico', 50),
        rawPlot('atencao', 12),
        rawPlot('alto', 30),
      ]),
    );

    expect(
      sortPlotsByRisk(normalized.talhoes).map(
        (assessment) => assessment.classificacao,
      ),
    ).toEqual(['CRITICO', 'ALTO_RISCO', 'ATENCAO', 'CONTROLADO']);
  });

  it('2. agrega os totais da propriedade a partir dos talhões', () => {
    const normalized = normalizeMonitoringReport(
      report([rawPlot('1', 20), rawPlot('2', 40, { area_ha: 12.5 })]),
    );
    const overview = buildMonitoringOverview(normalized);

    expect(overview.areaMonitorada.value).toBe(22.5);
    expect(overview.talhoesAvaliados).toBe(2);
    expect(overview.pontosAmostrados).toBe(2);
    expect(overview.ocorrenciasRegistradas).toBe(2);
    expect(overview.severidadeMedia.value).toBe(30);
  });

  it('3. trata relatório sem talhões sem diagnóstico inventado', () => {
    const normalized = normalizeMonitoringReport(report([]));
    const overview = buildMonitoringOverview(normalized);

    expect(overview.talhoesAvaliados).toBe(0);
    expect(overview.areaMonitorada.value).toBeNull();
    expect(overview.diagnostic).toContain('nenhum talhão informado');
  });

  it('4. trata talhão sem pontos como sem dados para classificação', () => {
    const plot = normalizeMonitoringPlot(
      rawPlot('vazio', null, { pontos: [] }),
    );
    const assessment = assessMonitoringPlot(plot);

    expect(assessment.totalPontos).toBe(0);
    expect(assessment.indiceOcorrencia).toBeNull();
    expect(assessment.classificacao).toBeNull();
  });

  it('5. limita ausência de ocorrências aos pontos avaliados', () => {
    const normalized = normalizeMonitoringReport(
      report([rawPlot('sem-ocorrencia', null)]),
    );
    const overview = buildMonitoringOverview(normalized);
    const conclusion = buildTechnicalConclusion(
      normalized,
      sortPlotsByRisk(normalized.talhoes),
      overview,
      [],
    );

    expect(overview.ocorrenciasRegistradas).toBe(0);
    expect(conclusion.join(' ')).toContain('se limita às amostras avaliadas');
    expect(conclusion.join(' ')).not.toContain('inexist');
  });

  it('6. preserva clima ausente como não informado', () => {
    const plot = normalizeMonitoringPlot(rawPlot('1', 10));

    expect(plot.condicoes_climaticas).toBeUndefined();
    expect(plot.disponibilidade.temperatura).toBe('not_informed');
    expect(plot.disponibilidade.umidade).toBe('not_informed');
    expect(plot.disponibilidade.chuva).toBe('not_informed');
  });

  it('7. preserva produto e dose ausentes como nulos no plano', () => {
    const normalized = normalizeMonitoringReport(
      report([
        rawPlot('1', 35, {
          recomendacoes: [
            {
              nivel: 'ALTO_RISCO',
              organismo: 'Percevejo-marrom',
              acao: 'Reavaliar os pontos afetados.',
              pontos: ['P01'],
            },
          ],
        }),
      ]),
    );
    const actions = buildPriorityActions(sortPlotsByRisk(normalized.talhoes));

    expect(actions).toHaveLength(1);
    expect(actions[0].produto).toBeNull();
    expect(actions[0].dose).toBeNull();
  });

  it('8. não cria recomendações genéricas para preencher layout', () => {
    const normalized = normalizeMonitoringReport(report([rawPlot('1', 35)]));

    expect(buildPriorityActions(sortPlotsByRisk(normalized.talhoes))).toEqual(
      [],
    );
  });

  it('9. diferencia zero real de dado ausente', () => {
    const zero = normalizeMonitoringPlot(
      rawPlot('zero', 0, {
        area_ha: 0,
        condicoes_climaticas: { temperatura: 0, umidade: 0, chuva: 'Sem chuva' },
      }),
    );
    const absent = normalizeMonitoringPlot(
      rawPlot('ausente', 10, {
        area_ha: undefined,
        condicoes_climaticas: {},
      }),
    );

    expect(zero.disponibilidade.area).toBe('payload');
    expect(zero.disponibilidade.temperatura).toBe('payload');
    expect(absent.disponibilidade.area).toBe('not_informed');
    expect(absent.disponibilidade.temperatura).toBe('not_informed');
    expect(formatNullableMetric(0, String)).toBe('0');
    expect(formatNullableMetric(null, String)).toBe('—');
  });

  it('10. remove imagens duplicadas ignorando query string', () => {
    const result = deduplicateReportImages([
      { url: 'https://cdn.exemplo/foto.jpg?token=1', ponto: 'P01' },
      { url: 'https://cdn.exemplo/foto.jpg?token=2', ponto: 'P02' },
      { url: 'https://cdn.exemplo/outra.jpg', ponto: 'P03' },
    ]);

    expect(result).toHaveLength(2);
  });

  it('11. conclusão utiliza somente dados e conduta registrados', () => {
    const normalized = normalizeMonitoringReport(
      report([
        rawPlot('14', 42, {
          recomendacoes: [
            {
              nivel: 'ACAO_IMEDIATA',
              organismo: 'Percevejo-marrom',
              acao: 'Repetir a avaliação.',
              pontos: ['P01'],
              prazo: '48 horas',
            },
          ],
        }),
      ]),
    );
    const assessments = sortPlotsByRisk(normalized.talhoes);
    const overview = buildMonitoringOverview(normalized);
    const actions = buildPriorityActions(assessments);
    const conclusion = buildTechnicalConclusion(
      normalized,
      assessments,
      overview,
      actions,
    ).join(' ');

    expect(conclusion).toContain('Percevejo-marrom');
    expect(conclusion).toContain('Repetir a avaliação');
    expect(conclusion).toContain('P01');
    expect(conclusion).toContain('48 horas');
    expect(conclusion).not.toMatch(/economia|produtividade|perda/i);
  });

  it('12. não compara NDE sem leitura e unidade compatíveis', () => {
    const incomplete: OrganismoContextoWeb = {
      nome: 'Percevejo-marrom',
      referenciaNde: 2,
      referenciaNdeUnidade: 'indivíduos/m²',
      quantidadeMedia: 3,
    };
    const complete: OrganismoContextoWeb = {
      ...incomplete,
      densidadeIndM2: 3,
    };

    expect(assessNdeComparison(incomplete)).toMatchObject({
      canCompare: false,
      ratio: null,
    });
    expect(assessNdeComparison(incomplete).message).toContain(
      'Dados insuficientes',
    );
    expect(assessNdeComparison(complete)).toMatchObject({
      canCompare: true,
      ratio: 1.5,
    });
  });

  it('13. produz modelo completo com um talhão', () => {
    const normalized = normalizeMonitoringReport(report([rawPlot('1', 15)]));
    const assessments = sortPlotsByRisk(normalized.talhoes);

    expect(normalized.talhoes).toHaveLength(1);
    expect(assessments[0].principalOcorrencia?.organismo).toBe(
      'Percevejo-marrom',
    );
  });

  it('14. produz modelo ordenado com vários talhões', () => {
    const normalized = normalizeMonitoringReport(
      report([rawPlot('1', 5), rawPlot('2', 45), rawPlot('3', 28)]),
    );
    const assessments = sortPlotsByRisk(normalized.talhoes);

    expect(assessments).toHaveLength(3);
    expect(assessments.map((item) => item.talhao.id)).toEqual(['2', '3', '1']);
  });

  it('15. mantém estrutura necessária para exportar cada talhão', () => {
    const normalized = normalizeMonitoringReport(
      report([rawPlot('1', 15), rawPlot('2', null)]),
    );
    const exportRows = normalized.talhoes.flatMap((talhao) =>
      talhao.pontos.flatMap((ponto) =>
        ponto.infestacoes.map((infestacao) => [
          ponto.identificador,
          infestacao.tipo,
          infestacao.nome,
          infestacao.quantidadeInformada
            ? infestacao.quantidade
            : 'Não informado',
          infestacao.severidadeInformada
            ? infestacao.severidade
            : 'Não informado',
        ]),
      ),
    );

    expect(exportRows).toEqual([
      ['P01', 'praga', 'Percevejo-marrom', 2, 15],
    ]);
  });
});
