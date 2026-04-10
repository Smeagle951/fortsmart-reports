/**
 * Contrato opcional `analiseAgronomica` (FortSmart app → relatório web).
 * Campos são best-effort; UI deve fazer fallback para plantabilidade/populacao/fenologia flat.
 */

export type UnknownRec = Record<string, unknown>;

export interface PlantioAnaliseImplantacao extends UnknownRec {
  insight?: string;
  populacaoDesejadaPlHa?: number;
  populacaoRealPlHa?: number;
  deltaPopulacaoPct?: number;
  cvPercentual?: number;
  referenciaLinhaTrena?: string;
}

export interface PlantioAnaliseMotor extends UnknownRec {
  riscoProdutivo?: string;
  correlacoes?: Array<{ tipo?: string; mensagem?: string; impactoEstimadoPct?: number }>;
  subscores?: {
    implantacao?: number;
    fenologia?: number;
    operacao?: number;
    geral?: number;
  };
}
