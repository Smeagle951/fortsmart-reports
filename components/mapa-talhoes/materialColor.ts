/**
 * Cores de contorno (hex #RRGGBB) para híbridos conhecidos — alinhado à legenda e ao KML
 * (o KML continua a usar hash [KmlStyling] para ids não mapeados; aqui o mapa web fixa
 * estes rótulos para leitura visual idêntica em campo).
 * Material desconhecido: paleta + hash (estável na sessão de navegação).
 */
export const MATERIAL_STROKE_OVERRIDES: Readonly<Record<string, string>> = {
  P3707PWU: '#4CAF50',
  DKB390: '#FF9800',
  NS6442: '#42A5F5',
  AG8088: '#9C27B0',
  P30F53: '#26A69A',
  P3898: '#C4A35A',
  P3890: '#D4E157',
} as const;

const PALETTE = [
  '#7CB342',
  '#C4A35A',
  '#42A5F5',
  '#9C27B0',
  '#26A69A',
  '#EC407A',
  '#FF9800',
  '#5C6BC0',
  '#D4E157',
  '#8D6E63',
] as const;

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function normKey(s: string): string {
  return s.trim().toUpperCase();
}

/**
 * Tenta híbrido exibido no app ou chave de estilo KML `hibrido:ID`.
 */
function resolveOverride(material: string | null | undefined, kmlStyleKey: string | null | undefined): string | null {
  if (material) {
    const u = normKey(material);
    if (u && MATERIAL_STROKE_OVERRIDES[u]) return MATERIAL_STROKE_OVERRIDES[u]!;
  }
  if (kmlStyleKey) {
    const m = kmlStyleKey.match(/^hibrido:(.+)$/i);
    if (m) {
      const u = normKey(m[1] ?? '');
      if (u && MATERIAL_STROKE_OVERRIDES[u]) return MATERIAL_STROKE_OVERRIDES[u]!;
    }
  }
  return null;
}

/**
 * Borda + sugestão de preenchimento (subárea) com alpha em hex
 */
export function colorPairForProperties(p: {
  material?: string | null;
  kml_style_key?: string | null;
}): { stroke: string; fill: string } {
  const o = resolveOverride(p.material, p.kml_style_key);
  if (o) return { stroke: o, fill: o + '55' };
  const key =
    (p.material && String(p.material).trim()) ||
    (p.kml_style_key && String(p.kml_style_key)) ||
    'default';
  const c = PALETTE[hashString(key) % PALETTE.length];
  return { stroke: c, fill: c + '55' };
}

export function strokeForProperties(p: {
  material?: string | null;
  kml_style_key?: string | null;
}): string {
  return colorPairForProperties(p).stroke;
}
