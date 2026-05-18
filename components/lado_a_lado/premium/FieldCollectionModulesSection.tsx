'use client';

import React, { createContext, useContext, useMemo } from 'react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import {
  extractFirstHttpUrlFromText,
  resolvePhotoSrcFromUnknown,
  resolveReportPhotoSrc,
} from '@/lib/resolveReportPhotoSrc';

/** Legenda das fotos de ocorrência: prefixo “Ponto N · …”. */
const FieldPointLabelContext = createContext<string | null>(null);

/* ----------------------------- labels & order ----------------------------- */

const KEY_LABELS: Record<string, string> = {
  data: 'Data',
  dose: 'Dose',
  estadio: 'Estádio',
  produto: 'Produto',
  categoria: 'Categoria',
  tipo: 'Tipo',
  alvo: 'Alvo',
  incidencia: 'Incid.',
  severidade: 'Sev.',
  observacao: 'Observação',
  observacoes: 'Observações',
  nota: 'Nota',
  unidade: 'Unidade',
  valor: 'Valor',
  descricao: 'Descrição',
  nome: 'Nome',
  quantidade: 'Qtd',
  status: 'Status',
  pressao: 'Pressão (hPa)',
  ur: 'U.R. (%)',
  temperatura: 'Temp. (°C)',
  vento: 'Vento',
  chuva: 'Chuva',
  solo_umidade: 'Solo (umid.)',
  compactacao: 'Compactação',
  caption: 'Legenda',
  foto: 'Foto',
  imagem: 'Foto',
  url: 'Foto',
  gps: 'GPS',
};

const SECTION_ID_FALLBACK: Record<string, string> = {
  aplicacoes: 'Aplicações',
  identificacao: 'Identificação',
  fenologia: 'Fenologia',
  ocorrencias: 'Ocorrências',
  observacoes: 'Observações',
  condicoes_ambientais: 'Condições ambientais',
  nutricao_solo: 'Nutrição e solo',
  pragas_detalhe: 'Pragas',
  doencas_detalhe: 'Doenças',
  plantas_daninhas: 'Plantas daninhas',
};

const HIDDEN_KEYS = new Set([
  'id',
  '_id',
  'filePath',
  'file_path',
  'path',
  'localPath',
  'local_path',
  'createdAt',
  'updatedAt',
  'uid',
  'owner_uid',
  'hash',
]);

const COLUMN_PRIORITY = [
  'foto',
  'imagem',
  'url',
  'data',
  'produto',
  'categoria',
  'tipo',
  'estadio',
  'dose',
  'alvo',
  'severidade',
  'incidencia',
  'caption',
  'observacao',
  'unidade',
] as const;

const IMAGE_KEYS = new Set(['url', 'foto', 'imagem', 'image', 'thumbnail', 'thumb']);
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|heic|heif)(\?.*)?$/i;

/* ------------------------------- utilities ------------------------------- */

function titleForSection(secId: string, moduleLabels: Record<string, string>): string {
  if (moduleLabels[secId]) return moduleLabels[secId];
  if (SECTION_ID_FALLBACK[secId]) return SECTION_ID_FALLBACK[secId];
  return secId
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object' && !Array.isArray(x);
}

