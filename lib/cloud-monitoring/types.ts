/**
 * Modelo normalizado do GET `/windows/monitoring/:farmId` (FortSmart Cloud).
 * Campos planos (`timeline`, `points`, …) são derivados dos `plots` aninhados.
 */

export type CloudMonitoringRecommendation = {
  simple_text: string | null;
  priority: string | null;
  action_type: string | null;
} | null;

export type CloudMonitoringImage = {
  image_id?: string | null;
  occurrence_id?: string | null;
  monitoring_point_id?: string | null;
  local_id?: string | null;
  file_name?: string | null;
  local_path?: string | null;
  cloud_url?: string | null;
  cloud_storage_key?: string | null;
  cloud_expires_at?: string | null;
  local_file_path?: string | null;
  caption?: string | null;
  taken_at?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type CloudMonitoringOccurrence = {
  occurrence_id: string | null;
  occurrence_local_id: string | null;
  type: string | null;
  name: string | null;
  infestation_level: string | null;
  risk_level: string | null;
  observations: string | null;
  /** GPS próprio da ocorrência (mobile / API); fallback imagem/ponto no mapa. */
  latitude: number | null;
  longitude: number | null;
  images: CloudMonitoringImage[];
  recommendation: CloudMonitoringRecommendation;
};

export type CloudMonitoringPoint = {
  point_id: string | null;
  point_local_id: string | null;
  point_code: string | null;
  latitude: number | null;
  longitude: number | null;
  occurrences: CloudMonitoringOccurrence[];
};

export type CloudMonitoringReport = {
  report_id: string | null;
  report_local_id: string | null;
  monitoring_date: string | null;
  phenological_stage: string | null;
  crop_name: string | null;
  subarea_local_id: string | null;
  subarea_name: string | null;
  summary: Record<string, unknown>;
  points: CloudMonitoringPoint[];
};

export type CloudMonitoringPlot = {
  plot_id: string | null;
  plot_local_id: string | null;
  plot_name: string;
  /** Contorno do talhão (GeoJSON), p.ex. vindo do sync mobile — mapa desktop. */
  plot_geojson?: unknown;
  timeline: CloudMonitoringReport[];
};

export type CloudMonitoringDiagnostics = {
  reports_loaded?: number;
  plots_with_occurrence?: number;
  points_loaded?: number;
  occurrences_loaded?: number;
  images_loaded?: number;
  last_update?: string | null;
} & Record<string, unknown>;

export type CloudMonitoringSummary = {
  farm_id: string | null;
  total_reports: number;
  total_points: number;
  total_occurrences: number;
  total_images: number;
  critical_occurrences: number;
  /** Ocorrências com risco alto (não crítico). */
  high_risk_occurrences: number;
  plots_with_occurrence: number;
  last_update: string | null;
  diagnostics: CloudMonitoringDiagnostics | null;
};

/** Grupo plano para a timeline UI (Talhão → …). */
export type CloudMonitoringTimelineGroup = {
  plot: CloudMonitoringPlot;
  reports: CloudMonitoringReport[];
};

export type CloudMonitoringNormalized = {
  farm_id: string | null;
  summary: CloudMonitoringSummary;
  plots: CloudMonitoringPlot[];
  /** Achado plano: cada relatório com referência ao talhão. */
  timeline: Array<CloudMonitoringReport & { plot: CloudMonitoringPlot }>;
  /** Todos os pontos com referência a relatório e talhão. */
  points: Array<CloudMonitoringPoint & { report: CloudMonitoringReport; plot: CloudMonitoringPlot }>;
  /** Todas as ocorrências com referências. */
  occurrences: Array<
    CloudMonitoringOccurrence & { point: CloudMonitoringPoint; report: CloudMonitoringReport; plot: CloudMonitoringPlot }
  >;
  /** Imagens achatadas (com contexto mínimo). */
  images: Array<
    CloudMonitoringImage & {
      occurrence: CloudMonitoringOccurrence;
      point: CloudMonitoringPoint;
      report: CloudMonitoringReport;
      plot: CloudMonitoringPlot;
    }
  >;
};
