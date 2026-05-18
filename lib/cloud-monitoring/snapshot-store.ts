/**
 * Cache local do payload `GET /windows/monitoring/:farmId`.
 */

export const CLOUD_MONITORING_SNAPSHOTS_KEY = 'cloudMonitoringSnapshots';

export type CloudMonitoringSnapshotEntry = {
  farmId: string;
  savedAt: string;
  raw: unknown;
};

type StoreShape = Record<string, CloudMonitoringSnapshotEntry>;

function readAll(): StoreShape {
  if (typeof window === 'undefined') return {};
  try {
    const t = window.localStorage.getItem(CLOUD_MONITORING_SNAPSHOTS_KEY);
    if (!t) return {};
    const p = JSON.parse(t) as unknown;
    return p && typeof p === 'object' && !Array.isArray(p) ? (p as StoreShape) : {};
  } catch {
    return {};
  }
}

function writeAll(map: StoreShape) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CLOUD_MONITORING_SNAPSHOTS_KEY, JSON.stringify(map));
  } catch {
    /* quota */
  }
}

export function loadCloudMonitoringSnapshot(farmId: string): CloudMonitoringSnapshotEntry | null {
  const id = farmId.trim();
  if (!id) return null;
  return readAll()[id] ?? null;
}

export function saveCloudMonitoringSnapshot(farmId: string, raw: unknown): CloudMonitoringSnapshotEntry {
  const id = farmId.trim();
  const entry: CloudMonitoringSnapshotEntry = {
    farmId: id,
    savedAt: new Date().toISOString(),
    raw,
  };
  const all = readAll();
  all[id] = entry;
  writeAll(all);
  return entry;
}

export function clearCloudMonitoringSnapshot(farmId: string): void {
  const id = farmId.trim();
  const all = readAll();
  delete all[id];
  writeAll(all);
}
