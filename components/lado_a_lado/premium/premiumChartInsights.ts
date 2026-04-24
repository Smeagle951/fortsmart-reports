/** Texto de leitura rápida para o radar — só a partir das linhas já normalizadas (0–100). */

export type RadarRowLite = { subject: string; A: number; B: number };

export function radarAxisWinSummary(
  radarRows: RadarRowLite[],
  nameA: string,
  nameB: string,
): string | null {
  if (!radarRows.length) return null;
  let winsB = 0;
  let winsA = 0;
  for (const r of radarRows) {
    if (!Number.isFinite(r.A) || !Number.isFinite(r.B)) continue;
    if (Math.abs(r.A - r.B) < 0.75) continue;
    if (r.B > r.A) winsB += 1;
    else winsA += 1;
  }
  const compared = winsA + winsB;
  if (compared === 0) {
    return `Nos ${radarRows.length} eixos do radar publicados não há dominância clara entre ${nameA} e ${nameB}.`;
  }
  const leader = winsB > winsA ? nameB : winsA > winsB ? nameA : null;
  const wins = Math.max(winsB, winsA);
  if (!leader) {
    return `${nameA} e ${nameB} dividem os eixos com vantagem numérica (${compared} eixos com diferença).`;
  }
  return `${leader} lidera em ${wins} de ${compared} eixos com diferença relevante no radar (dados normalizados 0–100 do relatório).`;
}
