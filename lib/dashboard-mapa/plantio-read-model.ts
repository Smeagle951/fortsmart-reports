/**
 * Camada de leitura do GeoJSON exportado pelo Plantio (KML/GeoJSON).
 * Não recalcula KPIs — só normaliza props + blocos JSON em `properties`.
 */

export type PlantioProductRow = {
  name: string;
  class: string;
  dose: string;
  unit: string;
  purpose: string;
  costPerHa: string;
  costTotal: string;
  provenance: string;
};

export type ManejoStage = {
  stage: string;
  status: string;
  date: string | null;
  summary: string | null;
  areaHa: number | null;
  operationId: string | null;
  operationCostPerHa: number | null;
  operationCostIsAdditional: boolean;
  products: PlantioProductRow[];
};

export type AgronomicRead = {
  plantingDate: string | null;
  emergenceDate: string | null;
  dap: number | null;
  dae: number | null;
  standMeasured: number | null;
  standTarget: number | null;
  seedsPerHa: number | null;
  phaseLabel: string | null;
  vigor: string | null;
  productivity: number | null;
  status: string | null;
};

export type EvaluationRead = {
  date: string | null;
  plantsMeasured: number | null;
  measuredLengthM: number | null;
  rowSpacingM: number | null;
  calculatedPopulation: number | null;
  averagePlantsPerMeter: number | null;
  germinationPct: number | null;
  vigor: string | null;
  uniformity: string | null;
  cvPct: number | null;
  phenology: string | null;
  pests: string | null;
  diseases: string | null;
  weeds: string | null;
  notes: string | null;
};

export type HarvestRead = {
  date: string | null;
  areaHa: number | null;
  production: number | null;
  productionUnit: string | null;
  productivity: number | null;
  productivityUnit: string | null;
  moisturePct: number | null;
  impurityPct: number | null;
  economicResult: number | null;
};

export type ComparisonAb = {
  linked: boolean;
  evaluationId?: string;
  title?: string;
  peerLabel?: string;
};

export type RecentActivity = {
  type: string;
  date: string;
  summary: string;
};

export type PlantioFeatureReadModel = {
  tipo: 'talhao' | 'subarea';
  talhaoId: string;
  subareaId: string | null;
  displayName: string;
  parentTalhaoName: string | null;
  cultura: string;
  safra: string;
  material: string;
  areaHa: number | null;
  tipoManejo: string | null;
  agronomic: AgronomicRead;
  evaluation: EvaluationRead;
  harvest: HarvestRead;
  manejoStages: ManejoStage[];
  productsTable: PlantioProductRow[];
  comparisonAb: ComparisonAb;
  recentActivities: RecentActivity[];
};

function emptyEvaluation(): EvaluationRead {
  return {
    date: null, plantsMeasured: null, measuredLengthM: null, rowSpacingM: null,
    calculatedPopulation: null, averagePlantsPerMeter: null, germinationPct: null,
    vigor: null, uniformity: null, cvPct: null, phenology: null, pests: null,
    diseases: null, weeds: null, notes: null,
  };
}

function evaluationFromProps(p: Record<string, unknown>): EvaluationRead {
  const raw = parseJsonBlock<Record<string, unknown>>(p.evaluation_read);
  if (!raw) return emptyEvaluation();
  return {
    date: asText(raw.date),
    plantsMeasured: asNumber(raw.plants_measured),
    measuredLengthM: asNumber(raw.measured_length_m),
    rowSpacingM: asNumber(raw.row_spacing_m),
    calculatedPopulation: asNumber(raw.calculated_population),
    averagePlantsPerMeter: asNumber(raw.average_plants_per_meter),
    germinationPct: asNumber(raw.germination_pct),
    vigor: asText(raw.vigor),
    uniformity: asText(raw.uniformity),
    cvPct: asNumber(raw.cv_pct),
    phenology: asText(raw.phenology),
    pests: asText(raw.pests),
    diseases: asText(raw.diseases),
    weeds: asText(raw.weeds),
    notes: asText(raw.notes),
  };
}

function harvestFromProps(p: Record<string, unknown>): HarvestRead {
  const raw = parseJsonBlock<Record<string, unknown>>(p.harvest_read);
  return {
    date: asText(raw?.date),
    areaHa: asNumber(raw?.area_ha),
    production: asNumber(raw?.production),
    productionUnit: asText(raw?.production_unit),
    productivity: asNumber(raw?.productivity),
    productivityUnit: asText(raw?.productivity_unit),
    moisturePct: asNumber(raw?.moisture_pct),
    impurityPct: asNumber(raw?.impurity_pct),
    economicResult: asNumber(raw?.economic_result),
  };
}

function asText(v: unknown): string | null {
  const s = v == null ? '' : String(v).trim();
  return s || null;
}

