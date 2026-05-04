export type MapEventPinKind = 'pest_high' | 'pest_med' | 'disease' | 'normal';

export type DashboardNavId =
  | 'resumo'
  | 'talhoes'
  | 'monitoramento'
  | 'atividades'
  | 'relatorios'
  | 'insumos'
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

export type TimelineEventType =
  | 'monitoramento'
  | 'plantio'
  | 'aplicacao'
  | 'pulverizacao'
  | 'colheita'
  | 'chuva'
  | 'foto'
  | 'ndvi';

export type DashboardTimelineEvent = {
  id: string;
  sourceEventId?: string;
  type: TimelineEventType;
  dateIso: string;
  talhaoLabel: string;
  areaLabel?: string;
  title: string;
  description: string;
  severity?: MonitorEventSeverity;
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
