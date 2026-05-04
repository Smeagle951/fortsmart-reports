/**
 * O app Flutter publica fotos como `url` (Storage), `imageBase64Jpg` (data URL ou base64 cru),
 * ou chaves legadas / aninhadas (`public_url`, objeto `photo`, caminho `bucket/key` no Supabase).
 */

export type ReportPhotoLike = {
  url?: string | null;
  imageBase64Jpg?: string | null;
};

const URL_KEYS = [
  'url',
  'publicUrl',
  'public_url',
  'photoUrl',
  'photo_url',
  'storageUrl',
  'storage_url',
  'signedUrl',
  'signed_url',
  'imageUrl',
  'image_url',
  'downloadUrl',
  'fileUrl',
  'href',
  'src',
  'uri',
  'link',
] as const;

const B64_KEYS = [
  'imageBase64Jpg',
  'image_base64_jpg',
  'base64',
  'thumbnail_base64',
  'thumbnailBase64',
  'data',
  'encoded_image',
  'imageData',
  'image_data',
] as const;

const NEST_KEYS = ['photo', 'media', 'imagem', 'image', 'attachment', 'file', 'foto'] as const;

function firstString(obj: Record<string, unknown>, keys: readonly string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

/** Achata objetos aninhados comuns (ex.: `{ foto: { url } }`). */
function flattenPhotoObject(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...obj };
  for (const nest of NEST_KEYS) {
    const inner = obj[nest];
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
      for (const [k, v] of Object.entries(inner as Record<string, unknown>)) {
        if (out[k] === undefined || out[k] === null || out[k] === '') {
          out[k] = v;
        }
      }
    }
  }
  return out;
}

export function coerceReportPhotoLike(input: unknown): ReportPhotoLike | null {
  if (input == null) return null;
  if (typeof input === 'string') {
    const t = input.trim();
    if (!t) return null;
    return { url: t, imageBase64Jpg: undefined };
  }
  if (typeof input !== 'object' || Array.isArray(input)) return null;
  const flat = flattenPhotoObject(input as Record<string, unknown>);
  const url = firstString(flat, URL_KEYS);
  const b64 = firstString(flat, B64_KEYS);
  if (!url && !b64) return null;
  return { url: url || undefined, imageBase64Jpg: b64 || undefined };
}

function normalizeBase64Field(raw: string): string | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  if (t.startsWith('data:')) return t;
  const comma = t.indexOf(',');
  if (comma !== -1 && t.slice(0, Math.min(comma + 20, t.length)).toLowerCase().includes('base64')) {
    return t;
  }
  const cleaned = t.replace(/\s/g, '');
  if (cleaned.length > 60 && /^[A-Za-z0-9+/]+=*$/.test(cleaned.slice(0, 300))) {
    return `data:image/jpeg;base64,${cleaned}`;
  }
  return undefined;
}

function encodeStoragePath(path: string): string {
  return path
    .split('/')
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join('/');
}

/** Caminho estilo `bucket/pasta/arquivo.jpg` publicado sem domínio — monta URL do Supabase. */
function trySupabasePublicUrl(maybePath: string): string | undefined {
  const base =
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') : undefined;
  if (!base) return undefined;
  const t = maybePath.trim();
  if (!t) return undefined;
  if (/^(https?:|data:|blob:)/i.test(t)) return undefined;
  if (t.includes('..')) return undefined;
  if (t.startsWith('/') || /^[a-z]:\\/i.test(t)) return undefined;
  if (!t.includes('/')) return undefined;
  return `${base}/storage/v1/object/public/${encodeStoragePath(t)}`;
}

function normalizeUrl(raw: string): string | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  if (t.startsWith('//')) return `https:${t}`;
  if (
    t.startsWith('http://') ||
    t.startsWith('https://') ||
    t.startsWith('data:') ||
    t.startsWith('blob:')
  ) {
    return t;
  }
  return trySupabasePublicUrl(t) ?? undefined;
}

/** Primeira URL http(s) encontrada em texto (ex.: legenda “Foto: https://…; Legenda: …”). */
export function extractFirstHttpUrlFromText(text: string): string | undefined {
  const m = text.match(/https?:\/\/[^\s;]+/i);
  return m ? m[0].trim() : undefined;
}

function looksLikeHttpUrl(s: string): boolean {
  const t = s.trim();
  return /^https?:\/\//i.test(t) || t.startsWith('//');
}

function collectStringsFromUnknown(obj: Record<string, unknown>, out: string[], depth: number): void {
  if (depth > 6) return;
  for (const v of Object.values(obj)) {
    if (typeof v === 'string' && v.length > 12) {
      out.push(v);
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      collectStringsFromUnknown(v as Record<string, unknown>, out, depth + 1);
    } else if (Array.isArray(v)) {
      for (const x of v) {
        if (typeof x === 'string' && x.length > 12) out.push(x);
        else if (x && typeof x === 'object' && !Array.isArray(x)) {
          collectStringsFromUnknown(x as Record<string, unknown>, out, depth + 1);
        }
      }
    }
  }
}

function resolveInner(like: ReportPhotoLike): string | undefined {
  const rawUrl = typeof like.url === 'string' ? like.url.trim() : '';
  const fromUrl = rawUrl ? normalizeUrl(rawUrl) : undefined;
  if (fromUrl) return fromUrl;

  const b64 =
    typeof like.imageBase64Jpg === 'string'
      ? like.imageBase64Jpg
      : typeof (like as Record<string, unknown>).image_base64_jpg === 'string'
        ? String((like as Record<string, unknown>).image_base64_jpg)
        : '';

  if (b64 && looksLikeHttpUrl(b64)) {
    const n = normalizeUrl(b64.trim());
    if (n) return n;
  }

  const fromB64 = b64 ? normalizeBase64Field(b64) : undefined;
  if (fromB64) return fromB64;

  if (rawUrl) {
    const supa = trySupabasePublicUrl(rawUrl);
    if (supa) return supa;
  }

  return undefined;
}

/**
 * Aceita `ReportPhoto`, objeto aninhado, ou string (URL / base64).
 */
export function resolveReportPhotoSrc(photo: ReportPhotoLike | Record<string, unknown> | string | null | undefined): string | undefined {
  if (photo == null) return undefined;
  if (typeof photo === 'string') {
    const n = normalizeUrl(photo) ?? normalizeBase64Field(photo);
    if (n) return n;
    const embedded = extractFirstHttpUrlFromText(photo);
    return embedded ? normalizeUrl(embedded) : undefined;
  }
  const coerced = coerceReportPhotoLike(photo);
  if (coerced) {
    const direct = resolveInner(coerced);
    if (direct) return direct;
  }
  if (typeof photo === 'object' && !Array.isArray(photo)) {
    const bucket: string[] = [];
    collectStringsFromUnknown(photo as Record<string, unknown>, bucket, 0);
    for (const s of bucket) {
      const emb = extractFirstHttpUrlFromText(s);
      if (emb) {
        const n = normalizeUrl(emb);
        if (n) return n;
      }
    }
  }
  return undefined;
}

/** Células / registos de mídia em `field_collection_modules` podem usar várias chaves. */
export function resolvePhotoSrcFromUnknown(row: Record<string, unknown>): string | undefined {
  return resolveReportPhotoSrc(row);
}

export function hasRenderablePhotoSrc(photo: ReportPhotoLike | null | undefined): boolean {
  return Boolean(resolveReportPhotoSrc(photo ?? undefined));
}
