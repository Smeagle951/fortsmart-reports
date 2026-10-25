import { describe, expect, it } from 'vitest';

import {
  daeDisplay,
  manejoCostSummary,
  moneyDisplay,
  parsePlantioFeatureProperties,
  recordedManejoStages,
} from '@/lib/dashboard-mapa/plantio-read-model';

describe('plantio-read-model', () => {
  it('DAE ausente permanece —', () => {
    const model = parsePlantioFeatureProperties({
      tipo: 'talhao',
      talhao_id: 't1',
      talhao: 'Pivô 1',
      cultura: 'Soja',
      safra: '2026/27',
      dap: 12,
      data_plantio: '2026-09-16',
    });
    expect(model).not.toBeNull();
    expect(daeDisplay(model!.agronomic.dae)).toBe('—');
    expect(model!.agronomic.dap).toBe(12);
  });

  it('não inventa produto pelo nome nem usa tabela solta de insumos planejados', () => {
    const model = parsePlantioFeatureProperties({
      tipo: 'subarea', talhao_id: 't1', subarea_id: 's1',
      label_manejo: 'A · SOIL SET + ACTIVE', area_ha: 56.41,
      products_table: [{ name: 'SOIL SET', dose: '1', unit: 'L/ha', provenance: 'subarea_manejo_product' }],
      manejo_stages: [{ stage: 'sulco', status: 'Registrado',
        products: [{ name: 'ACTIVE', dose: '0.5', unit: 'L/ha', provenance: 'subarea_manejo_product' }] }],
    });
    expect(model?.productsTable).toEqual([]);
    expect(recordedManejoStages(model!.manejoStages)).toEqual([]);
    expect(manejoCostSummary(model!).totalPerHa).toBeNull();
  });

  it('mantém produto real dentro da operação e custo ausente como desconhecido', () => {
    const model = parsePlantioFeatureProperties({
      tipo: 'subarea', talhao_id: 't1', subarea_id: 's1', area_ha: 10,
      manejo_stages: [{ stage: 'aplicacoes', status: 'Registrado', date: '2026-09-25',
        operation_id: 'op-1', products: [
          { name: 'Active', class: 'Biológico', dose: '0,50', unit: 'L/ha',
            purpose: 'Sulco', cost_per_ha: '22,50', cost_total: '225,00', provenance: 'farm_operation' },
        ] }],
    })!;
    expect(model.productsTable).toHaveLength(1);
    expect(model.manejoStages[0].products[0].unit).toBe('L/ha');
    expect(manejoCostSummary(model).productPerHa).toBe(22.5);
    expect(manejoCostSummary(model).totalPerHa).toBeNull();
    expect(moneyDisplay(null)).toBe('Custo não informado');
  });

  it('custo/ha da subárea pondera execução parcial pela área total', () => {
    const model = parsePlantioFeatureProperties({
      tipo: 'subarea', talhao_id: 't1', subarea_id: 's1', area_ha: 50,
      manejo_stages: [{ stage: 'aplicacoes', status: 'Registrado',
        operation_id: 'op-1', area_ha: 10, products: [
          { name: 'Produto A', dose: '1', unit: 'L/ha', cost_total: '100',
            cost_per_ha: '10', provenance: 'farm_operation' },
        ] }],
    })!;
    expect(manejoCostSummary(model).productPerHa).toBe(2);
  });

  it('lê agronomic_read embutido no GeoJSON', () => {
    const model = parsePlantioFeatureProperties({
      tipo: 'subarea',
      talhao_id: 't1',
      subarea_id: 's1',
      agronomic_read: {
        planting_date: '2026-09-16',
        emergence_date: '2026-09-20',
        dap: 12,
        dae: 8,
        stand_measured: 278000,
        stand_target: 280000,
      },
      manejo_stages: [
        {
          stage: 'semeadura',
          status: 'Registrado',
          date: '2026-09-16',
          products: [],
        },
      ],
      comparison_ab: { linked: true, title: 'Teste A×B' },
    });
    expect(model?.agronomic.dae).toBe(8);
    expect(model?.comparisonAb.linked).toBe(true);
    expect(model?.manejoStages.length).toBe(1);
  });

  it('talhão sem subárea mantém painel agronômico sem inventar parcela', () => {
    const model = parsePlantioFeatureProperties({
      tipo: 'talhao', talhao_id: 't1', talhao: 'Pivô 1', area_ha: 153.12,
      cultura: 'Soja', safra: '2026/27', material: 'Bálsamo',
      agronomic_read: { planting_date: '2026-09-16', dap: 5, dae: null },
    })!;
    expect(model.tipo).toBe('talhao');
    expect(model.subareaId).toBeNull();
    expect(model.evaluation.calculatedPopulation).toBeNull();
    expect(model.harvest.date).toBeNull();
  });

  it('lê avaliação e colheita somente dos blocos canônicos exportados', () => {
    const model = parsePlantioFeatureProperties({
      tipo: 'subarea', talhao_id: 't1', subarea_id: 's1',
      evaluation_read: {
        date: '2026-09-25', plants_measured: 151, measured_length_m: 10,
        row_spacing_m: 0.5, calculated_population: 302000, cv_pct: 8.4,
        phenology: 'V1',
      },
      harvest_read: {
        date: '2027-01-12', area_ha: 41.56, production: 3100,
        production_unit: 'sc', productivity: 74.59,
        productivity_unit: 'sc/ha', moisture_pct: 13.2, impurity_pct: 1.1,
      },
    })!;
    expect(model.evaluation.plantsMeasured).toBe(151);
    expect(model.evaluation.phenology).toBe('V1');
    expect(model.harvest.productivity).toBe(74.59);
    expect(model.harvest.productivityUnit).toBe('sc/ha');
  });

  it('população alvo nunca vira avaliação de estande', () => {
    const model = parsePlantioFeatureProperties({
      tipo: 'subarea', talhao_id: 't1', subarea_id: 's1',
      agronomic_read: { stand_target: 280000, stand_measured: null },
    })!;
    expect(model.agronomic.standTarget).toBe(280000);
    expect(model.agronomic.standMeasured).toBeNull();
    expect(model.evaluation.calculatedPopulation).toBeNull();
  });

  it('timeline exclui etapa apenas planejada e aceita avaliação real resumida', () => {
    const model = parsePlantioFeatureProperties({
      tipo: 'subarea', talhao_id: 't1', subarea_id: 's1',
      manejo_stages: [
        { stage: 'semeadura', status: 'Planejado', date: '2026-10-15', summary: '280000 sementes/ha' },
        { stage: 'avaliacoes_qualidade', status: 'Registrado', summary: '274000 plantas/ha' },
      ],
    })!;
    expect(recordedManejoStages(model.manejoStages).map((stage) => stage.stage))
      .toEqual(['avaliacoes_qualidade']);
  });
});
