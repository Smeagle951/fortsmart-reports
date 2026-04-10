/**
 * Tipos e leitura segura dos blocos colheita / custo do relatório lado a lado.
 */

export type ColheitaSidePayload = {
  side?: string;
  sideName?: string;
  yieldKgHa?: number;
  yieldScHa?: number;
  areaHa?: number;
  netWeightKg?: number;
  moisturePct?: number;
  impurityPct?: number;
  pmsG?: number;
  harvestDate?: string;
  notes?: string;
  linkedToHarvestModule?: boolean;
};

export type ColheitaPayload = {
  kgPerSack?: number;
  sides?: ColheitaSidePayload[];
};

export type CustoItemPayload = {
  category?: string;
  productName?: string;
  unitCost?: number;
  unit?: string;
  qty?: number;
  itemTotal?: number;
  dosePerHa?: number;
  doseUnit?: string;
  notes?: string;
};

export type CustoSidePayload = {
  side?: string;
  sideName?: string;
  totalCost?: number;
  costPerHa?: number;
  source?: string;
  currency?: string;
  items?: CustoItemPayload[];
};

export type CustoPayload = {
  by_side?: CustoSidePayload[];
  deltaCostPerHa_B_vs_A?: number;
};

/** Alinhado ao export Flutter: `preco_saca_brl`, `fonte_preco`. */
export type EconomiaPayload = {
  precoSacaBrl: number;
  fontePreco: string;
};

/** Fallback quando o payload não traz `economia` (relatórios antigos). */
export const REFERENCE_SACK_PRICE_BRL_DEFAULT = 130;

export function readColheitaPayload(raw: unknown): ColheitaPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const sides = o.sides;
  if (!Array.isArray(sides) || sides.length === 0) return null;
  return {
    kgPerSack: typeof o.kgPerSack === 'number' ? o.kgPerSack : 60,
    sides: sides as ColheitaSidePayload[],
  };
}

export function readCustoPayload(raw: unknown): CustoPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const bySide = o.by_side;
  if (!Array.isArray(bySide) || bySide.length === 0) return null;
  return {
    by_side: bySide as CustoSidePayload[],
    deltaCostPerHa_B_vs_A:
      typeof o.deltaCostPerHa_B_vs_A === 'number' ? o.deltaCostPerHa_B_vs_A : undefined,
  };
}

export function readEconomiaPayload(raw: unknown): EconomiaPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const p = o.preco_saca_brl ?? o.preco_saca;
  const num = typeof p === 'number' ? p : typeof p === 'string' ? parseFloat(p) : NaN;
  if (!Number.isFinite(num) || num <= 0) return null;
  const fonte =
    o.fonte_preco != null && String(o.fonte_preco).trim() !== ''
      ? String(o.fonte_preco).trim()
      : 'padrao_sistema';
  return { precoSacaBrl: num, fontePreco: fonte };
}

/** Diferença B−A em sacas/ha quando há dois lados com colheita. */
export function colheitaScHaDiff(colheita: ColheitaPayload | null): number | null {
  if (!colheita?.sides || colheita.sides.length < 2) return null;
  const a = colheita.sides.find((s) => s.side === 'A');
  const b = colheita.sides.find((s) => s.side === 'B');
  const scA = a?.yieldScHa;
  const scB = b?.yieldScHa;
  if (scA == null || scB == null) return null;
  return scB - scA;
}
