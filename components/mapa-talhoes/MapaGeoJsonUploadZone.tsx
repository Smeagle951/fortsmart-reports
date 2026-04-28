'use client';

import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import type { FeatureCollection } from 'geojson';
import { parseJsonFileText } from './geojsonUtils';

type Props = {
  onFeatureCollection: (fc: FeatureCollection) => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
  disabled?: boolean;
  /** Com mapa já carregado: faixa mais baixa e discreta. */
  compact?: boolean;
};

/**
 * Área principal para carregar GeoJSON (seletor ou arrastar). Fluxo preferido em relação ao legado `?d=`.
 */
export function MapaGeoJsonUploadZone({
  onFeatureCollection,
  onError,
  onSuccess,
  disabled = false,
  compact = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const processFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? '');
        const fc = parseJsonFileText(text);
        if (!fc) {
          onError(
            'Erro ao ler arquivo — esperado GeoJSON válido (FeatureCollection com feições).',
          );
          return;
        }
        if (fc.features.length === 0) {
          onError('O GeoJSON está vazio (sem feições).');
          return;
        }
        onFeatureCollection(fc);
        onSuccess('Mapa carregado com sucesso.');
      };
      reader.onerror = () => {
        onError('Erro ao ler o ficheiro.');
      };
      reader.readAsText(file, 'UTF-8');
    },
    [onError, onSuccess, onFeatureCollection],
  );

  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      processFile(file);
    },
    [processFile],
  );

  const prevent = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDragEnter = useCallback(
    (e: DragEvent) => {
      prevent(e);
      if (!disabled) setDragOver(true);
    },
    [disabled, prevent],
  );

  const onDragLeave = useCallback(
    (e: DragEvent) => {
      prevent(e);
      setDragOver(false);
    },
    [prevent],
  );

  const onDrop = useCallback(
    (e: DragEvent) => {
      prevent(e);
      setDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      const lower = file.name.toLowerCase();
      if (!lower.endsWith('.geojson') && !lower.endsWith('.json')) {
        onError('Use um ficheiro `.geojson` ou `.json`.');
        return;
      }
      processFile(file);
    },
    [disabled, onError, prevent, processFile],
  );

  return (
    <section
      aria-label={compact ? 'Trocar arquivo GeoJSON' : 'Carregar arquivo GeoJSON'}
      className={`mapa-geojson-upload mx-auto w-full max-w-[1920px] print:hidden ${
        compact ? 'px-3 pt-1 pb-0' : 'px-4 pt-3'
      } ${dragOver && !compact ? 'rounded-xl' : ''}`}
    >
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(ev) => {
          if (disabled) return;
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={onDragEnter}
        onDragOver={onDragEnter}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`cursor-pointer border-dashed transition-colors ${
          compact
            ? `rounded-lg border px-3 py-2 sm:py-2.5 ${
                disabled
                  ? 'border-slate-700/40 bg-slate-900/40 opacity-60'
                  : dragOver
                    ? 'border-emerald-500/60 bg-emerald-950/30'
                    : 'border-slate-600/50 bg-slate-900/50 hover:border-emerald-700/45 hover:bg-slate-900/70'
              }`
            : `rounded-xl border-2 px-4 py-5 lg:px-8 lg:py-6 ${
                disabled
                  ? 'border-slate-700/50 bg-slate-900/30 opacity-60'
                  : dragOver
                    ? 'border-emerald-400/80 bg-emerald-950/40'
                    : 'border-emerald-700/50 bg-gradient-to-br from-slate-900/90 via-slate-950 to-emerald-950/20 hover:border-emerald-600/70 hover:bg-emerald-950/25'
              }`
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".geojson,.json,application/geo+json,application/json"
          className="sr-only"
          disabled={disabled}
          onChange={onInputChange}
        />
        <div
          className={`flex items-center gap-2 sm:gap-3 ${
            compact ? 'flex-row justify-between text-left' : 'flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left'
          }`}
        >
          <div className="min-w-0 flex-1">
            {compact ? (
              <>
                <p className="text-xs font-medium text-slate-300">
                  Trocar GeoJSON
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                  Arraste ou clique para carregar outro ficheiro (.geojson).
                </p>
              </>
            ) : (
              <>
                <h2 className="text-sm font-semibold text-emerald-100 sm:text-base">
                  Carregar arquivo GeoJSON
                </h2>
                <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                  Arraste seu arquivo aqui ou clique para escolher (.geojson exportado no app FortSmart).
                </p>
              </>
            )}
          </div>
          <span
            className={`pointer-events-none shrink-0 rounded-lg border font-medium text-emerald-200 ${
              compact
                ? 'border-emerald-700/35 bg-emerald-950/35 px-3 py-1.5 text-[11px]'
                : 'border-emerald-600/40 bg-emerald-950/50 px-4 py-2 text-xs'
            }`}
          >
            {compact ? 'Outro ficheiro' : 'Selecionar arquivo'}
          </span>
        </div>
      </div>
    </section>
  );
}
