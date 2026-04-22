/**
 * Contrato mínimo lado a lado (espelhado com `packages/report-contract` e o DTO Flutter).
 * Tipos definidos aqui para o build Next funcionar na Vercel/Render sem `file:` para `../packages/`.
 * Ao alterar, alinhar com `packages/report-contract/src/index.ts`.
 */

export type RoiType = 'real' | 'estimated' | 'unavailable';

export type RoiSideAudit = {
  roi?: number | null;
  roiType: RoiType;
  source?: string | null;
};

export type EconomicAnalysisBlockV1 = {
  schemaVersion?: number;
  pointers?: Record<string, boolean | undefined>;
  roiAudit?: { A?: RoiSideAudit; B?: RoiSideAudit };
  uiLabels?: Record<string, string>;
  dataQuality?: Record<string, unknown>;
  /** Estratégia de categorias de fotos no app (registo visual). */
  photoRegistry?: { schemaVersion?: number; diverseCategories?: boolean };
};

export type ReportMetaV1 = {
  reportId?: string;
  createdAt?: string;
  appVersion?: string;
  generatedBy?: { name?: string; role?: string | null };
  confidenceScore?: number;
  missingData?: string[];
};

export type QualityGateV1 = {
  canPublish: boolean;
  schemaVersion: number;
  warnings: string[];
  sectionVisibility?: Record<string, Record<string, unknown>>;
};