function asNumber(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseJsonBlock<T>(v: unknown): T | null {
  if (v == null) return null;
  if (typeof v === 'object') return v as T;
  if (typeof v === 'string') {
    try {
      return JSON.parse(v) as T;
    } catch {
      return null;
    }
  }
  return null;
}

function formatDatePt(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(`${iso.split('T')[0]}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR');
}

function mapProduct(raw: Record<string, unknown>): PlantioProductRow {
  return {
    name: asText(raw.name) ?? '—',
    class: asText(raw.class ?? raw.classe) ?? '—',
    dose: asText(raw.dose) ?? '—',
    unit: asText(raw.unit ?? raw.unidade) ?? '—',
    purpose: asText(raw.purpose ?? raw.finalidade) ?? '—',
    costPerHa:
      raw.cost_per_ha != null
        ? String(raw.cost_per_ha)
        : raw.custo_ha != null
          ? String(raw.custo_ha)
          : '—',
    costTotal:
      raw.cost_total != null
        ? String(raw.cost_total)
        : raw.custo_total != null
          ? String(raw.custo_total)
          : '—',
    provenance: asText(raw.provenance ?? raw.source) ?? 'registrado',
  };
}

function mapStage(raw: Record<string, unknown>): ManejoStage {
  const productsRaw = raw.products;
  const products = Array.isArray(productsRaw)
    ? productsRaw
        .map((p) => mapProduct((p ?? {}) as Record<string, unknown>))
        .filter((p) => isActualProduct(p.provenance) || asText(raw.operation_id) != null)
    : [];
  return {
    stage: asText(raw.stage) ?? 'etapa',
    status: asText(raw.status) ?? 'Sem registro',
    date: asText(raw.date),
    summary: asText(raw.summary),
    areaHa: asNumber(raw.area_ha ?? raw.areaHa),
    operationId: asText(raw.operation_id ?? raw.operationId),
    operationCostPerHa: asNumber(raw.operation_cost_per_ha ?? raw.custo_operacao_ha),
    operationCostIsAdditional: raw.operation_cost_excludes_products === true,
    products,
  };
}

function isActualProduct(provenance: string): boolean {
  return ['aplicacao', 'farm_operation', 'operation', 'product_application']
    .includes(provenance.trim().toLowerCase());
}

export function recordedManejoStages(stages: ManejoStage[]): ManejoStage[] {
  return stages.filter((stage) => {
    const status = stage.status.toLowerCase();
    if (status.includes('pendente') || status.includes('sem registro') || status.includes('planejado')) return false;
    return stage.operationId != null || stage.products.length > 0 ||
      stage.date != null || stage.summary != null;
  });
}

export function moneyNumber(value: string | null | undefined): number | null {
  if (!value || value === '—') return null;
  const cleaned = value.replace(/R\$|\s/g, '');
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned;
  const number = Number(normalized);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function moneyDisplay(value: string | number | null | undefined): string {
  const number = typeof value === 'number' ? value : moneyNumber(value);
  return number == null ? 'Custo não informado' :
    number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function manejoCostSummary(model: PlantioFeatureReadModel) {
  const stages = recordedManejoStages(model.manejoStages);
  const products = stages.flatMap((stage) => stage.products.map((product) => ({ stage, product })));
  const productTotals = products.map(({ stage, product }) =>
    moneyNumber(product.costTotal) ??
    (stage.areaHa != null && moneyNumber(product.costPerHa) != null
      ? stage.areaHa * moneyNumber(product.costPerHa)!
      : null));
  const productPerHa = model.areaHa != null && model.areaHa > 0 &&
    productTotals.length > 0 && productTotals.every((cost) => cost != null)
      ? productTotals.reduce<number>((sum, cost) => sum + (cost ?? 0), 0) / model.areaHa
      : null;
  const operationCosts = stages.filter((stage) => stage.operationCostPerHa != null);
  const operationPerHa = model.areaHa != null && model.areaHa > 0 &&
    operationCosts.length > 0 && operationCosts.every((stage) => stage.areaHa != null)
      ? operationCosts.reduce((sum, stage) => sum + stage.operationCostPerHa! * stage.areaHa!, 0) / model.areaHa
      : null;
  const costsAreAdditive = operationCosts
    .every((stage) => stage.operationCostIsAdditional);
  const totalPerHa = productPerHa != null && operationPerHa != null && costsAreAdditive
    ? productPerHa + operationPerHa : null;
  return {
    productPerHa,
    operationPerHa,
    totalPerHa,
    total: totalPerHa != null && model.areaHa != null ? totalPerHa * model.areaHa : null,
  };
}

function agronomicFromProps(p: Record<string, unknown>): AgronomicRead {
  const embedded = parseJsonBlock<Record<string, unknown>>(p.agronomic_read);
  if (embedded) {
    return {
      plantingDate: asText(embedded.planting_date),
      emergenceDate: asText(embedded.emergence_date),
      dap: asNumber(embedded.dap),
      dae: asNumber(embedded.dae),
      standMeasured: asNumber(embedded.stand_measured),
      standTarget: asNumber(embedded.stand_target),
      seedsPerHa: asNumber(embedded.seeds_per_ha),
      phaseLabel: asText(embedded.phase_label),
      vigor: asText(embedded.vigor ?? p.vigor),
      productivity: asNumber(embedded.productivity ?? p.produtividade),
      status: asText(embedded.status),
    };
  }

  const dap = asNumber(p.dap);
  const daeRaw = p.dae;
  const dae =
    daeRaw != null && daeRaw !== '' && asNumber(daeRaw) != null ? asNumber(daeRaw) : null;

  const standMeasured = asNumber(
    p.estande_pl_ha ?? p.plantas_por_ha ?? p.estande_atual ?? p.populacao_final,
  );
  const standTarget = asNumber(p.populacao_planejada ?? p.estande_inicial);

  return {
    plantingDate: asText(p.data_plantio),
    emergenceDate: asText(p.data_emergencia),
    dap,
    dae,
    standMeasured,
    standTarget,
    seedsPerHa: standTarget ?? standMeasured,
    phaseLabel: asText(p.estadio_fenologico ?? p.fenologia),
    vigor: asText(p.vigor),
    productivity: asNumber(p.produtividade),
    status: asText(p.status),
  };
}

export function parsePlantioFeatureProperties(
  properties: Record<string, unknown> | null | undefined,
): PlantioFeatureReadModel | null {
  if (!properties) return null;
  const tipoRaw = String(properties.tipo ?? 'talhao');
  const isSub = tipoRaw === 'subarea';
  const talhaoId = asText(properties.talhao_id) ?? '';
  if (!talhaoId) return null;

  const manejoRaw = parseJsonBlock<unknown[]>(properties.manejo_stages);
  const manejoStages = Array.isArray(manejoRaw)
    ? manejoRaw.map((s) => mapStage((s ?? {}) as Record<string, unknown>))
    : [];

  // `products_table` legado pode conter insumos apenas planejados. A Web
  // apresenta somente itens vinculados a uma operação registrada.
  const productsTable = recordedManejoStages(manejoStages)
    .flatMap((stage) => stage.products);

  const compRaw = parseJsonBlock<Record<string, unknown>>(properties.comparison_ab);
  const comparisonAb: ComparisonAb = compRaw
    ? {
        linked: compRaw.linked === true,
        evaluationId: asText(compRaw.evaluation_id) ?? undefined,
        title: asText(compRaw.title) ?? undefined,
        peerLabel: asText(compRaw.peer_label) ?? undefined,
      }
    : { linked: false };

  const actRaw = parseJsonBlock<unknown[]>(properties.recent_activities);
  const recentActivities = Array.isArray(actRaw)
    ? actRaw
        .map((a) => {
          const o = (a ?? {}) as Record<string, unknown>;
          const date = asText(o.date);
          const summary = asText(o.summary);
          const type = asText(o.type);
          if (!date || !summary || !type) return null;
          return { type, date, summary };
        })
        .filter((x): x is RecentActivity => x != null)
    : [];

  const material =
    asText(properties.material ?? properties.variedade ?? properties.hibrido) ?? '—';

  return {
    tipo: isSub ? 'subarea' : 'talhao',
    talhaoId,
    subareaId: isSub ? asText(properties.subarea_id) : null,
    displayName: asText(
      isSub
        ? properties.label_manejo ?? properties.name ?? properties.talhao
        : properties.talhao ?? properties.name ?? properties.talhao_nome,
    ) ?? '—',
    parentTalhaoName: isSub ? asText(properties.parent_talhao_nome) : null,
    cultura: asText(properties.cultura) ?? '—',
    safra: asText(properties.safra) ?? '—',
    material,
    areaHa: asNumber(properties.area_ha),
    tipoManejo: isSub ? asText(properties.tipo_manejo ?? properties.subtipo) : null,
    agronomic: agronomicFromProps(properties),
    evaluation: evaluationFromProps(properties),
    harvest: harvestFromProps(properties),
    manejoStages,
    productsTable,
    comparisonAb,
    recentActivities,
  };
}

export function standDisplay(measured: number | null, target: number | null): string {
  if (measured != null && measured > 0) {
    return `${Math.round(measured).toLocaleString('pt-BR')} plantas/ha`;
  }
  return 'Sem avaliação';
}

export function dapDisplay(dap: number | null): string {
  return dap != null && dap >= 0 ? String(dap) : '—';
}

export function daeDisplay(dae: number | null): string {
  return dae != null && dae >= 0 ? String(dae) : '—';
}

export function plantingDateDisplay(iso: string | null): string {
  return formatDatePt(iso);
}

export function subareaStatusDisplay(raw: string | null): string {
  switch (raw?.trim().toLowerCase()) {
    case 'draft': return 'Rascunho';
    case 'final': return 'Cadastrada';
    case 'ativo': return 'Ativa';
    default: return raw?.trim() || 'Status não informado';
  }
}

export function featurePropsFromCollection(
  fc: { features: { properties?: Record<string, unknown> | null }[] } | null,
  talhaoId: string,
  subareaId: string | null,
): Record<string, unknown> | null {
  if (!fc) return null;
  for (const f of fc.features) {
    const p = f.properties as Record<string, unknown> | null | undefined;
    if (!p) continue;
    if (subareaId) {
      if (String(p.tipo) === 'subarea' && String(p.subarea_id ?? '') === subareaId) return p;
    } else if (String(p.tipo) === 'talhao' && String(p.talhao_id ?? '') === talhaoId) return p;
  }
  return null;
}
