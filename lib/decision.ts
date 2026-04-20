/**
 * Resolução app vs motor — reexporta a implementação única em `decisionLayer.ts`
 * para imports estáveis (`@/lib/decision`).
 */
export {
  resolveDecision,
  type DecisionLayerJson,
  type DecisionReportPayload,
  type DecisionSide,
} from './decisionLayer';
