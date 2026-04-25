/** Parse `data_plantio` do GeoJSON export (YYYY-MM-DD ou prefixo ISO). */
export function parsePlantioDate(s: string | null | undefined): Date | null {
  if (s == null || !String(s).trim()) return null;
  const t = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) {
    const d = new Date(`${t.slice(0, 10)}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    const day = Number.parseInt(m[1]!, 10);
    const month = Number.parseInt(m[2]!, 10) - 1;
    const year = Number.parseInt(m[3]!, 10);
    const d = new Date(year, month, day, 12, 0, 0);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function diasDesdePlantio(s: string | null | undefined): number | null {
  const d = parsePlantioDate(s);
  if (!d) return null;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}
