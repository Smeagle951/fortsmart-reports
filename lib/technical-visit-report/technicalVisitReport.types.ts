export type TechnicalVisitSeverity = 'low' | 'medium' | 'high' | 'critical' | 'unknown';

export type TechnicalVisitField = {
  label: string;
  value: string;
};

export type TechnicalVisitKpi = {
  label: string;
  value: string;
  detail?: string;
  tone: 'neutral' | 'success' | 'info' | 'warning' | 'danger';
};

export type TechnicalVisitGeoPoint = {
  id?: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  type?: string;
  severity?: string;
  date?: string;
  imageUrl?: string;
  recommendation?: string;
};

export type TechnicalVisitPhoto = {
  url?: string;
  localPath?: string;
  description?: string;
  category?: string;
  date?: string;
  plotName?: string;
  latitude?: number;
  longitude?: number;
  occurrenceName?: string;
};

export type TechnicalVisitOccurrence = {
  id?: string;
  type?: string;
  name: string;
  incidence?: string;
  severity?: string;
  severityTone: TechnicalVisitSeverity;
  status?: string;
  priority?: string;
  risk?: string;
  observation?: string;
  recommendation?: string;
  probableCause?: string;
  affectedArea?: string;
  responsible?: string;
  deadline?: string;
  latitude?: number;
  longitude?: number;
  photos: TechnicalVisitPhoto[];
};

export type TechnicalVisitRecommendation = {
  text: string;
  type?: string;
  priority?: string;
  deadline?: string;
  responsible?: string;
  occurrence?: string;
};

export type TechnicalVisitAction = {
  action: string;
  priority?: string;
  deadline?: string;
  responsible?: string;
  status?: string;
  source?: string;
};

export type TechnicalVisitTimelineItem = {
  label: string;
  date: string;
  detail?: string;
};

export type TechnicalVisitDecisionChip = {
  label: string;
  value: string;
  tone: 'neutral' | 'success' | 'info' | 'warning' | 'danger';
};

export type TechnicalVisitReport = {
  id?: string;
  reportKey?: string;
  title: string;
  farmName: string;
  plotName: string;
  cropName?: string;
  seasonName?: string;
  visitDate?: string;
  generatedAt?: string;
  technicianName?: string;
  technicianCrea?: string;
  status?: string;
  visitType?: string;
  objective?: string;
  city?: string;
  state?: string;
  ownerName?: string;
  areaHa?: string;
  phenologicalStage?: string;
  areaCondition?: string;
  heroImage?: string;
  polygon?: [number, number][];
  points: TechnicalVisitGeoPoint[];
  photos: TechnicalVisitPhoto[];
  occurrences: TechnicalVisitOccurrence[];
  recommendations: TechnicalVisitRecommendation[];
  actions: TechnicalVisitAction[];
  timeline: TechnicalVisitTimelineItem[];
  farmFields: TechnicalVisitField[];
  visitFields: TechnicalVisitField[];
  fieldConditionFields: TechnicalVisitField[];
  identificationRows: TechnicalVisitField[];
  operationRows: TechnicalVisitField[];
  decisionPanel: TechnicalVisitDecisionChip[];
  kpis: TechnicalVisitKpi[];
  conclusion?: string;
  diagnosis?: {
    mainProblem?: string;
    probableCause?: string;
    risk?: string;
    urgency?: string;
    observations?: string;
  };
  rawDebugIds: {
    farmId?: string;
    plotId?: string;
    seasonId?: string;
    cropId?: string;
  };
};
