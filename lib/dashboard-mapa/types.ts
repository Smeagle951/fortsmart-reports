export type MapEventPinKind = 'pest_high' | 'pest_med' | 'disease' | 'normal';

export type DashboardNavId =
  | 'resumo'
  | 'talhoes'
  | 'monitoramento'
  | 'atividades'
  | 'relatorios'
  | 'insumos'
  | 'clima'
  | 'config';

export type MonitorEventSeverity = 'alto' | 'medio' | 'baixo' | 'normal';

export type MonitorEventType = 'praga' | 'doenca' | 'normal';

export type DashboardMonitorEvent = {
  id: string;
  title: string;
  /** Nome científico ou código, opcional */
  subtitle?: string;
  talhaoLabel: string;
  areaLabel?: string;
  lat: number;
  lng: number;
  pinKind: MapEventPinKind;
  severity: MonitorEventSeverity;
  type: MonitorEventType;
  dateIso: string;
  evaluator: string;
  observation: string;
  imageUrl: string;
  /** Atributos agronómicos exibidos no painel */
  specs: { label: string; value: string }[];
};

export type DashboardTimelineEvent = {
  id: string;
  /** Quando vem de monitoramento, referencia o evento original */
  sourceEventId?: string;
  type: 'monitoramento' | 'plantio' | 'foto';
  dateIso: string;
  talhaoLabel: string;
  areaLabel?: string;
  title: string;
  description: string;
  severity?: MonitorEventSeverity;
  /** label curto em caps (ex.: ALTO/MÉDIO/BAIXO/NORMAL, PLANTIO, FOTO) */
  status?: string;
  imageUrl?: string;
};

export type PropertyAlert = {
  id: string;
  message: string;
  talhaoLabel: string;
  tone: 'danger' | 'warning' | 'info';
};

export type PropertySummary = {
  totalHa: number;
  talhaoCount: number;
  subareaCount: number;
  eventsLast7Days: number;
};
