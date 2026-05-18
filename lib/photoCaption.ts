import type { ReportPhotoWeb } from '@/types/side-by-side-report';

/** Formata snake_case ou chaves técnicas para leitura em relatório. */
export function humanizePhotoLabel(raw: string | null | undefined): string {
  const s = (raw || '').trim();
  if (!s) return '';
  const spaced = s.replace(/_/g, ' ').replace(/\s+/g, ' ');
  return spaced.replace(/(^|\s)(\S)/g, (_, lead: string, ch: string) => lead + ch.toUpperCase());
}

/**
 * Legenda exibida: prioriza texto livre do consultor; combina com categoria quando ambos existem.
 */
export function photoDisplayCaption(p: ReportPhotoWeb): string {
  const cap = (p.caption || '').trim();
  const cat = humanizePhotoLabel(p.category);
  const capH = humanizePhotoLabel(cap);
  if (capH && cat && capH.toLowerCase() !== cat.toLowerCase()) return `${capH} · ${cat}`;
  if (capH) return capH;
  if (cat) return cat;
  return 'Evidência de campo';
}

/**
 * Remove enumeração longa de marcadores/pontos na legenda quando há `hotspots` no JSON
 * (o resumo numérico fica à parte na galeria).
 */
export function shortenPhotoCaptionForGallery(p: ReportPhotoWeb): string {
  let text = photoDisplayCaption(p);
  if (p.hotspots != null && p.hotspots.length > 0) {
    text = text
      .replace(/\s*MARCADORES[\s\S]*$/i, '')
      .replace(/\s*Marcadores[\s\S]*$/i, '')
      .trim();
    /* Remove enumerações “x%, y% — Ponto N” geradas no app (os marcadores já têm resumo numérico na galeria). */
    text = text.replace(/(?:\s*[,·]\s*)?\d+[,.]?\d*%\s*,\s*\d+[,.]?\d*%\s*—\s*Ponto\s+\d+/gi, '');
    text = text.replace(/\s{2,}/g, ' ').trim();
  }
  if (/\bPonto\s+\d+\b/i.test(text) && text.length > 100) {
    const cut = text.search(/\s+[—–-]\s+Ponto\s+1\b/i);
    if (cut > 20) text = text.slice(0, cut).trim();
  }
  return text || photoDisplayCaption(p);
}
