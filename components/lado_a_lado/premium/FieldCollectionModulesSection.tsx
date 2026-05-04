'use client';

import React, { useMemo } from 'react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';

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
const HTTP_IMAGE_RE = /https?:\/\/[^\s;|,)]+/gi;

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
  if (!/^https?:\/\//i.test(t)) return false;
  if (IMAGE_EXT.test(t)) return true;
  if (/\/storage\/v1\/object\/public\//i.test(t)) return true;
  if (/supabase\.co\/.+\/public\//i.test(t)) return true;
  return false;
}

function extractImageUrlsFromText(v: unknown): string[] {
  if (typeof v !== 'string') return [];
  const matches = v.match(HTTP_IMAGE_RE) ?? [];
  return matches.map((m) => m.trim()).filter((m) => isLikelyImageUrl(m));
}

function collectImageUrls(v: unknown, depth = 0): string[] {
  if (depth > 5 || v == null) return [];
  if (typeof v === 'string') return isLikelyImageUrl(v) ? [v.trim()] : extractImageUrlsFromText(v);
  if (Array.isArray(v)) return v.flatMap((x) => collectImageUrls(x, depth + 1));
  if (isPlainObject(v)) {
    const direct = pickImageUrlFromRow(v);
    const nested = Object.values(v).flatMap((x) => collectImageUrls(x, depth + 1));
    return [...(direct ? [direct] : []), ...nested].filter((x, i, arr) => arr.indexOf(x) === i);
  }
  return [];
}

function stripImageUrlsFromText(text: string): string {
  return text
    .replace(/Foto:\s*https?:\/\/[^\s;|,)]+;?/gi, '')
    .replace(/Imagem:\s*https?:\/\/[^\s;|,)]+;?/gi, '')
    .replace(HTTP_IMAGE_RE, '')
    .replace(/\s*;\s*/g, ' · ')
    .replace(/\s+/g, ' ')
    .replace(/^·\s*|\s*·$/g, '')
    .trim();
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
    return stripImageUrlsFromText(t) || t;
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

function pickImageUrlFromRow(row: Record<string, unknown>): string | null {
  for (const k of IMAGE_KEYS) {
    const v = row[k];
    if (typeof v === 'string' && isLikelyImageUrl(v)) return v.trim();
  }
  for (const v of Object.values(row)) {
    const urls = collectImageUrls(v);
    if (urls.length > 0) return urls[0];
  }
  return null;
}

function isPhotoMediaRecord(v: unknown): v is Record<string, unknown> {
  if (!isPlainObject(v)) return false;
  const url = (v.url ?? v.publicUrl ?? v.public_url)?.toString().trim() ?? '';
  if (/^https?:\/\//i.test(url)) return true;
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

function PhotoMediaCell({ value }: { value: Record<string, unknown> }) {
  const url = (value.url ?? value.publicUrl ?? value.public_url)?.toString().trim() ?? '';
  const caption =
    (value.caption ?? value.legenda ?? value.nome ?? value.nomeAlvo)?.toString().trim() ?? '';
  if (/^https?:\/\//i.test(url)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block min-w-[140px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={caption || 'Foto da avaliação'}
          loading="lazy"
          className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-[1.03]"
        />
        {caption ? <span className="block truncate px-2 py-1 text-[10.5px] font-medium text-slate-600">{caption}</span> : null}
      </a>
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

function InlineImageGallery({ urls, caption }: { urls: string[]; caption?: string }) {
  return (
    <div className="grid min-w-[220px] grid-cols-2 gap-2 sm:grid-cols-3">
      {urls.slice(0, 6).map((src, i) => (
        <a
          key={`${src}-${i}`}
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={caption || `Foto ${i + 1}`}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-[1.03]"
          />
          {caption ? (
            <span className="block truncate px-2 py-1 text-[10.5px] font-medium text-slate-600">
              {caption}
            </span>
          ) : null}
        </a>
      ))}
    </div>
  );
}

function renderTableCell(value: unknown): React.ReactNode {
  if (isPhotoMediaRecord(value)) {
    return <PhotoMediaCell value={value} />;
  }
  const urls = collectImageUrls(value);
  if (urls.length > 0) {
    const caption = typeof value === 'string' ? stripImageUrlsFromText(value) : undefined;
    return <InlineImageGallery urls={urls} caption={caption} />;
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
        className="h-14 w-14 object-cover print:h-20 print:w-20"
      />
    </a>
  );
}

/** Célula de tabela: URL pública, registo de mídia (objeto) ou texto formatado. */
function renderCell(k: string, v: unknown, row: Record<string, unknown>): React.ReactNode {
  if (isPhotoMediaRecord(v)) {
    return <PhotoMediaCell value={v as Record<string, unknown>} />;
  }
  const embeddedUrls = collectImageUrls(v);
  if (typeof v === 'string' && (embeddedUrls.length > 0 || (IMAGE_KEYS.has(k) && isLikelyImageUrl(v)))) {
    const caption =
      (typeof row.caption === 'string' && stripImageUrlsFromText(row.caption)) ||
      (typeof row.descricao === 'string' && stripImageUrlsFromText(row.descricao)) ||
      stripImageUrlsFromText(v) ||
      undefined;
    const urls = embeddedUrls.length > 0 ? embeddedUrls : [v];
    return urls.length === 1 ? (
      <ImageThumb src={urls[0]} alt={caption} />
    ) : (
      <InlineImageGallery urls={urls} caption={caption} />
    );
  }
  return (
    <span className="text-[12.5px] leading-snug text-slate-800">
      {formatCellValue(v)}
    </span>
  );
}

/* --------------------------------- tables --------------------------------- */

function ItensTable({ rows }: { rows: Record<string, unknown>[] }) {
  const keys = useMemo(() => collectKeysFromRows(rows), [rows]);
  if (keys.length === 0) {
    return <p className="text-xs text-slate-400 italic py-2">Sem registros.</p>;
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
  const withImages = rows.filter((r) => pickImageUrlFromRow(r));
  const withoutImages = rows.filter((r) => !pickImageUrlFromRow(r));
  return (
    <div className="space-y-3">
      {withImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {withImages.map((r, i) => {
            const urls = collectImageUrls(r);
            const caption =
              (typeof r.caption === 'string' && r.caption.trim()) ||
              (typeof r.descricao === 'string' && r.descricao.trim()) ||
              (typeof r.alvo === 'string' && r.alvo.trim()) ||
              'Ocorrência';
            const meta: string[] = [];
            if (typeof r.severidade === 'string' && r.severidade) meta.push(`Sev. ${r.severidade}`);
            if (typeof r.incidencia === 'string' && r.incidencia) meta.push(`Incid. ${r.incidencia}`);
            if (typeof r.nota !== 'undefined' && r.nota !== null && r.nota !== '')
              meta.push(`Nota ${r.nota}`);
            return urls.slice(0, 4).map((src, imgIndex) => (
              <figure
                key={`${i}-${imgIndex}`}
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
            ));
          })}
        </div>
      )}
      {withoutImages.length > 0 && <ItensTable rows={withoutImages} />}
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
      <div className="grid grid-cols-2 gap-1.5">
        {entries.map(([k, v]) => (
          <div key={k} className="rounded-md border border-slate-200/80 bg-slate-50/70 px-2 py-1.5">
            <div className="text-[0.56rem] font-bold uppercase tracking-wide text-slate-500">
              {KEY_LABELS[k] ?? k.replace(/_/g, ' ')}
            </div>
            <div className="mt-0.5 text-sm font-semibold leading-tight text-slate-900">{renderTableCell(v)}</div>
          </div>
        ))}
      </div>
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
              <div className="mt-0.5">{renderValue(v, 1)}</div>
            </div>
          );
        }
        return (
          <div key={k} className="rounded border border-slate-200/90 bg-white px-2 py-1.5">
            <dt className="text-[0.56rem] font-semibold uppercase tracking-wide text-slate-500">
              {KEY_LABELS[k] ?? k.replace(/_/g, ' ')}
            </dt>
            <dd className="mt-0.5 text-[11.5px] font-medium text-slate-900 min-w-0 wrap-break-word">
              {isPhotoMediaRecord(v) ? <PhotoMediaCell value={v} /> : formatCellValue(v)}
            </dd>
          </div>
        );
      })}
    </div>
  );
}