function isLikelyImageUrl(v: unknown): boolean {
  if (typeof v !== 'string') return false;
  const t = v.trim();
  if (!t) return false;
  if (t.startsWith('data:image/')) return true;
  if (!/^https?:\/\//i.test(t)) return false;
  if (IMAGE_EXT.test(t)) return true;
  if (/\/storage\/v1\/object\/public\//i.test(t)) return true;
  if (/supabase\.co\/.+\/public\//i.test(t)) return true;
  return false;
}

function hasFieldCollectionData(data: SideBySideReportData): boolean {
  const fcm = data.field_collection_modules;
  if (fcm == null || typeof fcm !== 'object' || Array.isArray(fcm)) return false;
  const pts = (fcm as { points?: unknown }).points;
  return Array.isArray(pts) && pts.length > 0;
}

function formatCellValue(raw: unknown, depth = 0): string {
  if (depth > 10) return '…';
  if (raw == null) return '—';
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t) return '—';
    if (/^\d{4}-\d{2}-\d{2}T/.test(t)) {
      const d = new Date(t);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      }
    }
    return t;
  }
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) return '—';
    return Number.isInteger(raw) ? String(raw) : String(Math.round(raw * 1000) / 1000);
  }
  if (typeof raw === 'boolean') return raw ? 'Sim' : 'Não';
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  if (Array.isArray(raw))
    return raw.map((x) => formatCellValue(x, depth + 1)).filter(Boolean).join(' · ') || '—';
  if (typeof raw === 'object') {
    const keys = Object.keys(raw as object).filter((k) => !HIDDEN_KEYS.has(k));
    if (keys.length <= 3) {
      return keys
        .map((k) => {
          const v = (raw as Record<string, unknown>)[k];
          return `${KEY_LABELS[k] ?? k}: ${formatCellValue(v, depth + 1)}`;
        })
        .join('; ');
    }
    return '…';
  }
  return String(raw);
}

function rowHasEmbeddedPhoto(row: Record<string, unknown>): boolean {
  if (pickImageUrlFromRow(row)) return true;
  return Object.values(row).some((v) => {
    if (typeof v !== 'string' || v.length < 20) return false;
    const emb = extractFirstHttpUrlFromText(v);
    return Boolean(emb && isLikelyImageUrl(emb));
  });
}

function pickImageUrlFromRow(row: Record<string, unknown>): string | null {
  const fromRecord = resolvePhotoSrcFromUnknown(row);
  if (fromRecord) return fromRecord;
  for (const k of IMAGE_KEYS) {
    const v = row[k];
    if (typeof v !== 'string') continue;
    const t = v.trim();
    if (isLikelyImageUrl(t)) return t;
    const asB64 = resolveReportPhotoSrc({ url: undefined, imageBase64Jpg: t });
    if (asB64) return asB64;
  }
  for (const v of Object.values(row)) {
    if (typeof v !== 'string' || v.length < 16) continue;
    const embedded = extractFirstHttpUrlFromText(v);
    if (!embedded || !isLikelyImageUrl(embedded)) continue;
    const resolved = resolveReportPhotoSrc(embedded);
    if (resolved) return resolved;
  }
  return null;
}

/** Texto tipo "Foto: https://…; Legenda: …" ou célula só com URL pública. */
function renderStringCellWithOptionalPhoto(raw: string): React.ReactNode {
  const t = raw.trim();
  if (!t) return '—';
  const embedded = extractFirstHttpUrlFromText(t);
  if (embedded && isLikelyImageUrl(embedded)) {
    const src = resolveReportPhotoSrc(embedded) ?? embedded;
    let cap = t
      .replace(new RegExp(embedded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '')
      .replace(/^\s*Foto\s*:\s*/i, '')
      .replace(/\s*;\s*/g, ' · ')
      .replace(/\s*Legenda\s*:\s*/gi, '')
      .replace(/^[\s·]+|[\s·]+$/g, '')
      .trim();
    if (cap.length > 180) cap = `${cap.slice(0, 177)}…`;
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <ImageThumb src={src} alt={cap || 'foto'} />
        {cap ? (
          <p className="min-w-0 flex-1 text-[12px] font-medium leading-snug text-slate-800">{cap}</p>
        ) : null}
      </div>
    );
  }
  return (
    <span className="text-[12.5px] leading-snug text-slate-800">
      {formatCellValue(raw)}
    </span>
  );
}

