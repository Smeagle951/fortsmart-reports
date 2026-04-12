/** Extrai URL da imagem de assinatura a partir de chaves comuns no payload. */
export function assinaturaImagemUrl(assinatura: Record<string, unknown>): string | undefined {
  const keys = [
    'urlAssinatura',
    'assinaturaUrl',
    'imagemUrl',
    'imagemAssinatura',
    'urlImagem',
    'signatureUrl',
    'fotoAssinatura',
    'url',
  ] as const;
  for (const k of keys) {
    const v = assinatura[k];
    if (typeof v !== 'string') continue;
    const t = v.trim();
    if (!t) continue;
    if (t.startsWith('http://') || t.startsWith('https://') || t.startsWith('data:')) return t;
    if (t.startsWith('/') && t.length > 1) return t;
  }
  return undefined;
}
