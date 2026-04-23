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
