/**
 * Utilitários para imagens de monitoramento vindas da FortSmart Cloud
 * (object storage temporário ~3 dias + metadados no Neon).
 *
 * Uso típico no desktop (Electron): após GET /windows/monitoring/:farmId,
 * 1) persistir cópias em FortSmartData/images/monitoring/…
 * 2) registrar no SQLite local: image_id, occurrence_id, local_file_path, downloaded_at, cloud_url, cloud_expires_at
 * 3) chamar mergeMonitoringImageLocalPath no JSON antes de renderizar.
 */

export const MONITORING_CLOUD_IMAGE_EXPIRED_PT =
  'Imagem expirada na nuvem. Disponível apenas no mobile original.';

export type MonitoringWindowsImage = {
  image_id?: string | null;
  occurrence_id?: string | null;
  monitoring_point_id?: string | null;
  local_id?: string | null;
  file_name?: string | null;
  local_path?: string | null;
  cloud_url?: string | null;
  cloud_storage_key?: string | null;
  cloud_expires_at?: string | null;
  /** Preenchido pelo desktop após download (file:// ou caminho absoluto). */
  local_file_path?: string | null;
  caption?: string | null;
  taken_at?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type MonitoringImageDownloadRow = {
  image_id: string;
  occurrence_id: string | null;
  local_file_path: string;
  downloaded_at: string;
  cloud_url: string | null;
  cloud_expires_at: string | null;
};

function parseIsoMs(iso: string | null | undefined): number | null {
  if (iso == null || String(iso).trim() === '') return null;
  const t = Date.parse(String(iso));
  return Number.isFinite(t) ? t : null;
}

/** True se a janela de 3 dias na URL/objeto cloud já passou (desktop não deve tentar GET). */
export function isMonitoringCloudImageExpired(image: MonitoringWindowsImage, nowMs = Date.now()): boolean {
  const exp = parseIsoMs(image.cloud_expires_at ?? null);
  if (exp == null) return false;
  return nowMs > exp;
}

export function mergeMonitoringImageLocalPath<T extends MonitoringWindowsImage>(
  image: T,
  byImageId: ReadonlyMap<string, MonitoringImageDownloadRow>,
  byLocalId?: ReadonlyMap<string, MonitoringImageDownloadRow>,
): T {
  const id = image.image_id != null ? String(image.image_id) : '';
  const localId = image.local_id != null ? String(image.local_id) : '';
  const row = (id && byImageId.get(id)) || (localId && byLocalId?.get(localId)) || undefined;
  if (!row?.local_file_path) return image;
  return { ...image, local_file_path: row.local_file_path };
}

export type MonitoringImageDisplayMode = 'local_file' | 'cloud_url' | 'expired' | 'pending_cloud';

/**
 * Define como a UI deve tratar a imagem (regra 9 e 10 do produto).
 */
export function getMonitoringImageDisplayMode(image: MonitoringWindowsImage, nowMs = Date.now()): MonitoringImageDisplayMode {
  const local = image.local_file_path != null && String(image.local_file_path).trim() !== '';
  if (local) return 'local_file';

  const url = image.cloud_url != null && String(image.cloud_url).trim() !== '';
  if (!url) return 'pending_cloud';

  if (isMonitoringCloudImageExpired(image, nowMs)) return 'expired';

  return 'cloud_url';
}

export function getMonitoringImageDisplayHint(
  image: MonitoringWindowsImage,
  nowMs = Date.now(),
): { mode: MonitoringImageDisplayMode; message?: string; src?: string } {
  const mode = getMonitoringImageDisplayMode(image, nowMs);
  if (mode === 'local_file') {
    return { mode, src: String(image.local_file_path) };
  }
  if (mode === 'cloud_url') {
    return { mode, src: String(image.cloud_url) };
  }
  if (mode === 'expired') {
    return { mode, message: MONITORING_CLOUD_IMAGE_EXPIRED_PT };
  }
  return {
    mode,
    message: 'Imagem sincronizada do mobile; upload cloud pendente.',
  };
}
