/**
 * Cache local do payload `GET /windows/planting/:farmId` (desktop / browser).
 * Não apaga dados SQLite do mobile — só armazena cópia de leitura cloud.
 */
export const CLOUD_PLANTING_SNAPSHOTS_KEY = 'cloudPlantingSnapshots';

export type CloudPlantingSnapshotEntry = {
  farmId: string;
  savedAt: string;
  /** Corpo `{ data: ... }` ou só `data` — o hook normaliza. */
  raw: unknown;
};

type StoreShape = Record<string, CloudPlantingSnapshotEntry>;

function readAll(): StoreShape {
  if (typeof window === 'undefined') return {};
  try {
    const t = window.localStorage.getItem(CLOUD_PLANTING_SNAPSHOTS_KEY);
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
    window.localStorage.setItem(CLOUD_PLANTING_SNAPSHOTS_KEY, JSON.stringify(map));
  } catch {
    /* quota / private mode */
  }
}

export function getCloudPlantingSnapshot(farmId: string): CloudPlantingSnapshotEntry | null {
  const id = farmId.trim();
  if (!id) return null;
  return readAll()[id] ?? null;
}

export function setCloudPlantingSnapshot(farmId: string, raw: unknown): CloudPlantingSnapshotEntry {
  const id = farmId.trim();
  const entry: CloudPlantingSnapshotEntry = {
    farmId: id,
    savedAt: new Date().toISOString(),
    raw,
  };
  const all = readAll();
  all[id] = entry;
  writeAll(all);
  return entry;
}

export function removeCloudPlantingSnapshot(farmId: string): void {
  const id = farmId.trim();
  const all = readAll();
  delete all[id];
  writeAll(all);
}