function isPhotoMediaRecord(v: unknown): v is Record<string, unknown> {
  if (!isPlainObject(v)) return false;
  const url = (v.url ?? v.publicUrl ?? v.public_url)?.toString().trim() ?? '';
  if (/^https?:\/\//i.test(url)) return true;
  const dataUri =
    typeof v.imageBase64Jpg === 'string'
      ? v.imageBase64Jpg.trim()
      : typeof v.image_base64_jpg === 'string'
        ? String(v.image_base64_jpg).trim()
        : '';
  if (dataUri.startsWith('data:image/')) return true;
  if (dataUri.length > 80 && /^[A-Za-z0-9+/=\s]+$/.test(dataUri.slice(0, 120))) return true;
  const fp = (v.filePath ?? v.file_path)?.toString().trim() ?? '';
  if (!fp || fp.toLowerCase().startsWith('http')) return false;
  const cap =
    (v.caption ?? v.legenda ?? v.nome ?? v.nomeAlvo)?.toString().trim() ?? '';
  const id = (v.id ?? v._id)?.toString().trim() ?? '';
  return (
    cap.length > 0 ||
    id.length > 0 ||
    fp.includes('evaluation_occurrences') ||
    /\.(jpe?g|png|webp|heic|heif)$/i.test(fp)
  );
}

function ImageThumb({ src, alt }: { src: string; alt?: string }) {
  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      className="block shrink-0 overflow-hidden rounded-md ring-1 ring-slate-200/70 shadow-sm hover:ring-amber-400/60 transition"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt ?? 'foto'}
        loading="lazy"
        className="h-24 w-24 max-w-full object-cover sm:h-28 sm:w-28 print:h-32 print:w-32"
      />
    </a>
  );
}

function PhotoMediaCell({ value }: { value: Record<string, unknown> }) {
  let src = resolvePhotoSrcFromUnknown(value);
  if (!src) {
    for (const k of ['caption', 'legenda', 'descricao', 'observacao', 'observacoes', 'texto', 'detalhe']) {
      const t = value[k];
      if (typeof t !== 'string') continue;
      const emb = extractFirstHttpUrlFromText(t);
      if (emb && isLikelyImageUrl(emb)) {
        src = resolveReportPhotoSrc(emb) ?? emb;
        break;
      }
    }
  }
  const caption =
    (value.caption ?? value.legenda ?? value.nome ?? value.nomeAlvo)?.toString().trim() ?? '';
  if (src) {
    return (
      <div className="space-y-1 min-w-0">
        <ImageThumb src={src} alt={caption || 'foto'} />
        {caption ? <p className="text-[11.5px] text-slate-600 leading-snug">{caption}</p> : null}
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-amber-200/80 bg-amber-50/60 px-2.5 py-2 text-[12px] leading-snug text-amber-950">
      <p className="font-semibold">Foto ainda no aparelho</p>
      <p className="text-amber-900/90 mt-1">
        O caminho local não abre no browser. Publique o relatório novamente com o app atualizado para enviar a imagem ao armazenamento na web.
      </p>
      {caption ? <p className="mt-1.5 font-medium text-slate-800">{caption}</p> : null}
    </div>
  );
}

function renderTableCell(value: unknown): React.ReactNode {
  if (isPhotoMediaRecord(value)) {
    return <PhotoMediaCell value={value} />;
  }
  if (typeof value === 'string' && value.length > 12) {
    const emb = extractFirstHttpUrlFromText(value);
    if (emb && isLikelyImageUrl(emb)) return renderStringCellWithOptionalPhoto(value);
  }
  return formatCellValue(value);
}

function collectKeysFromRows(rows: Record<string, unknown>[]): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    for (const k of Object.keys(row)) {
      if (HIDDEN_KEYS.has(k)) continue;
      if (k.startsWith('_')) continue;
      set.add(k);
    }
  }
  const prioritySet = new Set(COLUMN_PRIORITY as readonly string[]);
  const rest = [...set].filter((k) => !prioritySet.has(k));
  rest.sort((a, b) => a.localeCompare(b, 'pt'));
  const ordered = (COLUMN_PRIORITY as readonly string[]).filter((k) => set.has(k));
  return [...ordered, ...rest];
}

