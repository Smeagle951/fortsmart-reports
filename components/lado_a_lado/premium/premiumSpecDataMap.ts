/**
 * Mapeamento conceitual: especificação HTML (Premium / DTO ideal) → campos reais de `SideBySideReportData`.
 * O JSON publicado pelo app segue o contrato em `SideBySideReportContent.tsx`, não o modelo Dart simplificado do doc.
 *
 * | Bloco spec              | Origem no payload web |
 * |-------------------------|------------------------|
 * | Capa / EvaluationMetaDto | `farm`, `meta`, `coleta` |
 * | Hero side A/B           | `sideA`/`sideB` (`label`/`name`/`observations[]` vêm do export `treatments[]`: testemunha, notas, protocolo) |
 * | KPIs strip              | `sideA.kpis`, `sideB.kpis`, `custo`, `decision_layer.metrics` |
 * | Radar / barras          | `buildPremiumRadarRows` ← KPIs/fenologia; gráficos no `ExecutiveDeckSection` |
 * | Tabela critérios        | `criteriosEstatistica` |
 * | Econômico               | `economia`, `colheita`, `custo`, `decision_layer.roiBySide`, `economic_timeline` |
 * | Decisão / vencedor      | `decision_layer.engineOverallWinner`, `conclusion.winner`, `decision_layer.summaryLines` |
 * | Confiança               | `meta.confidenceScore`, `meta.missingData`, CV em `criteriosEstatistica` |
 * | Timeline                | `applications`, `aplicacoes`, `coleta` |
 * | Conclusão               | `conclusion`, `resumo` |
 *
 * Extensões futuras (opcional, plano fase 4): `why_win[]`, `score_breakdown[]`, alertas textuais canónicos no mapper Dart.
 */
export const PREMIUM_SPEC_SCHEMA_VERSION = 1 as const;
