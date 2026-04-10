import type { ReactNode } from 'react';

/** Configuração de uma aba do relatório executivo (id estável para URL/print). */
export type ReportTabDefinition<T extends string = string> = {
  readonly id: T;
  readonly label: string;
};

export type ReportExecutivePeopleChip = {
  readonly name: string;
  readonly initials: string;
};

export type ReportExecutiveShellProps<T extends string> = {
  /** Título principal (ex.: RELATÓRIO X) */
  title: string;
  /** Subtítulo curto (produto / origem dos dados) */
  subtitle?: string;
  /** Abas visíveis na navegação; ordem = ordem de leitura no PDF */
  tabs: readonly ReportTabDefinition<T>[];
  /** Conteúdo por aba — TypeScript exige chave para cada `tabs[].id` quando usar `satisfies` */
  slots: Record<T, ReactNode>;
  /** Aba inicial (default: primeira de `tabs`) */
  defaultTab?: T;
  /** Faixa de contexto abaixo do título (metadados, ícones, chips) */
  contextRow?: ReactNode;
  /** Até N responsáveis com avatar iniciais */
  people?: readonly ReportExecutivePeopleChip[];
  /** Linha final (versão, id, auditoria) */
  footerAudit?: ReactNode;
  onPrint?: () => void;
  onExportPdf?: () => void;
  /** Classes no wrapper externo */
  className?: string;
  /** id do elemento raiz (testes / analytics) */
  shellId?: string;
};