/* --------------------------------- cells --------------------------------- */

/** Célula de tabela: URL pública, registo de mídia (objeto) ou texto formatado. */
function renderCell(k: string, v: unknown, row: Record<string, unknown>): React.ReactNode {
  if (isPhotoMediaRecord(v)) {
    return <PhotoMediaCell value={v as Record<string, unknown>} />;
  }
  if (typeof v === 'string' && v.length > 12) {
    const emb = extractFirstHttpUrlFromText(v);
    if (emb && isLikelyImageUrl(emb)) return renderStringCellWithOptionalPhoto(v);
  }
  if (IMAGE_KEYS.has(k) && typeof v === 'string') {
    const trimmed = v.trim();
    const resolved =
      resolveReportPhotoSrc({ url: trimmed, imageBase64Jpg: trimmed }) ??
      (isLikelyImageUrl(trimmed) ? trimmed : null);
    if (resolved) {
      const caption =
        (typeof row.caption === 'string' && row.caption.trim()) ||
        (typeof row.descricao === 'string' && row.descricao.trim()) ||
        undefined;
      return <ImageThumb src={resolved} alt={caption} />;
    }
    return renderStringCellWithOptionalPhoto(v);
  }
  if (typeof v === 'string' && (/foto\s*:/i.test(v) || /legenda\s*:/i.test(v)) && /https?:\/\//i.test(v)) {
    return renderStringCellWithOptionalPhoto(v);
  }
  return (
    <span className="text-[12.5px] leading-snug text-slate-800">
      {formatCellValue(v)}
    </span>
  );
}

/* --------------------------------- tables --------------------------------- */

