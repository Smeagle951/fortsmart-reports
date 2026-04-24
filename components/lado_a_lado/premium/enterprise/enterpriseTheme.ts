/**
 * Tema visual dos blocos enterprise (Visão geral / gráficos / cabeçalho).
 * Mantido explícito para evitar divergência com `className` Tailwind em estilos inline.
 */
export const ENT = {
  blue: '#1565C0',
  blueDark: '#0D47A1',
  green: '#2E7D32',
  greenDark: '#1B5E20',
  gold: '#F9A825',
  red: '#C62828',
  textMuted: '#64748b',
  shadowCard: '0 10px 40px -12px rgba(15, 23, 42, 0.12), 0 1px 0 0 rgba(255, 255, 255, 0.88) inset',
  shadowSoft: '0 4px 24px -8px rgba(15, 23, 42, 0.08)',
  shadowStrong: '0 18px 48px -12px rgba(15, 23, 42, 0.18)',
  shadowHover: '0 12px 32px -10px rgba(15, 23, 42, 0.15)',
} as const;

export type EnterpriseTheme = typeof ENT;