function renderValue(raw: unknown, depth: number, sectionId?: string): React.ReactNode {
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
      if (sectionId === 'ocorrencias' || rows.some((r) => pickImageUrlFromRow(r))) {
        return <OccurrencesGallery rows={rows} />;
      }
      return <ItensTable rows={rows} />;
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
      if (sectionId === 'ocorrencias' || rows.some((r) => pickImageUrlFromRow(r))) {
        return <OccurrencesGallery rows={rows} />;
      }
      return <ItensTable rows={rows} />;
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
}: {
  letter: string;
  value: unknown;
  sectionId: string;
  empty?: boolean;
}) {
  const skin = sideSkin(letter);
  return (
    <div className={`min-w-0 rounded-lg border border-slate-200/80 bg-white px-2 py-2 shadow-sm ${skin.border}`}>
      <div className="min-w-0">
        {empty ? (
          <p className="text-[11px] text-slate-400 italic">Sem registros.</p>
        ) : (
          renderValue(value, 0, sectionId)
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
    ? 'overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-md shadow-emerald-950/5 print:shadow-none print:border-slate-300'
    : `relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/70
          bg-gradient-to-b from-white via-slate-50/20 to-slate-100/10
          shadow-[0_1px_0_0_rgba(255,255,255,0.9)_inset,0_10px_32px_-12px_rgba(15,23,42,0.08)]
          print:shadow-none print:border print:rounded-lg`;

  const headPad = compact ? 'px-3 py-2.5 sm:px-4' : 'px-5 py-5 sm:px-7 sm:py-6';
  const headTitle = compact ? 'text-sm font-semibold' : 'text-lg sm:text-2xl font-light tracking-[-0.02em]';
  const bodyPad = compact ? 'space-y-3 px-2.5 py-3 sm:px-4 sm:py-4' : 'space-y-8 px-4 py-7 sm:px-7 sm:py-8';
  const pointSep = compact ? 'border-b border-slate-200/80 pb-3 last:border-0 last:pb-0' : 'border-b border-slate-200/80 pb-8 last:border-0 last:pb-0';
  const pointHead = compact ? 'py-1.5' : 'py-3';
  const modRow = compact ? 'gap-1.5 px-1.5 py-1.5 sm:px-2 sm:py-2' : 'gap-2.5 px-3 py-3 sm:gap-3 sm:px-4 sm:py-4';

  return (
    <section id={sectionId} className="scroll-mt-28 print:break-inside-avoid relative isolate">
      <div className={shell}>
        <div
          className={`relative border-b border-emerald-900/10 bg-emerald-950 print:!bg-slate-100 print:!border-slate-300 ${headPad}`}
        >
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.22em] text-emerald-100/70 print:text-slate-600">
            {compact ? 'Coleta' : 'Dossiê técnico'}
          </p>
          <div className="mt-0.5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className={`${headTitle} text-white print:text-slate-900`}>
                {compact ? 'Módulos por ponto (A × B)' : 'Coleta em campo — ponto a ponto'}
              </h2>
              {!compact ? (
                <p className="mt-1 max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300 font-light print:text-slate-700">
                  Cada linha alinha o mesmo módulo agronómico nos dois manejos, para leitura comparativa imediata. Fotos
                  das ocorrências abrem em tamanho real ao clicar.
                  {schemaVersion != null && (
                    <span className="text-slate-500 print:text-slate-500"> · Schema v{schemaVersion}</span>
                  )}
                </p>
              ) : schemaVersion != null ? (
                <p className="mt-0.5 text-[10px] text-emerald-100/65 print:text-slate-600">Schema v{schemaVersion}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center gap-1 rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-100 print:text-blue-900 print:bg-blue-100">
                A
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-100 print:text-emerald-900 print:bg-emerald-100">
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

            return (
              <div key={pt.point_id ?? `pt-${i}`} className={pointSep}>
                <div
                  className={`flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 px-0 ${pointHead}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center justify-center rounded bg-slate-900 font-bold text-white ${compact ? 'h-5 min-w-[1.25rem] px-1 text-[10px]' : 'h-7 w-7 text-[11px] shadow-sm'}`}
                    >
                      {typeof pt.index === 'number' ? pt.index : i + 1}
                    </span>
                    <h3
                      className={`font-semibold tracking-tight text-slate-900 ${compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}`}
                    >
                      {pLabel}
                    </h3>
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

                <div className="divide-y divide-slate-100">
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
                        />
                      );
                    });
                    return (
                      <div
                        key={secId}
                        className={`grid items-start ${modRow}`}
                        style={{
                          gridTemplateColumns: compact
                            ? `minmax(5.5rem,8rem) repeat(${sideKeys.length},minmax(0,1fr))`
                            : `minmax(7rem,10rem) repeat(${sideKeys.length},minmax(0,1fr))`,
                        }}
                      >
                        <div className="flex flex-col justify-start pt-0.5">
                          <span
                            className={`font-bold uppercase tracking-wide text-slate-500 ${compact ? 'text-[9px] tracking-[0.1em]' : 'text-[10.5px] tracking-[0.14em]'}`}
                          >
                            {compact ? 'Mod.' : 'Módulo'}
                          </span>
                          <span
                            className={`mt-0.5 font-semibold text-slate-900 leading-tight ${compact ? 'text-[11px]' : 'text-[13px]'}`}
                          >
                            {title}
                          </span>
                        </div>
                        {rowCells}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