function ItensTable({
  rows,
  variant = 'cards',
}: {
  rows: Record<string, unknown>[];
  variant?: 'table' | 'cards';
}) {
  const keys = useMemo(() => collectKeysFromRows(rows), [rows]);
  if (keys.length === 0) {
    return <p className="text-xs text-slate-400 italic py-2">Sem registros.</p>;
  }
  if (variant === 'cards') {
    return (
      <div className="space-y-3">
        {rows.map((row, ri) => (
          <div
            key={ri}
            className="rounded-xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/40 p-3 shadow-sm ring-1 ring-slate-100/80"
          >
            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Registo {ri + 1}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {keys.map((k) => (
                <div key={k} className="min-w-0 rounded-lg bg-white/80 px-2 py-1.5 ring-1 ring-slate-100">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {KEY_LABELS[k] ?? k.replace(/_/g, ' ')}
                  </div>
                  <div className="mt-1 min-w-0">{renderCell(k, row[k], row)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg ring-1 ring-slate-200/80 bg-white/90">
      <table className="w-full text-left text-[12.5px] border-collapse">
        <thead>
          <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
            {keys.map((k) => (
              <th
                key={k}
                className="py-2 px-2.5 first:pl-3 last:pr-3 font-semibold text-[0.62rem] uppercase tracking-[0.1em] whitespace-nowrap"
              >
                {KEY_LABELS[k] ?? k.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className="border-b border-slate-100 last:border-0 hover:bg-amber-50/30 transition-colors"
            >
              {keys.map((k) => (
                <td
                  key={k}
                  className="py-1.5 px-2.5 first:pl-3 last:pr-3 align-middle"
                >
                  {renderCell(k, row[k], row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Ocorrências com imagem viram galeria compacta com legenda (estilo dossiê). */
function OccurrencesGallery({ rows }: { rows: Record<string, unknown>[] }) {
  const pointCtx = useContext(FieldPointLabelContext);
  const withImages = rows.filter((r) => pickImageUrlFromRow(r));
  const withoutImages = rows.filter((r) => !pickImageUrlFromRow(r));
  return (
    <div className="space-y-3">
      {withImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {withImages.map((r, i) => {
            const src = pickImageUrlFromRow(r)!;
            const captionBase =
              (typeof r.caption === 'string' && r.caption.trim()) ||
              (typeof r.descricao === 'string' && r.descricao.trim()) ||
              (typeof r.alvo === 'string' && r.alvo.trim()) ||
              'Ocorrência';
            const caption = pointCtx ? `${pointCtx} · ${captionBase}` : captionBase;
            const meta: string[] = [];
            if (typeof r.severidade === 'string' && r.severidade) meta.push(`Sev. ${r.severidade}`);
            if (typeof r.incidencia === 'string' && r.incidencia) meta.push(`Incid. ${r.incidencia}`);
            if (typeof r.nota !== 'undefined' && r.nota !== null && r.nota !== '')
              meta.push(`Nota ${r.nota}`);
            return (
              <figure
                key={i}
                className="group relative overflow-hidden rounded-lg ring-1 ring-slate-200 bg-white shadow-sm"
              >
                <a href={src} target="_blank" rel="noopener noreferrer" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={caption}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover group-hover:scale-[1.02] transition-transform"
                  />
                </a>
                <figcaption className="px-2.5 py-1.5 border-t border-slate-100">
                  <p className="text-[11.5px] font-semibold text-slate-800 truncate">{caption}</p>
                  {meta.length > 0 && (
                    <p className="text-[10.5px] text-slate-500 mt-0.5 truncate">{meta.join(' · ')}</p>
                  )}
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}
      {withoutImages.length > 0 && <ItensTable rows={withoutImages} variant="cards" />}
    </div>
  );
}

/* ---------------------------- object rendering ---------------------------- */

function DlBlock({ obj }: { obj: Record<string, unknown> }) {
  const entries = Object.entries(obj).filter(
    ([k, v]) =>
      !HIDDEN_KEYS.has(k) &&
      !k.startsWith('_') &&
      v !== null &&
      v !== undefined &&
      v !== '',
  );
  if (entries.length === 0) {
    return <p className="text-xs text-slate-400">—</p>;
  }

  const hasNested = entries.some(
    ([, v]) =>
      isPlainObject(v) || (Array.isArray(v) && v.length > 0 && typeof (v as unknown[])[0] === 'object'),
  );

  if (!hasNested) {
    return (
      <table className="w-full border-collapse text-left text-[11px] leading-snug">
        <tbody>
          {entries.map(([k, v]) => (
            <tr key={k} className="border-b border-slate-100 last:border-b-0">
              <th
                scope="row"
                className="w-[38%] max-w-38 py-1 pr-2 align-top text-[0.58rem] font-semibold uppercase tracking-wide text-slate-500"
              >
                {KEY_LABELS[k] ?? k.replace(/_/g, ' ')}
              </th>
              <td className="py-1 font-medium text-slate-900">
                {isPhotoMediaRecord(v) ? (
                  <PhotoMediaCell value={v} />
                ) : typeof v === 'string' && /https?:\/\//i.test(v) ? (
                  renderStringCellWithOptionalPhoto(v)
                ) : (
                  formatCellValue(v)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-1">
      {entries.map(([k, v]) => {
        if (isPlainObject(v) || (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object')) {
          return (
            <div key={k} className="col-span-2 rounded border border-slate-200/90 bg-white px-2 py-1.5">
              <p className="text-[0.58rem] font-semibold uppercase tracking-wide text-slate-500">
                {KEY_LABELS[k] ?? k.replace(/_/g, ' ')}
              </p>
              <div className="mt-0.5">{renderValue(v, 1, undefined, { tableVariant: 'cards' })}</div>
            </div>
          );
        }
        return (
          <div key={k} className="rounded border border-slate-200/90 bg-white px-2 py-1.5">
            <dt className="text-[0.56rem] font-semibold uppercase tracking-wide text-slate-500">
              {KEY_LABELS[k] ?? k.replace(/_/g, ' ')}
            </dt>
            <dd className="mt-0.5 text-[11.5px] font-medium text-slate-900 min-w-0 wrap-break-word">
              {isPhotoMediaRecord(v) ? (
                <PhotoMediaCell value={v} />
              ) : typeof v === 'string' && /https?:\/\//i.test(v) ? (
                renderStringCellWithOptionalPhoto(v)
              ) : (
                formatCellValue(v)
              )}
            </dd>
          </div>
        );
      })}
    </div>
  );
}

function renderValue(
  raw: unknown,
  depth: number,
  sectionId?: string,
  opts?: { tableVariant?: 'table' | 'cards' },
): React.ReactNode {
  if (raw == null) return <span className="text-slate-400">—</span>;
  if (depth > 2) {
    return (
      <pre className="text-[10.5px] font-mono leading-snug text-slate-600 whitespace-pre-wrap break-all max-h-28 overflow-y-auto rounded bg-slate-100/70 p-2 print:text-[9px]">
        {JSON.stringify(raw, null, 2)}
      </pre>
    );
  }
  if (Array.isArray(raw)) {
    if (raw.length === 0) return <span className="text-slate-400 text-xs">—</span>;
    if (raw.every((x) => isPlainObject(x))) {
      const rows = raw as Record<string, unknown>[];
      if (sectionId === 'ocorrencias' || rows.some((r) => rowHasEmbeddedPhoto(r))) {
        return <OccurrencesGallery rows={rows} />;
      }
      return <ItensTable rows={rows} variant={opts?.tableVariant ?? 'cards'} />;
    }
    return (
      <ul className="space-y-1 text-[12.5px] text-slate-800">
        {raw.map((x, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" aria-hidden />
            <span className="min-w-0">{renderTableCell(x)}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (isPlainObject(raw)) {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.itens) && o.itens.length > 0 && o.itens.every((x) => isPlainObject(x))) {
      const rows = o.itens as Record<string, unknown>[];
      if (sectionId === 'ocorrencias' || rows.some((r) => rowHasEmbeddedPhoto(r))) {
        return <OccurrencesGallery rows={rows} />;
      }
      return <ItensTable rows={rows} variant={opts?.tableVariant ?? 'cards'} />;
    }
    return <DlBlock obj={o} />;
  }
  return <span className="text-[12.5px] text-slate-800 font-medium">{formatCellValue(raw)}</span>;
}

/* --------------------------- side / section skin -------------------------- */

const SIDE_SKIN: Record<string, { border: string; chip: string; label: string }> = {
  A: {
    border: 'border-l-[3px] border-l-blue-600',
    chip: 'bg-blue-600/10 text-blue-800',
    label: 'Manejo A',
  },
  B: {
    border: 'border-l-[3px] border-l-emerald-600',
    chip: 'bg-emerald-600/10 text-emerald-800',
    label: 'Manejo B',
  },
};

function sideSkin(letter: string) {
  return (
    SIDE_SKIN[letter] ?? {
      border: 'border-l-[3px] border-l-slate-400',
      chip: 'bg-slate-200 text-slate-700',
      label: `Manejo ${letter}`,
    }
  );
}

/* ------------------------------ side row cell ----------------------------- */

function SideCell({
  letter,
  value,
  sectionId,
  empty,
  sideDisplayName,
}: {
  letter: string;
  value: unknown;
  sectionId: string;
  empty?: boolean;
  sideDisplayName?: string;
}) {
  const skin = sideSkin(letter);
  const headBg = letter === 'A' ? 'bg-blue-600' : letter === 'B' ? 'bg-emerald-600' : 'bg-slate-600';
  return (
    <div className={`min-w-0 overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-sm ${skin.border}`}>
      <div className={`${headBg} px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-white`}>
        {skin.label}
        {sideDisplayName ? <span className="ml-1.5 font-semibold opacity-95 normal-case tracking-normal">· {sideDisplayName}</span> : null}
      </div>
      <div className="min-w-0 p-2.5 sm:p-3">
        {empty ? (
          <p className="text-[11px] text-slate-400 italic">Sem registros neste módulo.</p>
        ) : (
          renderValue(value, 0, sectionId, { tableVariant: 'cards' })
        )}
      </div>
    </div>
  );
}

/* --------------------------------- types --------------------------------- */

type FcmPoint = {
  point_id?: string;
  index?: number;
  status?: string;
  sides?: Record<string, Record<string, unknown>>;
};

/* -------------------------------- component ------------------------------- */

export default function FieldCollectionModulesSection({
  data,
  sectionId = 'coleta-campo-modulos',
  /** Menos padding e visual mais denso (relatório agronómico). */
  compact = false,
}: {
  data: SideBySideReportData;
  sectionId?: string;
  compact?: boolean;
}) {
  if (!hasFieldCollectionData(data)) return null;

  const fcm = data.field_collection_modules as {
    schema_version?: number;
    module_labels?: Record<string, string>;
    points?: FcmPoint[];
  };
  const points = fcm.points ?? [];
  const moduleLabels = fcm.module_labels ?? {};
  const schemaVersion = fcm.schema_version;

  const shell = compact
    ? 'rounded-lg border border-slate-200/90 bg-white shadow-sm print:shadow-none print:border-slate-300'
    : `relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/70
          bg-gradient-to-b from-white via-slate-50/20 to-slate-100/10
          shadow-[0_1px_0_0_rgba(255,255,255,0.9)_inset,0_10px_32px_-12px_rgba(15,23,42,0.08)]
          print:shadow-none print:border print:rounded-lg`;

  const headPad = compact ? 'px-3 py-2.5 sm:px-4' : 'px-5 py-5 sm:px-7 sm:py-6';
  const headTitle = compact ? 'text-sm font-semibold' : 'text-lg sm:text-2xl font-light tracking-[-0.02em]';
  const bodyPad = compact ? 'space-y-3 px-2.5 py-3 sm:px-4 sm:py-4' : 'space-y-8 px-4 py-7 sm:px-7 sm:py-8';
  const pointSep = compact ? 'border-b border-slate-200/80 pb-3 last:border-0 last:pb-0' : 'border-b border-slate-200/80 pb-8 last:border-0 last:pb-0';
  const pointHead = compact ? 'py-1.5' : 'py-3';
  return (
    <section id={sectionId} className="scroll-mt-28 print:break-inside-avoid relative isolate">
      <div className={shell}>
        <div
          className={`relative border-b border-emerald-900/10 bg-gradient-to-r from-slate-50 via-white to-emerald-50/40 print:!border-slate-200 print:!bg-white ${headPad}`}
        >
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-emerald-600/[0.06] to-transparent print:hidden" aria-hidden />
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.22em] text-emerald-900/70 print:text-slate-600">
            {compact ? 'Coleta comparativa' : 'Dossiê técnico'}
          </p>
          <div className="relative mt-0.5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className={`${headTitle} text-slate-900`}>
                {compact ? 'Módulos por ponto (A × B)' : 'Coleta em campo — ponto a ponto'}
              </h2>
              {!compact ? (
                <p className="mt-1 max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-600 print:text-slate-700">
                  Mesmo módulo alinhado nos dois manejos; fotos com URL aparecem em miniatura e abrem ao clicar.
                  {schemaVersion != null ? (
                    <span className="text-slate-500"> · Schema v{schemaVersion}</span>
                  ) : null}
                </p>
              ) : schemaVersion != null ? (
                <p className="mt-0.5 text-[10px] text-slate-500 print:text-slate-600">Schema v{schemaVersion}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-800 print:border-blue-300">
                A
              </span>
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-900 print:border-emerald-300">
                B
              </span>
            </div>
          </div>
        </div>

        <div className={bodyPad}>
          {points.map((pt, i) => {
            const pLabel = typeof pt.index === 'number' ? `Ponto ${pt.index}` : `Ponto ${i + 1}`;
            const sides = pt.sides && typeof pt.sides === 'object' ? pt.sides : {};
            const sideKeys = Object.keys(sides).sort();
            if (sideKeys.length === 0) return null;

            const secSet = new Set<string>();
            for (const letter of sideKeys) {
              for (const secId of Object.keys(sides[letter] ?? {})) {
                secSet.add(secId);
              }
            }
            const sectionIds = [...secSet].sort((a, b) => {
              const order = ['identificacao', 'fenologia', 'aplicacoes', 'ocorrencias'];
              const ai = order.indexOf(a);
              const bi = order.indexOf(b);
              if (ai !== -1 || bi !== -1)
                return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
              return a.localeCompare(b, 'pt');
            });

            const nameForSide = (lk: string) =>
              lk === 'A'
                ? data.sideA?.name?.trim() || data.sideA?.label?.trim() || 'Manejo A'
                : lk === 'B'
                  ? data.sideB?.name?.trim() || data.sideB?.label?.trim() || 'Manejo B'
                  : `Manejo ${lk}`;

            return (
              <FieldPointLabelContext.Provider key={pt.point_id ?? `pt-${i}`} value={pLabel}>
                <div className={pointSep}>
                  <div
                    className={`flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 px-0 ${pointHead}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center justify-center rounded bg-slate-900 font-bold text-white ${compact ? 'h-5 min-w-[1.25rem] px-1 text-[10px]' : 'h-7 w-7 text-[11px] shadow-sm'}`}
                      >
                        {typeof pt.index === 'number' ? pt.index : i + 1}
                      </span>
                      <div>
                        <h3
                          className={`font-semibold tracking-tight text-slate-900 ${compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}`}
                        >
                          {pLabel}
                        </h3>
                        <p className="text-[10px] text-slate-500">
                          Comparativo lado a lado · fotos com prefixo do ponto na legenda
                        </p>
                      </div>
                    </div>
                    {pt.status ? (
                      <span
                        className={`inline-flex items-center gap-1 rounded bg-emerald-50 font-medium text-emerald-800 ${compact ? 'px-1.5 py-0.5 text-[10px]' : 'gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] text-emerald-700 ring-1 ring-emerald-200'}`}
                      >
                        {!compact ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> : null}
                        {pt.status}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 space-y-4">
                    {sectionIds.map((secId) => {
                      const title = titleForSection(secId, moduleLabels);
                      const rowCells = sideKeys.map((letter) => {
                        const secMap = sides[letter] ?? {};
                        const v = secMap[secId];
                        const empty =
                          v == null ||
                          (Array.isArray(v) && v.length === 0) ||
                          (isPlainObject(v) && Object.keys(v).length === 0);
                        return (
                          <SideCell
                            key={letter}
                            letter={letter}
                            value={v}
                            sectionId={secId}
                            empty={empty}
                            sideDisplayName={nameForSide(letter)}
                          />
                        );
                      });
                      return (
                        <div
                          key={secId}
                          className="overflow-hidden rounded-xl border border-slate-200/90 bg-slate-50/40 shadow-sm ring-1 ring-slate-100/80"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-white px-3 py-2">
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                {compact ? 'Módulo' : 'Bloco de coleta'}
                              </p>
                              <p className={`font-semibold text-slate-900 ${compact ? 'text-xs' : 'text-sm'}`}>{title}</p>
                            </div>
                            <span className="text-[10px] font-medium text-slate-400">{pLabel}</span>
                          </div>
                          <div
                            className={`grid gap-3 p-3 ${sideKeys.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1'}`}
                          >
                            {rowCells}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </FieldPointLabelContext.Provider>
            );
          })}
        </div>
      </div>
    </section>
  );
}
